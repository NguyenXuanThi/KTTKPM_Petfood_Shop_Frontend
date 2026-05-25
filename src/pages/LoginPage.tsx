import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Eye, EyeOff, Mail, Lock } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { InactiveAccountCard } from "@/components/admin/InactiveAccountCard";

const loginSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, "Vui lòng nhập email")
    .email("Email không hợp lệ"),
  password: z.string().min(1, "Vui lòng nhập mật khẩu"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoggingIn, inactiveAccount, clearInactiveAccount, loginError, clearLoginError } =
    useAuth();
  const [showPass, setShowPass] = useState(false);
  const { t } = useTranslation();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  return (
    <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-gradient-to-br from-amber-50 via-white to-teal-50 px-4 py-12 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        <div className="rounded-3xl border border-gray-100 bg-white p-8 shadow-xl dark:border-gray-800 dark:bg-gray-900">
          {/* Logo */}
          <div className="mb-8 text-center">
            <Link to="/" className="inline-flex items-center gap-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-500 text-2xl shadow-md">
                🐾
              </div>
            </Link>
            <h1 className="mt-4 text-2xl font-extrabold text-gray-900 dark:text-white">
              {t("pawmart.auth.welcomeBack")}
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t("pawmart.auth.signInDesc")}
            </p>
          </div>

          {inactiveAccount && (
            <div className="mb-6">
              <InactiveAccountCard
                inactiveAccount={inactiveAccount}
                onTryAgain={clearInactiveAccount}
              />
            </div>
          )}

          <form
            onSubmit={handleSubmit((data) => {
              clearLoginError();
              login(data);
            })}
            className="space-y-4"
          >
            <Input
              label={t("pawmart.auth.email")}
              type="email"
              placeholder="you@example.com"
              leftIcon={<Mail size={14} />}
              error={errors.email?.message}
              onInput={clearLoginError}
              {...register("email")}
            />

            <Input
              label={t("pawmart.auth.password")}
              type={showPass ? "text" : "password"}
              placeholder="••••••••"
              leftIcon={<Lock size={14} />}
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPass((v) => !v)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  {showPass ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              }
              error={errors.password?.message}
              onInput={clearLoginError}
              {...register("password")}
            />

            {loginError && (
              <div className="rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm font-medium text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
                {loginError}
              </div>
            )}

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-amber-500 focus:ring-amber-400"
                />
                {t("pawmart.auth.rememberMe")}
              </label>
              <Link
                to="/forgot-password"
                className="text-sm text-amber-500 hover:underline"
              >
                {t("pawmart.auth.forgotPassword")}
              </Link>
            </div>

            <Button
              type="submit"
              size="lg"
              loading={isLoggingIn}
              className="w-full"
            >
              {isLoggingIn ? "Đang đăng nhập..." : t("pawmart.auth.signIn")}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
            <span className="text-xs text-gray-400">OR</span>
            <div className="h-px flex-1 bg-gray-100 dark:bg-gray-800" />
          </div>

          {/* Demo credentials */}
          <div className="rounded-xl bg-amber-50 p-4 dark:bg-amber-900/20">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              {t("pawmart.auth.demoCredentials")}
            </p>
            <p className="mt-1 text-xs text-amber-600 dark:text-amber-500">
              Admin: admin@pawmart.vn / admin123
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t("pawmart.auth.noAccount")}{" "}
            <Link
              to="/register"
              className="font-semibold text-amber-500 hover:underline"
            >
              {t("pawmart.auth.signUpFree")}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
