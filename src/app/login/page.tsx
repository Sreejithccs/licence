import { Suspense } from 'react';
import LoginForm from './LoginForm';
import { CircularProgress, Box } from '@mui/material';

export default function LoginPage() {
  return (
    <Suspense 
      fallback={
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
          <CircularProgress />
        </Box>
      }
    >
      <LoginForm />
    </Suspense>
  );
}
