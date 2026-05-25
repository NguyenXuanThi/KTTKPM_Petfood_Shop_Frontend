import { FolderTree, Plus, RefreshCw, Search } from "lucide-react";
import { CategoryNode as CategoryTreeItem } from "@/types";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Skeleton } from "@/components/ui/Skeleton";
import { CategoryNode } from "./CategoryNode";

interface CategoryTreeProps {
  nodes: CategoryTreeItem[];
  totalCount: number;
  isLoading?: boolean;
  isRefreshing?: boolean;
  search: string;
  selectedCategoryId: string;
  onSearchChange: (value: string) => void;
  onRefresh: () => void;
  onCreateRoot: () => void;
  onSelect: (node: CategoryTreeItem) => void;
  onEdit: (node: CategoryTreeItem) => void;
  onDelete: (node: CategoryTreeItem) => void;
  onAddChild: (parentId: string) => void;
}

const filterTree = (
  nodes: CategoryTreeItem[],
  keyword: string,
): CategoryTreeItem[] => {
  if (!keyword.trim()) return nodes;

  const lowerKeyword = keyword.trim().toLowerCase();
  return nodes.reduce<CategoryTreeItem[]>((result, node) => {
    const children = filterTree(node.children ?? [], keyword);
    const matched =
      node.name.toLowerCase().includes(lowerKeyword) ||
      node.slug.toLowerCase().includes(lowerKeyword) ||
      node.path.toLowerCase().includes(lowerKeyword);

    if (matched || children.length > 0) {
      result.push({ ...node, children });
    }

    return result;
  }, []);
};

export function CategoryTree({
  nodes,
  totalCount,
  isLoading = false,
  isRefreshing = false,
  search,
  selectedCategoryId,
  onSearchChange,
  onRefresh,
  onCreateRoot,
  onSelect,
  onEdit,
  onDelete,
  onAddChild,
}: CategoryTreeProps) {
  const filteredNodes = filterTree(nodes, search);

  return (
    <section className="rounded-3xl border border-gray-100 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 p-5 dark:border-gray-800">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-gray-900 dark:text-white">
              <FolderTree size={18} className="text-amber-500" />
              <h2 className="text-lg font-semibold">Cây danh mục</h2>
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {totalCount} danh mục đang sẵn sàng để quản lý product.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw
                size={14}
                className={isRefreshing ? "animate-spin" : ""}
              />
              Làm mới
            </Button>
            <Button size="sm" onClick={onCreateRoot}>
              <Plus size={14} />
              Thêm
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Input
            placeholder="Tìm danh mục..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            leftIcon={<Search size={14} />}
          />
        </div>
      </div>

      <div className="max-h-[72vh] overflow-y-auto p-4">
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 7 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-12 rounded-xl"
                style={{ width: `${100 - index * 6}%` }}
              />
            ))}
          </div>
        ) : filteredNodes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 px-4 py-10 text-center dark:border-gray-700">
            <p className="text-3xl">🗂️</p>
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-200">
              {search ? "Không có danh mục khớp với tìm kiếm" : "Chưa có danh mục nào"}
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Tạo danh mục để bắt đầu sắp xếp product.
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNodes.map((node) => (
              <CategoryNode
                key={node._id ?? node.id}
                node={node}
                selectedCategoryId={selectedCategoryId}
                searchActive={!!search.trim()}
                onSelect={onSelect}
                onEdit={onEdit}
                onDelete={onDelete}
                onAddChild={onAddChild}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}


