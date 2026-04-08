import Foundation

final class DataService {
    static let shared = DataService()

    private init() {}

    func postMeasurement(_ payload: FatigueSubmissionPayload, to urlString: String) async throws {
        guard let url = URL(string: urlString) else {
            throw URLError(.badURL)
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(payload)

        let (_, response) = try await URLSession.shared.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw URLError(.badServerResponse)
        }
    }

    func postMeasurementDemo(_ payload: FatigueSubmissionPayload) async {
        // Simulate API latency so the demo flow looks like a real submission.
        try? await Task.sleep(nanoseconds: 600_000_000)
        print("[DEMO] Payload posted locally:\n\(payloadJSONString(payload))")
    }

    func payloadJSONString(_ payload: FatigueSubmissionPayload) -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]

        guard let data = try? encoder.encode(payload),
              let json = String(data: data, encoding: .utf8) else {
            return "{}"
        }
        return json
    }
}
