import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { rewardApi, RewardPoolPayload, RewardShopPayload } from "@/api/rewardApi";
import { MY_COUPONS_KEY } from "@/hooks/useCoupons";

export const REWARDS_KEY = "rewards";
export const REWARD_WHEEL_KEY = "reward-wheel";
export const REWARD_SHOP_KEY = "reward-shop";
export const SPIN_HISTORY_KEY = "spin-history";
export const ADMIN_REWARD_POOL_KEY = "admin-reward-pool";
export const ADMIN_REWARD_SHOP_KEY = "admin-reward-shop";

const messageOf = (error: { response?: { data?: { message?: string } } }, fallback: string) =>
  error?.response?.data?.message ?? fallback;

export function useMyRewards(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: [REWARDS_KEY, "me"],
    queryFn: rewardApi.getMyRewards,
    enabled: options?.enabled ?? true,
  });
}

export function useWheelRewards() {
  return useQuery({ queryKey: [REWARD_WHEEL_KEY], queryFn: rewardApi.getWheelRewards });
}

export function useSpinHistory() {
  return useQuery({ queryKey: [SPIN_HISTORY_KEY], queryFn: rewardApi.getSpinHistory });
}

export function useSpinWheel() {
  return useMutation({
    mutationFn: rewardApi.spinWheel,
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(messageOf(error, "Không thể quay vòng quay"));
    },
  });
}

export function useRewardShop() {
  return useQuery({ queryKey: [REWARD_SHOP_KEY], queryFn: rewardApi.getRewardShop });
}

export function useExchangeReward() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rewardApi.exchangeRewardShopItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [REWARDS_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_SHOP_KEY] });
      queryClient.invalidateQueries({ queryKey: [MY_COUPONS_KEY] });
      toast.success("Đổi coupon thành công");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(messageOf(error, "Không thể đổi thưởng"));
    },
  });
}

export function useAdminRewardPool() {
  return useQuery({ queryKey: [ADMIN_REWARD_POOL_KEY], queryFn: rewardApi.listAdminRewardPool });
}

export function useCreateRewardPoolItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RewardPoolPayload) => rewardApi.createRewardPoolItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_POOL_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_WHEEL_KEY] });
      toast.success("Tạo phần thưởng vòng quay thành công");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể tạo phần thưởng")),
  });
}

export function useUpdateRewardPoolItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RewardPoolPayload> }) => rewardApi.updateRewardPoolItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_POOL_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_WHEEL_KEY] });
      toast.success("Cập nhật phần thưởng vòng quay thành công");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể cập nhật phần thưởng")),
  });
}

export function useToggleRewardPoolItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      enable ? rewardApi.enableRewardPoolItem(id) : rewardApi.disableRewardPoolItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_POOL_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_WHEEL_KEY] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể đổi trạng thái phần thưởng")),
  });
}

export function useDeleteRewardPoolItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: rewardApi.deleteRewardPoolItem,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_POOL_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_WHEEL_KEY] });
      toast.success("Xóa phần thưởng vòng quay thành công");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể xóa phần thưởng")),
  });
}

export function useAdminRewardShop() {
  return useQuery({ queryKey: [ADMIN_REWARD_SHOP_KEY], queryFn: rewardApi.listAdminRewardShop });
}

export function useCreateRewardShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RewardShopPayload) => rewardApi.createRewardShopItem(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_SHOP_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_SHOP_KEY] });
      toast.success("Tạo mục đổi thưởng thành công");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể tạo mục đổi thưởng")),
  });
}

export function useUpdateRewardShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<RewardShopPayload> }) => rewardApi.updateRewardShopItem(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_SHOP_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_SHOP_KEY] });
      toast.success("Cập nhật mục đổi thưởng thành công");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể cập nhật mục đổi thưởng")),
  });
}

export function useToggleRewardShopItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, enable }: { id: string; enable: boolean }) =>
      enable ? rewardApi.enableRewardShopItem(id) : rewardApi.disableRewardShopItem(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ADMIN_REWARD_SHOP_KEY] });
      queryClient.invalidateQueries({ queryKey: [REWARD_SHOP_KEY] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => toast.error(messageOf(error, "Không thể đổi trạng thái mục đổi thưởng")),
  });
}



