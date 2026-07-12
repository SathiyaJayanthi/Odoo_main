import { useEffect, useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { listVehicles } from '../api/vehicles'
import { listDrivers } from '../api/drivers'
import { listMaintenance } from '../api/maintenance'
import { Truck, Users, Wrench, DollarSign } from 'lucide-react'

const Dashboard = () => {
  const { user } = useAuth()
  const [stats, setStats] = useState({
    vehiclesCount: 0,
    driversCount: 0,
    activeMaintenanceCount: 0,
    fuelCostTotal: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const vehicles = await listVehicles()
        const drivers = await listDrivers()
        const maintenance = await listMaintenance()
        
        const openMaint = maintenance.filter(m => m.status === 'Open').length

        setStats({
          vehiclesCount: vehicles.length,
          driversCount: drivers.length,
          activeMaintenanceCount: openMaint,
          fuelCostTotal: 1250.50 // mock baseline
        })
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const statCards = [
    { name: 'Total Vehicles', value: stats.vehiclesCount, icon: Truck, color: 'bg-blue-500/10 text-blue-600' },
    { name: 'Active Drivers', value: stats.driversCount, icon: Users, color: 'bg-emerald-500/10 text-emerald-600' },
    { name: 'Vehicles in Shop', value: stats.activeMaintenanceCount, icon: Wrench, color: 'bg-amber-500/10 text-amber-600' },
    { name: 'Monthly Fuel Expenses', value: `$${stats.fuelCostTotal.toFixed(2)}`, icon: DollarSign, color: 'bg-indigo-500/10 text-indigo-600' },
  ]

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome back, {user?.full_name || 'Manager'}!</h2>
        <p className="text-sm text-gray-500 mt-1">Here is a quick overview of your fleet operational metrics.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon
          return (
            <div key={card.name} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-shadow">
              <div className={`p-3.5 rounded-xl ${card.color} shrink-0`}>
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-400">{card.name}</p>
                <h4 className="text-2xl font-bold text-gray-800 mt-1">
                  {loading ? (
                    <span className="inline-block h-6 w-12 bg-gray-100 animate-pulse rounded" />
                  ) : (
                    card.value
                  )}
                </h4>
              </div>
            </div>
          )
        })}
      </div>

      {/* Hero section */}
      <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-2xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-xl space-y-4">
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/30 text-indigo-300 border border-indigo-500/20">
            System Operational
          </span>
          <h3 className="text-2xl font-bold">TransitOps Enterprise Control Panel</h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Manage your vehicles, coordinate available drivers, track real-time maintenance tickets, and monitor overall financial operational costs from a single central view.
          </p>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
