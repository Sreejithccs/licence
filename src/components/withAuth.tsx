'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { isAuthenticated } from '@/utils/auth';

interface WithAuthProps {
  ComponentIfLoggedIn: React.ComponentType<any>;
  ComponentIfLoggedOut: React.ComponentType<any>;
}

export default function withAuth({
  ComponentIfLoggedIn,
  ComponentIfLoggedOut,
}: WithAuthProps) {
  return function WithAuthWrapper(props: any) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isClient, setIsClient] = useState(false);
    const [isAuth, setIsAuth] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
      setIsClient(true);
      const checkAuth = () => {
        const auth = isAuthenticated();
        setIsAuth(auth);
        setIsLoading(false);

        if (!auth) {
          // Get current path with query params
          const currentPath = window.location.pathname;
          const queryString = window.location.search;
          const callbackUrl = `${currentPath}${queryString}`;
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      };

      checkAuth();
    }, [router]);

    if (!isClient || isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      );
    }

    return isAuth ? <ComponentIfLoggedIn {...props} /> : <ComponentIfLoggedOut {...props} />;
  };
}
