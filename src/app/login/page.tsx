"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoginForm from './LoginForm';
import { CircularProgress, Box } from '@mui/material';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Get the callback URL and preserve all query parameters
  const callbackUrl = searchParams.get('callbackUrl') || '/';
  // Get the current search params except the callbackUrl
  const currentParams = new URLSearchParams(window.location.search);
  currentParams.delete('callbackUrl');
  const queryString = currentParams.toString();
  const fullCallbackUrl = `${callbackUrl}${queryString ? '?' + queryString : ''}`;

  useEffect(() => {
    if (isAuthenticated()) {
      // Use the full URL with original query parameters
      router.push(fullCallbackUrl);
    }
  }, [router, callbackUrl]);

  if (isAuthenticated()) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return <LoginForm callbackUrl={fullCallbackUrl} />;
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      }
    >
      <LoginPageInner />
    </Suspense>
  );
}
