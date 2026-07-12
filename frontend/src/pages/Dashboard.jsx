import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { getDashboardStats, getROI, downloadCSVReport } from '../api/reports'
import { listVehicles } from '../api/vehicles'
import { Truck, Users, Wrench, BarChart3, Download, RefreshCw, Layers, TrendingUp } from 'lucide-react'
import { useToast } from '../context/ToastContext'
import Button from '../components/common/Button'
import CrudTable from '../components/common/CrudTable'

const Dashboard = () => {
  const { user } = useAuth()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isExporting, setIsExporting] = useState(false)

  // Fetch dashboard KPIs
  const { data: stats = {}, isLoading, isRefetching, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: getDashboardStats,
    refetchOnWindowFocus: true
  })

  // Fetch ROI/Vehicle lookup lists for Financial Analyst role
  const isAnalyst = user?.role === 'financial_analyst'
  const isManager = user?.role === 'fleet_manager'
  const canExport = isAnalyst || isManager

  const { data: roiList = [], isLoading: isLoadingRoi } = useQuery({
    queryKey: ['reports-roi'],
    queryFn: getROI,
    enabled: isAnalyst
  })

  const { data: vehiclesList = [] } = useQuery({
    queryKey: ['vehicles'],
    queryFn: listVehicles,
    enabled: isAnalyst
  })

  const handleExportCSV = async () => {
    setIsExporting(true)
    try {
      const blobData = await downloadCSVReport()
      const url = window.URL.createObjectURL(new Blob([blobData]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', 'transitops_operations_report.csv')
      document.body.appendChild(link)
      link.click()
      link.parentNode.removeChild(link)
      toast.success('CSV Report downloaded successfully!')
    } catch (err) {
      console.error('Failed to export CSV report:', err)
      toast.error('Failed to export report CSV.')
    } finally {
      setIsExporting(false)
    }
  }

  const statCards = [
    { 
      name: 'Available Vehicles', 
      value: stats.available_vehicles ?? 0, 
      sub: `out of ${stats.active_vehicles ?? 0} active`,
      icon: Truck, 
      color: 'bg-blue-500/10 text-blue-600 border-blue-500/5 border' 
    },
    { 
      name: 'Active Trips', 
      value: stats.active_trips ?? 0, 
      sub: `${stats.pending_trips ?? 0} draft / queued`,
      icon: Layers, 
      color: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/5 border' 
    },
    { 
      name: 'Vehicles in Shop', 
      value: stats.in_maintenance ?? 0, 
      sub: 'requires review',
      icon: Wrench, 
      color: 'bg-amber-500/10 text-amber-600 border-amber-500/5 border' 
    },
    { 
      name: 'Fleet Utilization', 
      value: `${stats.fleet_utilization_pct ?? 0}%`, 
      sub: 'on-trip vs active',
      icon: TrendingUp, 
      color: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/5 border' 
    },
  ]

  // Combine ROI details with vehicle list for names/registrations
  const combinedRoiData = roiList.map(roi => {
    const matchingVeh = vehiclesList.find(v => v.id === roi.vehicle_id)
    return {
      ...roi,
      registration_number: matchingVeh?.registration_number || `ID ${roi.vehicle_id}`,
      name_model: matchingVeh?.name_model || 'Unknown Vehicle'
    }
  })

  const roiColumns = [
    {
      key: 'registration',
      header: 'Vehicle Model',
      render: (row) => (
        <div>
          <p className="font-semibold text-gray-800">{row.name_model}</p>
          <span className="font-mono text-xs text-gray-400 bg-gray-50 border px-1.5 py-0.5 rounded-sm">
            {row.registration_number}
          </span>
        </div>
      )
    },
    {
      key: 'revenue',
      header: 'Total Revenue',
      render: (row) => `$${parseFloat(row.revenue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'cost',
      header: 'Total Cost',
      render: (row) => `$${parseFloat(row.cost).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
    },
    {
      key: 'roi_pct',
      header: 'ROI Percentage',
      render: (row) => {
        const pct = parseFloat(row.roi_pct)
        const isPositive = pct >= 0
        return (
          <span className={`font-bold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
            {isPositive ? '+' : ''}{pct.toFixed(1)}%
          </span>
        )
      }
    }
  ]

  const getRoleLabel = (r) => {
    const roles = {
      fleet_manager: 'Fleet Manager',
      driver: 'Driver',
      safety_officer: 'Safety Officer',
      financial_analyst: 'Financial Analyst'
    }
    return roles[r] || r
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back, {user?.full_name || 'User'}!</h2>
          <p className="text-sm text-gray-500 mt-1">Logged in as: <span className="font-semibold text-indigo-600">{getRoleLabel(user?.role)}</span></p>
        </div>
        <button
          onClick={() => {
            refetch()
            if (isAnalyst) queryClient.invalidateQueries({ queryKey: ['reports-roi'] })
          }}
          disabled={isLoading || isRefetching}
          className="flex items-center justify-center gap-2 p-2.5 rounded-xl border border-gray-100 bg-white hover:bg-slate-50 text-gray-500 hover:text-gray-700 transition-all font-semibold text-xs cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isRefetching ? 'animate-spin' : ''}`} />
          Refresh Stats
        </button>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs flex items-center gap-5 hover:shadow-md transition-all">
              <div className={`p-3.5 rounded-xl ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-400 truncate">{card.name}</p>
                <h4 className="text-2xl font-bold text-gray-800 mt-0.5">
                  {isLoading ? (
                    <span className="inline-block h-6 w-12 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    card.value
                  )}
                </h4>
                <p className="text-xs text-gray-400 mt-0.5 font-medium truncate">{card.sub}</p>
              </div>
            </div>
          )
        })}
      </div>

      {/* Bottom Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Operations Hub / Seed Summary */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between min-h-[300px]">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
            <div className="relative z-10 space-y-4">
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-500/20">
                System Status: Online
              </span>
              <h3 className="text-xl font-bold">TransitOps Enterprise Panel</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Coordinate vehicles, track active driver duty statuses, audit maintenance shop logs, and monitor overall ROI yields.
              </p>
            </div>
            
            <div className="relative z-10 pt-4 border-t border-slate-700/50 flex flex-col gap-1 text-[11px] text-slate-400">
              <p>Host URL: http://localhost:8000</p>
              <p>JWT Session State: Connected</p>
              <p>Client Interface: React 19 / Vite</p>
            </div>
          </div>

          {/* Export Action Card */}
          {canExport && (
            <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-gray-900 text-sm">Reports Center</h4>
                  <p className="text-xs text-gray-400 mt-0.5">Generate spreadsheet format exports</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 leading-relaxed">
                Downloads an updated operational CSV spreadsheet including distance metrics, fuel consumption, raw revenues, and ROI indicators per vehicle.
              </p>
              <Button
                variant="primary"
                className="w-full flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-indigo-500"
                onClick={handleExportCSV}
                isLoading={isExporting}
              >
                <Download className="w-4 h-4" />
                Export CSV Report
              </Button>
            </div>
          )}
        </div>

        {/* Financial Analyst ROI Table */}
        {isAnalyst && (
          <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-gray-100 shadow-xs space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-base font-bold text-gray-900">Vehicle Return on Investment (ROI)</h3>
                <p className="text-xs text-gray-500 mt-0.5">Live ROI computed relative to trip counts ($2,000/trip) and maintenance costs</p>
              </div>
              <TrendingUp className="w-5 h-5 text-indigo-500 shrink-0" />
            </div>

            <CrudTable
              columns={roiColumns}
              data={combinedRoiData}
              isLoading={isLoadingRoi}
              emptyMessage="No financial ROI data available"
            />
          </div>
        )}

      </div>
    </div>
  )
}

export default Dashboard
