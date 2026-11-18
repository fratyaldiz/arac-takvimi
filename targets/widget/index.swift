import SwiftUI
import WidgetKit

// Uygulama ile paylaşılan alan; JS tarafı buraya "nextDeadline" yazar.
private let appGroup = "group.com.aractakvimi.app"
private let storageKey = "nextDeadline"

struct Deadline {
  let title: String
  let subtitle: String
  let dateText: String
  let daysLeft: Int?

  /// Gün sayısına göre renk: geçmişse kırmızı, yaklaşıyorsa turuncu.
  var tint: Color {
    guard let days = daysLeft else { return .blue }
    if days < 0 { return .red }
    if days <= 30 { return .orange }
    return .green
  }

  var badge: String {
    guard let days = daysLeft else { return "—" }
    if days == 0 { return "Bugün" }
    if days == 1 { return "Yarın" }
    if days < 0 { return "\(-days) gün geçti" }
    return "\(days) gün"
  }
}

private func loadDeadline() -> Deadline? {
  guard let defaults = UserDefaults(suiteName: appGroup),
        let raw = defaults.string(forKey: storageKey),
        let data = raw.data(using: .utf8),
        let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
        let title = json["title"] as? String
  else { return nil }

  return Deadline(
    title: title,
    subtitle: json["subtitle"] as? String ?? "",
    dateText: json["dateText"] as? String ?? "",
    daysLeft: json["daysLeft"] as? Int
  )
}

struct DeadlineEntry: TimelineEntry {
  let date: Date
  let deadline: Deadline?
}

struct Provider: TimelineProvider {
  func placeholder(in context: Context) -> DeadlineEntry {
    DeadlineEntry(
      date: Date(),
      deadline: Deadline(title: "Araç muayenesi", subtitle: "34 ABC 123", dateText: "14 Kasım 2028", daysLeft: 42)
    )
  }

  func getSnapshot(in context: Context, completion: @escaping (DeadlineEntry) -> Void) {
    completion(DeadlineEntry(date: Date(), deadline: loadDeadline()))
  }

  func getTimeline(in context: Context, completion: @escaping (Timeline<DeadlineEntry>) -> Void) {
    let entry = DeadlineEntry(date: Date(), deadline: loadDeadline())
    // Gün sayısı değiştiği için her gece yarısı yenilenir.
    let tomorrow = Calendar.current.startOfDay(for: Date().addingTimeInterval(86_400))
    completion(Timeline(entries: [entry], policy: .after(tomorrow)))
  }
}

struct WidgetView: View {
  var entry: DeadlineEntry

  var body: some View {
    VStack(alignment: .leading, spacing: 6) {
      if let deadline = entry.deadline {
        Text(deadline.badge)
          .font(.caption)
          .fontWeight(.bold)
          .foregroundStyle(deadline.tint)
        Text(deadline.title)
          .font(.headline)
          .lineLimit(2)
        if !deadline.subtitle.isEmpty {
          Text(deadline.subtitle)
            .font(.caption2)
            .foregroundStyle(.secondary)
            .lineLimit(1)
        }
        Spacer(minLength: 0)
        Text(deadline.dateText)
          .font(.caption2)
          .foregroundStyle(.secondary)
      } else {
        Text("Araç Takvimi")
          .font(.headline)
        Text("Uygulamayı aç ve aracını ekle; en yakın tarih burada görünür.")
          .font(.caption2)
          .foregroundStyle(.secondary)
      }
    }
    .frame(maxWidth: .infinity, maxHeight: .infinity, alignment: .leading)
  }
}

@main
struct AracTakvimiWidget: Widget {
  var body: some WidgetConfiguration {
    StaticConfiguration(kind: "AracTakvimiWidget", provider: Provider()) { entry in
      WidgetView(entry: entry)
        .containerBackground(.fill.tertiary, for: .widget)
    }
    .configurationDisplayName("Yaklaşan tarih")
    .description("Aracının en yakın muayene, sigorta, MTV ya da bakım tarihini gösterir.")
    .supportedFamilies([.systemSmall, .systemMedium])
  }
}
