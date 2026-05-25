import { useEffect, useRef, useState } from "react";
import { Check, Info, Loader2, Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { useDebounce } from "@/hooks/useDebounce";
import { userService } from "@/services/user.service";
import { UserSearchResult } from "@/types";
import { Coupon } from "@/types/coupon";
import { cn } from "@/lib/utils";

interface AssignCouponModalProps {
  coupon: Coupon | null;
  isOpen: boolean;
  isLoading: boolean;
  onClose: () => void;
  onSubmit: (couponId: string, userId: string) => void;
}

function getInitials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

export function AssignCouponModal({
  coupon,
  isOpen,
  isLoading,
  onClose,
  onSubmit,
}: AssignCouponModalProps) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<UserSearchResult | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const debouncedQuery = useDebounce(query, 300);

  // Reset on open/close
  useEffect(() => {
    if (isOpen) {
      setQuery("");
      setSelected(null);
      setDropdownOpen(false);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const { data: results = [], isFetching } = useQuery({
    queryKey: ["user-search", debouncedQuery],
    queryFn: () => userService.searchUsers(debouncedQuery),
    enabled: debouncedQuery.trim().length >= 1 && !selected,
    staleTime: 30_000,
  });

  // Open dropdown when results arrive
  useEffect(() => {
    if (results.length > 0 && !selected) setDropdownOpen(true);
    else if (results.length === 0) setDropdownOpen(false);
  }, [results, selected]);

  const handleSelect = (user: UserSearchResult) => {
    setSelected(user);
    setQuery(user.fullName);
    setDropdownOpen(false);
  };

  const handleClear = () => {
    setSelected(null);
    setQuery("");
    setDropdownOpen(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!coupon || !selected) return;
    onSubmit(coupon._id, selected._id);
  };

  const showSpinner = isFetching && !selected && debouncedQuery.length >= 1;
  const showEmpty =
    !isFetching &&
    debouncedQuery.length >= 1 &&
    results.length === 0 &&
    !selected;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Gán coupon cho user">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Coupon info strip */}
        {coupon && (
          <div className="flex items-start gap-3 rounded-2xl border border-amber-100 bg-amber-50 p-4 dark:border-amber-900/30 dark:bg-amber-900/10">
            <Info
              size={16}
              className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400"
            />
            <div className="text-sm">
              <p className="font-semibold text-amber-800 dark:text-amber-300">
                {coupon.code}
              </p>
              <p className="text-amber-700 dark:text-amber-400">
                {coupon.type === "percentage"
                  ? `${coupon.discountValue}% giảm`
                  : `${coupon.discountValue.toLocaleString("vi-VN")}đ giảm`}
                {coupon.minOrderAmount > 0 &&
                  ` · tối thiểu ${coupon.minOrderAmount.toLocaleString("vi-VN")}đ`}
              </p>
            </div>
          </div>
        )}

        {/* User search */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Tìm user
          </label>

          <div className="relative" ref={dropdownRef}>
            {/* Input */}
            <div
              className={cn(
                "flex items-center gap-2 rounded-xl border bg-white px-3 py-2.5 transition-all dark:bg-gray-900",
                dropdownOpen
                  ? "border-amber-400 ring-2 ring-amber-100 dark:ring-amber-900/30"
                  : "border-gray-200 dark:border-gray-700",
                selected && "border-emerald-400 dark:border-emerald-600"
              )}
            >
              {/* Left icon */}
              {showSpinner ? (
                <Loader2
                  size={15}
                  className="shrink-0 animate-spin text-amber-500"
                />
              ) : selected ? (
                <Check size={15} className="shrink-0 text-emerald-500" />
              ) : (
                <Search size={15} className="shrink-0 text-gray-400" />
              )}

              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (selected) setSelected(null);
                }}
                onFocus={() => {
                  if (results.length > 0 && !selected) setDropdownOpen(true);
                }}
                placeholder="Tìm theo tên hoặc email..."
                className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-100"
              />

              {/* Clear button */}
              {(query || selected) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="shrink-0 rounded-md p-0.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800"
                >
                  <X size={14} />
                </button>
              )}
            </div>

            {/* Selected user card */}
            {selected && (
              <div className="mt-2 flex items-center gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-900/10">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                  {selected.avatarUrl ? (
                    <img
                      src={selected.avatarUrl}
                      alt={selected.fullName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    getInitials(selected.fullName)
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
                    {selected.fullName}
                  </p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                    {selected.email}
                  </p>
                </div>
                <Check size={15} className="shrink-0 text-emerald-500" />
              </div>
            )}

            {/* Dropdown results */}
            {dropdownOpen && results.length > 0 && (
              <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                {results.map((user) => (
                  <button
                    key={user._id}
                    type="button"
                    onClick={() => handleSelect(user)}
                    className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-amber-50 dark:hover:bg-amber-900/10"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-amber-100 text-xs font-bold text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(user.fullName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                        {user.email}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {/* Empty state */}
            {showEmpty && (
              <div className="absolute z-20 mt-1 w-full rounded-xl border border-gray-200 bg-white px-4 py-3 text-center text-sm text-gray-500 shadow-lg dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400">
                Không tìm thấy user cho "{debouncedQuery}"
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-1">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button type="submit" loading={isLoading} disabled={!selected}>
            Gán coupon
          </Button>
        </div>
      </form>
    </Modal>
  );
}



