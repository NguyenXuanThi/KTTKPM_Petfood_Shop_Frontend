import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Search, XCircle, ZoomIn } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { paymentService } from "@/services/payment.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Modal } from "@/components/ui/Modal";
import { formatPrice } from "@/lib/utils";

const paymentStateLabel = (status: string, hasProof: boolean) => {
  if (status === "pending" && !hasProof) return "Đang chờ user tải ảnh chuyển khoản";
  if (status === "waiting_verify" && hasProof) return "Đang chờ admin xác minh";
  return status.replace(/_/g, " ");
};

export default function AdminBankingPaymentsPage() {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [imageZoom, setImageZoom] = useState<string | null>(null);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedId, setSelectedId] = useState("");
  const [reason, setReason] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-banking-payments"],
    queryFn: () => paymentService.getPendingBankingPayments(),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["admin-banking-payments"] });

  const approveMutation = useMutation({
    mutationFn: (id: string) => paymentService.approvePayment(id),
    onSuccess: () => {
      toast.success("Duyệt payment thành công");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể duyệt payment"),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, rejectedReason }: { id: string; rejectedReason: string }) =>
      paymentService.rejectPayment(id, rejectedReason),
    onSuccess: () => {
      toast.success("Đã từ chối payment");
      setRejectDialogOpen(false);
      setReason("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể từ chối payment"),
  });

  const rows = data?.payments ?? [];
  const filtered = useMemo(() => {
    if (!keyword.trim()) return rows;
    const k = keyword.toLowerCase();
    return rows.filter((p) => p.orderId.toLowerCase().includes(k) || p._id.toLowerCase().includes(k));
  }, [rows, keyword]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Xác minh payment banking</h1>
        <div className="w-80">
          <Input value={keyword} onChange={(e) => setKeyword(e.target.value)} placeholder="Tìm payment/order" leftIcon={<Search size={14} />} />
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-gray-500">Đang tải payment...</p>}
        {!isLoading && filtered.length === 0 && <p className="text-sm text-gray-500">Không có payment chờ xử lý</p>}

        {filtered.map((payment) => (
          <div key={payment._id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="grid gap-3 md:grid-cols-[140px_1fr_auto] md:items-center">
              <button
                onClick={() => setImageZoom(payment.proofImageUrl || null)}
                className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
              >
                {payment.proofImageUrl ? (
                  <img src={payment.proofImageUrl} alt="proof" className="h-24 w-full object-cover" />
                ) : (
                  <div className="flex h-24 items-center justify-center text-xs text-gray-400">Chưa có ảnh xác minh</div>
                )}
                <span className="absolute inset-0 hidden items-center justify-center bg-black/40 text-white group-hover:flex">
                  <ZoomIn size={16} />
                </span>
              </button>

              <div className="text-sm">
                <p className="font-mono font-semibold text-gray-900 dark:text-white">Payment #{payment._id.slice(-8).toUpperCase()}</p>
                <p className="text-gray-500">Order: #{payment.orderId.slice(-8).toUpperCase()}</p>
                <p className="text-gray-500">Số tiền: <span className="font-semibold text-amber-600">{formatPrice(payment.amount)}</span></p>
                <p className="text-gray-500">
                  Trạng thái:{" "}
                  <span className="font-semibold text-gray-800 dark:text-gray-200">
                    {paymentStateLabel(payment.status, Boolean(payment.proofImageUrl))}
                  </span>
                </p>
                <p className="text-gray-500">
                  {payment.proofImageUrl ? "Đã tải lên" : "Ngày tạo"}:{" "}
                  {new Date(payment.updatedAt).toLocaleString("vi-VN")}
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Button
                  size="sm"
                  disabled={payment.status !== "waiting_verify" || !payment.proofImageUrl}
                  onClick={() => approveMutation.mutate(payment._id)}
                >
                  <CheckCircle2 size={14} /> Duyệt
                </Button>
                <Button
                  size="sm"
                  variant="danger"
                  disabled={payment.status !== "waiting_verify" || !payment.proofImageUrl}
                  onClick={() => {
                    setSelectedId(payment._id);
                    setRejectDialogOpen(true);
                  }}
                >
                  <XCircle size={14} /> Từ chối
                </Button>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={!!imageZoom} onClose={() => setImageZoom(null)} title="Xem ảnh xác minh" size="xl">
        {imageZoom && <img src={imageZoom} alt="proof-zoom" className="max-h-[70vh] w-full rounded-xl object-contain" />}
      </Modal>

      <Modal isOpen={rejectDialogOpen} onClose={() => setRejectDialogOpen(false)} title="Từ chối payment">
        <div className="space-y-3">
          <textarea
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Nhập lý do từ chối"
          />
          <div className="flex justify-end">
            <Button
              variant="danger"
              disabled={!reason.trim()}
              loading={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: selectedId, rejectedReason: reason.trim() })}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}




