import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { listTrips, updateTrip } from '../../api/trips'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import CrudTable from '../../components/common/CrudTable'
import FormField from '../../components/common/FormField'
import Modal from '../../components/common/Modal'
import TripFormModal from './TripFormModal'
import { Plus, RefreshCw, Send, CheckCircle, XCircle, Navigation, Calculator } from 'lucide-react'
import { useToast } from '../../context/ToastContext'

const TripsPage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Modals state
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)
  const [isCompleteModalOpen, setIsCompleteModalOpen] = useState(false)
  const [isCancelModalOpen, setIsCancelModalOpen] = useState(false)
  
  // Selection state
  const [selectedTrip, setSelectedTrip] = useState(null)
  
  // Form states
  const [completeFormData, setCompleteFormData] = useState({
    final_odometer: '',
    fuel_consumed: ''
  })
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('')

  const filters = {
    ...(statusFilter && { status: statusFilter })
  }

  // React Query Fetch
  const { data: trips = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['trips', filters],
    queryFn: () => listTrips(filters),
  })

  // Invalidations
  const invalidateKeys = () => {
    queryClient.invalidateQueries({ queryKey: ['trips'] })
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['drivers'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // Mutations
  const dispatchMutation = useMutation({
    mutationFn: (id) => updateTrip(id, { status: 'Dispatched' }),
    onSuccess: (data) => {
      toast.success(`Trip #${data.id} dispatched! Vehicle & Driver status flipped to On Trip.`)
      invalidateKeys()
    },
    onError: (err) => {
      console.error('Error dispatching:', err)
      const errorMsg = err.response?.data?.error?.message || 'Failed to dispatch trip.'
      toast.error(errorMsg)
    }
  })

  const completeMutation = useMutation({
    mutationFn: ({ id, data }) => updateTrip(id, { ...data, status: 'Completed' }),
    onSuccess: (data) => {
      toast.success(`Trip #${data.id} completed. Vehicle & Driver status restored. Odometer updated.`)
      setIsCompleteModalOpen(false)
      invalidateKeys()
    },
    onError: (err) => {
      console.error('Error completing:', err)
      toast.error(err.response?.data?.error?.message || 'Failed to complete trip.')
    }
  })

  const cancelMutation = useMutation({
    mutationFn: (id) => updateTrip(id, { status: 'Cancelled' }),
    onSuccess: (data) => {
      toast.success(`Trip #${data.id} cancelled successfully.`)
      setIsCancelModalOpen(false)
      invalidateKeys()
    },
    onError: (err) => {
      console.error('Error cancelling:', err)
      toast.error(err.response?.data?.error?.message || 'Failed to cancel trip.')
    }
  })

  // Handlers
  const handleOpenRegister = () => {
    setSelectedTrip(null)
    setIsFormModalOpen(true)
  }

  const handleDispatch = async (tripId) => {
    await dispatchMutation.mutateAsync(tripId)
  }

  const handleOpenComplete = (trip) => {
    setSelectedTrip(trip)
    // Prefill odometer: vehicle odometer + planned distance
    const vOdo = parseFloat(trip.vehicle?.odometer || 0)
    const pDist = parseFloat(trip.planned_distance || 0)
    setCompleteFormData({
      final_odometer: (vOdo + pDist).toFixed(2),
      fuel_consumed: ''
    })
    setIsCompleteModalOpen(true)
  }

  const handleCompleteSubmit = async (e) => {
    e.preventDefault()
    if (!selectedTrip) return
    await completeMutation.mutateAsync({
      id: selectedTrip.id,
      data: {
        final_odometer: parseFloat(completeFormData.final_odometer),
        fuel_consumed: parseFloat(completeFormData.fuel_consumed)
      }
    })
  }

  const handleOpenCancel = (trip) => {
    setSelectedTrip(trip)
    setIsCancelModalOpen(true)
  }

  const handleCancelConfirm = async () => {
    if (!selectedTrip) return
    await cancelMutation.mutateAsync(selectedTrip.id)
  }

  const handleSaveSuccess = () => {
    invalidateKeys()
  }

  // Columns definition
  const columns = [
    {
      key: 'id',
      header: 'Trip ID',
      render: (row) => <span className="font-bold text-gray-900">#{row.id}</span>
    },
    {
      key: 'route',
      header: 'Route Path',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.source} → {row.destination}</p>
          <span className="text-xs text-gray-400 font-medium">Distance: {parseFloat(row.planned_distance).toFixed(1)} km</span>
        </div>
      )
    },
    {
      key: 'vehicle',
      header: 'Vehicle Assigned',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-700">{row.vehicle?.name_model || 'Unknown'}</p>
          <span className="font-mono text-xs text-gray-400 bg-gray-50 border px-1.5 py-0.5 rounded-sm">
            {row.vehicle?.registration_number || 'N/A'}
          </span>
        </div>
      )
    },
    {
      key: 'driver',
      header: 'Driver Assigned',
      render: (row) => (
        <div>
          <p className="font-medium text-gray-700">{row.driver?.name || 'Unknown'}</p>
          <span className="text-xs text-gray-400">Lic: {row.driver?.license_number || 'N/A'}</span>
        </div>
      )
    },
    {
      key: 'cargo_weight',
      header: 'Cargo Weight',
      render: (row) => `${parseFloat(row.cargo_weight).toLocaleString()} kg`
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => {
        if (row.status === 'Draft') {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={() => handleDispatch(row.id)}
                isLoading={dispatchMutation.isPending && selectedTrip?.id === row.id}
              >
                <Send className="w-3.5 h-3.5" />
                Dispatch
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red-500 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleOpenCancel(row)}
              >
                Cancel
              </Button>
            </div>
          )
        }
        if (row.status === 'Dispatched') {
          return (
            <div className="flex items-center gap-2">
              <Button
                variant="success"
                size="sm"
                className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-emerald-500"
                onClick={() => handleOpenComplete(row)}
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Complete
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-1 focus-visible:ring-2 focus-visible:ring-red-500 border-red-200 text-red-600 hover:bg-red-50"
                onClick={() => handleOpenCancel(row)}
              >
                Cancel
              </Button>
            </div>
          )
        }
        return <span className="text-gray-400 text-xs font-semibold">Archived</span>
      }
    }
  ]

  const tripStatuses = ['Draft', 'Dispatched', 'Completed', 'Cancelled']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Trips Dispatch & Operations</h2>
          <p className="text-sm text-gray-500 mt-1">Manage draft loads, coordinate drivers, dispatch active trips, and complete loops.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenRegister}
          className="flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Plan New Trip
        </Button>
      </div>

      {/* Filter and control bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400 select-none px-1">
            <Navigation className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {tripStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 text-gray-500 hover:text-gray-700 transition-all font-semibold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Table */}
      <CrudTable
        columns={columns}
        data={trips}
        isLoading={isLoading}
        emptyMessage="No trips registered yet"
        emptyIcon={
          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        }
      />

      {/* Create Form Modal */}
      <TripFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        trip={selectedTrip}
        onSaveSuccess={handleSaveSuccess}
      />

      {/* Complete Trip Modal */}
      <Modal
        isOpen={isCompleteModalOpen}
        onClose={() => setIsCompleteModalOpen(false)}
        title="Complete Trip Dispatch"
        size="md"
      >
        <form onSubmit={handleCompleteSubmit} className="space-y-4">
          <div className="flex items-start gap-3 bg-indigo-50 text-indigo-700 p-4 rounded-xl border border-indigo-150 mb-2">
            <Calculator className="w-5 h-5 shrink-0 mt-0.5" />
            <div className="text-xs space-y-1">
              <p className="font-bold">Summary parameters:</p>
              <p>Vehicle: {selectedTrip?.vehicle?.name_model} ({selectedTrip?.vehicle?.registration_number})</p>
              <p>Vehicle Odometer Start: {selectedTrip?.vehicle?.odometer} km</p>
              <p>Trip Distance: {selectedTrip?.planned_distance} km</p>
            </div>
          </div>

          <FormField
            label="Final Odometer Reading (km)"
            id="final_odometer"
            name="final_odometer"
            type="number"
            step="0.01"
            required
            value={completeFormData.final_odometer}
            onChange={(e) => setCompleteFormData(prev => ({ ...prev, final_odometer: e.target.value }))}
            placeholder="e.g. 12050.00"
          />

          <FormField
            label="Fuel Consumed (Liters)"
            id="fuel_consumed"
            name="fuel_consumed"
            type="number"
            step="0.01"
            required
            value={completeFormData.fuel_consumed}
            onChange={(e) => setCompleteFormData(prev => ({ ...prev, fuel_consumed: e.target.value }))}
            placeholder="e.g. 15.50"
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <Button variant="secondary" onClick={() => setIsCompleteModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="success" isLoading={completeMutation.isPending}>
              Complete Trip
            </Button>
          </div>
        </form>
      </Modal>

      {/* Cancel Confirmation Modal */}
      <Modal
        isOpen={isCancelModalOpen}
        onClose={() => setIsCancelModalOpen(false)}
        title="Confirm Trip Cancellation"
        size="md"
      >
        <div className="space-y-6">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-50 rounded-xl text-red-600 shrink-0">
              <XCircle className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-gray-900">Are you sure you want to cancel this trip?</h4>
              <p className="text-sm text-gray-500 mt-2">
                This will cancel Trip #{selectedTrip?.id} and free the vehicle ({selectedTrip?.vehicle?.registration_number}) and driver ({selectedTrip?.driver?.name}) back to Available status.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
            <Button variant="secondary" onClick={() => setIsCancelModalOpen(false)}>
              No, Keep Trip
            </Button>
            <Button 
              variant="danger" 
              onClick={handleCancelConfirm}
              isLoading={cancelMutation.isPending}
            >
              Yes, Cancel Trip
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

export default TripsPage
