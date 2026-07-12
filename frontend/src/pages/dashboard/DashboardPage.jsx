import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  AlertTriangle,
  BusFront,
  Clock3,
  Gauge,
  RefreshCw,
  Route,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { getDashboardStats } from "../../api/reports";
import { listDrivers } from "../../api/drivers";
import { listVehicles } from "../../api/vehicles";
import Button from "../../components/common/Button";

const dashboardCards = [
  {
    key: "active_vehicles",
    label: "Active Vehicles",
    icon: BusFront,
    accent: "bg-blue-50 text-blue-600",
  },
  {
    key: "available_vehicles",
    label: "Available Vehicles",
    icon: Gauge,
    accent: "bg-emerald-50 text-emerald-600",
  },
  {
    key: "in_maintenance",
    label: "In Maintenance",
    icon: Wrench,
    accent: "bg-amber-50 text-amber-600",
  },
  {
    key: "active_trips",
    label: "Active Trips",
    icon: Route,
    accent: "bg-indigo-50 text-indigo-600",
  },
  {
    key: "pending_trips",
    label: "Pending Trips",
    icon: Clock3,
    accent: "bg-sky-50 text-sky-600",
  },
  {
    key: "drivers_on_duty",
    label: "Drivers On Duty",
    icon: UserRoundCheck,
    accent: "bg-violet-50 text-violet-600",
  },
  {
    key: "fleet_utilization_pct",
    label: "Fleet Utilization %",
    icon: Gauge,
    accent: "bg-emerald-50 text-emerald-600",
  },
];

const DashboardPage = () => {
  const {
    data: metrics = {},
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardStats,
    refetchInterval: 5000,
    refetchOnWindowFocus: true,
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers", "dashboard"],
    queryFn: () => listDrivers({ status: "Available" }),
  });

  const attentionVehicles = (vehicles || []).filter(
    (vehicle) => vehicle.status === "In Shop",
  );
  const expiringDrivers = (drivers || []).filter((driver) => {
    if (!driver.license_expiry) return false;
    const expiryDate = new Date(driver.license_expiry);
    const today = new Date();
    const diffInDays = Math.ceil((expiryDate - today) / (1000 * 60 * 60 * 24));
    return diffInDays >= 0 && diffInDays <= 30;
  });

  const utilizationPercent = Number(metrics.fleet_utilization_pct ?? 0);
  const chartBars = [
    { label: "Utilization", value: utilizationPercent },
    { label: "Open capacity", value: Math.max(100 - utilizationPercent, 0) },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Fleet Operations Dashboard
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Live view of fleet readiness, trip activity, and attention items.
          </p>
        </div>
        <Button
          variant="secondary"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-32 animate-pulse rounded-2xl border border-gray-100 bg-gray-100"
            />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {dashboardCards.map((card) => {
            const Icon = card.icon;
            const value = metrics[card.key];
            const displayValue =
              card.key === "fleet_utilization_pct"
                ? `${value ?? 0}%`
                : (value ?? 0);

            return (
              <div
                key={card.key}
                className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className={`rounded-xl p-2.5 ${card.accent}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
                    {card.label}
                  </span>
                </div>
                <div className="mt-5">
                  <p className="text-3xl font-semibold text-gray-900">
                    {displayValue}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {(metrics.active_vehicles ?? 0) === 0 && !isLoading && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">
                No trips yet — create your first trip
              </p>
              <p className="mt-1 text-amber-700/80">
                Register a vehicle first so trips can be planned.
              </p>
            </div>
            <Link to="/vehicles">
              <Button variant="secondary" className="flex items-center gap-2">
                Register vehicle
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1.5fr_0.9fr]">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Fleet Utilization
              </h3>
              <p className="text-sm text-gray-500">
                A quick view of current trip demand vs spare capacity.
              </p>
            </div>
            <div className="rounded-full bg-indigo-50 px-3 py-1 text-sm font-semibold text-indigo-600">
              {utilizationPercent.toFixed(1)}%
            </div>
          </div>
          <div className="mt-8 flex items-end gap-4">
            {chartBars.map((bar) => (
              <div
                key={bar.label}
                className="flex flex-1 flex-col items-center gap-3"
              >
                <div className="flex h-36 w-full items-end rounded-2xl bg-slate-50 p-2">
                  <div
                    className={`w-full rounded-xl ${bar.label === "Utilization" ? "bg-indigo-500" : "bg-slate-300"}`}
                    style={{ height: `${Math.max(bar.value, 8)}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-600">
                  {bar.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="text-lg font-semibold text-gray-900">
              Attention Needed
            </h3>
          </div>

          <div className="mt-5 space-y-4">
            <div>
              <p className="text-sm font-semibold text-gray-700">
                Vehicles in shop
              </p>
              {attentionVehicles.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {attentionVehicles.map((vehicle) => (
                    <li
                      key={vehicle.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                    >
                      {vehicle.registration_number} — {vehicle.name_model}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No vehicles currently flagged for maintenance.
                </p>
              )}
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-700">
                Drivers with expiring licenses
              </p>
              {expiringDrivers.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {expiringDrivers.map((driver) => (
                    <li
                      key={driver.id}
                      className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2 text-sm text-gray-600"
                    >
                      {driver.name} — expires{" "}
                      {new Date(driver.license_expiry).toLocaleDateString()}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-gray-500">
                  No drivers need attention in the next 30 days.
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
