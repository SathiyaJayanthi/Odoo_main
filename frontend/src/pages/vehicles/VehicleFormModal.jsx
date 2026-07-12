import { useState, useEffect } from 'react'
import { createVehicle, updateVehicle } from '../../api/vehicles'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import Modal from '../../components/common/Modal'

const VehicleFormModal = ({ isOpen, onClose, vehicle, onSaveSuccess }) => {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    registration_number: '',
    name_model: '',
    type: 'Van',
    max_load_capacity: '',
    odometer: '0',
    acquisition_cost: '',
    region: '',
    status: 'Available'
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (vehicle) {
      setFormData({
        registration_number: vehicle.registration_number || '',
        name_model: vehicle.name_model || '',
        type: vehicle.type || 'Van',
        max_load_capacity: vehicle.max_load_capacity || '',
        odometer: vehicle.odometer || '0',
        acquisition_cost: vehicle.acquisition_cost || '',
        region: vehicle.region || '',
        status: vehicle.status || 'Available'
      })
    } else {
      setFormData({
        registration_number: '',
        name_model: '',
        type: 'Van',
        max_load_capacity: '',
        odometer: '0',
        acquisition_cost: '',
        region: '',
        status: 'Available'
      })
    }
    setErrors({})
  }, [vehicle, isOpen])

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

    try {
      let result
      if (vehicle) {
        result = await updateVehicle(vehicle.id, formData)
        toast.success(`Vehicle ${formData.registration_number} updated`)
      } else {
        result = await createVehicle(formData)
        toast.success(`Vehicle ${formData.registration_number} registered`)
      }
      onSaveSuccess(result)
      onClose()
    } catch (err) {
      console.error('Error saving vehicle:', err)
      const errorData = err.response?.data?.error
      if (errorData?.field === 'registration_number') {
        setErrors({ registration_number: errorData.message })
      } else if (err.response?.data) {
        // Fallback for direct serializer errors if exception handler is bypassed
        const fieldErrors = err.response.data
        if (fieldErrors.registration_number) {
          setErrors({ registration_number: Array.isArray(fieldErrors.registration_number) ? fieldErrors.registration_number[0] : fieldErrors.registration_number })
        } else {
          toast.error(errorData?.message || 'An error occurred while saving the vehicle')
        }
      } else {
        toast.error('Failed to communicate with server')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const vehicleTypes = ['Van', 'Truck', 'Semi-Trailer', 'Flatbed', 'Refrigerator', 'Box Truck']
  const vehicleStatuses = ['Available', 'On Trip', 'In Shop', 'Retired']

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={vehicle ? 'Edit Vehicle Details' : 'Register New Vehicle'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Registration Number"
            id="registration_number"
            name="registration_number"
            required
            value={formData.registration_number}
            onChange={handleChange}
            error={errors.registration_number}
            placeholder="e.g. MH12AB1234"
          />

          <FormField
            label="Vehicle Model Name"
            id="name_model"
            name="name_model"
            required
            value={formData.name_model}
            onChange={handleChange}
            placeholder="e.g. Tata Ace Van"
          />

          <FormField
            label="Vehicle Type"
            id="type"
            name="type"
            required
            error={errors.type}
          >
            {({ id, className }) => (
              <select
                id={id}
                name="type"
                className={className}
                value={formData.type}
                onChange={handleChange}
              >
                {vehicleTypes.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Max Load Capacity (Tons / kg)"
            id="max_load_capacity"
            name="max_load_capacity"
            type="number"
            step="0.01"
            required
            value={formData.max_load_capacity}
            onChange={handleChange}
            error={errors.max_load_capacity}
            placeholder="e.g. 5.5"
          />

          <FormField
            label="Odometer reading (km)"
            id="odometer"
            name="odometer"
            type="number"
            step="0.01"
            required
            value={formData.odometer}
            onChange={handleChange}
            placeholder="e.g. 15000"
          />

          <FormField
            label="Acquisition Cost ($)"
            id="acquisition_cost"
            name="acquisition_cost"
            type="number"
            step="0.01"
            required
            value={formData.acquisition_cost}
            onChange={handleChange}
            placeholder="e.g. 45000"
          />

          <FormField
            label="Operating Region"
            id="region"
            name="region"
            value={formData.region}
            onChange={handleChange}
            placeholder="e.g. West Coast"
          />

          {vehicle && (
            <FormField
              label="Status"
              id="status"
              name="status"
              required
            >
              {({ id, className }) => (
                <select
                  id={id}
                  name="status"
                  className={className}
                  value={formData.status}
                  onChange={handleChange}
                >
                  {vehicleStatuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              )}
            </FormField>
          )}
        </div>

        <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
          <Button variant="secondary" onClick={onClose} disabled={isLoading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isLoading}>
            {vehicle ? 'Save Changes' : 'Register Vehicle'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default VehicleFormModal
