import { useState } from "react";
import { Plus, RefreshCw, ShoppingBag } from "lucide-react";
import { RewardShopItem, RewardShopPayload } from "@/api/rewardApi";
import { useAdminRewardShop, useCreateRewardShopItem, useToggleRewardShopItem, useUpdateRewardShopItem } from "@/hooks/useRewards";
import { RewardShopDialog } from "@/components/admin/rewards/RewardShopDialog";
import { RewardShopTable } from "@/components/admin/rewards/RewardShopTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";

export default function AdminRewardShopPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RewardShopItem | null>(null);
  const { data: items = [], isLoading, isError, refetch, isFetching } = useAdminRewardShop();
  const createMutation = useCreateRewardShopItem();
  const updateMutation = useUpdateRewardShopItem();
  const toggleMutation = useToggleRewardShopItem();

  const handleSubmit = async (payload: RewardShopPayload) => {
    if (editingItem) await updateMutation.mutateAsync({ id: editingItem._id, payload });
    else await createMutation.mutateAsync(payload);
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-600 dark:bg-emerald-900/30"><ShoppingBag size={22} /></div>
          <div>
            <h1 className="text-2xl font-black text-gray-950 dark:text-white">Quản lý đổi xu</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Quản lý coupon mà user có thể đổi bằng xu.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} loading={isFetching}><RefreshCw size={14} /> Làm mới</Button>
          <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}><Plus size={16} /> Tạo mục</Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        {isError ? (
          <div className="p-8"><EmptyState icon={<ShoppingBag size={28} />} title="Không thể tải cửa hàng đổi thưởng" description="Kiểm tra kết nối reward-service rồi thử lại." action={<Button onClick={() => refetch()}>Thử lại</Button>} /></div>
        ) : !isLoading && items.length === 0 ? (
          <div className="p-8"><EmptyState icon={<ShoppingBag size={28} />} title="Chưa có mục đổi thưởng nào" description="Thêm coupon scope reward để user đổi bằng xu." action={<Button onClick={() => setDialogOpen(true)}><Plus size={14} /> Tạo mục</Button>} /></div>
        ) : (
          <RewardShopTable items={items} isLoading={isLoading} onEdit={(item) => { setEditingItem(item); setDialogOpen(true); }} onToggle={(item) => toggleMutation.mutate({ id: item._id, enable: !item.isActive })} />
        )}
      </div>

      <RewardShopDialog item={editingItem} isOpen={dialogOpen} isLoading={createMutation.isPending || updateMutation.isPending} onClose={() => { setDialogOpen(false); setEditingItem(null); }} onSubmit={handleSubmit} />
    </div>
  );
}




