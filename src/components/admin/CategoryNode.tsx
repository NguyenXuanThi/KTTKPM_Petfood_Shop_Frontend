import { useEffect, useState } from "react";
import { ChevronRight, Folder, FolderOpen, Pencil, Plus, Trash2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { CategoryNode as CategoryTreeItem } from "@/types";
import { cn } from "@/lib/utils";

interface CategoryNodeProps {
  node: CategoryTreeItem;
  depth?: number;
  selectedCategoryId: string;
  searchActive?: boolean;
  onSelect: (node: CategoryTreeItem) => void;
  onEdit: (node: CategoryTreeItem) => void;
  onDelete: (node: CategoryTreeItem) => void;
  onAddChild: (parentId: string) => void;
}

const getCategoryId = (node: Pick<CategoryTreeItem, "_id" | "id">) => node._id ?? node.id;

export function CategoryNode({
  node,
  depth = 0,
  selectedCategoryId,
  searchActive = false,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryNodeProps) {
  const nodeId = getCategoryId(node);
  const hasChildren = (node.children?.length ?? 0) > 0;
  const isSelected = selectedCategoryId === nodeId;
  const [expanded, setExpanded] = useState(depth < 1 || isSelected);

  useEffect(() => {
    if (isSelected || searchActive) {
      setExpanded(true);
    }
  }, [isSelected, searchActive]);

  const isOpen = searchActive ? true : expanded;

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => onSelect(node)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onSelect(node);
          }
        }}
        className={cn(
          "group flex items-center gap-2 rounded-xl border px-3 py-2 text-left transition-all",
          isSelected
            ? "border-amber-200 bg-amber-50 shadow-sm dark:border-amber-800 dark:bg-amber-900/20"
            : "border-transparent hover:border-gray-200 hover:bg-gray-50 dark:hover:border-gray-700 dark:hover:bg-gray-800/60"
        )}
        style={{ marginLeft: `${depth * 14}px` }}
      >
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            setExpanded((value) => !value);
          }}
          className={cn(
            "flex h-6 w-6 shrink-0 items-center justify-center rounded-lg text-gray-400 transition-colors",
            hasChildren
              ? "hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-200"
              : "pointer-events-none opacity-0"
          )}
        >
          <ChevronRight size={14} className={cn("transition-transform", isOpen && "rotate-90")} />
        </button>

        <span className={cn("shrink-0", isSelected ? "text-amber-500" : "text-gray-400") }>
          {hasChildren && isOpen ? <FolderOpen size={16} /> : <Folder size={16} />}
        </span>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-gray-900 dark:text-white">{node.name}</p>
          <p className="truncate text-xs text-gray-400">/{node.path || node.slug}</p>
        </div>

        <div className="hidden items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 sm:flex">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddChild(nodeId);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
            title="Thêm danh mục con"
          >
            <Plus size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(node);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
            title="Chỉnh sửa category"
          >
            <Pencil size={13} />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(node);
            }}
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
            title="Xóa category"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {hasChildren && isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="overflow-hidden pt-1"
          >
            <div className="space-y-1">
              {node.children.map((child) => (
                <CategoryNode
                  key={getCategoryId(child)}
                  node={child}
                  depth={depth + 1}
                  selectedCategoryId={selectedCategoryId}
                  searchActive={searchActive}
                  onSelect={onSelect}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onAddChild={onAddChild}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

