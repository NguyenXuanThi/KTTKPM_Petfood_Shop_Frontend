// AppointmentList.tsx — full code

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import apiClient from "@/lib/axios";

interface Appointment {
  _id: string;
  customerName: string;
  customerPhone?: string;
  petName: string;
  petType: string;
  serviceType: string;
  appointmentDate: string; // YYYY-MM-DD
  appointmentSlot: string; // HH:mm
  status:
    | "pending_confirmation"
    | "confirmed"
    | "waiting_customer"
    | "completed";
  isPinned?: boolean;
}

const PET_TYPES = [
  { value: "dog", label: "Chó" },
  { value: "cat", label: "Mèo" },
  { value: "hamster", label: "Chuột hamster" },
  { value: "rabbit", label: "Thỏ" },
  { value: "squirrel", label: "Sóc cảnh" },
  { value: "other", label: "Khác" },
];

function petTypeLabel(v?: string) {
  if (!v) return "";
  const found = PET_TYPES.find((p) => p.value === v || p.label === v);
  return found ? found.label : v;
}

const MAX_PINS = 5;
const VI_MONTHS = [
  "Tháng 1",
  "Tháng 2",
  "Tháng 3",
  "Tháng 4",
  "Tháng 5",
  "Tháng 6",
  "Tháng 7",
  "Tháng 8",
  "Tháng 9",
  "Tháng 10",
  "Tháng 11",
  "Tháng 12",
];
const WEEKDAYS = ["CN", "T2", "T3", "T4", "T5", "T6", "T7"];

