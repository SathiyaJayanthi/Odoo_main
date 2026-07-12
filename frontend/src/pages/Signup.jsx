import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import Button from '../components/common/Button'
import FormField from '../components/common/FormField'
import { Truck } from 'lucide-react'

const roleOptions = [
  { label: 'Fleet Manager', value: 'fleet_manager' },
  { label: 'Driver', value: 'driver' },
  { label: 'Safety Officer', value: 'safety_officer' },
  { label: 'Financial Analyst', value: 'financial_analyst' },
]

export default function Signup() {
  const navigate = useNavigate()
  const { signup } = useAuth()
  const { toast } = useToast()
  
  const [form, setForm] = useState({
    email: '',
    password: '',
    full_name: '',
    role: 'fleet_manager',
  })
  
  const [errors, setErrors] = useState({})
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (error) setError('')
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')
    setErrors({})

    const res = await signup(form)
    if (res.success) {
      toast.success('Account created successfully. You can log in now!')
      navigate('/login', { replace: true })
    } else {
      setError(res.error)
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background radial highlights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-600/30">
            <Truck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Get started with TransitOps fleet control
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="bg-slate-900 py-8 px-4 border border-slate-800 shadow-xl rounded-3xl sm:px-10">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <FormField
              label="Full Name"
              id="full_name"
              name="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={handleChange}
              error={errors.full_name}
              placeholder="e.g. Alex Fernandes"
            />

            <FormField
              label="Email Address"
              id="email"
              name="email"
              type="email"
              required
              value={form.email}
              onChange={handleChange}
              error={errors.email}
              placeholder="you@example.com"
            />

            <FormField
              label="Password"
              id="password"
              name="password"
              type="password"
              required
              value={form.password}
              onChange={handleChange}
              error={errors.password}
              placeholder="••••••••"
            />

            <FormField
              label="Role"
              id="role"
              name="role"
              required
              error={errors.role}
            >
              {({ id, className }) => (
                <select
                  id={id}
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className={`${className} bg-slate-950 text-slate-300 border-slate-800`}
                >
                  {roleOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              )}
            </FormField>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold p-3.5 rounded-xl">
                {error}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full flex justify-center py-2.5 shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
              isLoading={isSubmitting}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
