import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Eye, EyeOff, ShieldCheck, Truck } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import { getPasswordStrength, validateSignupForm } from "../utils/validation";

const roleOptions = [
  { label: "Fleet Manager", value: "fleet_manager" },
  { label: "Driver", value: "driver" },
  { label: "Safety Officer", value: "safety_officer" },
  { label: "Financial Analyst", value: "financial_analyst" },
];

export default function Signup() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { toast } = useToast();

  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "fleet_manager",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [hasInteracted, setHasInteracted] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validationErrors = useMemo(() => validateSignupForm(form), [form]);
  const visibleErrors = hasInteracted ? validationErrors : {};
  const passwordStrength = useMemo(
    () => getPasswordStrength(form.password),
    [form.password],
  );
  const isFormValid =
    !validationErrors.full_name &&
    !validationErrors.email &&
    !validationErrors.password &&
    !validationErrors.role &&
    form.full_name.trim() &&
    form.email.trim() &&
    form.password &&
    form.role;

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    setHasInteracted(true);
    if (serverError) setServerError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setHasInteracted(true);
    setServerError("");

    if (!isFormValid) {
      return;
    }

    setIsSubmitting(true);

    const res = await signup({
      ...form,
      email: form.email.trim(),
      full_name: form.full_name.trim(),
    });

    if (res.success) {
      toast.success("Account created successfully. You can log in now!");
      navigate("/login", { replace: true });
    } else {
      setServerError(res.error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.26),_transparent_36%),linear-gradient(135deg,_#020617_0%,_#0f172a_45%,_#111827_100%)] flex flex-col justify-center py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="flex justify-center">
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 p-3 shadow-lg shadow-indigo-600/30">
            <Truck className="h-8 w-8 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Create your account
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Join TransitOps with secure identity and role-based access.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <div className="rounded-3xl border border-slate-800/80 bg-slate-900/70 py-8 px-4 shadow-2xl backdrop-blur-xl sm:px-10">
          <div className="mb-5 flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 w-fit">
            <ShieldCheck className="h-4 w-4" />
            Strong validation for every signup
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <FormField
              label="Full Name"
              id="full_name"
              name="full_name"
              type="text"
              required
              value={form.full_name}
              onChange={handleChange}
              error={visibleErrors.full_name}
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
              error={visibleErrors.email}
              placeholder="you@example.com"
            />

            <FormField
              label="Password"
              id="password"
              name="password"
              error={visibleErrors.password}
            >
              {({ id, className }) => (
                <div className="relative">
                  <input
                    id={id}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    required
                    value={form.password}
                    onChange={handleChange}
                    placeholder="••••••••"
                    className={`${className} pr-12`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((previous) => !previous)}
                    className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-200"
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              )}
            </FormField>

            {form.password ? (
              <div className="space-y-2 rounded-xl border border-slate-800 bg-slate-950/70 p-3">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span>Password strength</span>
                  <span className={`font-semibold ${passwordStrength.text}`}>
                    {passwordStrength.label}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
                  <div
                    className={`h-full rounded-full ${passwordStrength.color}`}
                    style={{ width: `${(passwordStrength.score / 5) * 100}%` }}
                  />
                </div>
                <ul className="mt-2 space-y-1 text-xs text-slate-400">
                  <li>• 8+ characters</li>
                  <li>• Uppercase and lowercase letters</li>
                  <li>• At least one number</li>
                </ul>
              </div>
            ) : null}

            <FormField
              label="Role"
              id="role"
              name="role"
              error={visibleErrors.role}
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

            {serverError && (
              <div
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-400"
                aria-live="polite"
              >
                {serverError}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              className="w-full flex justify-center py-2.5 shadow-md shadow-indigo-600/10 focus-visible:ring-2 focus-visible:ring-indigo-500"
              isLoading={isSubmitting}
              disabled={!isFormValid}
            >
              Create Account
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-400">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
