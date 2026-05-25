import apiClient from "@/lib/axios";
import { AuthResponse, LoginPayload, RegisterPayload, User } from "@/types";

export const authService = {
  async login(payload: LoginPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>("/auth/login", payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthResponse> {
    const { data } = await apiClient.post<AuthResponse>(
      "/auth/register",
      payload,
    );
    return data;
  },

  async logout(): Promise<void> {
    await apiClient.post("/auth/logout");
  },

  async refresh(): Promise<{ accessToken: string }> {
    const { data } = await apiClient.post<{ accessToken: string }>(
      "/auth/refresh",
    );
    return data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<{ user: User }>("/auth/me");
    return data.user;
  },

  async requestReactivation(userId: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      "/auth/request-reactivation",
      { userId },
    );
    return data;
  },

  async forgotPassword(email: string): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      "/auth/forgot-password",
      { email },
    );
    return data;
  },

  async resetPassword(payload: {
    email: string;
    otp: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<{ message: string }> {
    const { data } = await apiClient.post<{ message: string }>(
      "/auth/reset-password",
      payload,
    );
    return data;
  },
};
