"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, ComponentType } from "react";
import { isAuthenticated } from "@/utils/auth";

// Define the props for the withAuth HOC
interface WithAuthProps<P = unknown> {
  ComponentIfLoggedIn: ComponentType<P>;
  ComponentIfLoggedOut: ComponentType<Record<string, never>>;
  LoadingComponent?: ComponentType<Record<string, never>>;
}

// Main HOC function
export default function withAuth<P extends Record<string, unknown>>({
  ComponentIfLoggedIn,
  ComponentIfLoggedOut,
  LoadingComponent = () => (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ),
}: WithAuthProps<P>) {
  // The actual wrapper component
  function Wrapper(props: Omit<P, keyof WithAuthProps<P>>) {
    const router = useRouter();
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
          const currentPath = window.location.pathname;
          const queryString = window.location.search;
          const callbackUrl = `${currentPath}${queryString}`;
          router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
        }
      };

      checkAuth();
    }, [router]);

    if (!isClient || isLoading) {
      return <LoadingComponent />;
    }

    if (isAuth) {
      return <ComponentIfLoggedIn {...(props as P)} />;
    }

    return <ComponentIfLoggedOut />;
  }

  // Set display name for better debugging
  Wrapper.displayName = `withAuth(${
    ComponentIfLoggedIn.displayName || ComponentIfLoggedIn.name || "Component"
  })`;

  return Wrapper;
}
