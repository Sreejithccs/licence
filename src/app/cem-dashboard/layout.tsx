"use client";
import { useRouter } from 'next/navigation';
import { getCurrentUser } from "@/utils/auth";
import SharedToolbar from "@/components/SharedToolbar";
import {
  Box,
  Container,
  CircularProgress,
  Typography,
} from "@mui/material";
import { useEffect, useState } from 'react';

export default function CEMLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [isCEM, setIsCEM] = useState(false);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = getCurrentUser();
        const currentPath = window.location.pathname;
        
        if (!user) {
          // If no user is logged in, redirect to login with the current path as callback
          const callbackUrl = currentPath === '/login' ? '/cem-dashboard' : currentPath;
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
          return;
        }
        
        if (user.role !== "cem") {
          // If user is not CEM, redirect to their dashboard based on role
          const redirectPath = user.role === 'admin' ? '/admin' : '/';
          router.push(redirectPath);
          return;
        }
        
        // User is CEM, allow access
        setIsCEM(true);
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

  if (!isCEM) {
    return null; // Redirection is handled in the effect
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <SharedToolbar title="CEM Dashboard" />
      <Container component="main" sx={{ flex: 1, py: 4 }}>
        {children}
      </Container>
      <Box component="footer" sx={{ py: 3, px: 2, mt: 'auto', backgroundColor: (theme) => theme.palette.grey[200] }}>
        <Container maxWidth="sm">
          <Typography variant="body2" color="text.secondary" align="center">
            © {new Date().getFullYear()} CCS Technologies IT (P) Ltd. All rights reserved.
          </Typography>
        </Container>
      </Box>
    </Box>
  );
}
