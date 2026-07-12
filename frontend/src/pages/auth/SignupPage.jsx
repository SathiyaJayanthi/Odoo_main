import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { LoaderCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { Button } from "../../components/shared/Button";
import { FormField } from "../../components/shared/FormField";
import { useToast } from "../../components/shared/Toast";

const roleOptions = [
  { label: "Fleet Manager", value: "fleet_manager" },
  { label: "Driver", value: "driver" },
  { label: "Safety Officer", value: "safety_officer" },
  { label: "Financial Analyst", value: "financial_analyst" },
];

export default function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const { pushToast } = useToast();
  const [form, setForm] = useState({
    email: "",
    password: "",
    full_name: "",
    role: "fleet_manager",
  });
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((previous) => ({ ...previous, [name]: value }));
    if (error) {
      setError("");
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsSubmitting(true);
    setError("");

    try {
      await signup(form);
      pushToast("Account created. You can sign in now.", "success");
      navigate("/login", { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        "Unable to create your account right now.";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-background)] px-4 py-10">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-[var(--color-primary)]">
            TransitOps
          </p>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">
            Create account
          </h1>
          <p className="text-sm text-slate-600">
            Set up your account to manage transit operations.
          </p>
        </div>

        <form className="space-y-4" onSubmit={handleSubmit}>
          <FormField
            label="Email"
            name="email"
            type="email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            required
          />
          <FormField
            label="Password"
            name="password"
            type="password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            required
          />
          <FormField
            label="Full name"
            name="full_name"
            type="text"
            autoComplete="name"
            value={form.full_name}
            onChange={handleChange}
            required
          />

          <label className="block space-y-1">
            <span className="text-sm font-medium text-slate-700">Role</span>
            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[var(--color-primary)]"
            >
              {roleOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          {error ? (
            <p
              className="rounded-md border border-[var(--color-danger)]/20 bg-[var(--color-danger)]/10 px-3 py-2 text-sm text-[var(--color-danger)]"
              aria-live="polite"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <span className="flex items-center justify-center gap-2">
                <LoaderCircle className="h-4 w-4 animate-spin" />
                Creating account...
              </span>
            ) : (
              "Create account"
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[var(--color-primary)] hover:underline"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
