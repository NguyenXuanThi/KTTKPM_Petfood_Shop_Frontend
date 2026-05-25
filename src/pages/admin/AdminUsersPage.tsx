import { useEffect, useState } from "react";
import {
  Mail,
  RefreshCw,
  Search,
  SlidersHorizontal,
  Users,
} from "lucide-react";
import { useDebounce } from "@/hooks/useDebounce";
import { useAuth } from "@/hooks/useAuth";
import { useActivateUser, useDeactivateUser, useUsers } from "@/hooks/useUsers";
import { ActivateModal } from "@/components/admin/ActivateModal";
import { DeactivateModal } from "@/components/admin/DeactivateModal";
import { UserTable } from "@/components/admin/UserTable";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { Pagination } from "@/components/ui/Pagination";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn } from "@/lib/utils";
import { User } from "@/types";

type StatusFilter = "all" | "active" | "inactive";

const statusFilters: Array<{ label: string; value: StatusFilter }> = [
  { label: "Tất cả", value: "all" },
  { label: "Đang hoạt động", value: "active" },
  { label: "Không hoạt động", value: "inactive" },
];

function UserTableSkeleton() {
  return (
    <div className="space-y-3 p-4">
      {Array.from({ length: 6 }, (_, index) => (
        <div
          key={index}
          className="grid grid-cols-[1.2fr,1.2fr,0.6fr,0.7fr,1.2fr,0.9fr,0.8fr] gap-3"
        >
          {Array.from({ length: 7 }, (_, cellIndex) => (
            <Skeleton key={cellIndex} className="h-14 rounded-xl" />
          ))}
        </div>
      ))}
    </div>
  );
}

export default function AdminUsersPage() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null);
  const [activateTarget, setActivateTarget] = useState<User | null>(null);
  const debouncedSearch = useDebounce(searchInput, 350);
  const { user: authUser } = useAuth();
  const deactivateMutation = useDeactivateUser();
  const activateMutation = useActivateUser();

  const { data, isLoading, isFetching, isError, refetch } = useUsers({
    page,
    limit: 10,
    email: debouncedSearch || undefined,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const users = data?.items ?? [];
  const total = data?.meta?.total ?? 0;
  const totalPages = data?.meta?.totalPages ?? 1;
  const currentUserId = authUser?.id ?? authUser?._id;
  const isMutating = deactivateMutation.isPending || activateMutation.isPending;

  const handleDeactivate = async (reason: string) => {
    const userId = deactivateTarget?.id ?? deactivateTarget?._id;
    if (!userId) return;

    await deactivateMutation.mutateAsync({ id: userId, reason });
    setDeactivateTarget(null);
  };

  const handleActivate = async () => {
    const userId = activateTarget?.id ?? activateTarget?._id;
    if (!userId) return;

    await activateMutation.mutateAsync(userId);
    setActivateTarget(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-3 text-gray-900 dark:text-white">
          <div className="rounded-2xl bg-amber-100 p-3 text-amber-600 dark:bg-amber-900/30 dark:text-amber-300">
            <Users size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Quản lý User</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Quản lý trạng thái tài khoản, role và lịch sử đăng nhập từ dữ liệu user-service.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="min-w-0 sm:w-80">
            <Input
              placeholder="Tìm theo email..."
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              leftIcon={<Search size={14} />}
            />
          </div>
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            <RefreshCw size={14} className={isFetching ? "animate-spin" : ""} />
            Làm mới
          </Button>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-3xl border border-gray-100 bg-white p-4 shadow-sm dark:border-gray-800 dark:bg-gray-900 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-300">
          <SlidersHorizontal size={16} />
          Lọc trạng thái
        </div>
        <div className="flex flex-wrap gap-2">
          {statusFilters.map((filter) => (
            <button
              key={filter.value}
              onClick={() => setStatusFilter(filter.value)}
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                statusFilter === filter.value
                  ? "bg-gray-900 text-white shadow-sm dark:bg-white dark:text-gray-900"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700",
              )}
            >
              {filter.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Badge variant="info">Dữ liệu trực tiếp từ user-service</Badge>
        <Badge variant="outline">{total} user phù hợp</Badge>
        {isFetching && !isLoading && (
          <Badge variant="warning">Đang làm mới</Badge>
        )}
      </div>

      <div className="overflow-hidden rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
        {isLoading ? (
          <UserTableSkeleton />
        ) : isError ? (
          <div className="p-8">
            <EmptyState
              icon={<Users size={28} />}
              title="Không thể tải user"
              description="Kiểm tra kết nối gateway và user-service rồi thử lại."
              action={
                <Button onClick={() => refetch()}>
                  <RefreshCw size={14} /> Thử lại
                </Button>
              }
            />
          </div>
        ) : users.length === 0 ? (
          <div className="p-8">
            <EmptyState
              icon={<Mail size={28} />}
              title={
                debouncedSearch
                  ? "Không có user khớp với tìm kiếm"
                  : "Không tìm thấy user"
              }
              description={
                debouncedSearch
                  ? "Thử từ khóa email khác hoặc xóa tìm kiếm."
                  : "Chưa có tài khoản user nào trong bộ lọc này."
              }
            />
          </div>
        ) : (
          <UserTable
            users={users}
            currentUserId={currentUserId}
            isMutating={isMutating}
            onDeactivate={setDeactivateTarget}
            onActivate={setActivateTarget}
          />
        )}
      </div>

      {!isLoading && !isError && totalPages > 1 && (
        <Pagination
          page={page}
          totalPages={totalPages}
          onPageChange={setPage}
        />
      )}

      <DeactivateModal
        user={deactivateTarget}
        isOpen={!!deactivateTarget}
        isLoading={deactivateMutation.isPending}
        onClose={() => setDeactivateTarget(null)}
        onConfirm={handleDeactivate}
      />

      <ActivateModal
        user={activateTarget}
        isOpen={!!activateTarget}
        isLoading={activateMutation.isPending}
        onClose={() => setActivateTarget(null)}
        onConfirm={handleActivate}
      />
    </div>
  );
}




