"use client";
import * as React from "react";
import { ComponentType, useState, useEffect, ReactElement } from "react";
import { useRouter } from "next/navigation";
import { CircularProgress } from "@mui/material";

// User roles must match the server-side implementation
export enum UserRole {
  ADMIN = "admin",
  USER = "user",
  CEM = "cem",
}

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
  id: string;
  username: string;
  empCode: string;
  role: UserRole;
  isActive: boolean;
  lastLogin?: Date;
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
  return userData ? JSON.parse(userData) : null;
};

/**
 * Check if the current user has admin role
 */
export const isAdmin = (): boolean => {
  const user = getCurrentUser();
  return user?.role === UserRole.ADMIN;
};

/**
 * Check if the current user has CEM role
 */
export const isCEM = (): boolean => {
  const user = getCurrentUser();
  return user?.role === UserRole.CEM;
};

/**
 * Higher-order component that requires authentication and optionally a specific role
 * @param requiredRole - Optional role required to access the wrapped component
 */
export function requireAuth(requiredRole?: UserRole) {
  return function withAuth<P extends object>(
    WrappedComponent: ComponentType<P>
  ): ComponentType<P> {
    // Get the display name for debugging purposes
    const wrapped = WrappedComponent as React.ComponentType<P> & { displayName?: string; name?: string };
    const displayName = wrapped.displayName ?? wrapped.name ?? "Component";

    // Create the wrapper component
    function AuthWrapper(props: P): ReactElement | null {
      const router = useRouter();
      const [isAuthorized, setIsAuthorized] = useState(false);
      const [isLoading, setIsLoading] = useState(true);

      useEffect(() => {
        const checkAuth = async () => {
          try {
            const user = getCurrentUser();

            if (!user) {
              // Not logged in, redirect to login
              router.push(
                `/login?callbackUrl=${encodeURIComponent(
                  window.location.pathname
                )}`
              );
              return;
            }

            if (requiredRole && user.role !== requiredRole) {
              // Not authorized, redirect to home
              router.push("/");
              return;
            }

            setIsAuthorized(true);
          } catch (error) {
            console.error("Authentication error:", error);
            router.push("/login");
          } finally {
            setIsLoading(false);
          }
        };

        checkAuth();
      }, [router]);

      if (isLoading) {
        return React.createElement(
          "div",
          {
            style: {
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              minHeight: "60vh",
            },
          },
          React.createElement(CircularProgress, null)
        );
      }

      if (!isAuthorized) {
        return null; // Already handled by the redirects above
      }

      // Use React.createElement to avoid JSX type issues
      return React.createElement(WrappedComponent, props);
    }

    // Set display name for debugging
    AuthWrapper.displayName = `withAuth(${displayName})`;

    // Return the wrapped component
    return AuthWrapper;
  };
}
