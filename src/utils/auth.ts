// Utility functions for authentication
export const isAuthenticated = (): boolean => {
  if (typeof window === "undefined") return false;
  return !!sessionStorage.getItem("authToken");
};

export const getAuthToken = (): string | null => {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem("authToken");
};

export interface UserData {
  role: {
    roleType: string;
    read: boolean;
    write: boolean;
    edit: boolean;
  };
  _id: string;
  userId: string;
  employeeID: string;
  name: string;
  mail: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export const setAuthData = (token: string, userData: UserData): void => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem("authToken", token);
    sessionStorage.setItem("userData", JSON.stringify(userData));
  }
};

export const removeAuthToken = (): void => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem("authToken");
    sessionStorage.removeItem("userData");
  }
};

export const getCurrentUser = (): UserData | null => {
  if (typeof window === "undefined") return null;
  
  const userData = sessionStorage.getItem("userData");
  if (!userData) return null;
  
  try {
    return JSON.parse(userData);
  } catch (error) {
    console.error("Error parsing user data:", error);
    return null;
  }
};
