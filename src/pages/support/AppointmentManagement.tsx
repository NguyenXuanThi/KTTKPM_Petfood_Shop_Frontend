import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

const MORNING = { start: 8, end: 12 };
const AFTERNOON = { start: 13, end: 17 };
const MAX_PER_SLOT = 3;

type SlotKey = string;

interface SlotInfo {
  label: string;
  key: SlotKey;
  past: boolean;
  count: number;
  full: boolean;
}

function buildSlotLabels(): string[] {
  const labels: string[] = [];
  [MORNING, AFTERNOON].forEach(({ start, end }) => {
    for (let h = start; h <= end; h++) {
      const mins = h === end ? [0] : [0, 30];
      mins.forEach((m) =>
        labels.push(
          `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`,
        ),
      );
    }
  });
  return labels;
}

const ALL_SLOT_LABELS = buildSlotLabels();

function getTimeSlots(
  dateStr: string,
  now: Date,
  bookings: Record<SlotKey, number>,
): SlotInfo[] {
  return ALL_SLOT_LABELS.map((label) => {
    const key: SlotKey = `${dateStr}_${label}`;
    const count = bookings[key] ?? 0;
    return {
      label,
      key,
      past: new Date(`${dateStr}T${label}`) < now,
      count,
      full: count >= MAX_PER_SLOT,
    };
  });
}

const PET_TYPES = [
  { value: "dog", label: "🐕 Chó" },
  { value: "cat", label: "🐈 Mèo" },
  { value: "hamster", label: "🐹 Chuột hamster" },
  { value: "rabbit", label: "🐇 Thỏ" },
  { value: "squirrel", label: "🐿️ Sóc cảnh" },
  { value: "other", label: "🐾 Khác" },
];

const SERVICES = [
  { icon: "🛁", name: "Tắm rửa", price: "150k" },
  { icon: "✂️", name: "Cắt tỉa lông", price: "200k" },
  { icon: "👂", name: "Vệ sinh tai", price: "50k" },
  { icon: "💅", name: "Cắt móng", price: "30k" },
  { icon: "💉", name: "Tiêm chủng", price: "100k" },
  { icon: "🦷", name: "Cạo vôi răng", price: "300k" },
  { icon: "🏥", name: "Khám sức khỏe", price: "250k" },
  { icon: "🔪", name: "Triệt sản", price: "500k" },
  { icon: "🎓", name: "Huấn luyện", price: "400k" },
  { icon: "⚰️", name: "Hỏa táng", price: "2000k" },
];

