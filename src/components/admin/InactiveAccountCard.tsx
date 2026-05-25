import { useEffect, useMemo, useState } from "react";
import { AlertCircle, MailCheck, RotateCcw } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { authService } from "@/services/auth.service";
import { InactiveLoginResponse } from "@/types";

interface InactiveAccountCardProps {
  inactiveAccount: InactiveLoginResponse;
  onTryAgain?: () => void;
}

const COOLDOWN_MS = 15 * 60 * 1000;

const formatRemaining = (ms: number) => {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export function InactiveAccountCard({
  inactiveAccount,
  onTryAgain,
}: InactiveAccountCardProps) {
  const storageKey = useMemo(
    () => `reactivationCooldown:${inactiveAccount.userId}`,
    [inactiveAccount.userId],
  );
  const [cooldownUntil, setCooldownUntil] = useState(() =>
    Number(localStorage.getItem(storageKey) || 0),
  );
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const remainingMs = Math.max(0, cooldownUntil - now);
  const isCoolingDown = remainingMs > 0;

  const requestMutation = useMutation({
    mutationFn: () => authService.requestReactivation(inactiveAccount.userId),
    onSuccess: () => {
      const nextCooldown = Date.now() + COOLDOWN_MS;
      localStorage.setItem(storageKey, String(nextCooldown));
      setCooldownUntil(nextCooldown);
      toast.success("Đã gửi yêu cầu đến admin.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(
        error?.response?.data?.message ?? "Không thể gửi yêu cầu kích hoạt lại",
      );
    },
  });

  return (
    <div className="rounded-[28px] border border-red-100/80 bg-white/95 p-6 shadow-[0_20px_60px_-24px_rgba(239,68,68,0.28)] backdrop-blur dark:border-red-900/40 dark:bg-gray-950/95">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-500 dark:bg-red-900/30 dark:text-red-300">
          <AlertCircle size={24} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Tài khoản không hoạt động
            </h2>
            <span className="rounded-full border border-red-100 bg-red-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-red-500 dark:border-red-900/40 dark:bg-red-900/20 dark:text-red-300">
              Cần admin xem xét
            </span>
          </div>
          <p className="mt-1.5 text-sm leading-6 text-gray-600 dark:text-gray-300">
            {inactiveAccount.message || "Tài khoản của bạn hiện đang không hoạt động."}
          </p>

          <div className="mt-5 rounded-2xl border border-red-100/80 bg-red-50/50 p-4 dark:border-red-900/30 dark:bg-red-950/15">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-red-500 dark:text-red-300">
                Lý do vô hiệu hóa
              </p>
              <div className="h-px flex-1 bg-gradient-to-r from-red-200/70 to-transparent dark:from-red-900/50" />
            </div>
            <p className="max-h-32 overflow-auto whitespace-pre-wrap rounded-xl bg-white/80 px-4 py-3 pr-3 text-sm leading-6 text-gray-700 shadow-inner dark:bg-gray-950/70 dark:text-gray-200">
              {inactiveAccount.reason}
            </p>
            <p className="mt-3 text-xs leading-5 text-gray-500 dark:text-gray-400">
              Nếu bạn cho rằng đây là nhầm lẫn, hãy gửi yêu cầu để admin xem xét.
            </p>
          </div>

          <div className="mt-5 space-y-3">
            <div className="grid gap-3 sm:grid-cols-2">
              <Button
                type="button"
                variant="danger"
                size="lg"
                className="w-full justify-center"
                loading={requestMutation.isPending}
                disabled={isCoolingDown}
                onClick={() => requestMutation.mutate()}
              >
                <MailCheck size={16} />
                {isCoolingDown ? "Đã gửi yêu cầu" : "Gửi yêu cầu đến admin"}
              </Button>
              {onTryAgain && (
                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  className="w-full justify-center border-gray-200 text-gray-700 dark:border-gray-700 dark:text-gray-200"
                  onClick={onTryAgain}
                >
                  <RotateCcw size={16} />
                  Thử tài khoản khác
                </Button>
              )}
            </div>

            {isCoolingDown && (
              <p className="text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                Bạn có thể gửi yêu cầu tiếp theo sau {formatRemaining(remainingMs)}.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}


