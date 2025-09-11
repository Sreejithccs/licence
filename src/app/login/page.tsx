"use client";

import { Suspense, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { isAuthenticated } from '@/utils/auth';
import LoginForm from './LoginForm';
import { CircularProgress, Box } from '@mui/material';

function LoginPageInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') || '/';

  useEffect(() => {
    if (isAuthenticated()) {
      router.push(callbackUrl);
    }
  }, [router, callbackUrl]);

  if (isAuthenticated()) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return <LoginForm callbackUrl={callbackUrl} />;
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
