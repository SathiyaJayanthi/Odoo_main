import { Menu } from "lucide-react";
import { Button } from "../shared/Button";

function formatRole(role) {
  if (!role) {
    return "User";
  }

  return role
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default function Topbar({ user, onMenuClick, onLogout }) {
  return (
    <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-4 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          type="button"
          className="rounded-md p-2 text-slate-600 hover:bg-slate-100 md:hidden"
          onClick={onMenuClick}
          aria-label="Open navigation"
        >
          <Menu className="h-5 w-5" />
        </button>
        <div>
          <p className="text-sm font-semibold text-slate-900">
            {user?.full_name || "TransitOps User"}
          </p>
          <p className="text-xs text-slate-500">{formatRole(user?.role)}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <span className="inline-flex items-center rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-medium text-slate-700">
          {formatRole(user?.role)}
        </span>
        <Button type="button" variant="secondary" onClick={onLogout}>
          Logout
        </Button>
      </div>
    </header>
  );
}
