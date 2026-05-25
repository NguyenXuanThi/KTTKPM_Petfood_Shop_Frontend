import { useState } from "react";
import { Gift, Plus, RefreshCw } from "lucide-react";
import { RewardPoolItem, RewardPoolPayload } from "@/api/rewardApi";
import { useAdminRewardPool, useCreateRewardPoolItem, useDeleteRewardPoolItem, useToggleRewardPoolItem, useUpdateRewardPoolItem } from "@/hooks/useRewards";
import { ProbabilitySummary } from "@/components/admin/rewards/ProbabilitySummary";
import { RewardPoolDialog } from "@/components/admin/rewards/RewardPoolDialog";
import { RewardPoolTable } from "@/components/admin/rewards/RewardPoolTable";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";

export default function AdminRewardPoolPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<RewardPoolItem | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<RewardPoolItem | null>(null);
  const { data: rewards = [], isLoading, isError, refetch, isFetching } = useAdminRewardPool();
  const createMutation = useCreateRewardPoolItem();
  const updateMutation = useUpdateRewardPoolItem();
  const toggleMutation = useToggleRewardPoolItem();
  const deleteMutation = useDeleteRewardPoolItem();

  const handleSubmit = async (payload: RewardPoolPayload) => {
    if (editingItem) await updateMutation.mutateAsync({ id: editingItem._id, payload });
    else await createMutation.mutateAsync(payload);
    setDialogOpen(false);
    setEditingItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3">
          <div className="rounded-2xl bg-orange-100 p-3 text-orange-600 dark:bg-orange-900/30"><Gift size={22} /></div>
          <div>
            <h1 className="text-2xl font-black text-gray-950 dark:text-white">Quản lý vòng quay</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Cấu hình phần thưởng đang hoạt động và phần thưởng dự phòng cho vòng quay.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => refetch()} loading={isFetching}><RefreshCw size={14} /> Làm mới</Button>
          <Button onClick={() => { setEditingItem(null); setDialogOpen(true); }}><Plus size={16} /> Tạo phần thưởng</Button>
        </div>
      </div>

      <ProbabilitySummary rewards={rewards} />

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-950">
        {isError ? (
          <div className="p-8"><EmptyState icon={<Gift size={28} />} title="Không thể tải danh sách phần thưởng" description="Kiểm tra kết nối reward-service rồi thử lại." action={<Button onClick={() => refetch()}>Thử lại</Button>} /></div>
        ) : !isLoading && rewards.length === 0 ? (
          <div className="p-8"><EmptyState icon={<Gift size={28} />} title="Chưa có phần thưởng vòng quay" description="Tạo phần thưởng xu hoặc coupon cho vòng quay may mắn." action={<Button onClick={() => setDialogOpen(true)}><Plus size={14} /> Tạo phần thưởng</Button>} /></div>
        ) : (
          <RewardPoolTable rewards={rewards} isLoading={isLoading} onEdit={(item) => { setEditingItem(item); setDialogOpen(true); }} onToggle={(item) => toggleMutation.mutate({ id: item._id, enable: !item.isActive })} onDelete={setDeleteTarget} />
        )}
      </div>

      <RewardPoolDialog item={editingItem} isOpen={dialogOpen} isLoading={createMutation.isPending || updateMutation.isPending} onClose={() => { setDialogOpen(false); setEditingItem(null); }} onSubmit={handleSubmit} />

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Xóa phần thưởng">
        <p className="text-gray-600 dark:text-gray-300">Bạn có chắc muốn xóa <strong>{deleteTarget?.label}</strong> không? Thao tác này không thể hoàn tác.</p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>Hủy</Button>
          <Button variant="danger" loading={deleteMutation.isPending} onClick={async () => { if (!deleteTarget) return; await deleteMutation.mutateAsync(deleteTarget._id); setDeleteTarget(null); }}>Xóa</Button>
        </div>
      </Modal>
    </div>
  );
}




