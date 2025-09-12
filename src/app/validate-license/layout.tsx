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

export default function ValidateLicenseLayout({
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
        const currentPath = window.location.pathname;
        
        if (!user) {
          // If no user is logged in, redirect to login with the current path as callback
          const callbackUrl = currentPath === '/login' ? '/validate-license' : currentPath;
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }
        
        // Allow both admin and CEM users to access validate-license
        if (user.role !== UserRole.ADMIN && user.role !== UserRole.CEM) {
          // If user is not admin or CEM, redirect to home
          router.push('/');
          return;
        }
        
        // User is authorized, allow access
        setIsAuthorized(true);
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

  if (!isAuthorized) {
    return null; // Redirection is handled in the effect
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SharedToolbar title="Validate License" />
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} License Management System
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
