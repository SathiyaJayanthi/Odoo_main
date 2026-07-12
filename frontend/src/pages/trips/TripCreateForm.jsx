import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { createTrip } from "../../api/trips";
import { listAvailableDrivers } from "../../api/drivers";
import { listAvailableVehicles } from "../../api/vehicles";
import { useToast } from "../../context/ToastContext";
import Button from "../../components/common/Button";
import FormField from "../../components/common/FormField";
import Modal from "../../components/common/Modal";
import { AlertCircle } from "lucide-react";

const initialFormState = {
  vehicle_id: "",
  driver_id: "",
  source: "",
  destination: "",
  cargo_weight: "",
  planned_distance: "",
};

const TripCreateForm = ({ isOpen, onClose, onSuccess }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState(initialFormState);
  const [vehicleQuery, setVehicleQuery] = useState("");
  const [driverQuery, setDriverQuery] = useState("");
  const [errors, setErrors] = useState({});

  const { data: vehicles = [] } = useQuery({
    queryKey: ["vehicles", "available"],
    queryFn: listAvailableVehicles,
    enabled: isOpen,
  });

  const { data: drivers = [] } = useQuery({
    queryKey: ["drivers", "available"],
    queryFn: listAvailableDrivers,
    enabled: isOpen,
  });

  const selectedVehicle = useMemo(
    () =>
      vehicles.find(
        (vehicle) => String(vehicle.id) === String(formData.vehicle_id),
      ) || null,
    [formData.vehicle_id, vehicles],
  );

  const selectedDriver = useMemo(
    () =>
      drivers.find(
        (driver) => String(driver.id) === String(formData.driver_id),
      ) || null,
    [formData.driver_id, drivers],
  );

  const capacityError = useMemo(() => {
    if (!selectedVehicle || !formData.cargo_weight) return "";

    const cargoWeight = Number(formData.cargo_weight);
    const capacity = Number(selectedVehicle.max_load_capacity);

    if (Number.isNaN(cargoWeight) || Number.isNaN(capacity)) return "";
    if (cargoWeight > capacity) {
      return `${cargoWeight}kg exceeds ${capacity}kg capacity`;
    }

    return "";
  }, [formData.cargo_weight, selectedVehicle]);

  useEffect(() => {
    if (!isOpen) {
      setFormData(initialFormState);
      setVehicleQuery("");
      setDriverQuery("");
      setErrors({});
      return;
    }

    if (selectedVehicle) {
      setVehicleQuery(
        `${selectedVehicle.name_model} (${selectedVehicle.registration_number})`,
      );
    }

    if (selectedDriver) {
      setDriverQuery(
        `${selectedDriver.name} (${selectedDriver.license_number})`,
      );
    }
  }, [isOpen, selectedDriver, selectedVehicle]);

  const invalidateTripRelatedQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["trips"] }),
      queryClient.invalidateQueries({ queryKey: ["vehicles"] }),
      queryClient.invalidateQueries({ queryKey: ["drivers"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard"] }),
    ]);
  };

  const createTripMutation = useMutation({
    mutationFn: (payload) => createTrip(payload),
    onSuccess: async () => {
      await invalidateTripRelatedQueries();
      toast.success("Trip created in Draft status");
      onSuccess?.();
      onClose();
    },
    onError: (error) => {
      const message =
        error.response?.data?.error?.message ||
        error.response?.data?.message ||
        error.message ||
        "Failed to create trip.";
      toast.error(message);
      if (error.response?.data?.error?.field) {
        setErrors({ [error.response.data.error.field]: message });
      }
    },
  });

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((previous) => ({ ...previous, [name]: value }));

    if (errors[name]) {
      setErrors((previous) => ({ ...previous, [name]: "" }));
    }
  };

  const handleVehicleInput = (event) => {
    const nextValue = event.target.value;
    setVehicleQuery(nextValue);

    const match = vehicles.find((vehicle) => {
      const label = `${vehicle.name_model} (${vehicle.registration_number})`;
      return label.toLowerCase() === nextValue.toLowerCase();
    });

    setFormData((previous) => ({
      ...previous,
      vehicle_id: match ? String(match.id) : "",
    }));
  };

  const handleDriverInput = (event) => {
    const nextValue = event.target.value;
    setDriverQuery(nextValue);

    const match = drivers.find((driver) => {
      const label = `${driver.name} (${driver.license_number})`;
      return label.toLowerCase() === nextValue.toLowerCase();
    });

    setFormData((previous) => ({
      ...previous,
      driver_id: match ? String(match.id) : "",
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setErrors({});

    if (capacityError) {
      setErrors({ cargo_weight: capacityError });
      toast.error(capacityError);
      return;
    }

    const payload = {
      vehicle_id: Number(formData.vehicle_id),
      driver_id: Number(formData.driver_id),
      source: formData.source,
      destination: formData.destination,
      cargo_weight: Number(formData.cargo_weight),
      planned_distance: Number(formData.planned_distance),
    };

    createTripMutation.mutate(payload);
  };

  const submitDisabled =
    createTripMutation.isPending ||
    !!capacityError ||
    !formData.vehicle_id ||
    !formData.driver_id ||
    !formData.source ||
    !formData.destination ||
    !formData.cargo_weight ||
    !formData.planned_distance;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Trip" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField label="Vehicle" id="vehicle" error={errors.vehicle_id}>
            {({ id, className }) => (
              <>
                <input
                  id={id}
                  name="vehicle_search"
                  className={className}
                  value={vehicleQuery}
                  onChange={handleVehicleInput}
                  list="trip-vehicle-options"
                  placeholder="Search available vehicle"
                />
                <datalist id="trip-vehicle-options">
                  {vehicles.map((vehicle) => (
                    <option
                      key={vehicle.id}
                      value={`${vehicle.name_model} (${vehicle.registration_number})`}
                    />
                  ))}
                </datalist>
              </>
            )}
          </FormField>

          <FormField label="Driver" id="driver" error={errors.driver_id}>
            {({ id, className }) => (
              <>
                <input
                  id={id}
                  name="driver_search"
                  className={className}
                  value={driverQuery}
                  onChange={handleDriverInput}
                  list="trip-driver-options"
                  placeholder="Search available driver"
                />
                <datalist id="trip-driver-options">
                  {drivers.map((driver) => (
                    <option
                      key={driver.id}
                      value={`${driver.name} (${driver.license_number})`}
                    />
                  ))}
                </datalist>
              </>
            )}
          </FormField>

          <FormField
            label="Source"
            id="source"
            name="source"
            required
            value={formData.source}
            onChange={handleChange}
            error={errors.source}
            placeholder="Warehouse A"
          />

          <FormField
            label="Destination"
            id="destination"
            name="destination"
            required
            value={formData.destination}
            onChange={handleChange}
            error={errors.destination}
            placeholder="Outlet B"
          />

          <div className="space-y-1.5">
            <FormField
              label="Cargo Weight (kg)"
              id="cargo_weight"
              name="cargo_weight"
              type="number"
              step="0.01"
              required
              value={formData.cargo_weight}
              onChange={handleChange}
              error={errors.cargo_weight}
              placeholder="e.g. 450"
            />
            {capacityError && (
              <div className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{capacityError}</span>
              </div>
            )}
          </div>

          <FormField
            label="Planned Distance (km)"
            id="planned_distance"
            name="planned_distance"
            type="number"
            step="0.01"
            required
            value={formData.planned_distance}
            onChange={handleChange}
            error={errors.planned_distance}
            placeholder="e.g. 120.5"
          />
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={createTripMutation.isPending}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
            isLoading={createTripMutation.isPending}
            disabled={submitDisabled}
          >
            Create Draft Trip
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default TripCreateForm;
