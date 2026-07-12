import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listVehicles } from '../../api/vehicles'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import CrudTable from '../../components/common/CrudTable'
import VehicleFormModal from './VehicleFormModal'
import { Plus, Filter, RefreshCw, Edit } from 'lucide-react'

const VehiclesPage = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedVehicle, setSelectedVehicle] = useState(null)
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')

  const filters = {
    ...(statusFilter && { status: statusFilter }),
    ...(typeFilter && { type: typeFilter })
  }

  // React Query Fetch
  const { data: vehicles = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['vehicles', filters],
    queryFn: () => listVehicles(filters),
    keepPreviousData: true
  })

  const handleOpenRegister = () => {
    setSelectedVehicle(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (vehicle) => {
    setSelectedVehicle(vehicle)
    setIsModalOpen(true)
  }

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['vehicles'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // Define Table Columns
  const columns = [
    {
      key: 'registration_number',
      header: 'Reg. Number',
      render: (row) => (
        <span className="font-mono font-semibold text-gray-900 bg-gray-100/60 px-2.5 py-1 rounded-md border border-gray-200/50">
          {row.registration_number}
        </span>
      )
    },
    {
      key: 'name_model',
      header: 'Model',
      render: (row) => row.name_model
    },
    {
      key: 'type',
      header: 'Type',
      render: (row) => row.type
    },
    {
      key: 'max_load_capacity',
      header: 'Capacity (Tons)',
      render: (row) => `${parseFloat(row.max_load_capacity).toFixed(2)}`
    },
    {
      key: 'odometer',
      header: 'Odometer (km)',
      render: (row) => `${parseFloat(row.odometer).toLocaleString()} km`
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <Button
          variant="secondary"
          size="sm"
          className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
          onClick={() => handleOpenEdit(row)}
        >
          <Edit className="w-3.5 h-3.5" />
          Edit
        </Button>
      )
    }
  ]

  const vehicleTypes = ['Van', 'Truck', 'Semi-Trailer', 'Flatbed', 'Refrigerator', 'Box Truck']
  const vehicleStatuses = ['Available', 'On Trip', 'In Shop', 'Retired']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Vehicles Management</h2>
          <p className="text-sm text-gray-500 mt-1">Register, monitor, and configure all fleet transport vehicles.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenRegister}
          className="flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Register Vehicle
        </Button>
      </div>

      {/* Filter and controls bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center flex-1">
          <div className="flex items-center gap-2 text-gray-400 select-none px-1">
            <Filter className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-3 flex-1">
            {/* Status Select */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Statuses</option>
              {vehicleStatuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>

            {/* Type Select */}
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
            >
              <option value="">All Types</option>
              {vehicleTypes.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={() => refetch()}
          disabled={isLoading || isRefetching}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 text-gray-500 hover:text-gray-700 transition-all font-semibold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50"
          title="Refresh table data"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Vehicles Table / Grid */}
      <CrudTable
        columns={columns}
        data={vehicles}
        isLoading={isLoading}
        emptyMessage="No vehicles registered yet"
        emptyIcon={
          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2h14a2 2 0 002-2zM5 18h14M8 10h1M8 14h1M12 10h1M12 14h1" />
          </svg>
        }
      />

      {/* Create / Edit Form Modal */}
      <VehicleFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        vehicle={selectedVehicle}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  )
}

export default VehiclesPage
