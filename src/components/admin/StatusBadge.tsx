import { CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface StatusBadgeProps {
  isActive?: boolean;
}

export function StatusBadge({ isActive = true }: StatusBadgeProps) {
  if (isActive === false) {
    return (
      <Badge variant="danger" className="gap-1.5">
        <XCircle size={12} />
        Không hoạt động
      </Badge>
    );
  }

  return (
    <Badge variant="success" className="gap-1.5">
      <CheckCircle2 size={12} />
      Đang hoạt động
    </Badge>
  );
}


