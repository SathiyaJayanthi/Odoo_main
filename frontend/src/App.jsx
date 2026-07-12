import { Routes, Route, Navigate } from 'react-router-dom'

function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<div className="p-8"><h1 className="text-2xl font-bold">Login Page (TODO)</h1></div>} />
        <Route path="/dashboard" element={<div className="p-8"><h1 className="text-2xl font-bold">Dashboard (TODO)</h1></div>} />
        <Route path="/vehicles/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Vehicles (TODO)</h1></div>} />
        <Route path="/drivers/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Drivers (TODO)</h1></div>} />
        <Route path="/trips/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Trips (TODO)</h1></div>} />
        <Route path="/maintenance/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Maintenance (TODO)</h1></div>} />
        <Route path="/finance/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Finance (TODO)</h1></div>} />
        <Route path="/reports/*" element={<div className="p-8"><h1 className="text-2xl font-bold">Reports (TODO)</h1></div>} />
      </Routes>
    </div>
  )
}

export default App
