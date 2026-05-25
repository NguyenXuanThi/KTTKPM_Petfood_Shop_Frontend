import { FormEvent, useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

interface ChangePasswordModalProps {
  isOpen: boolean;
  isLoading?: boolean;
  onClose: () => void;
  onSave: (payload: {
    oldPassword: string;
    newPassword: string;
  }) => Promise<unknown>;
}

export function ChangePasswordModal({
  isOpen,
  isLoading = false,
  onClose,
  onSave,
}: ChangePasswordModalProps) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");

  const reset = () => {
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setError("");
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError("New password must be at least 6 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    await onSave({ oldPassword, newPassword });
    reset();
  };

  const EyeToggle = ({
    show,
    onToggle,
  }: {
    show: boolean;
    onToggle: () => void;
  }) => (
    <button
      type="button"
      onClick={onToggle}
      className="text-gray-400 hover:text-gray-600"
    >
      {show ? <EyeOff size={14} /> : <Eye size={14} />}
    </button>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Change Password"
      size="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="rounded-xl bg-amber-50 p-3 text-xs text-amber-700 dark:bg-amber-900/20 dark:text-amber-400">
          🔒 Use a strong password with at least 6 characters.
        </div>

        <Input
          label="Current Password"
          type={showOld ? "text" : "password"}
          value={oldPassword}
          onChange={(e) => setOldPassword(e.target.value)}
          leftIcon={<Lock size={14} />}
          rightIcon={
            <EyeToggle show={showOld} onToggle={() => setShowOld((v) => !v)} />
          }
          required
        />
        <Input
          label="New Password"
          type={showNew ? "text" : "password"}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          leftIcon={<Lock size={14} />}
          rightIcon={
            <EyeToggle show={showNew} onToggle={() => setShowNew((v) => !v)} />
          }
          minLength={6}
          required
        />
        <Input
          label="Confirm New Password"
          type={showNew ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            setError("");
          }}
          leftIcon={<Lock size={14} />}
          error={error || undefined}
          minLength={6}
          required
        />

        <div className="flex justify-end gap-2 pt-1">
          <Button type="button" variant="ghost" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            type="submit"
            loading={isLoading}
            disabled={!oldPassword || !newPassword || !confirmPassword}
          >
            Update Password
          </Button>
        </div>
      </form>
    </Modal>
  );
}
