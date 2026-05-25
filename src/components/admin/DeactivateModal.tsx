import { FormEvent, useEffect, useState } from "react";
import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";

interface DeactivateModalProps {
  user: User | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export function DeactivateModal({
  user,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: DeactivateModalProps) {
  const [reason, setReason] = useState("");
  const isReasonValid = reason.trim().length >= 3;

  useEffect(() => {
    if (isOpen) setReason("");
  }, [isOpen]);

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!isReasonValid) return;
    onConfirm(reason.trim());
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Vô hiệu hóa tài khoản">
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <AlertTriangle size={16} />
            User này sẽ không thể đăng nhập nữa.
          </div>
          <p>
            Bạn đang vô hiệu hóa{" "}
            <span className="font-semibold">{user?.fullName}</span>. The reason
            will be shown to the user on the blocked login screen.
          </p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-200">
            Lý do vô hiệu hóa
          </span>
          <textarea
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            rows={4}
            placeholder="Ví dụ: Vi phạm chính sách"
            className="w-full rounded-2xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-amber-400 focus:ring-4 focus:ring-amber-100 dark:border-gray-700 dark:bg-gray-950 dark:text-white dark:focus:ring-amber-900/30"
          />
          {!isReasonValid && reason.length > 0 && (
            <p className="mt-2 text-xs text-red-500">
              Lý do phải có ít nhất 3 ký tự.
            </p>
          )}
        </label>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="submit"
            variant="danger"
            loading={isLoading}
            disabled={!isReasonValid}
          >
            Vô hiệu hóa
          </Button>
        </div>
      </form>
    </Modal>
  );
}




