import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  cancelTrip,
  completeTrip,
  dispatchTrip,
  listTrips,
} from "../../api/trips";
import { listDrivers } from "../../api/drivers";
import { listVehicles } from "../../api/vehicles";
import Button from "../../components/common/Button";
import StatusBadge from "../../components/common/StatusBadge";
import CrudTable from "../../components/common/CrudTable";
import TripCreateForm from "./TripCreateForm";
import { CheckCircle, Navigation, Plus, RefreshCw, Send } from "lucide-react";
import { useToast } from "../../context/ToastContext";

const TripsPage = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("");
  const [pendingTripId, setPendingTripId] = useState(null);

  const filterKey = statusFilter || "all";
  const {
    data: trips = [],
    isLoading,
    isRefetching,
    refetch,
  } = useQuery({
    queryKey: ["trips", filterKey],
    queryFn: () => listTrips(statusFilter ? { status: statusFilter } : {}),
  });

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles"],
    queryFn: listVehicles,
    staleTime: 60_000,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers"],
    queryFn: listDrivers,
    staleTime: 60_000,
  });

  const vehicleById = useMemo(
    () =>
      Object.fromEntries(
        (vehicles || []).map((vehicle) => [vehicle.id, vehicle]),
      ),
    [vehicles],
  );
  const driverById = useMemo(
    () =>
      Object.fromEntries((drivers || []).map((driver) => [driver.id, driver])),
    [drivers],
  );

  const invalidateTripRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["trips"] }),
      queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
      queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  };

  const getErrorMessage = (error) =>
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    "Request failed.";

  const dispatchMutation = useMutation({
    mutationFn: (tripId) => dispatchTrip(tripId),
    onSuccess: async (data) => {
      toast.success(`Trip #${data.id} dispatched successfully.`);
      await invalidateTripRelatedQueries();
      setPendingTripId(null);
    },
    onError: (error) => {
      setPendingTripId(null);
      toast.error(getErrorMessage(error));
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ tripId, payload }) => completeTrip(tripId, payload),
    onSuccess: async (data) => {
      toast.success(`Trip #${data.id} completed successfully.`);
      await invalidateTripRelatedQueries();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const cancelMutation = useMutation({
    mutationFn: (tripId) => cancelTrip(tripId),
    onSuccess: async (data) => {
      toast.success(`Trip #${data.id} cancelled successfully.`);
      await invalidateTripRelatedQueries();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error));
    },
  });

  const handleDispatch = async (tripId) => {
    setPendingTripId(tripId);
    await dispatchMutation.mutateAsync(tripId);
  };

  const handleComplete = (trip) => {
    const vehicle =
      trip.vehicle && typeof trip.vehicle === "object"
        ? trip.vehicle
        : vehicleById[trip.vehicle];
    const currentOdometer = Number(vehicle?.odometer || 0);
    const plannedDistance = Number(trip.planned_distance || 0);
    completeMutation.mutate({
      tripId: trip.id,
      payload: {
        final_odometer: currentOdometer + plannedDistance,
        fuel_consumed: 0,
      },
    });
  };

  const handleCancel = (tripId) => {
    cancelMutation.mutate(tripId);
  };

  const columns = [
    {
      key: "id",
      header: "Trip ID",
      render: (row) => (
        <span className="font-semibold text-gray-900">#{row.id}</span>
      ),
    },
    {
      key: "route",
      header: "Source → Destination",
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">
            {row.source} → {row.destination}
          </p>
          <span className="text-xs text-gray-500">
            Distance: {Number(row.planned_distance || 0).toFixed(1)} km
          </span>
        </div>
      ),
    },
    {
      key: "vehicle",
      header: "Vehicle",
      render: (row) => {
        const vehicle =
          row.vehicle && typeof row.vehicle === "object"
            ? row.vehicle
            : vehicleById[row.vehicle];
        return (
          <div>
            <p className="font-medium text-gray-700">
              {vehicle?.name_model || "Unknown"}
            </p>
            <span className="rounded border border-gray-100 bg-gray-50 px-1.5 py-0.5 font-mono text-[11px] text-gray-500">
              {vehicle?.registration_number || "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      key: "driver",
      header: "Driver",
      render: (row) => {
        const driver =
          row.driver && typeof row.driver === "object"
            ? row.driver
            : driverById[row.driver];
        return (
          <div>
            <p className="font-medium text-gray-700">
              {driver?.name || "Unknown"}
            </p>
            <span className="text-xs text-gray-500">
              Lic: {driver?.license_number || "N/A"}
            </span>
          </div>
        );
      },
    },
    {
      key: "cargo_weight",
      header: "Cargo Weight",
      render: (row) => `${Number(row.cargo_weight || 0).toLocaleString()} kg`,
    },
    {
      key: "status",
      header: "Status",
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      render: (row) => {
        if (row.status === "Draft") {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => handleDispatch(row.id)}
                isLoading={
                  dispatchMutation.isPending && pendingTripId === row.id
                }
              >
                <Send className="h-3.5 w-3.5" />
                Dispatch
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleCancel(row.id)}
                isLoading={
                  cancelMutation.isPending &&
                  cancelMutation.variables === row.id
                }
              >
                Cancel
              </Button>
            </div>
          );
        }

        if (row.status === "Dispatched") {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex items-center gap-1"
                onClick={() => handleComplete(row)}
                isLoading={completeMutation.isPending}
              >
                <CheckCircle className="h-3.5 w-3.5" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleCancel(row.id)}
                isLoading={
                  cancelMutation.isPending &&
                  cancelMutation.variables === row.id
                }
              >
                Cancel
              </Button>
            </div>
          );
        }

        return (
          <span className="text-xs font-semibold text-gray-400">View only</span>
        );
      },
    },
  ];

  const filterOptions = [
    "All",
    "Draft",
    "Dispatched",
    "Completed",
    "Cancelled",
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Trip Management
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Create, dispatch, complete, or cancel trips with live fleet updates.
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Trip
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
          <Navigation className="h-4 w-4" />
          Filters
        </div>
        {filterOptions.map((option) => {
          const nextValue = option === "All" ? "" : option;
          const isActive = statusFilter === nextValue;
          return (
            <button
              key={option}
              type="button"
              onClick={() => setStatusFilter(nextValue)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${isActive ? "bg-indigo-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
            >
              {option}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="ml-auto flex items-center gap-2 rounded-full border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-50"
        >
          <RefreshCw
            className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`}
          />
          Refresh
        </button>
      </div>

      <CrudTable
        columns={columns}
        data={trips}
        isLoading={isLoading}
        emptyMessage="No trips match the current filter"
        emptyIcon={
          <svg
            className="mb-3 h-16 w-16 text-gray-300"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
        }
      />

      <TripCreateForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
};

export default TripsPage;
