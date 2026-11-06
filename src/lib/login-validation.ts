const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export type LoginFieldErrors = { email?: string; password?: string };

export function validateEmail(value: string): string | undefined {
  const email = value.trim();
  if (!email) return "Enter your email address.";
  if (!EMAIL_PATTERN.test(email)) return "That doesn't look like an email address — check it for typos (e.g. name@example.com).";
  return undefined;
}

export function validatePassword(value: string): string | undefined {
  if (!value) return "Enter your password.";
  return undefined;
}

export function validateLogin(email: string, password: string): LoginFieldErrors {
  const errors: LoginFieldErrors = {};
  const emailError = validateEmail(email);
  const passwordError = validatePassword(password);
  if (emailError) errors.email = emailError;
  if (passwordError) errors.password = passwordError;
  return errors;
}

// Every message says what happened and what to do next. A wrong email and a wrong password get the
// same text on purpose: the server never reveals which one was wrong, so the page can't either.
export function loginFailureMessage(status: number | null): string {
  if (status === 401) return "Incorrect email or password. Check both and try again, or reset your password.";
  if (status === 429) return "Too many sign-in attempts. Please wait a few minutes before trying again.";
  if (status === null) return "We couldn't reach the server. Check your internet connection and try again.";
  return "Something went wrong on our side. Please try again in a moment.";
}

// After signing in, only ever go to a page inside the admin area.
export function adminRedirectTarget(next: string | null | undefined) {
  if (!next || !next.startsWith("/admin") || next.startsWith("//") || next.includes("\\")) return "/admin/overview";
  if (next === "/admin/login") return "/admin/overview";
  return next;
}

export const MIN_PASSWORD_LENGTH = 8;

export type PasswordChangeErrors = { current?: string; next?: string };

export function validatePasswordChange(current: string, next: string): PasswordChangeErrors {
  const errors: PasswordChangeErrors = {};
  if (!current) errors.current = "Enter your current password.";
  if (!next) errors.next = "Enter a new password.";
  else if (next.length < MIN_PASSWORD_LENGTH) errors.next = `Use at least ${MIN_PASSWORD_LENGTH} characters — a longer phrase is even better.`;
  else if (current && next === current) errors.next = "Choose a password that's different from your current one.";
  return errors;
}
