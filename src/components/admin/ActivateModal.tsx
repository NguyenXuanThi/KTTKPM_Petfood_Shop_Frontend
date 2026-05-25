import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";

interface ActivateModalProps {
  user: User | null;
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function ActivateModal({
  user,
  isOpen,
  isLoading = false,
  onClose,
  onConfirm,
}: ActivateModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Kích hoạt tài khoản">
      <div className="space-y-5">
        <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm text-emerald-700 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-300">
          <div className="mb-2 flex items-center gap-2 font-semibold">
            <CheckCircle2 size={16} />
            Tài khoản này sẽ được khôi phục.
          </div>
          <p>
            After activation,{" "}
            <span className="font-semibold">{user?.fullName}</span> can login
            normally again.
          </p>
        </div>

        <div className="flex justify-end gap-3">
          <Button type="button" variant="ghost" onClick={onClose}>
            Hủy
          </Button>
          <Button
            type="button"
            variant="secondary"
            loading={isLoading}
            onClick={onConfirm}
          >
            Kích hoạt
          </Button>
        </div>
      </div>
    </Modal>
  );
}



