"use client";
import { useRouter } from 'next/navigation';
import { getCurrentUser, UserRole } from "@/utils/auth";
import SharedToolbar from "@/components/SharedToolbar";
import {
  Box,
  Container,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = getCurrentUser();
        const currentPath = window.location.pathname;
        
        if (!user) {
          // If no user is logged in, redirect to login with the current path as callback
          const callbackUrl = currentPath === '/login' ? '/admin' : currentPath;
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }
        
        // Allow Admin access to all admin routes
        if (user.role === UserRole.ADMIN) {
          setIsAdmin(true);
          return;
        }

        // Allow CEM to access edit page under admin, but not the full admin
        const isEditRoute = currentPath.startsWith('/admin/edit/');
        if (user.role === UserRole.CEM && isEditRoute) {
          setIsAdmin(true);
          return;
        }

        // Otherwise, redirect non-admins away from admin pages
        const redirectPath = user.role === UserRole.CEM ? '/cem-dashboard' : '/';
        router.push(redirectPath);
        return;
      } catch (error) {
        console.error('Authentication error:', error);
        router.push('/login');
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
    
    // Listen for storage events to handle logout from other tabs
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'authToken' && !e.newValue) {
        router.push('/login');
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [router]);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (!isAdmin) {
    return null; // Will redirect from useEffect
  }

  return (
    <Box sx={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <SharedToolbar title="Admin Dashboard" />
      <Container component="main" maxWidth="lg" sx={{ mt: 4, mb: 4, flex: 1 }}>
        {children}
      </Container>
      <Box
        component="footer"
        sx={{
          py: 3,
          px: 2,
          mt: "auto",
          backgroundColor: (theme) => theme.palette.grey[200],
        }}
      >
        <Container maxWidth="lg">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CCS Technologies IT (P) Ltd. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
