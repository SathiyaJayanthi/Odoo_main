import { useState, useEffect } from 'react'
import { createDriver, updateDriver } from '../../api/drivers'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import Modal from '../../components/common/Modal'

const DriverFormModal = ({ isOpen, onClose, driver, onSaveSuccess }) => {
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: '',
    license_number: '',
    license_category: 'Class A',
    license_expiry: '',
    contact_number: '',
    status: 'Available'
  })

  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (driver) {
      setFormData({
        name: driver.name || '',
        license_number: driver.license_number || '',
        license_category: driver.license_category || 'Class A',
        license_expiry: driver.license_expiry || '',
        contact_number: driver.contact_number || '',
        status: driver.status || 'Available'
      })
    } else {
      setFormData({
        name: '',
        license_number: '',
        license_category: 'Class A',
        license_expiry: '',
        contact_number: '',
        status: 'Available'
      })
    }
    setErrors({})
  }, [driver, isOpen])

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
      if (driver) {
        result = await updateDriver(driver.id, formData)
        toast.success(`Driver ${formData.name} details updated`)
      } else {
        result = await createDriver(formData)
        toast.success(`Driver ${formData.name} registered`)
      }
      onSaveSuccess(result)
      onClose()
    } catch (err) {
      console.error('Error saving driver:', err)
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
          toast.error(errorData?.message || 'An error occurred while saving driver details')
        }
      } else {
        toast.error('Failed to communicate with server')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const licenseCategories = ['Class A', 'Class B', 'Class C', 'HGV', 'Light Motor Vehicle', 'Heavy Motor Vehicle']
  const driverStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended']

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={driver ? 'Edit Driver Profile' : 'Register New Driver'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            label="Full Name"
            id="name"
            name="name"
            required
            value={formData.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="e.g. Alex Fernandes"
          />

          <FormField
            label="License Number"
            id="license_number"
            name="license_number"
            required
            value={formData.license_number}
            onChange={handleChange}
            error={errors.license_number}
            placeholder="e.g. DL-MH-2024-99887"
          />

          <FormField
            label="License Category"
            id="license_category"
            name="license_category"
            required
            error={errors.license_category}
          >
            {({ id, className }) => (
              <select
                id={id}
                name="license_category"
                className={className}
                value={formData.license_category}
                onChange={handleChange}
              >
                {licenseCategories.map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="License Expiry Date"
            id="license_expiry"
            name="license_expiry"
            type="date"
            required
            value={formData.license_expiry}
            onChange={handleChange}
            error={errors.license_expiry}
          />

          <FormField
            label="Contact Number"
            id="contact_number"
            name="contact_number"
            required
            value={formData.contact_number}
            onChange={handleChange}
            error={errors.contact_number}
            placeholder="e.g. +91 98765 43210"
          />

          {driver && (
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
                  {driverStatuses.map((s) => (
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
            {driver ? 'Save Changes' : 'Register Driver'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

export default DriverFormModal
