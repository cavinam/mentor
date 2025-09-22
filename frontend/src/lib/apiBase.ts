/**
 * Resolve API base URL safely on any device.
 * Priority:
 * 1) NEXT_PUBLIC_API_BASE_URL (build-time env)
 * 2) Derive from window.location (same host) with default backend port 5000
 *
 * This avoids hardcoded "http://localhost:5000" which breaks on other devices.
 */
export function getApiBase(): string {
  const fromEnv = process.env.NEXT_PUBLIC_API_BASE_URL;
  if (fromEnv && fromEnv.trim() !== "") {
    return fromEnv;
  }

  if (typeof window !== "undefined") {
    const proto = window.location.protocol; // http: or https:
    const host = window.location.hostname; // device-accessible host/IP
    const defaultBackendPort = "5000";
    return `${proto}//${host}:${defaultBackendPort}`;
  }

  return "";
}
