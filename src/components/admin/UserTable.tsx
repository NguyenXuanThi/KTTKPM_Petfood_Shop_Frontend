import { ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { User } from "@/types";

interface UserTableProps {
  users: User[];
  currentUserId?: string;
  isMutating?: boolean;
  onDeactivate: (user: User) => void;
  onActivate: (user: User) => void;
}

const getUserId = (user: User) => user.id ?? user._id ?? "";

const formatDateTime = (value?: string | null) => {
  if (!value) return "Chưa từng";
  return new Intl.DateTimeFormat("vi-VN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
};

export function UserTable({
  users,
  currentUserId,
  isMutating = false,
  onDeactivate,
  onActivate,
}: UserTableProps) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[1120px]">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 dark:border-gray-800 dark:bg-gray-800/50">
            {[
              "Họ tên",
              "Email",
              "Role",
              "Trạng thái",
              "Lý do vô hiệu hóa",
              "Lần đăng nhập cuối",
              "Thao tác",
            ].map((heading) => (
              <th
                key={heading}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400"
              >
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
          {users.map((user) => {
            const userId = getUserId(user);
            const isSelf = !!userId && currentUserId === userId;
            const isInactive = user.isActive === false;

            return (
              <tr
                key={userId || user.email}
                className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
              >
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-900/30">
                      {user.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt={user.fullName}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center font-semibold text-amber-700 dark:text-amber-300">
                          {user.fullName.charAt(0).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-white">
                        {user.fullName}
                      </p>
                      <p className="truncate text-xs text-gray-400">{userId}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                  {user.email}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={user.role === "admin" ? "warning" : "info"}>
                    <ShieldCheck size={12} />
                    {user.role}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <StatusBadge isActive={user.isActive} />
                </td>
                <td className="max-w-[260px] px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {isInactive ? (
                    <span className="line-clamp-2">
                      {user.inactiveReason || "Chưa có lý do"}
                    </span>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                  {formatDateTime(user.lastLoginAt)}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    {isInactive ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        loading={isMutating}
                        disabled={!userId}
                        onClick={() => onActivate(user)}
                      >
                        Kích hoạt
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        variant="danger"
                        loading={isMutating}
                        disabled={isSelf || !userId}
                        onClick={() => onDeactivate(user)}
                      >
                        Vô hiệu hóa
                      </Button>
                    )}
                    {isSelf && <Badge variant="outline">Admin hiện tại</Badge>}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}





