export const DEMO_ADMIN_EMAIL = "admin@seconded.demo";
export const DEMO_ADMIN_PASSWORD = "Admin@12345";

const DEMO_ADMIN_SESSION_KEY = "seconded-demo-admin-session";
export const DEMO_ADMIN_SESSION_EVENT = "seconded:demo-admin-session-change";

export function isDemoAdminCredentials(email: string, password: string) {
  return email === DEMO_ADMIN_EMAIL && password === DEMO_ADMIN_PASSWORD;
}

export function hasDemoAdminSession() {
  return typeof window !== "undefined" && window.sessionStorage.getItem(DEMO_ADMIN_SESSION_KEY) === "active";
}

export function startDemoAdminSession() {
  window.sessionStorage.setItem(DEMO_ADMIN_SESSION_KEY, "active");
  window.dispatchEvent(new Event(DEMO_ADMIN_SESSION_EVENT));
}

export function clearDemoAdminSession() {
  window.sessionStorage.removeItem(DEMO_ADMIN_SESSION_KEY);
  window.dispatchEvent(new Event(DEMO_ADMIN_SESSION_EVENT));
}