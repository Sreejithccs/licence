import { removeAuthToken } from './auth';
type RouterLike = { push: (href: string) => void };

export const handleLogout = async (router?: RouterLike | null) => {
  try {
    // No Next.js API usage; just clear client state and redirect
    const response = { ok: true };

    if (!response.ok) {
      console.error('Logout API call failed');
      // Continue with client-side cleanup even if API call fails
    }
  } catch (error) {
    console.error('Error during logout:', error);
    // Continue with client-side cleanup even if there's an error
  } finally {
    // Clear client-side auth state
    removeAuthToken();
    
    // Redirect to login page
    if (router) {
      router.push('/login');
    } else if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  }
};
