let authToken: string | null = null;

export const setAuthToken = (token: string) => {
  authToken = token;
  localStorage.setItem("authToken", token);
};

export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  
  const stored = localStorage.getItem("authToken");
  if (stored) {
    authToken = stored;
    return stored;
  }
  
  return null;
};

export const clearAuthToken = () => {
  authToken = null;
  localStorage.removeItem("authToken");
};

export const isAuthenticated = (): boolean => {
  return getAuthToken() !== null;
};
