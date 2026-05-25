import apiClient from "@/lib/axios";
import { Order, Payment, PaymentStatus } from "@/types";

export interface CreateOrderPayload {
  selectedCartItemIds?: string[];
  directItems?: Array<{
    productId: string;
    name: string;
    price: number;
    imageUrl: string;
    quantity: number;
  }>;
  paymentMethod: "cash" | "banking";
  addressId: string;
  couponCode?: string;
  notes?: string;
}

export interface CreateOrderResponse {
  order: Order;
  payment?: Payment;
  nextAction: "UPLOAD_BANKING_PROOF" | "ORDER_CREATED";
}

export const orderService = {
  async createOrder(payload: CreateOrderPayload): Promise<CreateOrderResponse> {
    const { data } = await apiClient.post<
      { success: boolean } & CreateOrderResponse
    >("/orders", payload);
    return {
      order: data.order,
      payment: data.payment,
      nextAction: data.nextAction,
    };
  },

  async getMyOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<{ success: boolean; orders: Order[] }>("/orders/my");
    return data.orders;
  },

  async getMyShippingOrders(): Promise<Order[]> {
    const { data } = await apiClient.get<{ success: boolean; orders: Order[] }>("/orders/my/shipping");
    return data.orders;
  },

  async getOrder(id: string): Promise<Order> {
    const { data } = await apiClient.get<{ success: boolean; order: Order }>(`/orders/${id}`);
    return data.order;
  },

  async listAdminOrders(params?: { page?: number; limit?: number }): Promise<{ orders: Order[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { data } = await apiClient.get("/admin/orders", { params });
    return data;
  },

  async listAdminPendingOrders(params?: { page?: number; limit?: number }): Promise<{ orders: Order[]; meta: { page: number; limit: number; total: number; totalPages: number } }> {
    const { data } = await apiClient.get("/admin/orders/pending", { params });
    return data;
  },

  async confirmOrder(id: string): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/admin/orders/${id}/confirm`);
    return data.order;
  },

  async markShipping(id: string, estimatedDeliveryAt: string): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/admin/orders/${id}/shipping`, {
      estimatedDeliveryAt,
    });
    return data.order;
  },

  async markDelivered(id: string): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/admin/orders/${id}/delivered`);
    return data.order;
  },

  async markCompleted(id: string): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/admin/orders/${id}/completed`);
    return data.order;
  },

  async cancelOrder(id: string, reason = ""): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/admin/orders/${id}/cancel`, { reason });
    return data.order;
  },

  async cancelMyBankingOrder(id: string, reason = ""): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/orders/${id}/cancel-unpaid-banking`, { reason });
    return data.order;
  },

  async updateCodPaymentStatus(id: string, paymentStatus: Extract<PaymentStatus, "paid">): Promise<Order> {
    const { data } = await apiClient.patch<{ success: boolean; order: Order }>(`/admin/orders/${id}/payment-status`, {
      paymentStatus,
    });
    return data.order;
  },
};
