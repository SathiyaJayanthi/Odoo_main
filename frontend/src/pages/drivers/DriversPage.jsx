import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { listDrivers } from '../../api/drivers'
import Button from '../../components/common/Button'
import StatusBadge from '../../components/common/StatusBadge'
import CrudTable from '../../components/common/CrudTable'
import DriverFormModal from './DriverFormModal'
import { Plus, Filter, RefreshCw, Edit, AlertTriangle } from 'lucide-react'

const DriversPage = () => {
  const queryClient = useQueryClient()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedDriver, setSelectedDriver] = useState(null)
  
  // Filter States
  const [statusFilter, setStatusFilter] = useState('')

  const filters = {
    ...(statusFilter && { status: statusFilter })
  }

  // React Query Fetch
  const { data: drivers = [], isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['drivers', filters],
    queryFn: () => listDrivers(filters),
    keepPreviousData: true
  })

  const handleOpenRegister = () => {
    setSelectedDriver(null)
    setIsModalOpen(true)
  }

  const handleOpenEdit = (driver) => {
    setSelectedDriver(driver)
    setIsModalOpen(true)
  }

  const handleSaveSuccess = () => {
    queryClient.invalidateQueries({ queryKey: ['drivers'] })
    queryClient.invalidateQueries({ queryKey: ['dashboard'] })
  }

  // Check if a license is within 30 days of expiry
  const isExpiringSoon = (expiryDateStr) => {
    if (!expiryDateStr) return false
    const expiry = new Date(expiryDateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    expiry.setHours(0, 0, 0, 0)
    const diffTime = expiry - today
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    // Trigger if expiry is in the past (expired) or within the next 30 days
    return diffDays <= 30
  }

  // Define Columns
  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (row) => row.name
    },
    {
      key: 'license_number',
      header: 'License Number',
      render: (row) => (
        <span className="font-mono text-xs font-semibold text-gray-700 bg-gray-50 px-2 py-1 rounded-md border border-gray-200/50">
          {row.license_number}
        </span>
      )
    },
    {
      key: 'license_category',
      header: 'License Category',
      render: (row) => row.license_category
    },
    {
      key: 'license_expiry',
      header: 'License Expiry',
      render: (row) => {
        const expiringSoon = isExpiringSoon(row.license_expiry)
        return (
          <div className="flex items-center gap-2">
            <span>{row.license_expiry}</span>
            {expiringSoon && (
              <AlertTriangle 
                className="w-4 h-4 text-amber-500 shrink-0 hover:scale-110 transition-transform cursor-pointer"
                title="License is expired or expiring within 30 days"
              />
            )}
          </div>
        )
      }
    },
    {
      key: 'safety_score',
      header: 'Safety Score',
      render: (row) => {
        const score = parseFloat(row.safety_score)
        let color = 'text-emerald-600 bg-emerald-50'
        if (score < 80) color = 'text-red-600 bg-red-50'
        else if (score < 90) color = 'text-amber-600 bg-amber-50'

        return (
          <span className={`px-2 py-0.5 rounded font-bold text-xs ${color}`}>
            {score.toFixed(1)} / 100
          </span>
        )
      }
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

  const driverStatuses = ['Available', 'On Trip', 'Off Duty', 'Suspended']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Drivers Management</h2>
          <p className="text-sm text-gray-500 mt-1">Register, edit profiles, and track status/safety ratings of fleet operators.</p>
        </div>
        <Button
          variant="primary"
          onClick={handleOpenRegister}
          className="flex items-center justify-center gap-2 self-start sm:self-auto shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
        >
          <Plus className="w-4 h-4" />
          Register Driver
        </Button>
      </div>

      {/* Filter bar */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs flex flex-col sm:flex-row gap-4 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-gray-400 select-none px-1">
            <Filter className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">Filters</span>
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer"
          >
            <option value="">All Statuses</option>
            {driverStatuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
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

      {/* Table */}
      <CrudTable
        columns={columns}
        data={drivers}
        isLoading={isLoading}
        emptyMessage="No drivers registered yet"
        emptyIcon={
          <svg className="w-16 h-16 text-gray-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        }
      />

      {/* Form Modal */}
      <DriverFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        driver={selectedDriver}
        onSaveSuccess={handleSaveSuccess}
      />
    </div>
  )
}

export default DriversPage
