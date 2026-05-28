import apiClient from "@/lib/axios";
import {
  Review,
  ReviewListResponse,
  ReviewPayload,
  AdminReviewListParams,
  AdminReviewListResponse,
  ProductReviewsParams,
} from "@/types";

export const reviewApi = {
  async getProductReviews(
    productId: string,
    params?: ProductReviewsParams,
  ): Promise<ReviewListResponse> {
    const { data } = await apiClient.get<ReviewListResponse>(
      `/products/${productId}/reviews`,
      {
        params,
      },
    );
    return data;
  },

  async createReview(payload: ReviewPayload): Promise<Review> {
    const { data } = await apiClient.post<{ success: boolean; review: Review }>(
      "/reviews",
      payload,
    );
    return data.review;
  },

  async updateReview(
    reviewId: string,
    payload: Partial<ReviewPayload>,
  ): Promise<Review> {
    const { data } = await apiClient.patch<{
      success: boolean;
      review: Review;
    }>(`/reviews/${reviewId}`, payload);
    return data.review;
  },

  async deleteReview(reviewId: string): Promise<void> {
    await apiClient.delete(`/reviews/${reviewId}`);
  },

  async listAdminReviews(
    params: AdminReviewListParams = {},
  ): Promise<AdminReviewListResponse> {
    const { data } = await apiClient.get<AdminReviewListResponse>(
      "/admin/reviews",
      { params },
    );
    return data;
  },

  async hideReview(reviewId: string, reason: string): Promise<Review> {
    const { data } = await apiClient.patch<{
      success: boolean;
      review: Review;
    }>(`/admin/reviews/${reviewId}/hide`, {
      reason,
    });
    return data.review;
  },

  async showReview(reviewId: string): Promise<Review> {
    const { data } = await apiClient.patch<{
      success: boolean;
      review: Review;
    }>(`/admin/reviews/${reviewId}/show`);
    return data.review;
  },

  async deleteReviewAsAdmin(reviewId: string): Promise<void> {
    await apiClient.delete(`/admin/reviews/${reviewId}`);
  },
};
