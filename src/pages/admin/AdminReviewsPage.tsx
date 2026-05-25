import { useMemo, useState } from "react";
import { Eye, EyeOff, MessageSquareText, RefreshCw, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Pagination } from "@/components/ui/Pagination";
import { StarRating } from "@/components/review/StarRating";
import { useAdminDeleteReview, useAdminReviews, useHideReview, useShowReview } from "@/hooks/useReviews";
import { Review } from "@/types";

const formatDate = (value: string) =>
  new Intl.DateTimeFormat("vi-VN", { dateStyle: "medium", timeStyle: "short" }).format(new Date(value));

const statusOptions = [
  { value: "all", label: "Tất cả" },
  { value: "visible", label: "Đang hiển thị" },
  { value: "hidden", label: "Đã ẩn" },
] as const;

function ReviewAdminCard({ review }: { review: Review }) {
  const hideReview = useHideReview();
  const showReview = useShowReview();
  const deleteReview = useAdminDeleteReview();
  const [hideOpen, setHideOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reason, setReason] = useState("");

  const handleHide = () => {
    if (!reason.trim()) return;
    hideReview.mutate(
      { reviewId: review._id, reason: reason.trim() },
      {
        onSuccess: () => {
          setHideOpen(false);
          setReason("");
        },
      },
    );
  };

  const handleDelete = () => {
    deleteReview.mutate(review._id, { onSuccess: () => setDeleteOpen(false) });
  };

  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm transition hover:shadow-md dark:border-gray-800 dark:bg-gray-900">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-gray-900 dark:text-white">{review.fullName || "Khách hàng"}</h3>
            <Badge variant={review.status === "visible" ? "success" : "warning"}>{review.status}</Badge>
            {(review.isVerifiedPurchase ?? review.verifiedPurchase) && <Badge variant="info">Đã mua hàng</Badge>}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <StarRating value={review.rating} readonly size="sm" />
            <span className="text-xs text-gray-400">{formatDate(review.createdAt)}</span>
          </div>
          <p className="mt-3 line-clamp-3 text-sm leading-6 text-gray-600 dark:text-gray-300">{review.comment}</p>
          <div className="mt-3 grid gap-1 text-xs text-gray-400 sm:grid-cols-3">
            <span className="truncate">Product: {review.productId}</span>
            <span className="truncate">Order: {review.orderId}</span>
            <span className="truncate">User: {review.userId}</span>
          </div>
          {review.status === "hidden" && review.hiddenReason && (
            <p className="mt-3 rounded-xl bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:bg-amber-950/20 dark:text-amber-300">
              Lý do ẩn: {review.hiddenReason}
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-2 lg:justify-end">
          {review.status === "visible" ? (
            <Button type="button" variant="outline" size="sm" loading={hideReview.isPending} onClick={() => setHideOpen(true)}>
              <EyeOff size={14} /> Ẩn
            </Button>
          ) : (
            <Button type="button" variant="outline" size="sm" loading={showReview.isPending} onClick={() => showReview.mutate(review._id)}>
              <Eye size={14} /> Hiện
            </Button>
          )}
          <Button type="button" variant="danger" size="sm" loading={deleteReview.isPending} onClick={() => setDeleteOpen(true)}>
            <Trash2 size={14} /> Xóa
          </Button>
        </div>
      </div>
      <Modal isOpen={hideOpen} onClose={() => setHideOpen(false)} title="Ẩn review" size="md">
        <div className="space-y-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Vui lòng nhập lý do. Review này sẽ không còn hiển thị công khai.
          </p>
          <textarea
            rows={4}
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            placeholder="Lý do ẩn review..."
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-900 dark:text-white"
          />
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setHideOpen(false)}>Hủy</Button>
            <Button type="button" loading={hideReview.isPending} disabled={!reason.trim()} onClick={handleHide}>
              Ẩn review
            </Button>
          </div>
        </div>
      </Modal>
      <Modal isOpen={deleteOpen} onClose={() => setDeleteOpen(false)} title="Xóa review" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-300">
            Review sẽ bị xóa vĩnh viễn. Thao tác này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>Hủy</Button>
            <Button type="button" variant="danger" loading={deleteReview.isPending} onClick={handleDelete}>
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </article>
  );
}

export default function AdminReviewsPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<"all" | "visible" | "hidden">("all");
  const [search, setSearch] = useState("");
  const params = useMemo(() => ({ page, limit: 10, status, search }), [page, status, search]);
  const { data, isLoading, isError, refetch, isFetching } = useAdminReviews(params);
  const reviews = data?.reviews ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-500">Kiểm duyệt</p>
          <h1 className="text-3xl font-black text-gray-950 dark:text-white">Quản lý đánh giá</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Ẩn, khôi phục hoặc xóa review từ các đơn mua đã xác minh.
          </p>
        </div>
        <Button type="button" variant="outline" loading={isFetching} onClick={() => refetch()}>
          <RefreshCw size={16} /> Làm mới
        </Button>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900">
        <div className="grid gap-3 md:grid-cols-[1fr,260px]">
          <Input
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Tìm theo tên khách hoặc nội dung review..."
            leftIcon={<Search size={16} />}
          />
          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            {statusOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setStatus(option.value);
                  setPage(1);
                }}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  status === option.value
                    ? "bg-white text-amber-600 shadow-sm dark:bg-gray-950"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {isError ? (
        <EmptyState
          icon={<MessageSquareText size={28} />}
          title="Không thể tải review"
          description="review-service có thể đang không khả dụng. Vui lòng thử lại."
          action={<Button type="button" variant="outline" onClick={() => refetch()}>Thử lại</Button>}
        />
      ) : isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-800" />
          ))}
        </div>
      ) : reviews.length ? (
        <>
          <div className="space-y-4">
            {reviews.map((review) => <ReviewAdminCard key={review._id} review={review} />)}
          </div>
          <Pagination
            page={data?.meta.page ?? page}
            totalPages={data?.meta.totalPages ?? 1}
            onPageChange={setPage}
          />
        </>
      ) : (
        <EmptyState
          icon={<MessageSquareText size={28} />}
          title="Không tìm thấy review"
          description="Thử đổi bộ lọc hoặc chờ khách gửi review."
        />
      )}
    </div>
  );
}




