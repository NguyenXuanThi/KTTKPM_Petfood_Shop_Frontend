import { StatisticsFilter } from "@/api/statisticsApi";

const quickFilters = [
  { label: "Hôm nay", value: "today" },
  { label: "7 ngày gần đây", value: "7days" },
  { label: "Tháng này", value: "month" },
  { label: "Tùy chọn thời gian", value: "custom" },
] as const;

export function StatisticsFilterBar({
  filter,
  onChange,
}: {
  filter: StatisticsFilter;
  onChange: (filter: StatisticsFilter) => void;
}) {
  const activeRange = filter.range || "today";

  return (
    <div className="mb-6 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-wrap gap-2">
        {quickFilters.map((item) => (
          <button
            key={item.value}
            onClick={() => onChange({ range: item.value })}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition ${
              activeRange === item.value
                ? "bg-amber-500 text-white shadow-sm"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {activeRange === "custom" && (
        <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_1fr_auto]">
          <input
            type="date"
            value={filter.startDate || ""}
            onChange={(e) => onChange({ ...filter, startDate: e.target.value })}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          <input
            type="date"
            value={filter.endDate || ""}
            onChange={(e) => onChange({ ...filter, endDate: e.target.value })}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-950 dark:text-white"
          />
          <button
            onClick={() => onChange({ range: "custom", startDate: filter.startDate, endDate: filter.endDate })}
            className="rounded-xl bg-gray-900 px-4 py-2 text-sm font-semibold text-white dark:bg-white dark:text-gray-950"
          >
            Áp dụng
          </button>
        </div>
      )}
    </div>
  );
}



