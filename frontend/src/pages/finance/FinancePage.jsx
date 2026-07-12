import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { 
  listFuelLogs, 
  createFuelLog, 
  listExpenses, 
  createExpense, 
  getCostSummary 
} from '../../api/finance'
import { listVehicles } from '../../api/vehicles'
import { useToast } from '../../context/ToastContext'
import Button from '../../components/common/Button'
import FormField from '../../components/common/FormField'
import CrudTable from '../../components/common/CrudTable'
import Modal from '../../components/common/Modal'
import { 
  DollarSign, 
  Plus, 
  Filter, 
  RefreshCw, 
  TrendingUp, 
  Droplet, 
  Wrench, 
  Calculator 
} from 'lucide-react'

const FinancePage = () => {
  const queryClient = useQueryClient()
  const { toast } = useToast()
  
  // Navigation & Filtering
  const [activeTab, setActiveTab] = useState('fuel') // 'fuel' or 'expenses'
  const [selectedVehicleId, setSelectedVehicleId] = useState('')

  // Modals state
  const [isFuelModalOpen, setIsFuelModalOpen] = useState(false)
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false)

  // Form states
  const [fuelFormData, setFuelFormData] = useState({
    vehicle_id: '',
    trip_id: '',
    liters: '',
    cost: '',
    log_date: new Date().toISOString().split('T')[0]
  })
  const [expenseFormData, setExpenseFormData] = useState({
    vehicle_id: '',
    category: 'Tolls',
    amount: '',
    expense_date: new Date().toISOString().split('T')[0],
    note: ''
  })

  const [fuelErrors, setFuelErrors] = useState({})
  const [expenseErrors, setExpenseErrors] = useState({})

  // Queries
  const { data: vehicles = [] } = useQuery({
    queryKey: ['vehicles-for-finance'],
    queryFn: () => listVehicles(),
  })

  const { data: fuelLogs = [], isLoading: isFuelLoading, refetch: refetchFuel } = useQuery({
    queryKey: ['fuel-logs', selectedVehicleId],
    queryFn: () => listFuelLogs({ ...(selectedVehicleId && { vehicle_id: selectedVehicleId }) }),
  })

  const { data: expenses = [], isLoading: isExpenseLoading, refetch: refetchExpenses } = useQuery({
    queryKey: ['expenses', selectedVehicleId],
    queryFn: () => listExpenses({ ...(selectedVehicleId && { vehicle_id: selectedVehicleId }) }),
  })

  const { data: costSummary, isLoading: isCostLoading } = useQuery({
    queryKey: ['cost-summary', selectedVehicleId],
    queryFn: () => getCostSummary(selectedVehicleId),
    enabled: !!selectedVehicleId,
  })

  // Mutations
  const addFuelMutation = useMutation({
    mutationFn: createFuelLog,
    onSuccess: () => {
      toast.success('Fuel log entry registered')
      setIsFuelModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] })
      if (selectedVehicleId) {
        queryClient.invalidateQueries({ queryKey: ['cost-summary', selectedVehicleId] })
      }
    },
    onError: (err) => {
      console.error('Error adding fuel log:', err)
      const errs = err.response?.data || {}
      setFuelErrors(errs)
      toast.error(err.response?.data?.error?.message || 'Failed to register fuel log')
    }
  })

  const addExpenseMutation = useMutation({
    mutationFn: createExpense,
    onSuccess: () => {
      toast.success('Expense entry registered')
      setIsExpenseModalOpen(false)
      queryClient.invalidateQueries({ queryKey: ['expenses'] })
      if (selectedVehicleId) {
        queryClient.invalidateQueries({ queryKey: ['cost-summary', selectedVehicleId] })
      }
    },
    onError: (err) => {
      console.error('Error adding expense:', err)
      const errs = err.response?.data || {}
      setExpenseErrors(errs)
      toast.error(err.response?.data?.error?.message || 'Failed to register expense')
    }
  })

  // Handlers
  const handleOpenFuelModal = () => {
    setFuelErrors({})
    setFuelFormData({
      vehicle_id: selectedVehicleId || (vehicles[0]?.id || ''),
      trip_id: '',
      liters: '',
      cost: '',
      log_date: new Date().toISOString().split('T')[0]
    })
    setIsFuelModalOpen(true)
  }

  const handleOpenExpenseModal = () => {
    setExpenseErrors({})
    setExpenseFormData({
      vehicle_id: selectedVehicleId || (vehicles[0]?.id || ''),
      category: 'Tolls',
      amount: '',
      expense_date: new Date().toISOString().split('T')[0],
      note: ''
    })
    setIsExpenseModalOpen(true)
  }

  const handleFuelSubmit = (e) => {
    e.preventDefault()
    setFuelErrors({})
    addFuelMutation.mutate({
      vehicle_id: parseInt(fuelFormData.vehicle_id),
      trip_id: fuelFormData.trip_id ? parseInt(fuelFormData.trip_id) : null,
      liters: parseFloat(fuelFormData.liters),
      cost: parseFloat(fuelFormData.cost),
      log_date: fuelFormData.log_date
    })
  }

  const handleExpenseSubmit = (e) => {
    e.preventDefault()
    setExpenseErrors({})
    addExpenseMutation.mutate({
      vehicle_id: parseInt(expenseFormData.vehicle_id),
      category: expenseFormData.category,
      amount: parseFloat(expenseFormData.amount),
      expense_date: expenseFormData.expense_date,
      note: expenseFormData.note
    })
  }

  // Utilities
  const getVehicleReg = (vId) => {
    const v = vehicles.find((item) => item.id === vId)
    return v ? `${v.name_model} (${v.registration_number})` : `ID: ${vId}`
  }

  // Table definitions
  const fuelColumns = [
    {
      key: 'log_date',
      header: 'Log Date',
      render: (row) => row.log_date
    },
    {
      key: 'vehicle_id',
      header: 'Vehicle',
      render: (row) => getVehicleReg(row.vehicle_id)
    },
    {
      key: 'liters',
      header: 'Liters',
      render: (row) => `${parseFloat(row.liters).toFixed(2)} L`
    },
    {
      key: 'cost',
      header: 'Cost',
      render: (row) => `$${parseFloat(row.cost).toFixed(2)}`
    },
    {
      key: 'trip_id',
      header: 'Trip ID',
      render: (row) => row.trip_id || '—'
    }
  ]

  const expenseColumns = [
    {
      key: 'expense_date',
      header: 'Expense Date',
      render: (row) => row.expense_date
    },
    {
      key: 'vehicle_id',
      header: 'Vehicle',
      render: (row) => getVehicleReg(row.vehicle_id)
    },
    {
      key: 'category',
      header: 'Category',
      render: (row) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
          {row.category}
        </span>
      )
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => `$${parseFloat(row.amount).toFixed(2)}`
    },
    {
      key: 'note',
      header: 'Note',
      render: (row) => row.note || '—'
    }
  ]

  const expenseCategories = ['Tolls', 'Insurance', 'Taxes', 'Permits', 'Service', 'Other']

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Finance Operations</h2>
          <p className="text-sm text-gray-500 mt-1">Track fuel logs, operational expenses, and view total cost summaries.</p>
        </div>
      </div>

      {/* Vehicle Filter Select for Cost Summary */}
      <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="flex items-center gap-2 text-gray-400 select-none px-1">
            <Filter className="w-4 h-4 shrink-0" />
            <span className="text-xs font-semibold uppercase tracking-wider">Select Vehicle for Cost Summary</span>
          </div>
          <select
            value={selectedVehicleId}
            onChange={(e) => setSelectedVehicleId(e.target.value)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 cursor-pointer max-w-md"
          >
            <option value="">Choose a Vehicle...</option>
            {vehicles.filter(v => v.status !== 'Retired').map((v) => (
              <option key={v.id} value={v.id}>
                {v.name_model} ({v.registration_number})
              </option>
            ))}
          </select>
        </div>

        {/* Cost Summary Card */}
        {selectedVehicleId && (
          <div className="pt-4 border-t border-gray-50 animate-in fade-in slide-in-from-top-2 duration-300">
            {isCostLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((n) => (
                  <div key={n} className="h-28 bg-gray-50 animate-pulse rounded-2xl border border-gray-100" />
                ))}
              </div>
            ) : costSummary ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Calculator className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wider">
                    Cost Summary for {getVehicleReg(parseInt(selectedVehicleId))}
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Fuel Total */}
                  <div className="bg-gradient-to-br from-indigo-50/40 to-indigo-50/10 p-5 rounded-2xl border border-indigo-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-indigo-500 uppercase tracking-wider">Fuel Total</span>
                      <h4 className="text-xl font-bold text-indigo-900 mt-1">${parseFloat(costSummary.fuel_total).toFixed(2)}</h4>
                    </div>
                    <div className="p-3 bg-indigo-500/10 text-indigo-600 rounded-xl">
                      <Droplet className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Maintenance Total */}
                  <div className="bg-gradient-to-br from-emerald-50/40 to-emerald-50/10 p-5 rounded-2xl border border-emerald-100 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-semibold text-emerald-500 uppercase tracking-wider">Maintenance Total</span>
                      <h4 className="text-xl font-bold text-emerald-900 mt-1">${parseFloat(costSummary.maintenance_total).toFixed(2)}</h4>
                    </div>
                    <div className="p-3 bg-emerald-500/10 text-emerald-600 rounded-xl">
                      <Wrench className="w-5 h-5" />
                    </div>
                  </div>

                  {/* Operational Cost */}
                  <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-5 rounded-2xl border border-slate-700 flex items-center justify-between shadow-lg text-white">
                    <div>
                      <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Operational Cost</span>
                      <h4 className="text-xl font-bold text-white mt-1">${parseFloat(costSummary.operational_cost).toFixed(2)}</h4>
                    </div>
                    <div className="p-3 bg-white/10 text-white rounded-xl">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Tabs & Add Action bar */}
      <div className="border-b border-gray-200 bg-white px-6 py-4 rounded-t-2xl border-x border-t border-gray-100 shadow-2xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Tabs */}
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('fuel')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'fuel' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Fuel Logs
          </button>
          <button
            onClick={() => setActiveTab('expenses')}
            className={`pb-2 text-sm font-bold border-b-2 transition-all cursor-pointer ${
              activeTab === 'expenses' 
                ? 'border-indigo-600 text-indigo-600' 
                : 'border-transparent text-gray-400 hover:text-gray-600'
            }`}
          >
            Expenses
          </button>
        </div>

        {/* Add Actions */}
        <div className="flex items-center gap-3">
          {activeTab === 'fuel' ? (
            <Button
              variant="primary"
              onClick={handleOpenFuelModal}
              className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Plus className="w-4 h-4" />
              Add Fuel Entry
            </Button>
          ) : (
            <Button
              variant="primary"
              onClick={handleOpenExpenseModal}
              className="flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-indigo-500"
            >
              <Plus className="w-4 h-4" />
              Add Expense Entry
            </Button>
          )}

          <button
            onClick={() => activeTab === 'fuel' ? refetchFuel() : refetchExpenses()}
            className="p-2.5 rounded-xl border border-gray-100 hover:bg-slate-50 text-gray-400 hover:text-gray-600 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
            title="Refresh current list"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Lists */}
      <div className="bg-white rounded-b-2xl border-x border-b border-gray-100 p-6 shadow-xs min-h-[300px]">
        {activeTab === 'fuel' ? (
          <CrudTable
            columns={fuelColumns}
            data={fuelLogs}
            isLoading={isFuelLoading}
            emptyMessage={selectedVehicleId ? "No fuel logs recorded for this vehicle" : "No fuel logs registered yet"}
            emptyIcon={<Droplet className="w-12 h-12 text-gray-300 mb-3" />}
          />
        ) : (
          <CrudTable
            columns={expenseColumns}
            data={expenses}
            isLoading={isExpenseLoading}
            emptyMessage={selectedVehicleId ? "No expenses recorded for this vehicle" : "No expenses registered yet"}
            emptyIcon={<DollarSign className="w-12 h-12 text-gray-300 mb-3" />}
          />
        )}
      </div>

      {/* Add Fuel Entry Modal */}
      <Modal
        isOpen={isFuelModalOpen}
        onClose={() => setIsFuelModalOpen(false)}
        title="Record Fuel Log Entry"
        size="md"
      >
        <form onSubmit={handleFuelSubmit} className="space-y-4">
          <FormField
            label="Vehicle"
            id="fuel_vehicle_id"
            name="vehicle_id"
            required
            error={fuelErrors.vehicle_id}
          >
            {({ id, className }) => (
              <select
                id={id}
                className={className}
                value={fuelFormData.vehicle_id}
                onChange={(e) => setFuelFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
              >
                <option value="" disabled>Select vehicle</option>
                {vehicles.filter(v => v.status !== 'Retired').map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name_model} ({v.registration_number})
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Trip ID (Optional)"
            id="fuel_trip_id"
            name="trip_id"
            type="number"
            value={fuelFormData.trip_id}
            onChange={(e) => setFuelFormData(prev => ({ ...prev, trip_id: e.target.value }))}
            error={fuelErrors.trip_id}
            placeholder="e.g. 5"
          />

          <FormField
            label="Fuel Liters (L)"
            id="fuel_liters"
            name="liters"
            type="number"
            step="0.01"
            required
            value={fuelFormData.liters}
            onChange={(e) => setFuelFormData(prev => ({ ...prev, liters: e.target.value }))}
            error={fuelErrors.liters}
            placeholder="e.g. 45.5"
          />

          <FormField
            label="Cost ($)"
            id="fuel_cost"
            name="cost"
            type="number"
            step="0.01"
            required
            value={fuelFormData.cost}
            onChange={(e) => setFuelFormData(prev => ({ ...prev, cost: e.target.value }))}
            error={fuelErrors.cost}
            placeholder="e.g. 75.00"
          />

          <FormField
            label="Log Date"
            id="fuel_log_date"
            name="log_date"
            type="date"
            required
            value={fuelFormData.log_date}
            onChange={(e) => setFuelFormData(prev => ({ ...prev, log_date: e.target.value }))}
            error={fuelErrors.log_date}
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <Button variant="secondary" onClick={() => setIsFuelModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addFuelMutation.isPending}>
              Add Fuel Log
            </Button>
          </div>
        </form>
      </Modal>

      {/* Add Expense Entry Modal */}
      <Modal
        isOpen={isExpenseModalOpen}
        onClose={() => setIsExpenseModalOpen(false)}
        title="Record Expense Entry"
        size="md"
      >
        <form onSubmit={handleExpenseSubmit} className="space-y-4">
          <FormField
            label="Vehicle"
            id="expense_vehicle_id"
            name="vehicle_id"
            required
            error={expenseErrors.vehicle_id}
          >
            {({ id, className }) => (
              <select
                id={id}
                className={className}
                value={expenseFormData.vehicle_id}
                onChange={(e) => setExpenseFormData(prev => ({ ...prev, vehicle_id: e.target.value }))}
              >
                <option value="" disabled>Select vehicle</option>
                {vehicles.filter(v => v.status !== 'Retired').map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name_model} ({v.registration_number})
                  </option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Expense Category"
            id="expense_category"
            name="category"
            required
            error={expenseErrors.category}
          >
            {({ id, className }) => (
              <select
                id={id}
                className={className}
                value={expenseFormData.category}
                onChange={(e) => setExpenseFormData(prev => ({ ...prev, category: e.target.value }))}
              >
                {expenseCategories.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            )}
          </FormField>

          <FormField
            label="Amount ($)"
            id="expense_amount"
            name="amount"
            type="number"
            step="0.01"
            required
            value={expenseFormData.amount}
            onChange={(e) => setExpenseFormData(prev => ({ ...prev, amount: e.target.value }))}
            error={expenseErrors.amount}
            placeholder="e.g. 15.00"
          />

          <FormField
            label="Expense Date"
            id="expense_date"
            name="expense_date"
            type="date"
            required
            value={expenseFormData.expense_date}
            onChange={(e) => setExpenseFormData(prev => ({ ...prev, expense_date: e.target.value }))}
            error={expenseErrors.expense_date}
          />

          <FormField
            label="Note / Description"
            id="expense_note"
            name="note"
            value={expenseFormData.note}
            onChange={(e) => setExpenseFormData(prev => ({ ...prev, note: e.target.value }))}
            error={expenseErrors.note}
            placeholder="e.g. Highway toll payment"
          />

          <div className="flex justify-end gap-3 border-t border-gray-100 pt-4 mt-6">
            <Button variant="secondary" onClick={() => setIsExpenseModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={addExpenseMutation.isPending}>
              Add Expense Log
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}

export default FinancePage
