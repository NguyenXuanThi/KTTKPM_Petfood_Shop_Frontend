import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Mail, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { AxiosError } from "axios";
import { authService } from "@/services/auth.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Email không hợp lệ"),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    return error.response?.data?.message || "Không thể gửi mã xác thực";
  }
  return "Không thể gửi mã xác thực";
};

export default function ForgotPasswordPage() {
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async ({ email }: ForgotPasswordFormData) => {
    try {
      const result = await authService.forgotPassword(email);
      toast.success(result.message);
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (error) {
      toast.error(getErrorMessage(error));
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-amber-50 via-white to-teal-50 px-4 py-12 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <div className="w-full max-w-md rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-900/30">
            <ShieldCheck size={26} />
          </div>
          <h1 className="mt-5 text-2xl font-extrabold text-gray-950 dark:text-white">
            Quên mật khẩu
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Nhập email tài khoản của bạn. Nếu email tồn tại, hệ thống sẽ gửi mã OTP để đặt lại mật khẩu.
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-5">
          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            leftIcon={<Mail size={14} />}
            error={errors.email?.message}
            {...register("email")}
          />

          <Button type="submit" size="lg" loading={isSubmitting} className="w-full">
            Gửi mã xác thực
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
          Đã nhớ mật khẩu?{" "}
          <Link to="/login" className="font-semibold text-amber-500 hover:underline">
            Đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}
