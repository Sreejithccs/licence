// Utility functions for authentication
export const isAuthenticated = (): boolean => {
  if (typeof window === 'undefined') return false;
  return !!sessionStorage.getItem('authToken');
};

export const getAuthToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return sessionStorage.getItem('authToken');
};

export const setAuthToken = (token: string): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('authToken', token);
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('authToken');
  }
};
