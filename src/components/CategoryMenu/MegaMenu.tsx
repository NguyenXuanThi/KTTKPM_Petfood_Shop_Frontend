import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import { ChevronDown, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCategoryMenu } from "@/hooks/useCategories";
import { CategoryNode } from "@/types";

// ─── Level-3 column ───────────────────────────────────────────────────────────
function SubColumn({ node }: { node: CategoryNode }) {
  return (
    <div className="min-w-[140px]">
      <Link
        to={`/products?categoryId=${node._id}`}
        className="mb-2 block text-sm font-semibold text-gray-900 hover:text-amber-500 dark:text-white dark:hover:text-amber-400"
      >
        {node.name}
      </Link>
      {node.children?.length > 0 && (
        <ul className="space-y-1">
          {[...node.children]
            .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0))
            .map((child) => (
              <li key={child._id}>
                <Link
                  to={`/products?categoryId=${child._id}`}
                  className="block text-sm text-gray-500 transition-colors hover:text-amber-500 dark:text-gray-400 dark:hover:text-amber-400"
                >
                  {child.name}
                </Link>
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}

// ─── Dropdown panel for one top-level item ────────────────────────────────────
function MegaPanel({ node }: { node: CategoryNode }) {
  const cols = [...(node.children ?? [])].sort(
    (a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0),
  );

  if (cols.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 6 }}
      transition={{ duration: 0.15 }}
      className="absolute left-0 top-full z-50 mt-1 min-w-[480px] rounded-2xl border border-gray-100 bg-white p-6 shadow-2xl dark:border-gray-800 dark:bg-gray-900"
    >
      {/* Header */}
      <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-800">
        <Link
          to={`/products?categoryId=${node._id}`}
          className="text-base font-bold text-gray-900 hover:text-amber-500 dark:text-white"
        >
          All {node.name}
        </Link>
        <Link
          to={`/products?categoryId=${node._id}`}
          className="text-xs text-amber-500 hover:underline"
        >
          View all →
        </Link>
      </div>
      {/* Columns */}
      <div className="flex flex-wrap gap-8">
        {cols.map((col) => (
          <SubColumn key={col._id} node={col} />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
function MenuSkeleton() {
  return (
    <div className="flex items-center gap-1">
      {[80, 60, 70, 65, 75].map((w, i) => (
        <div
          key={i}
          className="h-8 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-800"
          style={{ width: w }}
        />
      ))}
    </div>
  );
}

// ─── Main MegaMenu ────────────────────────────────────────────────────────────
export function MegaMenu() {
  const { data: tree, isLoading } = useCategoryMenu();
  const [activeId, setActiveId] = useState<string | null>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const open = (id: string) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveId(id);
  };

  const close = () => {
    timeoutRef.current = setTimeout(() => setActiveId(null), 120);
  };

  const cancelClose = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
  };

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    [],
  );

  if (isLoading) return <MenuSkeleton />;
  if (!tree?.length) return null;

  const topLevel = [...tree].sort(
    (a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0),
  );

  return (
    <nav className="relative flex items-center gap-1">
      {topLevel.map((node) => {
        const isActive = activeId === node._id;
        const hasChildren = (node.children?.length ?? 0) > 0;

        return (
          <div
            key={node._id}
            className="relative"
            onMouseEnter={() => open(node._id)}
            onMouseLeave={close}
          >
            <Link
              to={`/products?categoryId=${node._id}`}
              className={`flex items-center gap-1 rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
              }`}
            >
              {node.name}
              {hasChildren && (
                <ChevronDown
                  size={13}
                  className={`transition-transform ${isActive ? "rotate-180" : ""}`}
                />
              )}
            </Link>

            {hasChildren && (
              <AnimatePresence>
                {isActive && (
                  <div onMouseEnter={cancelClose} onMouseLeave={close}>
                    <MegaPanel node={node} />
                  </div>
                )}
              </AnimatePresence>
            )}
          </div>
        );
      })}
    </nav>
  );
}

// ─── Mobile accordion version ─────────────────────────────────────────────────
function MobileNode({
  node,
  depth = 0,
  onNavigate,
}: {
  node: CategoryNode;
  depth?: number;
  onNavigate: () => void;
}) {
  const [open, setOpen] = useState(false);
  const hasChildren = (node.children?.length ?? 0) > 0;

  return (
    <div>
      <div className="flex items-center">
        <Link
          to={`/products?categoryId=${node._id}`}
          onClick={onNavigate}
          className="flex-1 rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-900"
          style={{ paddingLeft: `${12 + depth * 16}px` }}
        >
          {node.name}
        </Link>
        {hasChildren && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="rounded-lg p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
          >
            <ChevronRight
              size={14}
              className={`transition-transform ${open ? "rotate-90" : ""}`}
            />
          </button>
        )}
      </div>
      {hasChildren && open && (
        <div>
          {[...(node.children ?? [])]
            .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0))
            .map((child) => (
              <MobileNode
                key={child._id}
                node={child}
                depth={depth + 1}
                onNavigate={onNavigate}
              />
            ))}
        </div>
      )}
    </div>
  );
}

export function MobileCategoryMenu({ onNavigate }: { onNavigate: () => void }) {
  const { data: tree } = useCategoryMenu();
  if (!tree?.length) return null;

  return (
    <div className="border-t border-gray-100 pt-2 dark:border-gray-800">
      <p className="px-3 py-1 text-xs font-semibold uppercase tracking-wide text-gray-400">
        Categories
      </p>
      {[...tree]
        .sort((a, b) => (a.menuOrder ?? 0) - (b.menuOrder ?? 0))
        .map((node) => (
          <MobileNode key={node._id} node={node} onNavigate={onNavigate} />
        ))}
    </div>
  );
}
