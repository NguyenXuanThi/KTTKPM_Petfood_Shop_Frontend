import {
  MessageSquare,
  Calendar,
  Clock,
  LogOut,
  ChevronRight,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

interface SupportSidebarProps {
  activeTab: "messages" | "appointments" | "schedules";
  onTabChange: (tab: "messages" | "appointments" | "schedules") => void;
  onLogout: () => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

export default function SupportSidebar({
  activeTab,
  onTabChange,
  onLogout,
  sidebarOpen,
  setSidebarOpen,
}: SupportSidebarProps) {
  const { user } = useAuth();

  const tabs = [
    {
      id: "messages" as const,
      label: "Quản lý tin nhắn",
      icon: <MessageSquare size={18} />,
    },
    {
      id: "appointments" as const,
      label: "Quản lý đặt lịch",
      icon: <Calendar size={18} />,
    },
    {
      id: "schedules" as const,
      label: "Quản lý lịch hẹn",
      icon: <Clock size={18} />,
    },
  ];

  const sidebarContent = (
    <aside className="flex h-screen w-64 flex-col overflow-hidden border-r border-gray-200 bg-white text-gray-900 shadow-xl dark:border-gray-800 dark:bg-gray-950 dark:text-white">
      {/* Header */}
      <header className="shrink-0 border-b border-gray-100 p-5 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-500 text-lg font-black text-white shadow-sm">
            P
          </div>
          <div>
            <div className="font-black text-gray-950 dark:text-white">
              PawMart
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              Support Panel
            </div>
          </div>
        </div>
      </header>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              onTabChange(tab.id);
              setSidebarOpen(false);
            }}
            className={cn(
              "group relative flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-400",
              activeTab === tab.id
                ? "bg-orange-50 font-semibold text-orange-600 shadow-sm dark:bg-orange-500/10 dark:text-orange-300"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-950 dark:text-gray-400 dark:hover:bg-gray-900 dark:hover:text-white",
            )}
          >
            <span
              className={cn(
                "absolute left-0 top-1/2 h-7 w-1 -translate-y-1/2 rounded-r-full transition",
                activeTab === tab.id ? "bg-orange-500" : "bg-transparent",
              )}
            />
            {tab.icon}
            <span className="flex-1 text-left">{tab.label}</span>
            <ChevronRight
              size={14}
              className={cn(
                "opacity-35 transition",
                activeTab === tab.id && "opacity-70",
              )}
            />
          </button>
        ))}
      </nav>

      {/* Footer */}
      <footer className="shrink-0 border-t border-gray-100 p-4 dark:border-gray-800">
        <div className="mb-3 flex items-center gap-3 rounded-2xl bg-gray-50 p-3 dark:bg-gray-900">
          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-orange-100 ring-1 ring-orange-200 dark:bg-orange-500/10 dark:ring-orange-500/20">
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt={user.fullName}
                className="h-full w-full object-cover"
              />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-sm font-bold text-orange-500">
                {user?.fullName?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <div className="truncate text-sm font-semibold text-gray-950 dark:text-white">
              {user?.fullName}
            </div>
            <div className="truncate text-xs text-gray-500 dark:text-gray-400">
              {user?.email}
            </div>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex min-h-12 w-full items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold text-red-500 transition hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 dark:hover:bg-red-500/10"
        >
          <LogOut size={16} /> Logout
        </button>
      </footer>
    </aside>
  );

  return (
    <>
      <div className="hidden shrink-0 lg:block">{sidebarContent}</div>

      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-black/60"
            onClick={() => setSidebarOpen(false)}
          />
          <div className="absolute left-0 top-0 h-full">{sidebarContent}</div>
        </div>
      )}
    </>
  );
}
