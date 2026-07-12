import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Eye, EyeOff, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useToast } from "../context/ToastContext";
import Button from "../components/common/Button";
import FormField from "../components/common/FormField";
import { validateLoginForm } from "../utils/validation";

const Login = () => {
  const { login } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState("");
  const [hasInteracted, setHasInteracted] = useState(false);

  const demoCredentials = [
    { email: "fleet_manager@demo.com", role: "Fleet Manager" },
    { email: "driver@demo.com", role: "Driver" },
    { email: "safety_officer@demo.com", role: "Safety Officer" },
    { email: "financial_analyst@demo.com", role: "Financial Analyst" },
  ];

  const validationErrors = useMemo(() => validateLoginForm(form), [form]);
  const visibleErrors = hasInteracted ? validationErrors : {};
  const isFormValid =
    !validationErrors.email &&
    !validationErrors.password &&
    form.email.trim() &&
    form.password;

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

    setIsLoading(true);

    const result = await login(form.email.trim(), form.password);
    if (result.success) {
      toast.success("Welcome back!");
      navigate("/dashboard");
    } else {
      setServerError(result.error);
      toast.error(result.error);
    }
    setIsLoading(false);
  };

  const handleSelectDemo = async (demoEmail) => {
    setForm({ email: demoEmail, password: "demopass123" });
    setHasInteracted(true);
    setIsLoading(true);
    const result = await login(demoEmail, "demopass123");
    setIsLoading(false);
    if (result.success) {
      toast.success("Signed in as demo user");
      navigate("/dashboard");
    } else {
      setServerError(result.error);
      toast.error(result.error);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-[radial-gradient(circle_at_top_left,_rgba(99,102,241,0.24),_transparent_36%),linear-gradient(135deg,_#020617_0%,_#0f172a_50%,_#111827_100%)] flex flex-col justify-center py-8 sm:py-12 sm:px-6 lg:px-8 relative overflow-y-auto overflow-x-hidden no-scrollbar">
      <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none translate-x-1/2 translate-y-1/2" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md z-10">
        <div className="flex justify-center items-center gap-3">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center font-bold text-white tracking-wider shadow-lg shadow-indigo-600/30">
            TO
          </div>
          <span className="font-extrabold text-2xl tracking-tight text-white bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
            TransitOps
          </span>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Sign in to your workspace
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Secure access to the fleet dashboard and operations tools.
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md z-10 px-4">
        <div className="bg-slate-900/70 backdrop-blur-xl py-8 px-6 sm:px-10 border border-slate-800/80 shadow-2xl rounded-3xl space-y-6">
          <div className="flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-400 w-fit">
            <ShieldCheck className="h-4 w-4" />
            Protected by role-based access
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {serverError && (
              <div
                className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm font-medium text-red-400"
                aria-live="polite"
              >
                {serverError}
              </div>
            )}

            <FormField
              label="Email address"
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              value={form.email}
              onChange={handleChange}
              error={visibleErrors.email}
              className="text-white"
              placeholder="fleet_manager@demo.com"
            />

            <FormField
              label="Password"
              id="password"
              name="password"
              className="text-white"
              error={visibleErrors.password}
            >
              {({ id, className }) => (
                <div className="relative">
                  <input
                    id={id}
                    name="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete="current-password"
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

            <Button
              type="submit"
              variant="primary"
              isLoading={isLoading}
              disabled={!isFormValid}
              className="w-full py-2.5 mt-2 shadow-lg shadow-indigo-600/25"
            >
              <span className="flex items-center justify-center gap-2">
                Sign In
                <ArrowRight className="h-4 w-4" />
              </span>
            </Button>
          </form>

          <p className="mt-4 text-center text-xs text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              to="/signup"
              className="font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              Create one
            </Link>
          </p>

          <div className="border-t border-slate-700/50 pt-6">
            <div className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
              <Sparkles className="h-3.5 w-3.5" />
              Demo Profiles
            </div>
            <div className="grid grid-cols-2 gap-2">
              {demoCredentials.map((cred) => (
                <button
                  key={cred.email}
                  type="button"
                  onClick={() => handleSelectDemo(cred.email)}
                  className="flex flex-col text-left rounded-xl border border-slate-700 bg-slate-800/70 p-2.5 text-xs font-medium text-slate-300 transition-all hover:border-indigo-500 hover:bg-indigo-600/5 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                >
                  <span className="font-semibold text-white">{cred.role}</span>
                  <span className="truncate text-[10px] text-slate-400">
                    {cred.email}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