function toDateKey(y: number, m: number, d: number): string {
  return `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

function fmtDate(ds: string): string {
  const [y, m, d] = ds.split("-");
  return `${parseInt(d)}/${parseInt(m)}/${y}`;
}

export default function AppointmentList() {
  const today = new Date();
  const [curYear, setCurYear] = useState(today.getFullYear());
  const [curMonth, setCurMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [pinnedIds, setPinnedIds] = useState<Set<string>>(new Set());
  const [monthAppts, setMonthAppts] = useState<Record<string, Appointment[]>>(
    {},
  );
  const [loadingMonth, setLoadingMonth] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apptsByDate = (dk: string): Appointment[] => monthAppts[dk] || [];

  const togglePin = async (id: string, currentlyPinned = false) => {
    try {
      // optimistic update
      setPinnedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id);
        else {
          if (next.size >= MAX_PINS) return prev;
          next.add(id);
        }
        return next;
      });

      await apiClient.patch(`/appointments/${id}/pin`, {
        isPinned: !currentlyPinned,
      });

      // refresh month data for the date of this appointment to keep UI consistent
      // find appointment date from existing cache
      const found = Object.values(monthAppts)
        .flat()
        .find((a) => a._id === id);
      if (found) {
        const date = found.appointmentDate;
        // refetch that date to get latest pinned state
        const { data } = await apiClient.get("/appointments", {
          params: { date },
        });
        if (data && data.success) {
          setMonthAppts((p) => ({ ...p, [date]: data.data }));
        }
      }
    } catch (err) {
      console.error("pin error", err);
      setError("Không thể cập nhật trạng thái ghim");
    }
  };

  const pinnedAppts = Object.values(monthAppts)
    .flat()
    .filter((a) => a.isPinned)
    .sort(
      (a, b) =>
        a.appointmentDate.localeCompare(b.appointmentDate) ||
        a.appointmentSlot.localeCompare(b.appointmentSlot),
    );

  const changeMonth = (dir: number) => {
    let m = curMonth + dir;
    let y = curYear;
    if (m > 11) {
      m = 0;
      y++;
    }
    if (m < 0) {
      m = 11;
      y--;
    }
    setCurMonth(m);
    setCurYear(y);
    setSelectedDate(null);
  };

  // ── Calendar cells ─────────────────────────────────────────────────
  const firstDay = new Date(curYear, curMonth, 1).getDay();
  const daysInMonth = new Date(curYear, curMonth + 1, 0).getDate();
  const daysInPrev = new Date(curYear, curMonth, 0).getDate();

  type Cell = { day: number; current: boolean; dateKey: string };
  const cells: Cell[] = [];
  for (let i = firstDay - 1; i >= 0; i--)
    cells.push({ day: daysInPrev - i, current: false, dateKey: "" });
  for (let d = 1; d <= daysInMonth; d++)
    cells.push({
      day: d,
      current: true,
      dateKey: toDateKey(curYear, curMonth, d),
    });
  const rem = cells.length % 7 === 0 ? 0 : 7 - (cells.length % 7);
  for (let d = 1; d <= rem; d++)
    cells.push({ day: d, current: false, dateKey: "" });

  const isToday = (cell: Cell) =>
    cell.current &&
    curYear === today.getFullYear() &&
    curMonth === today.getMonth() &&
    cell.day === today.getDate();

  const selectedAppts = selectedDate
    ? apptsByDate(selectedDate).sort((a, b) =>
        a.appointmentSlot.localeCompare(b.appointmentSlot),
      )
    : [];

  const statusPill = (status: Appointment["status"]) => {
    const base = "w-fit rounded-full px-2.5 py-0.5 text-[10px] font-medium";
    if (status === "confirmed")
      return cn(
        base,
        "bg-green-100 text-green-800 dark:bg-green-500/10 dark:text-green-400",
      );
    if (status === "pending_confirmation")
      return cn(
        base,
        "bg-amber-100 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400",
      );
    if (status === "waiting_customer")
      return cn(
        base,
        "bg-blue-100 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400",
      );
    return cn(
      base,
      "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
    );
  };

  // Fetch appointments for the current month
  useEffect(() => {
    let mounted = true;
    const fetchMonth = async () => {
      try {
        setLoadingMonth(true);
        setError(null);
        const month = `${curYear}-${String(curMonth + 1).padStart(2, "0")}`;
        const { data } = await apiClient.get("/appointments", {
          params: { month },
        });
        console.debug("fetchMonth", month, data);
        if (!mounted) return;
        if (data && data.success) {
          const map: Record<string, Appointment[]> = {};
          data.data.forEach((a: Appointment) => {
            const d = a.appointmentDate;
            if (!map[d]) map[d] = [];
            map[d].push(a);
          });
          if (mounted) setMonthAppts(map);
        } else if (data && !data.success) {
          setError(data.message || "Không thể tải lịch hẹn");
        }
      } catch (err) {
        console.error("fetchMonth error", err);
        if (mounted) setError("Không thể tải lịch hẹn");
      } finally {
        if (mounted) setLoadingMonth(false);
      }
    };
    fetchMonth();
    return () => {
      mounted = false;
    };
  }, [curYear, curMonth]);

  // keep pinnedIds in sync with backend data
  useEffect(() => {
    const pinned = Object.values(monthAppts)
      .flat()
      .filter((a) => a.isPinned)
      .map((a) => a._id);
    setPinnedIds(new Set(pinned));
  }, [monthAppts]);

  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      {/* ── Header ── */}
      <div className="mb-2 flex flex-shrink-0 flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-orange-500">
            Support Panel
          </p>
          <h1 className="text-xl font-black text-gray-950 dark:text-white">
            Quản lý lịch hẹn
          </h1>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            Click vào ngày có lịch để xem chi tiết · Ghim tối đa {MAX_PINS} lịch
            quan trọng
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeMonth(-1)}
            aria-label="Tháng trước"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            ‹
          </button>
          <span className="min-w-[110px] text-center text-sm font-medium text-gray-950 dark:text-white">
            {VI_MONTHS[curMonth]} {curYear}
          </span>
          <button
            onClick={() => changeMonth(1)}
            aria-label="Tháng sau"
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-gray-200 bg-gray-50 text-gray-500 transition hover:border-orange-400 hover:text-orange-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400"
          >
            ›
          </button>
        </div>
      </div>
      {error && (
        <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* ── Main 3-column grid ── */}
      {/* calendar nhỏ hơn (0.85fr), 2 cột phải rộng bằng nhau (1fr mỗi cột) */}
      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[2fr_1fr_1fr]">
        {/* ── Calendar ── */}
        <div className="relative overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          {loadingMonth && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/60 dark:bg-black/60">
              <div className="text-sm font-medium text-gray-700">
                Đang tải lịch...
              </div>
            </div>
          )}
          <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800">
            {WEEKDAYS.map((d) => (
              <div
                key={d}
                className="py-2.5 text-center text-xs font-medium text-white"
              >
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((cell, i) => {
              const appts = cell.current ? apptsByDate(cell.dateKey) : [];
              const hasPinned = appts.some((a) => a.isPinned);
              const isTodayCell = isToday(cell);
              // Treat today as always its own prominent state — never as "selected"
              const isSel = !!(
                cell.dateKey &&
                cell.dateKey === selectedDate &&
                !isTodayCell
              );
              const isTodayOnly = isTodayCell && !isSel;
              const isSelectedOnly = isSel && !isTodayCell;
              const isTodayAndSelected = false; // never allow selected state for today

              return (
                <div
                  key={i}
                  onClick={() => {
                    if (!cell.current) return;
                    // If clicking today: select it only if there are appointments, otherwise clear selection
                    if (isTodayCell) {
                      if (appts.length > 0) setSelectedDate(cell.dateKey);
                      else setSelectedDate(null);
                      return;
                    }
                    setSelectedDate(cell.dateKey);
                  }}
                  className={cn(
                    "min-h-[72px] border-b border-r border-gray-100 p-2 dark:border-gray-800",
                    "[&:nth-child(7n)]:border-r-0",
                    cell.current
                      ? "cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-600/20"
                      : "cursor-default",
                    isTodayOnly &&
                      "bg-orange-100 ring-2 ring-orange-500 dark:bg-orange-600/25",
                    isSelectedOnly &&
                      "bg-orange-100 ring-1 ring-orange-500 dark:bg-orange-600/25",
                    isTodayAndSelected &&
                      "bg-orange-100 ring-2 ring-orange-500 dark:bg-orange-600/25",
                  )}
                >
                  <div
                    className={cn(
                      "flex items-center justify-center text-sm font-medium",
                      isTodayAndSelected
                        ? "h-[32px] w-[32px] rounded-full bg-orange-700 text-white font-bold"
                        : isTodayOnly
                          ? "h-[26px] w-[26px] rounded-full bg-orange-600 text-white"
                          : isSel
                            ? "h-[26px] w-[26px] text-orange-600 font-semibold"
                            : cell.current
                              ? "h-[26px] w-[26px] text-gray-950 dark:text-white"
                              : "h-[26px] w-[26px] text-gray-300 dark:text-gray-600",
                    )}
                  >
                    {cell.day}
                  </div>
                  {appts.length > 0 && (
                    <>
                      <div className="mt-1.5 flex flex-wrap gap-[3px]">
                        {appts.slice(0, 5).map((a) => (
                          <span
                            key={a._id}
                            className="inline-block h-[5px] w-[5px] rounded-full"
                            style={{
                              background: a.isPinned
                                ? "#f97316"
                                : a.status === "confirmed"
                                  ? "#16a34a"
                                  : "#d97706",
                            }}
                          />
                        ))}
                      </div>
                      <div className="mt-1 flex items-center gap-0.5 text-[10px] font-medium text-orange-500">
                        {appts.length} lịch{hasPinned && " 📌"}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Detail panel ── */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
            <span className="flex-1 text-xs font-bold text-gray-950 dark:text-white">
              {selectedDate ? fmtDate(selectedDate) : "Chi tiết ngày"}
            </span>
            {selectedDate && selectedAppts.length > 0 && (
              <span className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-500/20 dark:text-orange-300">
                {selectedAppts.length} lịch
              </span>
            )}
          </div>

          {!selectedDate ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-2xl">📅</span>
              <p className="text-xs text-gray-400">
                Click vào ngày có lịch để xem chi tiết
              </p>
            </div>
          ) : selectedAppts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-2xl">📅</span>
              <p className="text-xs text-gray-400">
                Click vào ngày có lịch để xem chi tiết
              </p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {selectedAppts.map((a) => {
                const isPinned = !!a.isPinned;
                const canPin = isPinned || pinnedAppts.length < MAX_PINS;
                return (
                  <div
                    key={a._id}
                    className={cn(
                      "rounded-xl border p-3 transition",
                      isPinned
                        ? "border-amber-300 bg-amber-50 dark:border-amber-500/40 dark:bg-amber-500/10"
                        : "border-orange-200 bg-orange-50/60 dark:border-orange-500/30 dark:bg-orange-500/5",
                    )}
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "text-xs font-semibold",
                          isPinned
                            ? "text-amber-700 dark:text-amber-400"
                            : "text-orange-600 dark:text-orange-400",
                        )}
                      >
                        🕐 {a.appointmentSlot}
                      </span>
                      {isPinned && (
                        <span className="rounded-full bg-amber-200 px-2 py-0.5 text-[9px] font-semibold text-amber-800 dark:bg-amber-500/20 dark:text-amber-300">
                          📌 Đã ghim
                        </span>
                      )}
                    </div>
                    <div className="text-sm font-semibold text-gray-950 dark:text-white">
                      {a.customerName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {a.petName} ({petTypeLabel(a.petType)}) · {a.serviceType}
                    </div>
                    <div className="mt-2 flex items-center gap-2">
                      <span className={statusPill(a.status)}>
                        {a.status === "confirmed"
                          ? "Đã xác nhận"
                          : a.status === "pending_confirmation"
                            ? "Chờ xác nhận"
                            : a.status === "waiting_customer"
                              ? "Chờ khách đến"
                              : "Đã xong"}
                      </span>
                      <button
                        onClick={() => togglePin(a._id, !!a.isPinned)}
                        disabled={!canPin}
                        className={cn(
                          "ml-auto flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[10px] font-medium transition",
                          isPinned
                            ? "border-amber-400 bg-amber-100 text-amber-800 hover:bg-amber-200 dark:border-amber-500/50 dark:bg-amber-500/20 dark:text-amber-300"
                            : canPin
                              ? "border-orange-300 bg-white text-orange-600 hover:bg-orange-50 dark:border-orange-500/40 dark:bg-transparent dark:text-orange-400"
                              : "cursor-not-allowed border-gray-100 text-gray-300 opacity-40 dark:border-gray-800",
                        )}
                      >
                        {isPinned ? "📌 Bỏ ghim" : "📌 Ghim"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Pinned panel ── */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex flex-shrink-0 items-center gap-2 border-b border-gray-100 px-4 py-2.5 dark:border-gray-800">
            <span className="flex-1 text-xs font-bold text-gray-950 dark:text-white">
              Lịch đã ghim
            </span>
            <span
              className={cn(
                "rounded-md px-2 py-0.5 text-[10px] font-medium",
                pinnedAppts.length >= MAX_PINS
                  ? "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-500/20 dark:text-amber-300",
              )}
            >
              {pinnedAppts.length} / {MAX_PINS}
            </span>
          </div>

          {pinnedAppts.length >= MAX_PINS && (
            <div className="flex-shrink-0 border-b border-red-100 bg-red-50 px-4 py-1.5 text-[10px] text-red-600 dark:border-red-900/30 dark:bg-red-900/20 dark:text-red-400">
              Đã đạt tối đa {MAX_PINS} lịch ghim
            </div>
          )}

          {pinnedAppts.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-2 p-6 text-center">
              <span className="text-2xl">📌</span>
              <p className="text-xs text-gray-400">
                Chưa có lịch nào được ghim
              </p>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {pinnedAppts.map((a) => (
                  <div
                    key={a._id}
                    className="rounded-xl border border-amber-300 bg-amber-50 p-3 dark:border-amber-500/40 dark:bg-amber-500/10"
                  >
                    <div className="mb-1 flex items-start justify-between gap-1">
                      <div className="text-[10px] font-medium text-amber-700 dark:text-amber-400">
                        📅 {fmtDate(a.appointmentDate)} · {a.appointmentSlot}
                      </div>
                      <button
                        onClick={() => togglePin(a._id, !!a.isPinned)}
                        aria-label="Bỏ ghim"
                        className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded text-amber-400 transition hover:bg-amber-200 hover:text-red-500 dark:text-amber-500 dark:hover:bg-amber-500/20 dark:hover:text-red-400"
                      >
                        ✕
                      </button>
                    </div>
                    <div className="text-sm font-semibold text-gray-950 dark:text-white">
                      {a.customerName}
                    </div>
                    <div className="mt-0.5 text-[11px] text-gray-500 dark:text-gray-400">
                      {a.petName} ({petTypeLabel(a.petType)})
                    </div>
                    <div className="text-[11px] text-gray-400 dark:text-gray-500">
                      {a.serviceType}
                    </div>
                    <div className="mt-2">
                      <span className={statusPill(a.status)}>
                        {a.status === "confirmed"
                          ? "Đã xác nhận"
                          : a.status === "pending_confirmation"
                            ? "Chờ xác nhận"
                            : a.status === "waiting_customer"
                              ? "Chờ khách đến"
                              : "Đã xong"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex-shrink-0 border-t border-gray-100 px-4 py-2 dark:border-gray-800">
                <p className="text-[10px] text-gray-400">Nhấn ✕ để bỏ ghim</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
