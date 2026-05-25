import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { CheckCircle2, KeyRound, Lock, Mail, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";

const OTP_TTL_SECONDS = 180;
const RESEND_COOLDOWN_SECONDS = 60;

const resetPasswordSchema = z
  .object({
    email: z.string().trim().email("Email không hợp lệ"),
    otp: z.string().trim().regex(/^\d{6}$/, "Mã xác thực phải gồm 6 chữ số"),
    newPassword: z.string().min(6, "Mật khẩu phải có ít nhất 6 ký tự"),
    confirmPassword: z.string().min(6, "Vui lòng xác nhận mật khẩu"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Mật khẩu xác nhận không khớp",
    path: ["confirmPassword"],
  });

type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Không thể đặt lại mật khẩu";
  }
  return "Không thể đặt lại mật khẩu";
};

function CircularCountdownButton({
  cooldown,
  loading,
  onClick,
}: {
  cooldown: number;
  loading: boolean;
  onClick: () => void;
}) {
  const progress = cooldown > 0 ? cooldown / RESEND_COOLDOWN_SECONDS : 0;
  const angle = Math.round(progress * 360);

  if (cooldown > 0) {
    return (
      <button
        type="button"
        disabled
        className="relative flex h-12 w-12 items-center justify-center rounded-full text-sm font-bold text-amber-700 shadow-sm"
        style={{
          background: `conic-gradient(#f59e0b ${angle}deg, #fde68a ${angle}deg)`,
        }}
        aria-label={`Có thể gửi lại mã sau ${cooldown} giây`}
      >
        <span className="absolute inset-1 rounded-full bg-white dark:bg-gray-900" />
        <span className="relative">{cooldown}</span>
      </button>
    );
  }

  return (
    <Button type="button" variant="outline" loading={loading} onClick={onClick}>
      <RotateCcw size={16} /> Gửi lại mã
    </Button>
  );
}

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialEmail = useMemo(() => searchParams.get("email") || "", [searchParams]);
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS);
  const [expiresIn, setExpiresIn] = useState(OTP_TTL_SECONDS);
  const [isResending, setIsResending] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      email: initialEmail,
      otp: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setCooldown((current) => Math.max(0, current - 1));
      setExpiresIn((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearInterval(timer);
  }, []);

  const resendOtp = async () => {
    const email = getValues("email");
    const parsed = z.string().trim().email().safeParse(email);

    if (!parsed.success) {
      toast.error("Vui lòng nhập email hợp lệ trước khi gửi lại mã");
      return;
    }

    try {
      setIsResending(true);
      setCooldown(RESEND_COOLDOWN_SECONDS);
      const result = await authService.forgotPassword(parsed.data);
      toast.success(result.message);
      setExpiresIn(OTP_TTL_SECONDS);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setIsResending(false);
    }
  };

  const onSubmit = async (payload: ResetPasswordFormData) => {
    try {
      const result = await authService.resetPassword(payload);
      toast.success(result.message);
      reset(payload);
      navigate("/login");
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  const isExpired = expiresIn <= 0;

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-amber-50 via-white to-teal-50 px-4 py-12 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-lg rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-teal-100 text-teal-600 dark:bg-teal-900/30">
            <KeyRound size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-gray-950 dark:text-white">
            Đặt lại mật khẩu
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Nhập mã OTP đã gửi qua email và mật khẩu mới của bạn.
          </p>
        </div>

        <div
          className={cn(
            "mt-6 rounded-2xl border p-4 text-sm",
            isExpired
              ? "border-red-100 bg-red-50 text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300"
              : "border-amber-100 bg-amber-50 text-amber-700 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300",
          )}
        >
          {isExpired ? (
            "Mã xác thực đã hết hạn. Vui lòng gửi lại mã."
          ) : (
            <span>
              Mã xác thực còn hiệu lực trong{" "}
              <strong>{expiresIn}</strong> giây.
            </span>
          )}
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-6 space-y-4">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={14} />}
            error={errors.email?.message}
            {...register("email")}
          />

          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Input
              label="Mã xác thực"
              inputMode="numeric"
              maxLength={6}
              placeholder="123456"
              leftIcon={<CheckCircle2 size={14} />}
              error={errors.otp?.message}
              {...register("otp")}
            />
            <CircularCountdownButton
              cooldown={cooldown}
              loading={isResending}
              onClick={resendOtp}
            />
          </div>

          <Input
            label="Mật khẩu mới"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={14} />}
            error={errors.newPassword?.message}
            {...register("newPassword")}
          />

          <Input
            label="Xác nhận mật khẩu"
            type="password"
            placeholder="••••••••"
            leftIcon={<Lock size={14} />}
            error={errors.confirmPassword?.message}
            {...register("confirmPassword")}
          />

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            Đặt lại mật khẩu
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Quay lại{" "}
          <Link to="/login" className="font-semibold text-amber-500 hover:underline">
            đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
