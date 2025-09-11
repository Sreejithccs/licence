import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import LicensesPage from '@/app/admin/licenses/list/page';
import { setAuthData, UserRole } from '@/utils/auth';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
}));

// Mock the API call
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('Licenses Management Page', () => {
  const mockLicenses = [
    {
      _id: '1',
      licenseKey: 'LIC-12345',
      app_id: 'app-123',
      client: {
        id: 'client-1',
        name: 'Test Client',
        contact: 'client@example.com',
      },
      cem: {
        name: 'Test CEM',
        email: 'cem@example.com',
        cem_code: 'CEM-001',
      },
      expiry: '2024-12-31T00:00:00.000Z',
      status: 'active',
      grace_period: 30,
      source_key: {
        android: 'android-key-123',
        ios: 'ios-key-123',
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
    },
  ];

  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock useRouter
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    
    // Mock successful API response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockLicenses,
    });
    
    // Set up admin user
    setAuthData('test-token', {
      _id: 'user-123',
      userId: 'admin',
      employeeID: 'emp-123',
      name: 'Admin User',
      mail: 'admin@example.com',
      role: {
        roleType: UserRole.ADMIN,
        read: true,
        write: true,
        edit: true,
      },
      createdAt: '2023-01-01T00:00:00.000Z',
      updatedAt: '2023-01-01T00:00:00.000Z',
      __v: 0,
    });
  });

  it('renders the licenses table with data', async () => {
    render(<LicensesPage />);
    
    // Check if loading state is shown initially
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('LIC-12345')).toBeInTheDocument();
      expect(screen.getByText('app-123')).toBeInTheDocument();
      expect(screen.getByText('Test Client')).toBeInTheDocument();
      expect(screen.getByText('Test CEM')).toBeInTheDocument();
      expect(screen.getByText('ACTIVE')).toBeInTheDocument();
    });
  });

  it('allows searching for licenses', async () => {
    render(<LicensesPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('LIC-12345')).toBeInTheDocument();
    });
    
    // Find search input and type search term
    const searchInput = screen.getByPlaceholderText('Search licenses...');
    fireEvent.change(searchInput, { target: { value: 'Test Client' } });
    
    // Check if the search term is applied
    expect(searchInput).toHaveValue('Test Client');
  });

  it('navigates to add new license page when button is clicked', async () => {
    render(<LicensesPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('LIC-12345')).toBeInTheDocument();
    });
    
    // Click the add button
    const addButton = screen.getByText('Add New License');
    fireEvent.click(addButton);
    
    // Check if navigation was triggered
    expect(mockRouter.push).toHaveBeenCalledWith('/admin/create');
  });

  it('shows delete confirmation dialog when delete button is clicked', async () => {
    render(<LicensesPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('LIC-12345')).toBeInTheDocument();
    });
    
    // Mock successful delete response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({}),
    });
    
    // Click the delete button
    const deleteButton = screen.getByLabelText('delete');
    fireEvent.click(deleteButton);
    
    // Check if delete confirmation dialog is shown
    expect(screen.getByText('Delete License')).toBeInTheDocument();
    
    // Click confirm delete
    const confirmButton = screen.getByText('Delete');
    fireEvent.click(confirmButton);
    
    // Check if delete API was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/licenses/1', {
        method: 'DELETE',
      });
    });
  });

  it('allows renewing a license', async () => {
    render(<LicensesPage />);
    
    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText('LIC-12345')).toBeInTheDocument();
    });
    
    // Mock successful renew response
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        ...mockLicenses[0],
        expiry: '2025-12-31T00:00:00.000Z',
      }),
    });
    
    // Click the renew button
    const renewButton = screen.getByLabelText('renew');
    fireEvent.click(renewButton);
    
    // Check if renew API was called
    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith('/api/licenses/1/renew', {
        method: 'POST',
      });
    });
  });
});
