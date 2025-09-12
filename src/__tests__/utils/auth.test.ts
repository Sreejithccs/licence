import { isAuthenticated, getAuthToken, setAuthData, removeAuthToken, getCurrentUser, isAdmin, isCEM, UserRole } from '@/utils/auth';

describe('Auth Utility Functions', () => {
  // Mock sessionStorage
  const mockSessionStorage = (() => {
    let store: Record<string, string> = {};
    return {
      getItem: (key: string) => store[key] || null,
      setItem: (key: string, value: string) => {
        store[key] = value.toString();
      },
      removeItem: (key: string) => {
        delete store[key];
      },
      clear: () => {
        store = {};
      },
    };
  })();

  beforeAll(() => {
    // Mock sessionStorage in the global object
    Object.defineProperty(window, 'sessionStorage', {
      value: mockSessionStorage,
      writable: true,
    });
  });

  beforeEach(() => {
    // Clear sessionStorage before each test
    mockSessionStorage.clear();
  });

  describe('isAuthenticated', () => {
    it('should return false when no token exists', () => {
      expect(isAuthenticated()).toBe(false);
    });

    it('should return true when a token exists', () => {
      mockSessionStorage.setItem('authToken', 'test-token');
      expect(isAuthenticated()).toBe(true);
    });
  });

  describe('getAuthToken', () => {
    it('should return null when no token exists', () => {
      expect(getAuthToken()).toBeNull();
    });

    it('should return the token when it exists', () => {
      const token = 'test-token-123';
      mockSessionStorage.setItem('authToken', token);
      expect(getAuthToken()).toBe(token);
    });
  });

  describe('setAuthData', () => {
    it('should set auth token and user data in sessionStorage', () => {
      const token = 'test-token';
      const userData = {
        _id: '123',
        userId: 'user123',
        employeeID: 'emp123',
        name: 'Test User',
        mail: 'test@example.com',
        role: {
          roleType: 'admin',
          read: true,
          write: true,
          edit: true,
        },
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        __v: 0,
      };

      setAuthData(token, userData);

      expect(sessionStorage.getItem('authToken')).toBe(token);
      expect(sessionStorage.getItem('userData')).toBe(JSON.stringify(userData));
    });
  });

  describe('removeAuthToken', () => {
    it('should remove auth token and user data from sessionStorage', () => {
      // Set up initial data
      mockSessionStorage.setItem('authToken', 'test-token');
      mockSessionStorage.setItem('userData', JSON.stringify({}));

      // Remove auth data
      removeAuthToken();

      // Check if data was removed
      expect(sessionStorage.getItem('authToken')).toBeNull();
      expect(sessionStorage.getItem('userData')).toBeNull();
    });
  });

  describe('getCurrentUser', () => {
    it('should return null when no user data exists', () => {
      expect(getCurrentUser()).toBeNull();
    });

    it('should return parsed user data when it exists', () => {
      const userData = {
        _id: '123',
        userId: 'user123',
        employeeID: 'emp123',
        name: 'Test User',
        mail: 'test@example.com',
        role: {
          roleType: 'admin',
          read: true,
          write: true,
          edit: true,
        },
        createdAt: '2023-01-01',
        updatedAt: '2023-01-01',
        __v: 0,
      };

      mockSessionStorage.setItem('userData', JSON.stringify(userData));
      expect(getCurrentUser()).toEqual(userData);
    });
  });

  describe('isAdmin', () => {
    it('should return false when no user is logged in', () => {
      expect(isAdmin()).toBe(false);
    });

    it('should return true when user has admin role', () => {
      const userData = {
        _id: '123',
        role: {
          roleType: UserRole.ADMIN,
          read: true,
          write: true,
          edit: true,
        },
      };

      mockSessionStorage.setItem('userData', JSON.stringify(userData));
      expect(isAdmin()).toBe(true);
    });

    it('should return false when user does not have admin role', () => {
      const userData = {
        _id: '123',
        role: {
          roleType: UserRole.CEM,
          read: true,
          write: true,
          edit: true,
        },
      };

      mockSessionStorage.setItem('userData', JSON.stringify(userData));
      expect(isAdmin()).toBe(false);
    });
  });

  describe('isCEM', () => {
    it('should return false when no user is logged in', () => {
      expect(isCEM()).toBe(false);
    });

    it('should return true when user has CEM role', () => {
      const userData = {
        _id: '123',
        role: {
          roleType: UserRole.CEM,
          read: true,
          write: true,
          edit: true,
        },
      };

      mockSessionStorage.setItem('userData', JSON.stringify(userData));
      expect(isCEM()).toBe(true);
    });

    it('should return false when user does not have CEM role', () => {
      const userData = {
        _id: '123',
        role: {
          roleType: UserRole.ADMIN,
          read: true,
          write: true,
          edit: true,
        },
      };

      mockSessionStorage.setItem('userData', JSON.stringify(userData));
      expect(isCEM()).toBe(false);
    });
  });
});
