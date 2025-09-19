"use client";
import { useRouter } from "next/navigation";
import { getCurrentUser } from "@/utils/auth";
import SharedToolbar from "@/components/SharedToolbar";
import { Box, Container, CircularProgress } from "@mui/material";
import { useEffect, useState } from "react";

export default function LicenseRenewalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = getCurrentUser();

        if (!user) {
          // If no user is logged in, redirect to login with the current path as callback
          const currentPath = window.location.pathname;
          router.push(`/login?callbackUrl=${encodeURIComponent(currentPath)}`);
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

    // Listen for storage events to handle logout from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === "authToken" && !e.newValue) {
        router.push("/login");
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, [router]);

  if (isLoading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthorized) {
    return null; // Will redirect from useEffect
  }

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        minHeight: "100vh",
        position: "relative",
        width: "100%",
      }}
    >
      <SharedToolbar title="License Renewal" />
      <Container
        component="main"
        maxWidth="lg"
        sx={{
          flexGrow: 1,
          py: 4,
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </Container>
    </Box>
  );
}
