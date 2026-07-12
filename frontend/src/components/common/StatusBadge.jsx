const StatusBadge = ({ status }) => {
  const normalized = status?.trim();

  const config = {
    Available: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Available",
    },
    "On Trip": {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      label: "On Trip",
    },
    "In Shop": {
      bg: "bg-slate-50 text-slate-700 border-slate-200",
      label: "In Shop",
    },
    "Off Duty": {
      bg: "bg-slate-50 text-slate-700 border-slate-200",
      label: "Off Duty",
    },
    Open: {
      bg: "bg-amber-50 text-amber-700 border-amber-200",
      label: "Open",
    },
    Closed: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Closed",
    },
    Retired: {
      bg: "bg-red-50 text-red-700 border-red-200",
      label: "Retired",
    },
    Suspended: {
      bg: "bg-red-50 text-red-700 border-red-200",
      label: "Suspended",
    },
    Draft: {
      bg: "bg-sky-50 text-sky-700 border-sky-200",
      label: "Draft",
    },
    Dispatched: {
      bg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      label: "Dispatched",
    },
    Completed: {
      bg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Completed",
    },
    Cancelled: {
      bg: "bg-rose-50 text-rose-700 border-rose-200",
      label: "Cancelled",
    },
  };

  const current = config[normalized] || {
    bg: "bg-gray-50 text-gray-700 border-gray-200",
    label: normalized || "Unknown",
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors duration-150 ease-out ${current.bg}`}
    >
      {current.label}
    </span>
  );
};

export default StatusBadge;