export default function AppointmentManagement() {
  const todayStr = (): string => {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const [bookings, setBookings] = useState<Record<SlotKey, number>>({});
  const [form, setForm] = useState({
    fullName: "",
    phone: "",
    address: "",
    petName: "",
    petType: "",
    apptDate: todayStr(),
  });
  const [selectedSlot, setSelectedSlot] = useState<SlotKey | null>(null);
  const [selectedSvcs, setSelectedSvcs] = useState<string[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notif, setNotif] = useState<{ msg: string; ok: boolean } | null>(null);

  const slots: SlotInfo[] = getTimeSlots(form.apptDate, new Date(), bookings);
  const mornSlots: SlotInfo[] = slots.filter((s: SlotInfo) => {
    const h = parseInt(s.label.split(":")[0]);
    return h >= MORNING.start && h <= MORNING.end;
  });
  const aftSlots: SlotInfo[] = slots.filter((s: SlotInfo) => {
    const h = parseInt(s.label.split(":")[0]);
    return h >= AFTERNOON.start && h <= AFTERNOON.end;
  });

  const { user: authUser } = useAuth();

  const onlyDigits = (v: string) => (v || "").replace(/\D+/g, "");
  const isValidVNPhone = (v: string) => /^(03|05|07|08|09)\d{8}$/.test(v);
  const isValidFullName = (v: string) => {
    const t = (v || "").trim();
    if (t.length < 2 || t.length > 50) return false;
    return /^[\p{L}\p{M}.'\- ]+$/u.test(t);
  };
  const isValidPetName = (v: string) => {
    const t = (v || "").trim();
    if (t.length < 1 || t.length > 40) return false;
    return /^[\p{L}\p{M}0-9\- ]+$/u.test(t);
  };

  const validate = (): Record<string, string> => {
    const errs: Record<string, string> = {};
    const fullName = (form.fullName || "").trim();
    const phoneRaw = onlyDigits(form.phone || "");
    const petName = (form.petName || "").trim();

    if (!fullName) errs.fullName = "Vui lòng nhập họ và tên";
    else if (!isValidFullName(fullName))
      errs.fullName = "Họ và tên không hợp lệ";

    if (!phoneRaw) errs.phone = "Vui lòng nhập số điện thoại";
    else if (!isValidVNPhone(phoneRaw))
      errs.phone = "Số điện thoại không hợp lệ (03/05/07/08/09 + 8 số)";

    if (!petName) errs.petName = "Vui lòng nhập tên thú cưng";
    else if (!isValidPetName(petName))
      errs.petName = "Tên thú cưng không hợp lệ";

    if (!form.petType) errs.petType = "Vui lòng chọn loài thú cưng";
    if (!form.apptDate) errs.apptDate = "Vui lòng chọn ngày hẹn";
    if (!selectedSlot) errs.slot = "Vui lòng chọn giờ hẹn";
    if (selectedSvcs.length === 0)
      errs.svcs = "Vui lòng chọn ít nhất 1 dịch vụ";
    if (selectedSlot) {
      const info = slots.find((s: SlotInfo) => s.key === selectedSlot);
      if (info?.past) errs.slot = "Giờ hẹn đã qua, vui lòng chọn lại";
      if (info?.full) errs.slot = "Slot này đã đầy (tối đa 3 khách/slot)";
    }
    return errs;
  };

  const showNotif = (msg: string, ok: boolean) => {
    setNotif({ msg, ok });
    if (ok) setTimeout(() => setNotif(null), 3500);
  };

  const fetchSlots = async (date: string) => {
    try {
      const res = await fetch(`/api/appointments/slots?date=${date}`);
      const data = await res.json();
      if (res.ok && data.success && Array.isArray(data.slots)) {
        const map: Record<SlotKey, number> = {};
        data.slots.forEach((s: any) => {
          map[`${date}_${s.slot}`] = s.currentBookings;
        });
        setBookings(map);
      } else {
        setBookings({});
      }
    } catch (e) {
      console.error("fetchSlots error", e);
      setBookings({});
    }
  };

  useEffect(() => {
    fetchSlots(form.apptDate);
  }, [form.apptDate]);

  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setForm((prev) => ({ ...prev, phone: onlyDigits(prev.phone) }));
    const errs = validate();
    setErrors(errs);
    if (Object.keys(errs).length > 0) {
      showNotif("Vui lòng điền đầy đủ thông tin còn thiếu", false);
      return;
    }

    if (!selectedSlot) {
      showNotif("Vui lòng chọn giờ hẹn", false);
      return;
    }

    setLoading(true);
    try {
      const [date, time] = selectedSlot.split("_");
      const payload = {
        customerId: "support_created_" + Date.now(),
        customerName: form.fullName.trim(),
        customerPhone: onlyDigits(form.phone),
        petName: form.petName.trim(),
        petType: form.petType,
        serviceType: selectedSvcs.join(", "),
        appointmentDate: date,
        appointmentSlot: time,
        note: form.address || "",
        supportId: authUser?.id || authUser?._id || null,
      };

      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        const msg = data && data.message ? data.message : "Đặt lịch thất bại";
        const newErrors: Record<string, string> = {};
        const parts = msg.split(";").map((s: string) => s.trim());
        parts.forEach((p: string) => {
          if (p.includes("họ và tên") || p.includes("Họ và tên"))
            newErrors.fullName = p;
          else if (p.includes("số điện thoại") || p.includes("Số điện thoại"))
            newErrors.phone = p;
          else if (p.includes("tên thú cưng") || p.includes("Tên thú cưng"))
            newErrors.petName = p;
          else if (p.includes("loài") || p.includes("Loài"))
            newErrors.petType = p;
          else if (p.includes("ngày hẹn") || p.includes("Ngày hẹn"))
            newErrors.apptDate = p;
          else if (p.includes("chọn giờ") || p.includes("giờ hẹn"))
            newErrors.slot = p;
        });
        setErrors((prev) => ({ ...prev, ...newErrors }));
        showNotif(msg, false);
        return;
      }

      showNotif("Đặt lịch hẹn thành công", true);
      await fetchSlots(form.apptDate);
      setForm({
        fullName: "",
        phone: "",
        address: "",
        petName: "",
        petType: "",
        apptDate: todayStr(),
      });
      setSelectedSlot(null);
      setSelectedSvcs([]);
      setErrors({});
    } catch (err: any) {
      console.error("submit appointment error", err);
      showNotif(err?.message || "Lỗi khi tạo lịch", false);
    } finally {
      setLoading(false);
    }
  };

  const labelCls =
    "mb-1 block text-[13px] font-medium text-gray-600 dark:text-gray-400";

  const inputCls = (field: string): string =>
    cn(
      "w-full rounded-lg border px-3 py-2 text-sm placeholder-gray-400 bg-gray-50",
      "focus:outline-none focus:ring-2 focus:ring-orange-100 dark:bg-gray-800 dark:text-white",
      errors[field]
        ? "border-red-400 focus:border-red-400"
        : "border-gray-200 focus:border-orange-400 dark:border-gray-700",
    );

  const slotCls = (s: SlotInfo): string =>
    cn(
      "rounded-lg border-2 px-2 py-2 text-sm font-medium transition-colors duration-150 ease-in-out text-center min-w-[72px] flex flex-col items-center justify-center",
      s.key === selectedSlot
        ? "bg-orange-500 border-orange-600 text-white shadow-md transform scale-105"
        : s.full
          ? "bg-gray-100 border-gray-200 text-gray-400 opacity-60 cursor-not-allowed dark:bg-gray-800 dark:border-gray-700 dark:text-gray-500"
          : s.past
            ? "bg-gray-50 border-gray-100 text-gray-300 opacity-50 cursor-not-allowed dark:bg-transparent dark:text-gray-500"
            : s.count === MAX_PER_SLOT - 1
              ? "bg-amber-50 border-amber-300 text-amber-700 hover:border-amber-400 cursor-pointer dark:bg-amber-900/10 dark:border-amber-700/30 dark:text-amber-200"
              : "bg-white border-gray-200 hover:border-orange-300 text-gray-900 cursor-pointer dark:bg-gray-900 dark:border-gray-800 dark:text-gray-200",
    );

  return (
    <div className="flex h-full flex-col overflow-hidden p-3">
      <div className="mb-2 flex-shrink-0">
        <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-orange-500">
          Support Panel
        </p>
        <h1 className="text-xl font-black text-gray-950 dark:text-white">
          Tạo lịch hẹn
        </h1>
        <p className="text-[11px] text-gray-500 dark:text-gray-400">
          Giờ làm việc: 08:00–12:00 &amp; 13:00–17:00 · Tối đa 3 khách / slot
        </p>
      </div>

      <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[1fr_1.65fr]">
        {/* Form card */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">
              Thông tin khách hàng
            </h2>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {(
              [
                {
                  id: "fullName",
                  label: "Họ và tên",
                  type: "text",
                  ph: "Nhập họ tên",
                  req: true,
                },
                {
                  id: "phone",
                  label: "Số điện thoại",
                  type: "tel",
                  ph: "0xxxxxxxxx",
                  req: true,
                },
                {
                  id: "address",
                  label: "Địa chỉ",
                  type: "text",
                  ph: "Địa chỉ khách hàng",
                  req: false,
                },
              ] as {
                id: keyof typeof form;
                label: string;
                type: string;
                ph: string;
                req: boolean;
              }[]
            ).map((f) => (
              <div key={f.id}>
                <label className={labelCls}>
                  {f.label}
                  {f.req && <span className="ml-0.5 text-red-400">*</span>}
                </label>
                <input
                  type={f.type}
                  placeholder={f.ph}
                  value={form[f.id]}
                  onChange={(e) => setForm({ ...form, [f.id]: e.target.value })}
                  className={inputCls(f.id)}
                />
                {errors[f.id] && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {errors[f.id]}
                  </p>
                )}
              </div>
            ))}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className={labelCls}>
                  Tên thú cưng<span className="ml-0.5 text-red-400">*</span>
                </label>
                <input
                  type="text"
                  placeholder="Bông, Milo..."
                  value={form.petName}
                  onChange={(e) =>
                    setForm({ ...form, petName: e.target.value })
                  }
                  className={inputCls("petName")}
                />
                {errors.petName && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {errors.petName}
                  </p>
                )}
              </div>
              <div>
                <label className={labelCls}>
                  Loài<span className="ml-0.5 text-red-400">*</span>
                </label>
                <select
                  value={form.petType}
                  onChange={(e) =>
                    setForm({ ...form, petType: e.target.value })
                  }
                  className={inputCls("petType")}
                >
                  <option value="">-- Chọn loài --</option>
                  {PET_TYPES.map((p) => (
                    <option key={p.value} value={p.value}>
                      {p.label}
                    </option>
                  ))}
                </select>
                {errors.petType && (
                  <p className="mt-1 text-[11px] text-red-500">
                    {errors.petType}
                  </p>
                )}
              </div>
            </div>

            <div>
              <label className={labelCls}>
                Ngày hẹn<span className="ml-0.5 text-red-400">*</span>
              </label>
              <input
                type="date"
                min={todayStr()}
                value={form.apptDate}
                onChange={(e) => {
                  setForm({ ...form, apptDate: e.target.value });
                  setSelectedSlot(null);
                }}
                className={inputCls("apptDate")}
              />
              {errors.apptDate && (
                <p className="mt-1 text-[11px] text-red-500">
                  {errors.apptDate}
                </p>
              )}
            </div>

            {/* Slot picker */}
            <div>
              <label className={labelCls}>
                Giờ hẹn<span className="ml-0.5 text-red-400">*</span>
              </label>
              {(
                [
                  { label: "Buổi sáng", items: mornSlots },
                  { label: "Buổi chiều", items: aftSlots },
                ] as { label: string; items: SlotInfo[] }[]
              ).map((g) => (
                <div key={g.label} className="mb-2">
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                    {g.label}
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                    {g.items.map((s: SlotInfo) => {
                      const remaining = Math.max(0, MAX_PER_SLOT - s.count);
                      return (
                        <button
                          key={s.key}
                          disabled={s.past || s.full}
                          aria-disabled={s.past || s.full}
                          onClick={() => {
                            if (!s.past && !s.full) {
                              setSelectedSlot(s.key);
                              setErrors((p) => ({ ...p, slot: "" }));
                            }
                          }}
                          className={slotCls(s)}
                          title={
                            s.full
                              ? "Đã đầy"
                              : s.past
                                ? "Đã qua"
                                : `Còn ${remaining} chỗ`
                          }
                        >
                          <div className="flex items-center justify-center w-full">
                            <div className="text-sm font-semibold leading-none text-gray-800 dark:text-white">
                              {s.label}
                            </div>
                          </div>
                          <div className="mt-1 flex items-center gap-2 w-full">
                            {!s.past && !s.full ? (
                              <>
                                <div className="text-[11px] leading-none text-amber-700 dark:text-amber-200 font-medium">
                                  {remaining} chỗ
                                </div>
                              </>
                            ) : s.full ? (
                              <div className="text-[11px] text-gray-400 dark:text-gray-500">
                                Đã đầy
                              </div>
                            ) : (
                              <div className="text-[11px] text-gray-400 dark:text-gray-500">
                                Đã qua
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
              {errors.slot && (
                <p className="mt-1 text-[11px] text-red-500">{errors.slot}</p>
              )}
            </div>
          </div>
        </div>

        {/* Services card */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
          <div className="flex-shrink-0 border-b border-gray-100 px-4 py-2 dark:border-gray-800">
            <h2 className="text-sm font-bold text-gray-950 dark:text-white">
              Chọn dịch vụ{" "}
              <span className="font-normal text-gray-400 text-xs">
                (chọn ít nhất 1)
              </span>
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            <div className="grid grid-cols-2 gap-2">
              {SERVICES.map((s) => (
                <button
                  key={s.name}
                  onClick={() =>
                    setSelectedSvcs((prev) =>
                      prev.includes(s.name)
                        ? prev.filter((x) => x !== s.name)
                        : [...prev, s.name],
                    )
                  }
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-left transition",
                    selectedSvcs.includes(s.name)
                      ? "border-orange-500 bg-orange-50 dark:bg-orange-500/10"
                      : "border-gray-100 bg-gray-50 hover:border-orange-300 dark:border-gray-800 dark:bg-gray-800",
                  )}
                >
                  <div className="text-lg">{s.icon}</div>
                  <div className="mt-0.5 text-xs font-semibold text-gray-950 dark:text-white">
                    {s.name}
                  </div>
                  <div className="text-[10px] text-gray-500">{s.price}</div>
                </button>
              ))}
            </div>
            {errors.svcs && (
              <p className="mt-2 text-[11px] text-red-500">{errors.svcs}</p>
            )}
          </div>

          <div className="flex-shrink-0 border-t border-gray-100 px-4 py-3 dark:border-gray-800">
            {selectedSvcs.length > 0 && (
              <div className="mb-2 flex flex-wrap gap-1">
                {selectedSvcs.map((n) => (
                  <span
                    key={n}
                    className="rounded-md bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700"
                  >
                    {n}
                  </span>
                ))}
              </div>
            )}
            {notif && (
              <div
                className={cn(
                  "mb-2 flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium",
                  notif.ok
                    ? "bg-green-50 text-green-700 border border-green-200 dark:bg-green-900/20 dark:text-green-400"
                    : "bg-red-50 text-red-600 border border-red-200 dark:bg-red-900/20 dark:text-red-400",
                )}
              >
                {notif.ok ? "✓" : "⚠"} {notif.msg}
              </div>
            )}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className={cn(
                "w-full rounded-xl py-2.5 text-sm font-bold text-white transition active:scale-[.98]",
                loading
                  ? "bg-orange-300 cursor-wait"
                  : "bg-orange-500 hover:bg-orange-600",
              )}
            >
              {loading ? "Đang gửi..." : "Đặt lịch hẹn"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
