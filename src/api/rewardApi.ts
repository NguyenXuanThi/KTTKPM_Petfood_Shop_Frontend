import apiClient from "@/lib/axios";
import { Coupon } from "@/types/coupon";

export type RewardType = "coin" | "coupon";

export interface UserReward {
  _id: string;
  userId: string;
  coinBalance: number;
  spinBalance: number;
  totalSpinsEarned: number;
  totalSpinsUsed: number;
}

export interface RewardPoolItem {
  _id: string;
  type: RewardType;
  label: string;
  coinAmount?: number;
  couponId?: string;
  probability: number;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface RewardShopItem {
  _id: string;
  couponId: string;
  coupon?: Coupon | null;
  coinCost: number;
  isActive: boolean;
  displayOrder: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface SpinHistoryItem {
  _id: string;
  userId: string;
  orderId?: string | null;
  rewardType: RewardType;
  rewardLabel: string;
  coinAmount: number;
  couponId?: string | null;
  playedAt: string;
  createdAt?: string;
}

export interface SpinResult {
  rewardPoolId: string;
  rewardIndex: number;
  rewardType: RewardType;
  type: RewardType;
  label: string;
  coinAmount: number;
  couponId?: string | null;
  coinBalance: number;
  spinBalance: number;
}

interface SpinApiResponse {
  success: boolean;
  data?: {
      reward: {
        rewardPoolId: string;
        rewardIndex?: number;
        type: RewardType;
      label: string;
      coinAmount: number;
      couponId?: string | null;
    };
    spin: {
      remainingSpins: number;
      coinBalance: number;
    };
  };
  rewardPoolId?: string;
  rewardIndex?: number;
  rewardType?: RewardType;
  type?: RewardType;
  label?: string;
  coinAmount?: number;
  couponId?: string | null;
  coinBalance?: number;
  spinBalance?: number;
}

export interface RewardPoolPayload {
  type: RewardType;
  label: string;
  coinAmount?: number;
  couponId?: string;
  probability: number;
  isActive?: boolean;
  displayOrder?: number;
}

export interface RewardShopPayload {
  couponId: string;
  coinCost: number;
  isActive?: boolean;
  displayOrder?: number;
}

export const rewardApi = {
  async getMyRewards(): Promise<UserReward> {
    const { data } = await apiClient.get<{ success: boolean; reward: UserReward }>("/rewards/me");
    return data.reward;
  },

  async getWheelRewards(): Promise<RewardPoolItem[]> {
    const { data } = await apiClient.get<{ success: boolean; rewards: RewardPoolItem[] }>("/rewards/wheel");
    return data.rewards;
  },

  async spinWheel(): Promise<SpinResult> {
    const { data } = await apiClient.post<SpinApiResponse>("/rewards/spin");
    if (data.data) {
      return {
        rewardPoolId: data.data.reward.rewardPoolId,
        rewardIndex: Number(data.data.reward.rewardIndex ?? -1),
        rewardType: data.data.reward.type,
        type: data.data.reward.type,
        label: data.data.reward.label,
        coinAmount: data.data.reward.coinAmount,
        couponId: data.data.reward.couponId ?? null,
        coinBalance: data.data.spin.coinBalance,
        spinBalance: data.data.spin.remainingSpins,
      };
    }

    return {
      rewardPoolId: data.rewardPoolId || "",
      rewardIndex: Number(data.rewardIndex ?? -1),
      rewardType: (data.rewardType || data.type) as RewardType,
      type: (data.type || data.rewardType) as RewardType,
      label: data.label || "",
      coinAmount: data.coinAmount || 0,
      couponId: data.couponId ?? null,
      coinBalance: data.coinBalance || 0,
      spinBalance: data.spinBalance || 0,
    };
  },

  async getRewardShop(): Promise<RewardShopItem[]> {
    const { data } = await apiClient.get<{ success: boolean; items: RewardShopItem[] }>("/rewards/shop");
    return data.items;
  },

  async exchangeRewardShopItem(shopItemId: string) {
    const { data } = await apiClient.post(`/rewards/shop/${shopItemId}/exchange`);
    return data;
  },

  async getSpinHistory(): Promise<SpinHistoryItem[]> {
    const { data } = await apiClient.get<{ success: boolean; history: SpinHistoryItem[] }>("/rewards/history");
    return data.history;
  },

  async listAdminRewardPool(): Promise<RewardPoolItem[]> {
    const { data } = await apiClient.get<{ success: boolean; rewards: RewardPoolItem[] }>("/admin/rewards/pool");
    return data.rewards;
  },

  async createRewardPoolItem(payload: RewardPoolPayload): Promise<RewardPoolItem> {
    const { data } = await apiClient.post<{ success: boolean; reward: RewardPoolItem }>("/admin/rewards/pool", payload);
    return data.reward;
  },

  async updateRewardPoolItem(id: string, payload: Partial<RewardPoolPayload>): Promise<RewardPoolItem> {
    const { data } = await apiClient.patch<{ success: boolean; reward: RewardPoolItem }>(`/admin/rewards/pool/${id}`, payload);
    return data.reward;
  },

  async enableRewardPoolItem(id: string): Promise<RewardPoolItem> {
    const { data } = await apiClient.patch<{ success: boolean; reward: RewardPoolItem }>(`/admin/rewards/pool/${id}/enable`);
    return data.reward;
  },

  async disableRewardPoolItem(id: string): Promise<RewardPoolItem> {
    const { data } = await apiClient.patch<{ success: boolean; reward: RewardPoolItem }>(`/admin/rewards/pool/${id}/disable`);
    return data.reward;
  },

  async deleteRewardPoolItem(id: string): Promise<RewardPoolItem> {
    const { data } = await apiClient.delete<{ success: boolean; reward: RewardPoolItem }>(`/admin/rewards/pool/${id}`);
    return data.reward;
  },

  async listAdminRewardShop(): Promise<RewardShopItem[]> {
    const { data } = await apiClient.get<{ success: boolean; items: RewardShopItem[] }>("/admin/rewards/shop");
    return data.items;
  },

  async createRewardShopItem(payload: RewardShopPayload): Promise<RewardShopItem> {
    const { data } = await apiClient.post<{ success: boolean; item: RewardShopItem }>("/admin/rewards/shop", payload);
    return data.item;
  },

  async updateRewardShopItem(id: string, payload: Partial<RewardShopPayload>): Promise<RewardShopItem> {
    const { data } = await apiClient.patch<{ success: boolean; item: RewardShopItem }>(`/admin/rewards/shop/${id}`, payload);
    return data.item;
  },

  async enableRewardShopItem(id: string): Promise<RewardShopItem> {
    const { data } = await apiClient.patch<{ success: boolean; item: RewardShopItem }>(`/admin/rewards/shop/${id}/enable`);
    return data.item;
  },

  async disableRewardShopItem(id: string): Promise<RewardShopItem> {
    const { data } = await apiClient.patch<{ success: boolean; item: RewardShopItem }>(`/admin/rewards/shop/${id}/disable`);
    return data.item;
  },
};




