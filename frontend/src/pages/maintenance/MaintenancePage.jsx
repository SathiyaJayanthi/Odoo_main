import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listMaintenance, openMaintenance, closeMaintenance } from '../../api/maintenance'
import { listVehicles } from '../../api/vehicles'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import CrudTable from '../../components/common/CrudTable'
import FormField from '../../components/common/FormField'
import Modal from '../../components/common/Modal'
import { Plus, Wrench, RefreshCw, CheckCircle } from 'lucide-react'

const MaintenancePage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()

  // Modals state
  const [isLogModalOpen, setIsLogModalOpen] = useState(false)
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false)
  const [selectedLogToClose, setSelectedLogToClose] = useState(null)

  // Log Form State
  const [logFormData, setLogFormData] = useState({
    vehicle_id: '',
    description: '',
    cost: '0'
  })
  const [logError, setLogError] = useState('')
  const [isSubmittingLog, setIsSubmittingLog] = useState(false)

  // React Query: Fetch Maintenance Logs
  const { data: logs = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['maintenance'],
    queryFn: () => listMaintenance(),
  })

  // React Query: Fetch Vehicles for selector dropdown
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-select'],
    queryFn: () => listVehicles(),
  })

  // Mutations
  const invalidateKeys = () => {
    queryClient.invalidateQueries({ queryKey: ['maintenance'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles-for-select'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  const logMaintenanceMutation = useMutation({
    mutationFn: openMaintenance,
    onSuccess: (data) => {
      toast.success(`Maintenance logged for vehicle ${data.vehicle?.registration_number || ''}`)
      setIsLogModalOpen(false)
      setLogFormData({ vehicle_id: '', description: '', cost: '0' })
      invalidateKeys()
    },
    onError: (err) => {
      console.error('Error logging maintenance:', err)
      const errorMsg = err.response?.data?.error?.message || 'An error occurred while logging maintenance.'
      // Show exact conflict/error message in toast
      toast.error(errorMsg)
      setLogError(errorMsg)
    }
  })

  const closeMaintenanceMutation = useMutation({
    mutationFn: ({ id, data }) => closeMaintenance(id, data),
    onSuccess: (data) => {
      toast.success(`Maintenance closed for vehicle ${data.vehicle?.registration_number || ''}`)
      setIsConfirmModalOpen(false)
      setSelectedLogToClose(null)
      invalidateKeys()
    },
    onError: (err) => {
      console.error('Error closing maintenance:', err)
      const errorMsg = err.response?.data?.error?.message || 'An error occurred while closing maintenance.'
      toast.error(errorMsg)
    }
  })

  // Handlers
  const handleOpenLogModal = () => {
    setLogError('')
    setLogFormData({
      vehicle_id: vehicles[0]?.id || '',
      description: '',
      cost: '0'
    })
    setIsLogModalOpen(true)
  }

  const handleLogSubmit = async (e) => {
    e.preventDefault()
    setLogError('')
    setIsSubmittingLog(true)
    await logMaintenanceMutation.mutateAsync({
      vehicle_id: parseInt(logFormData.vehicle_id),
      description: logFormData.description,
      cost: parseFloat(logFormData.cost)
    })
    setIsSubmittingLog(false)
  }

  const handleOpenCloseConfirm = (log) => {
    setSelectedLogToClose(log)
    setIsConfirmModalOpen(true)
  }

  const handleConfirmClose = async () => {
    if (!selectedLogToClose) return
    await closeMaintenanceMutation.mutateAsync({
      id: selectedLogToClose.id,
      data: { cost: selectedLogToClose.cost }
    })
  }

  // Table Columns
  const columns = [
    {
      key: 'vehicle',
      header: 'Vehicle',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-900">{row.vehicle?.name_model || 'Unknown'}</p>
          <span className="font-mono text-xs font-semibold text-gray-500 bg-gray-50 border border-gray-150 px-2 py-0.5 rounded-md mt-1 inline-block">
            {row.vehicle?.registration_number || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => row.description
    },
    {
      key: 'cost',
      header: 'Cost ($)',
      render: (row) => `$${parseFloat(row.cost).toFixed(2)}`
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'opened_at',
      header: 'Opened At',
      render: (row) => new Date(row.opened_at).toLocaleString()
    },
    {
      key: 'closed_at',
      header: 'Closed At',
      render: (row) => row.closed_at ? new Date(row.closed_at).toLocaleString() : '—'
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (row.status === 'Open') {
          return (
            <Button
              variant="success"
              size="sm"
              className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-emerald-500"
              onClick={() => handleOpenCloseConfirm(row)}
            >
              <CheckCircle className="w-3.5 h-3.5" />
              Close Ticket
            </Button>
          )
        }
        return <span className="text-gray-400 text-xs font-semibold">Archived</span>
      }
    }
  ]

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Maintenance Logs</h2>
          <p className="text-sm text-gray-500 mt-1">Track and manage active workshop maintenance tickets for your fleet.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenLogModal}
          className="flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Log Maintenance
        </Button>
      </div>

      {/* Control bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex justify-end">
        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 text-gray-500 hover:text-gray-700 transition-all font-semibold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Logs Table */}
      <CrudTable
        columns={columns}
        data={logs}
        isLoading={isLoading}
        emptyMessage="No maintenance logged yet"
        emptyIcon={
          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      {/* Log Maintenance Modal */}
      <Modal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        title="Log Vehicle Maintenance"
        size="md"
      >
        <form onSubmit={handleLogSubmit} className="space-y-4">
          {logError && (
            <div className="bg-red-50 text-red-700 text-xs font-semibold p-3.5 rounded-xl border border-red-200">
              {logError}
            </div>
          )}

          <FormField
            label="Vehicle"
            id="vehicle_id"
            name="vehicle_id"
            required
          >
            {({ id, className }) => (
              <select
                id={id}
                className={className}
                value={logFormData.vehicle_id}
                onChange={(e) => setLogFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
              >
                <option value="" disabled>Select a vehicle</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name_model} ({v.registration_number}) [{v.status}]
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Description of Service"
            id="description"
            name="description"
            required
            value={logFormData.description}
            onChange={(e) => setLogFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="e.g. Brake pad replacement, Engine oil change"
          />

          <FormField
            label="Estimated Cost ($)"
            id="cost"
            name="cost"
            type="number"
            step="0.01"
            required
            value={logFormData.cost}
            onChange={(e) => setLogFormData(prev => ({ ...prev, cost: e.target.value }))}
            placeholder="e.g. 250.00"
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <Button variant="secondary" onClick={() => setIsLogModalOpen(false)} disabled={isSubmittingLog}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmittingLog}>
              Log Maintenance
            </Button>
          </div>
        </form>
      </Modal>

      {/* Confirm Close Modal */}
      <Modal
        isOpen={isConfirmModalOpen}
        onClose={() => setIsConfirmModalOpen(false)}
        title="Confirm Ticket Closure"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-amber-50 rounded-xl text-amber-600 shrink-0">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Are you sure you want to close this ticket?</h4>
              <p className="text-sm text-gray-500 mt-2">
                Close maintenance for <span className="font-semibold text-indigo-600">{selectedLogToClose?.vehicle?.registration_number || 'this vehicle'}</span>? This will make the vehicle Available again.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button 
              variant="secondary" 
              onClick={() => setIsConfirmModalOpen(false)}
              disabled={closeMaintenanceMutation.isPending}
            >
              Cancel
            </Button>
            <Button 
              variant="success" 
              onClick={handleConfirmClose}
              isLoading={closeMaintenanceMutation.isPending}
            >
              Close Maintenance
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default MaintenancePage
