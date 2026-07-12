import { useState, useEffect } from 'react'
import { createTrip, updateTrip } from '../../api/trips'
import { listVehicles } from '../../api/vehicles'
import { listDrivers } from '../../api/drivers'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import Modal from '../../components/common/Modal'
import { AlertCircle } from 'lucide-react'

const TripFormModal = ({ isOpen, onClose, trip, onSaveSuccess }) => {
  const { toast } = useToast()
  
  // Lists
  const [vehicles, setVehicles] = useState([])
  const [drivers, setDrivers] = useState([])
  
  // Form State
  const [formData, setFormData] = useState({
    vehicle_id: '',
    driver_id: '',
    source: '',
    destination: '',
    cargo_weight: '',
    planned_distance: ''
  })
  
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  // Load vehicles and drivers
  useEffect(() => {
    const loadResources = async () => {
      try {
        const vList = await listVehicles()
        const dList = await listDrivers()
        
        // Filter out Retired vehicles & Suspended drivers, but keep the currently selected ones if editing
        const activeVehicles = vList.filter(
          v => v.status === 'Available' || (trip && trip.vehicle?.id === v.id)
        )
        const activeDrivers = dList.filter(
          d => d.status === 'Available' || (trip && trip.driver?.id === d.id)
        )

        setVehicles(activeVehicles)
        setDrivers(activeDrivers)
      } catch (err) {
        console.error('Failed to load form resources:', err)
      }
    }
    if (isOpen) {
      loadResources()
    }
  }, [isOpen, trip])

  useEffect(() => {
    if (trip) {
      setFormData({
        vehicle_id: trip.vehicle?.id || '',
        driver_id: trip.driver?.id || '',
        source: trip.source || '',
        destination: trip.destination || '',
        cargo_weight: trip.cargo_weight || '',
        planned_distance: trip.planned_distance || ''
      })
    } else {
      setFormData({
        vehicle_id: '',
        driver_id: '',
        source: '',
        destination: '',
        cargo_weight: '',
        planned_distance: ''
      })
    }
    setErrors({})
  }, [trip, isOpen])

  const selectedVehicle = vehicles.find(v => v.id === parseInt(formData.vehicle_id))
  
  // Real-time capacity validation helper
  const isCargoOverweight = selectedVehicle && 
    formData.cargo_weight && 
    parseFloat(formData.cargo_weight) > parseFloat(selectedVehicle.max_load_capacity)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: null }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrors({})
    setIsLoading(true)

    // Client-side block before sending request
    if (isCargoOverweight) {
      setErrors({ cargo_weight: `Cargo weight exceeds vehicle capacity of ${selectedVehicle.max_load_capacity} kg.` })
      setIsLoading(false)
      toast.error('Cannot create trip: Cargo weight exceeds capacity.')
      return
    }

    try {
      let result
      const payload = {
        vehicle_id: parseInt(formData.vehicle_id),
        driver_id: parseInt(formData.driver_id),
        source: formData.source,
        destination: formData.destination,
        cargo_weight: parseFloat(formData.cargo_weight),
        planned_distance: parseFloat(formData.planned_distance)
      }

      if (trip) {
        result = await updateTrip(trip.id, payload)
        toast.success(`Trip #${trip.id} details updated`)
      } else {
        result = await createTrip(payload)
        toast.success('Trip registered in Draft status')
      }
      onSaveSuccess(result)
      onClose()
    } catch (err) {
      console.error('Error saving trip:', err)
      const errorData = err.response?.data?.error
      if (errorData?.field) {
        setErrors({ [errorData.field]: errorData.message })
      } else if (err.response?.data) {
        const fieldErrors = err.response.data
        const firstField = Object.keys(fieldErrors)[0]
        if (firstField) {
          const firstErr = fieldErrors[firstField]
          setErrors({ [firstField]: Array.isArray(firstErr) ? firstErr[0] : firstErr })
        } else {
          toast.error(errorData?.message || 'An error occurred while saving trip details')
        }
      } else {
        toast.error('Failed to communicate with server')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={trip ? `Edit Trip #${trip.id}` : 'Plan New Route Trip'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Select Vehicle"
            id="vehicle_id"
            name="vehicle_id"
            required
            error={errors.vehicle_id}
          >
            {({ id, className }) => (
              <select
                id={id}
                name="vehicle_id"
                className={className}
                value={formData.vehicle_id}
                onChange={handleChange}
              >
                <option value="" disabled>Choose available vehicle...</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name_model} ({v.registration_number}) [Cap: {v.max_load_capacity} kg]
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Select Driver"
            id="driver_id"
            name="driver_id"
            required
            error={errors.driver_id}
          >
            {({ id, className }) => (
              <select
                id={id}
                name="driver_id"
                className={className}
                value={formData.driver_id}
                onChange={handleChange}
              >
                <option value="" disabled>Choose available driver...</option>
                {drivers.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.license_number})
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Source Location"
            id="source"
            name="source"
            required
            value={formData.source}
            onChange={handleChange}
            error={errors.source}
            placeholder="e.g. Warehouse A"
          />

          <FormField
            label="Destination Location"
            id="destination"
            name="destination"
            required
            value={formData.destination}
            onChange={handleChange}
            error={errors.destination}
            placeholder="e.g. Outlet B"
          />

          <div className="space-y-1">
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
              placeholder="e.g. 450.00"
            />
            {/* Live real-time capacity warning display */}
            {isCargoOverweight && (
              <div className="flex items-center gap-1.5 text-xs text-amber-600 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-1 animate-in fade-in">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>
                  Warning: Weight exceeds vehicle capacity ({selectedVehicle.max_load_capacity} kg) and will be blocked on submit!
                </span>
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
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {trip ? 'Save Changes' : 'Create Draft Trip'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default TripFormModal
