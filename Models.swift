import Foundation

enum Gender: String, CaseIterable, Codable, Identifiable {
    case male = "Male"
    case female = "Female"

    var id: String { rawValue }
}

enum SportType: String, CaseIterable, Codable, Identifiable {
    case sprint = "短跑"
    case longDistance = "長跑"
    case hurdles = "跨欄"
    case weightTraining = "重量訓練"
    case basketball = "籃球"
    case other = "其他"

    var id: String { rawValue }
}

enum MeasurementPhase: String, CaseIterable, Codable, Identifiable {
    case wakeBaseline = "起床基準"
    case prePostStrength = "重訓前後"
    case prePostSprint = "衝刺前後"
    case prePostSport = "專項運動前後"
    case recovery24h48h = "恢復追蹤(24h/48h)"

    var id: String { rawValue }

    var apiValue: String {
        switch self {
        case .wakeBaseline:
            return "Wake_Baseline"
        case .prePostStrength:
            return "PrePost_Strength"
        case .prePostSprint:
            return "PrePost_Sprint"
        case .prePostSport:
            return "PrePost_Sport"
        case .recovery24h48h:
            return "Recovery_24h_48h"
        }
    }
}

enum BodyPart: String, CaseIterable, Codable, Identifiable {
    case leftQuad = "左大腿"
    case rightQuad = "右大腿"
    case leftCalf = "左小腿"
    case rightCalf = "右小腿"

    var id: String { rawValue }

    var apiValue: String {
        switch self {
        case .leftQuad:
            return "Left_Quad"
        case .rightQuad:
            return "Right_Quad"
        case .leftCalf:
            return "Left_Calf"
        case .rightCalf:
            return "Right_Calf"
        }
    }
}

struct AthleteProfile: Codable {
    var name: String = ""
    var gender: Gender = .male
    var age: Int = 18
    var heightCm: Double = 170
    var weightKg: Double = 65
    var sportType: SportType = .sprint
    var deviceID: String = ""
}

struct MeasurementContext {
    var sleepQuality: Int = 3
    var phase: MeasurementPhase = .wakeBaseline
    var fatigueScore: Int = 5
    var bodyPart: BodyPart = .leftQuad
    var notes: String = ""
}

struct FatigueSubmissionPayload: Codable {
    let timestamp: Int
    let name: String
    let gender: String
    let age: Int
    let height_cm: Double
    let weight_kg: Double
    let sport_type: String
    let device_id: String
    let sleep_quality: Int
    let phase: String
    let body_part: String
    let fatigue_score: Int
    let notes: String

    static func build(profile: AthleteProfile, context: MeasurementContext, timestamp: Int = Int(Date().timeIntervalSince1970)) -> FatigueSubmissionPayload {
        FatigueSubmissionPayload(
            timestamp: timestamp,
            name: profile.name,
            gender: profile.gender.rawValue,
            age: profile.age,
            height_cm: profile.heightCm,
            weight_kg: profile.weightKg,
            sport_type: profile.sportType.rawValue,
            device_id: profile.deviceID,
            sleep_quality: context.sleepQuality,
            phase: context.phase.apiValue,
            body_part: context.bodyPart.apiValue,
            fatigue_score: context.fatigueScore,
            notes: context.notes
        )
    }
}
