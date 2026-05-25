import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Truck } from "lucide-react";
import { toast } from "sonner";
import { orderService } from "@/services/order.service";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { StatusBadge } from "@/components/account/StatusBadge";
import { formatPrice } from "@/lib/utils";
import { Modal } from "@/components/ui/Modal";

function OrderAdminPanel({ pendingOnly = false }: { pendingOnly?: boolean }) {
  const queryClient = useQueryClient();
  const [keyword, setKeyword] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState<string>("");
  const [eta, setEta] = useState("");
  const [cancelReason, setCancelReason] = useState("");
  const [shippingDialogOpen, setShippingDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);

  const queryKey = pendingOnly ? ["admin-orders-pending"] : ["admin-orders-all"];

  const { data, isLoading } = useQuery({
    queryKey,
    queryFn: () => (pendingOnly ? orderService.listAdminPendingOrders() : orderService.listAdminOrders()),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey });

  const confirmMutation = useMutation({
    mutationFn: (id: string) => orderService.confirmOrder(id),
    onSuccess: () => {
      toast.success("Đã xác nhận order");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể xác nhận order"),
  });

  const shippingMutation = useMutation({
    mutationFn: ({ id, estimatedDeliveryAt }: { id: string; estimatedDeliveryAt: string }) =>
      orderService.markShipping(id, estimatedDeliveryAt),
    onSuccess: () => {
      toast.success("Order đã chuyển sang đang giao");
      setShippingDialogOpen(false);
      setEta("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể đặt trạng thái đang giao"),
  });

  const deliveredMutation = useMutation({
    mutationFn: (id: string) => orderService.markDelivered(id),
    onSuccess: () => {
      toast.success("Đã đánh dấu order đã giao");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể đánh dấu đã giao"),
  });

  const completedMutation = useMutation({
    mutationFn: (id: string) => orderService.markCompleted(id),
    onSuccess: () => {
      toast.success("Order đã hoàn thành");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể hoàn thành order"),
  });

  const codPaidMutation = useMutation({
    mutationFn: (id: string) => orderService.updateCodPaymentStatus(id, "paid"),
    onSuccess: () => {
      toast.success("Đã đánh dấu COD payment là paid");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể đánh dấu payment là paid"),
  });

  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => orderService.cancelOrder(id, reason),
    onSuccess: () => {
      toast.success("Đã hủy order");
      setCancelDialogOpen(false);
      setCancelReason("");
      refresh();
    },
    onError: (e: any) => toast.error(e?.response?.data?.message ?? "Không thể hủy order"),
  });

  const orders = data?.orders ?? [];
  const filtered = useMemo(() => {
    if (!keyword.trim()) return orders;
    const key = keyword.toLowerCase();
    return orders.filter(
      (o) => o._id.toLowerCase().includes(key) || o.shippingAddress.fullName.toLowerCase().includes(key),
    );
  }, [orders, keyword]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {pendingOnly ? "Order chờ xử lý" : "Quản lý Order"}
        </h1>
        <div className="w-80">
          <Input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Tìm order ID / khách hàng"
            leftIcon={<Search size={14} />}
          />
        </div>
      </div>

      <div className="space-y-3">
        {isLoading && <p className="text-sm text-gray-500">Đang tải order...</p>}
        {!isLoading && filtered.map((order) => (
          <div key={order._id} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
            <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm font-semibold text-gray-900 dark:text-white">#{order._id.slice(-8).toUpperCase()}</p>
                <p className="text-sm text-gray-500">{order.shippingAddress.fullName} - {order.shippingAddress.phone}</p>
              </div>
              <div className="flex gap-2">
                <StatusBadge type="payment" value={order.paymentStatus} />
                <StatusBadge type="order" value={order.orderStatus} />
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-300">
              <p>Tổng: <span className="font-semibold text-amber-600">{formatPrice(order.totalAmount)}</span></p>
              <p>Phương thức payment: {order.paymentMethod}</p>
            </div>

            <div className="mt-3 flex flex-wrap gap-2">
              {order.orderStatus === "pending" && (
                <Button size="sm" onClick={() => confirmMutation.mutate(order._id)} loading={confirmMutation.isPending}>
                  Xác nhận
                </Button>
              )}

              {order.orderStatus === "confirmed" && (
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setSelectedOrderId(order._id);
                    setShippingDialogOpen(true);
                  }}
                >
                  <Truck size={14} /> Cập nhật đang giao
                </Button>
              )}

              {order.orderStatus === "shipping" && (
                <Button size="sm" variant="outline" onClick={() => deliveredMutation.mutate(order._id)}>
                  Đánh dấu đã giao
                </Button>
              )}

              {order.orderStatus === "delivered" && (
                <Button size="sm" variant="outline" onClick={() => completedMutation.mutate(order._id)}>
                  Đánh dấu hoàn thành
                </Button>
              )}

              {order.paymentMethod === "cash" && order.paymentStatus === "unpaid" && (
                <Button size="sm" variant="ghost" onClick={() => codPaidMutation.mutate(order._id)}>
                  Đánh dấu COD paid
                </Button>
              )}

              {!(["completed", "cancelled"] as string[]).includes(order.orderStatus) &&
                !order.estimatedDeliveryAt && (
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => {
                    setSelectedOrderId(order._id);
                    setCancelDialogOpen(true);
                  }}
                >
                  Hủy
                </Button>
              )}
            </div>
          </div>
        ))}
      </div>

      <Modal isOpen={shippingDialogOpen} onClose={() => setShippingDialogOpen(false)} title="Cập nhật đang giao Estimate">
        <div className="space-y-3">
          <Input type="datetime-local" value={eta} onChange={(e) => setEta(e.target.value)} />
          <div className="flex justify-end">
            <Button
              onClick={() => shippingMutation.mutate({ id: selectedOrderId, estimatedDeliveryAt: new Date(eta).toISOString() })}
              loading={shippingMutation.isPending}
              disabled={!eta}
            >
              Lưu
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={cancelDialogOpen} onClose={() => setCancelDialogOpen(false)} title="Hủy Order">
        <div className="space-y-3">
          <textarea
            rows={3}
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm dark:border-gray-700 dark:bg-gray-900"
            placeholder="Lý do hủy"
          />
          <div className="flex justify-end">
            <Button
              variant="danger"
              onClick={() => cancelMutation.mutate({ id: selectedOrderId, reason: cancelReason })}
              loading={cancelMutation.isPending}
            >
              Xác nhận cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function AdminOrdersPage() {
  return <OrderAdminPanel pendingOnly={false} />;
}

export function AdminPendingOrdersPage() {
  return <OrderAdminPanel pendingOnly />;
}




