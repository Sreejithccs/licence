"use client";

import { Suspense, useEffect } from "react";
import Loader from "@/components/Loader";
import { useRouter, useSearchParams } from "next/navigation";
import { getCurrentUser, UserRole, getAuthToken } from "@/utils/auth";
import { getUserByEmpCode } from "@/utils/userService";

function Redirector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  useEffect(() => {

    const handleNavigation = async () => {
      try {
        // Handle token-based redirect first (before auth check)
        if (token) {
          console.log("Token found, redirecting to license renewal");
          await router.push(`/license-renewal?token=${encodeURIComponent(token)}`);
          return;
        }

        // Check if user is authenticated
        console.log("Getting current user...");
        const user = getCurrentUser();
        console.log("Current user from session:", user);

        if (!user) {
          console.log("No user found, redirecting to login");
          await router.push("/login");
          return;
        }

        // Fetch the latest user data from the server using the serverless endpoint
        let userRole = user.role;
        try {
          const serverUserData = await getUserByEmpCode(user.empCode, getAuthToken() || '');
          console.log("User data from server:", serverUserData);
          
          // Update the stored user data with the latest role
          if (serverUserData.role) {
            userRole = serverUserData.role as UserRole;
            const updatedUser = { ...user, role: userRole };
            sessionStorage.setItem('userData', JSON.stringify(updatedUser));
          }
        } catch (error) {
          console.error('Error fetching user data from server:', error);
          // Continue with the existing role if there's an error
        }

        console.log("Final user role:", userRole);

        let redirectPath = "/";
        if (userRole === UserRole.ADMIN) {
          console.log("Admin user, redirecting to /admin");
          redirectPath = "/admin";
        } else if (userRole === UserRole.CEM) {
          console.log("CEM user, redirecting to /cem-dashboard");
          redirectPath = "/cem-dashboard";
        } else {
          console.log("Regular user, no redirection needed");
        }

        // Only navigate if we have a path different from current
        if (redirectPath && redirectPath !== window.location.pathname) {
          console.log(`Navigating to: ${redirectPath}`);
          await router.push(redirectPath);
        } else {
          console.log("No redirection needed, already on the correct page");
        }
      } catch (error) {
        console.error("Navigation error:", error);
        // Fallback to login if there's an error
        await router.push("/login");
      } finally {
      }
    };

    handleNavigation();

  }, [router, token]);

  return null;
}

export default function Home() {
  return (
    <Suspense fallback={<Loader message="Redirecting..." /> }>
      <Redirector />
    </Suspense>
  );
}
