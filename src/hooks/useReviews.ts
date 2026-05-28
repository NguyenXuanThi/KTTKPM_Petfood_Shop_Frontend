import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { reviewService } from "@/services/review.service";
import {
  AdminReviewListParams,
  ProductReviewsParams,
  ReviewPayload,
} from "@/types";
import { PRODUCTS_KEY } from "./useProducts";

export const PRODUCT_REVIEWS_KEY = "reviews";
export const ADMIN_REVIEWS_KEY = "admin-reviews";

const getErrorMessage = (
  error: { response?: { data?: { message?: string } } },
  fallback: string,
) => error?.response?.data?.message ?? fallback;

export function useProductReviews(
  productId: string,
  params?: ProductReviewsParams,
) {
  return useQuery({
    queryKey: [PRODUCT_REVIEWS_KEY, productId, params],
    queryFn: () => reviewService.getProductReviews(productId, params),
    enabled: !!productId,
  });
}

export function useAdminReviews(params: AdminReviewListParams) {
  return useQuery({
    queryKey: [ADMIN_REVIEWS_KEY, params],
    queryFn: () => reviewService.listAdminReviews(params),
    placeholderData: (prev) => prev,
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ReviewPayload) => reviewService.createReview(payload),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_REVIEWS_KEY, review.productId],
      });
      queryClient.invalidateQueries({
        queryKey: [PRODUCTS_KEY, review.productId],
      });
      queryClient.invalidateQueries({
        queryKey: ["order-detail", review.orderId],
      });
      queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
      toast.success("Review submitted successfully.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(getErrorMessage(error, "Failed to submit review"));
    },
  });
}

export function useUpdateReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      reviewId,
      payload,
    }: {
      reviewId: string;
      payload: Partial<ReviewPayload>;
    }) => reviewService.updateReview(reviewId, payload),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_REVIEWS_KEY, review.productId],
      });
      queryClient.invalidateQueries({
        queryKey: [PRODUCTS_KEY, review.productId],
      });
      queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
      toast.success("Review updated successfully.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(getErrorMessage(error, "Failed to update review"));
    },
  });
}

export function useDeleteReview(productId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.deleteReview(reviewId),
    onSuccess: () => {
      if (productId) {
        queryClient.invalidateQueries({
          queryKey: [PRODUCT_REVIEWS_KEY, productId],
        });
        queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY, productId] });
      } else {
        queryClient.invalidateQueries({ queryKey: [PRODUCT_REVIEWS_KEY] });
      }
      queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
      toast.success("Review deleted successfully.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(getErrorMessage(error, "Failed to delete review"));
    },
  });
}

export function useHideReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ reviewId, reason }: { reviewId: string; reason: string }) =>
      reviewService.hideReview(reviewId, reason),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_REVIEWS_KEY, review.productId],
      });
      queryClient.invalidateQueries({
        queryKey: [PRODUCTS_KEY, review.productId],
      });
      queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
      toast.success("Review hidden.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(getErrorMessage(error, "Failed to hide review"));
    },
  });
}

export function useShowReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) => reviewService.showReview(reviewId),
    onSuccess: (review) => {
      queryClient.invalidateQueries({
        queryKey: [PRODUCT_REVIEWS_KEY, review.productId],
      });
      queryClient.invalidateQueries({
        queryKey: [PRODUCTS_KEY, review.productId],
      });
      queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
      toast.success("Review is visible again.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(getErrorMessage(error, "Failed to show review"));
    },
  });
}

export function useAdminDeleteReview() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (reviewId: string) =>
      reviewService.deleteReviewAsAdmin(reviewId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [PRODUCT_REVIEWS_KEY] });
      queryClient.invalidateQueries({ queryKey: [PRODUCTS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ADMIN_REVIEWS_KEY] });
      toast.success("Review deleted.");
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(getErrorMessage(error, "Failed to delete review"));
    },
  });
}
