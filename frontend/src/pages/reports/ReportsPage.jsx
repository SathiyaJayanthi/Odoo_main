import { useState, useEffect } from 'react'
import { Download, Activity, TrendingUp } from 'lucide-react'

export default function ReportsPage() {
  const [fuelData, setFuelData] = useState(null)
  const [roiData, setRoiData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('access_token')
        const headers = {
          'Authorization': `Bearer ${token}`
        }

        const [fuelRes, roiRes] = await Promise.all([
          fetch('http://127.0.0.1:8000/api/v1/reports/fuel-efficiency/', { headers }),
          fetch('http://127.0.0.1:8000/api/v1/reports/roi/', { headers })
        ])

        if (!fuelRes.ok || !roiRes.ok) {
          throw new Error('Failed to fetch reports')
        }

        const fuel = await fuelRes.json()
        const roi = await roiRes.json()

        setFuelData(fuel)
        setRoiData(roi)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    fetchReports()
  }, [])

  const handleExportCSV = () => {
    const token = localStorage.getItem('access_token')
    fetch('http://127.0.0.1:8000/api/v1/reports/export/?type=csv', {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Export failed')
        return res.blob()
      })
      .then(blob => {
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.style.display = 'none'
        a.href = url
        a.download = 'fleet_report.csv'
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
      })
      .catch(err => {
        alert('Failed to export CSV: ' + err.message)
      })
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-slate-500">Loading reports...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Fleet Reports</h2>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        >
          <Download className="h-4 w-4" />
          Export CSV
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fuel Efficiency Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-indigo-500" />
            <h3 className="text-base font-semibold text-slate-800">Fuel Efficiency</h3>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Efficiency (mpg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {fuelData && fuelData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{item.vehicle}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 text-right">{item.efficiency_mpg}</td>
                  </tr>
                ))}
                {(!fuelData || fuelData.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-slate-500">No fuel data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ROI Table */}
        <div className="overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
          <div className="border-b border-slate-200 bg-slate-50 px-6 py-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-emerald-500" />
            <h3 className="text-base font-semibold text-slate-800">Return on Investment (ROI)</h3>
          </div>
          <div className="p-0">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-white">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vehicle</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">ROI %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {roiData && roiData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-900">{item.vehicle}</td>
                    <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500 text-right">{item.roi_percentage}%</td>
                  </tr>
                ))}
                {(!roiData || roiData.length === 0) && (
                  <tr>
                    <td colSpan={2} className="px-6 py-4 text-center text-sm text-slate-500">No ROI data available.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
