// src/lib/auth.ts

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", token);
  }
};

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
  }
};

export const isTokenValid = (token: string | null): boolean => {
  if (!token) return false;

  try {
    // Decode JWT token (header.payload.signature)
    const payload = JSON.parse(atob(token.split(".")[1]));

    // Check if token has expired
    const currentTime = Date.now() / 1000;
    if (payload.exp && payload.exp < currentTime) {
      return false; // Token has expired
    }

    return true; // Token is valid
  } catch (error) {
    console.error("Error validating token:", error);
    return false; // Invalid token format
  }
};
