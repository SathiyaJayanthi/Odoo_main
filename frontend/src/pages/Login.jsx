import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Button from '../components/common/Button'
import FormField from '../components/common/FormField'

const Login = () => {
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  const demoCredentials = [
    { email: 'fleet_manager@demo.com', role: 'Fleet Manager' },
    { email: 'driver@demo.com', role: 'Driver' },
    { email: 'safety_officer@demo.com', role: 'Safety Officer' },
    { email: 'financial_analyst@demo.com', role: 'Financial Analyst' },
  ]

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    const result = await login(email, password)
    if (result.success) {
      toast.success('Welcome back!')
      navigate('/dashboard')
    } else {
      setError(result.error)
      toast.error(result.error)
    }
    setIsLoading(false)
  }

  const handleSelectDemo = (demoEmail) => {
    setEmail(demoEmail)
    setPassword('demopass123')
  }

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold text-white tracking-wider shadow-lg">
            TO
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TransitOps
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Sign in to your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Or select a demo profile below to auto-fill
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-800/40 backdrop-blur-md py-8 px-6 sm:px-10 border border-slate-700/50 shadow-2xl rounded-2xl space-y-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="bg-red-500/10 border border-red-500/25 rounded-xl p-3 text-sm text-red-400 font-medium">
                {error}
              </div>
            )}
            
            <FormField
              label="Email address"
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-white"
              placeholder="fleet_manager@demo.com"
            />

            <FormField
              label="Password"
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-white"
              placeholder="••••••••"
            />

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              className="w-full py-2.5 mt-2 shadow-lg shadow-indigo-600/25"
            >
              Sign In
            </Button>
          </form>

          {/* Demo Profiles Card */}
          <div className="border-t border-slate-700/50 pt-6">
            <span className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Demo Profiles
            </span>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => handleSelectDemo(cred.email)}
                  className="flex flex-col text-left p-2.5 rounded-xl border border-slate-700 hover:border-indigo-500 hover:bg-indigo-600/5 transition-all text-xs font-medium cursor-pointer focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <span className="text-white font-semibold">{cred.role}</span>
                  <span className="text-[10px] text-slate-400 truncate">{cred.email}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
