import { useState } from "react";

interface ExportMenuProps {
  structuredData: any;
  planText: string;
}

function generateICS(structuredData: any, startDate: string): string {
  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//TravelAgent//EN",
    "CALSCALE:GREGORIAN",
  ];

  const attractions = structuredData?.attractions;
  const dayGroupings = attractions?.suggested_day_groupings ?? [];

  for (const group of dayGroupings) {
    const date = new Date(startDate);
    date.setDate(date.getDate() + (group.day - 1));
    const dateStr = date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    const nextDateStr = nextDay.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

    const names = (group.attraction_names ?? []).join(", ");
    lines.push(
      "BEGIN:VEVENT",
      `DTSTART:${dateStr}`,
      `DTEND:${nextDateStr}`,
      `SUMMARY:Day ${group.day}: ${group.area}`,
      `DESCRIPTION:${names}`,
      `UID:travel-day-${group.day}-${Date.now()}@travelagent`,
      "END:VEVENT"
    );
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}

function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function ExportMenu({ structuredData, planText }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [copied, setCopied] = useState(false);

  function handleICSExport() {
    if (!startDate) {
      setShowDatePicker(true);
      setOpen(false);
      return;
    }
    const ics = generateICS(structuredData, startDate);
    downloadFile(ics, "travel-itinerary.ics", "text/calendar");
    setOpen(false);
  }

  function confirmDateAndExport() {
    if (!startDate) return;
    const ics = generateICS(structuredData, startDate);
    downloadFile(ics, "travel-itinerary.ics", "text/calendar");
    setShowDatePicker(false);
  }

  async function handleJSONCopy() {
    try {
      const data = structuredData ?? { planText };
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
    setOpen(false);
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-[180px]">
          <button
            onClick={handleICSExport}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-t-lg"
          >
            📅 Export to Calendar
          </button>
          <button
            onClick={handleJSONCopy}
            className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 flex items-center gap-2 rounded-b-lg border-t"
          >
            {copied ? "✅ Copied!" : "📋 Copy as JSON"}
          </button>
        </div>
      )}

      {showDatePicker && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 shadow-xl max-w-xs w-full mx-4">
            <h3 className="font-semibold text-gray-800 mb-2">When does your trip start?</h3>
            <p className="text-sm text-gray-500 mb-4">This date will be used for calendar events.</p>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowDatePicker(false)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={confirmDateAndExport}
                disabled={!startDate}
                className="flex-1 px-3 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300"
              >
                Export
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
