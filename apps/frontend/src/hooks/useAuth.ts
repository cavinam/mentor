// Auth hook for authentication state and actions
export function useAuth() {
  return {
    user: null,
    isAuthenticated: false,
    login: async (email: string, password: string) => {},
    logout: () => {},
    isLoading: false,
  };
}
