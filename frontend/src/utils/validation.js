const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(value) {
  const email = value.trim();

  if (!email) {
    return "Email is required.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    return "Enter a valid email address.";
  }

  return "";
}

export function validateFullName(value) {
  const fullName = value.trim();

  if (!fullName) {
    return "Full name is required.";
  }

  if (fullName.length < 2) {
    return "Full name must be at least 2 characters.";
  }

  if (!/^[A-Za-zÀ-ÖØ-öø-ÿ\s.'-]+$/.test(fullName)) {
    return "Use only letters, spaces, periods, or hyphens.";
  }

  return "";
}

export function validatePassword(value) {
  if (!value) {
    return "Password is required.";
  }

  if (value.length < 8) {
    return "Password must be at least 8 characters.";
  }

  if (!/[A-Z]/.test(value)) {
    return "Add at least one uppercase letter.";
  }

  if (!/[a-z]/.test(value)) {
    return "Add at least one lowercase letter.";
  }

  if (!/\d/.test(value)) {
    return "Add at least one number.";
  }

  return "";
}

export function getPasswordStrength(value) {
  const checks = {
    length: value.length >= 8,
    upper: /[A-Z]/.test(value),
    lower: /[a-z]/.test(value),
    number: /\d/.test(value),
  };

  const score = Object.values(checks).filter(Boolean).length;

  if (score <= 2) {
    return {
      score,
      label: "Too weak",
      color: "bg-red-500",
      text: "text-red-600",
    };
  }

  if (score <= 4) {
    return {
      score,
      label: "Strong",
      color: "bg-amber-500",
      text: "text-amber-600",
    };
  }

  return {
    score,
    label: "Excellent",
    color: "bg-emerald-500",
    text: "text-emerald-600",
  };
}

export function validateLoginForm(values) {
  return {
    email: validateEmail(values.email || ""),
    password: values.password ? "" : "Password is required.",
  };
}

export function validateSignupForm(values) {
  return {
    full_name: validateFullName(values.full_name || ""),
    email: validateEmail(values.email || ""),
    password: validatePassword(values.password || ""),
    role: values.role ? "" : "Choose a role.",
  };
}
