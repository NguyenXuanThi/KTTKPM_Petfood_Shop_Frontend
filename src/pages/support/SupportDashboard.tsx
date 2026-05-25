import { useEffect, useState } from "react";
import { Menu } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import SupportSidebar from "@/pages/support/SupportSidebar";
import MessageManagement from "@/pages/support/MessageManagement";
import AppointmentManagement from "@/pages/support/AppointmentManagement";
import AppointmentList from "@/pages/support/AppointmentList";

export default function SupportDashboard() {
  const { user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Map pathname to tab
  const getActiveTabFromPath = ():
    | "messages"
    | "appointments"
    | "schedules" => {
    const path = location.pathname.toLowerCase();
    if (path.includes("appointmentsmanagement")) return "appointments";
    if (path.includes("schedulesmanagement")) return "schedules";
    return "messages";
  };

  const activeTab = getActiveTabFromPath();

  // Auth check
  useEffect(() => {
    if (!user || (user.role !== "admin" && user.role !== "support")) {
      window.location.href = "/";
    }
  }, [user]);

  const handleLogout = () => {
    // Clear auth token/session
    localStorage.removeItem("auth");
    window.location.href = "/";
  };

  const handleTabChange = (tab: "messages" | "appointments" | "schedules") => {
    if (tab === "messages") navigate("/support/messagesmanagement");
    if (tab === "appointments") navigate("/support/appointmentsmanagement");
    if (tab === "schedules") navigate("/support/schedulesmanagement");
    setSidebarOpen(false);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <SupportSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onLogout={handleLogout}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
      />

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile Header */}
        <div className="flex h-16 items-center border-b border-gray-200 bg-white px-4 lg:hidden dark:border-gray-800 dark:bg-gray-900">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
          >
            <Menu size={20} />
          </button>
          <span className="ml-3 font-semibold text-gray-900 dark:text-white">
            Support Panel
          </span>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-hidden bg-gray-50 dark:bg-gray-900">
          {activeTab === "messages" && <MessageManagement />}
          {activeTab === "appointments" && <AppointmentManagement />}
          {activeTab === "schedules" && <AppointmentList />}
        </div>
      </div>
    </div>
  );
}
