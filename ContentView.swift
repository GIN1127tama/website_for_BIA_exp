import SwiftUI

struct ContentView: View {
    @AppStorage("athleteProfileData") private var athleteProfileData: Data = Data()
    @AppStorage("isDemoMode") private var isDemoMode: Bool = true
    @State private var profile = AthleteProfile()
    @State private var context = MeasurementContext()
    @State private var apiURL: String = "https://example.com/api/fatigue"

    @State private var isSubmitting = false
    @State private var showResultAlert = false
    @State private var resultMessage = ""
    @State private var generatedJSONPreview = ""

    var body: some View {
        NavigationStack {
            Form {
                Section("1) 註冊頁面 (Static Profile)") {
                    TextField("姓名", text: $profile.name)

                    Picker("性別", selection: $profile.gender) {
                        ForEach(Gender.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }

                    Stepper("年齡: \(profile.age)", value: $profile.age, in: 8...99)

                    VStack(alignment: .leading, spacing: 6) {
                        Text("身高 (cm): \(profile.heightCm, specifier: \"%.1f\")")
                        Slider(value: $profile.heightCm, in: 120...230, step: 0.5)
                    }

                    VStack(alignment: .leading, spacing: 6) {
                        Text("體重 (kg): \(profile.weightKg, specifier: \"%.1f\")")
                        Slider(value: $profile.weightKg, in: 30...180, step: 0.5)
                    }

                    Picker("運動專項", selection: $profile.sportType) {
                        ForEach(SportType.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }

                    TextField("Device_ID (例如 BIA-001)", text: $profile.deviceID)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled(true)
                }

                Section("2) 日常量測登記 (Daily Context)") {
                    VStack(alignment: .leading, spacing: 6) {
                        Text("睡眠品質: \(context.sleepQuality) / 5")
                        HStack(spacing: 4) {
                            ForEach(1...5, id: \.self) { value in
                                Image(systemName: value <= context.sleepQuality ? "star.fill" : "star")
                                    .foregroundStyle(.yellow)
                                    .onTapGesture {
                                        context.sleepQuality = value
                                    }
                            }
                        }
                    }

                    Picker("當下情境", selection: $context.phase) {
                        ForEach(MeasurementPhase.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }

                    Stepper("自覺疲勞 (RPE): \(context.fatigueScore)", value: $context.fatigueScore, in: 1...10)

                    Picker("量測部位", selection: $context.bodyPart) {
                        ForEach(BodyPart.allCases) { item in
                            Text(item.rawValue).tag(item)
                        }
                    }

                    TextField("備註 (特殊狀況)", text: $context.notes, axis: .vertical)
                        .lineLimit(2...4)
                }

                Section("3) API 設定") {
                    Toggle("Xcode Demo 模式 (不打外網)", isOn: $isDemoMode)

                    TextField("POST URL", text: $apiURL)
                        .keyboardType(.URL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled(true)
                        .disabled(isDemoMode)
                }

                Section {
                    Button {
                        Task {
                            await submitRecord()
                        }
                    } label: {
                        if isSubmitting {
                            ProgressView()
                                .frame(maxWidth: .infinity)
                        } else {
                            Text("送出紀錄")
                                .bold()
                                .frame(maxWidth: .infinity)
                        }
                    }
                    .disabled(isSubmitting)
                }

                if !generatedJSONPreview.isEmpty {
                    Section("本次送出 JSON Preview") {
                        Text(generatedJSONPreview)
                            .font(.system(.footnote, design: .monospaced))
                            .textSelection(.enabled)
                    }
                }
            }
            .navigationTitle("疲勞數據採集")
            .onAppear(perform: loadProfile)
            .onChange(of: profile) { _, _ in
                saveProfile()
            }
            .alert("送出結果", isPresented: $showResultAlert) {
                Button("確定", role: .cancel) {}
            } message: {
                Text(resultMessage)
            }
        }
    }

    private func loadProfile() {
        guard !athleteProfileData.isEmpty,
              let decoded = try? JSONDecoder().decode(AthleteProfile.self, from: athleteProfileData) else {
            return
        }
        profile = decoded
    }

    private func saveProfile() {
        guard let encoded = try? JSONEncoder().encode(profile) else {
            return
        }
        athleteProfileData = encoded
    }

    @MainActor
    private func submitRecord() async {
        isSubmitting = true
        defer { isSubmitting = false }

        let payload = FatigueSubmissionPayload.build(profile: profile, context: context)
        generatedJSONPreview = DataService.shared.payloadJSONString(payload)

        do {
            if isDemoMode {
                await DataService.shared.postMeasurementDemo(payload)
                resultMessage = "Demo 送出成功（本機模擬），時間戳記: \(payload.timestamp)"
            } else {
                try await DataService.shared.postMeasurement(payload, to: apiURL)
                resultMessage = "送出成功，時間戳記: \(payload.timestamp)"
            }
            showResultAlert = true
        } catch {
            resultMessage = "送出失敗: \(error.localizedDescription)"
            showResultAlert = true
        }
    }
}

#Preview {
    ContentView()
}
