import { useMemo, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  BadgeDollarSign,
  BarChart3,
  Car,
  LayoutGrid,
  Menu,
  Route,
  Users,
  Wrench,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";

const baseNavItems = [
  { label: "Dashboard", path: "/dashboard", icon: LayoutGrid },
  { label: "Vehicles", path: "/vehicles", icon: Car },
  { label: "Drivers", path: "/drivers", icon: Users },
  { label: "Trips", path: "/trips", icon: Route },
  { label: "Maintenance", path: "/maintenance", icon: Wrench },
  { label: "Finance", path: "/finance", icon: BadgeDollarSign },
  { label: "Reports", path: "/reports", icon: BarChart3 },
];

function getOrderedNavItems(role) {
  if (role === "financial_analyst") {
    return [
      baseNavItems[5],
      baseNavItems[6],
      ...baseNavItems.filter(
        (item) => item.path !== "/finance" && item.path !== "/reports",
      ),
    ];
  }

  if (role === "safety_officer") {
    return [
      baseNavItems[2],
      ...baseNavItems.filter((item) => item.path !== "/drivers"),
    ];
  }

  return baseNavItems;
}

export default function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = useMemo(() => getOrderedNavItems(user?.role), [user?.role]);
  const activePath =
    location.pathname === "/" ? "/dashboard" : location.pathname;

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)] text-[var(--color-text)]">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="hidden w-72 flex-col border-r border-slate-200 bg-white md:flex">
          <div className="flex h-16 items-center border-b border-slate-200 px-6">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
                TransitOps
              </p>
              <p className="text-sm text-slate-600">Operations hub</p>
            </div>
          </div>
          <div className="flex-1 px-4 py-6">
            <Sidebar items={navItems} activePath={activePath} />
          </div>
        </aside>

        <div className="flex flex-1 flex-col">
          <Topbar
            user={user}
            onMenuClick={() => setMobileOpen(true)}
            onLogout={handleLogout}
          />
          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <Outlet />
          </main>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 bg-slate-950/50 transition-opacity md:hidden ${mobileOpen ? "opacity-100" : "pointer-events-none opacity-0"}`}
        onClick={() => setMobileOpen(false)}
      />
      <div
        className={`fixed inset-y-0 left-0 z-50 w-72 bg-white shadow-xl transition-transform duration-200 md:hidden ${mobileOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
              TransitOps
            </p>
            <p className="text-sm text-slate-600">Operations hub</p>
          </div>
          <button
            type="button"
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100"
            onClick={() => setMobileOpen(false)}
            aria-label="Close navigation"
          >
            <Menu className="h-5 w-5 rotate-45" />
          </button>
        </div>
        <div className="p-4">
          <Sidebar
            items={navItems}
            activePath={activePath}
            onNavigate={() => setMobileOpen(false)}
          />
        </div>
      </div>
    </div>
  );
}
