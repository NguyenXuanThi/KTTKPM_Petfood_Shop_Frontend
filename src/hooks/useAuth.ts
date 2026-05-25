import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useState } from "react";
import { authService } from "@/services/auth.service";
import { setCredentials, logout as logoutAction } from "@/store/authSlice";
import { useAppDispatch, useAppSelector } from "./useAppDispatch";
import { InactiveLoginResponse, LoginPayload, RegisterPayload } from "@/types";
import {
  cartService,
  clearGuestToken,
} from "@/services/cart.service";
import { CART_KEY } from "./useCartApi";
import { WISHLIST_KEY } from "./useWishlistApi";

export function useAuth() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [inactiveAccount, setInactiveAccount] =
    useState<InactiveLoginResponse | null>(null);
  const [loginError, setLoginError] = useState("");
  const { user, isAuthenticated, accessToken } = useAppSelector((s) => s.auth);

  const mergeGuestCartAfterLogin = async () => {
    const guestToken = localStorage.getItem("cartGuestToken");
    if (guestToken) {
      try {
        await cartService.mergeCart(guestToken);
        clearGuestToken();
      } catch {
        // merge failure is non-critical
      }
    }
    queryClient.invalidateQueries({ queryKey: [CART_KEY] });
  };

  const loginMutation = useMutation({
    mutationFn: (payload: LoginPayload) => authService.login(payload),
    onSuccess: async (data) => {
      setInactiveAccount(null);
      setLoginError("");
      dispatch(
        setCredentials({ user: data.user, accessToken: data.accessToken }),
      );
      await mergeGuestCartAfterLogin();
      toast.success(`Welcome back, ${data.user.fullName}! 🐾`);
      if (data.user.role === "admin") {
        navigate("/admin");
      } else if (data.user.role === "support") {
        navigate("/support");
      } else {
        navigate("/");
      }
    },
    onError: (error: {
      response?: {
        status?: number;
        data?: Partial<InactiveLoginResponse> & { message?: string };
      };
    }) => {
      const data = error?.response?.data;

      if (
        error?.response?.status === 403 &&
        data?.canRequestReactivation &&
        data?.userId
      ) {
        setInactiveAccount({
          message: data.message ?? "Your account is inactive",
          reason: data.reason ?? "Account is inactive",
          canRequestReactivation: true,
          userId: data.userId,
        });
        setLoginError("Tài khoản của bạn đang bị vô hiệu hóa");
        return;
      }

      setInactiveAccount(null);
      const status = error?.response?.status;
      const backendMessage = data?.message || "";
      const message =
        status === 400 || status === 401 || backendMessage === "Invalid email or password"
          ? "Sai email hoặc mật khẩu"
          : backendMessage.toLowerCase().includes("refresh token")
            ? "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."
            : backendMessage || "Sai email hoặc mật khẩu";
      setLoginError(message);
    },
  });

  const registerMutation = useMutation({
    mutationFn: (payload: RegisterPayload) => authService.register(payload),
    onSuccess: async (data) => {
      dispatch(
        setCredentials({ user: data.user, accessToken: data.accessToken }),
      );
      await mergeGuestCartAfterLogin();
      toast.success(`Welcome to PawMart, ${data.user.fullName}! 🐾`);
      navigate("/");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error?.response?.data?.message ?? "Registration failed");
    },
  });

  const logoutMutation = useMutation({
    mutationFn: () => authService.logout(),
    onSettled: () => {
      const isAdmin = user?.role === "admin";
      dispatch(logoutAction());
      queryClient.removeQueries({ queryKey: [CART_KEY] });
      queryClient.removeQueries({ queryKey: WISHLIST_KEY });
      toast.success("Logged out. See you soon! 🐾");
      navigate(isAdmin ? "/login" : "/");
    },
  });

  return {
    user,
    isAuthenticated,
    accessToken,
    isAdmin: user?.role === "admin",
    isSupport: user?.role === "support",
    login: loginMutation.mutate,
    loginError,
    clearLoginError: () => setLoginError(""),
    inactiveAccount,
    clearInactiveAccount: () => setInactiveAccount(null),
    register: registerMutation.mutate,
    logout: logoutMutation.mutate,
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
    isLoggingOut: logoutMutation.isPending,
  };
}
