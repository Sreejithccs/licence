"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoginForm from './LoginForm';
import { CircularProgress, Box } from '@mui/material';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    // If already logged in, redirect to callback URL or home
    if (isAuthenticated()) {
      router.push(callbackUrl);
    }
  }, [router, callbackUrl]);

  // Show loading state while checking auth
  if (isAuthenticated()) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Suspense 
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      }
    >
      <LoginForm callbackUrl={callbackUrl} />
    </Suspense>
  );
}
