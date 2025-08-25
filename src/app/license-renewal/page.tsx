"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import axios, { AxiosError } from "axios";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Button from "@mui/material/Button";
import Paper from "@mui/material/Paper";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { removeAuthToken, getAuthToken, getCurrentUser } from "@/utils/auth";
import withAuth from "@/components/withAuth";

interface Client {
  id: string;
  name: string;
  contact: string;
}

interface User {
  id: string;
  name: string;
  contact: string;
}

interface CEM {
  name: string;
  email: string;
  cem_code: string;
}

interface LicenseData {
  licenseKey: string;
  user: User;
  expiry: string;
  app_id: string;
  client: Client;
  grace_period: number;
  cem: CEM;
}

interface UserToken {
  userId: string;
  employeeID: string;
  name: string;
  mail: string;
  role: {
    roleType: string;
    read: boolean;
    write: boolean;
    edit: boolean;
  };
}

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

// This is the main content component that contains all the existing license renewal logic
function LicenseRenewalContent() {
  const clientSearchParams = useSearchParams();
  const token = clientSearchParams.get("token");
  const [user, setUser] = useState<UserToken | null>(null);

  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [extensionDays, setExtensionDays] = useState<number | "">("");
  const [extensionMonths, setExtensionMonths] = useState<number | "">(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [licenseState, setLicenseState] = useState<{
    isAlreadyRenewed?: boolean;
    isNotExpired?: boolean;
    canBeRenewed?: boolean;
  }>({});

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = "/login";
  };

  const renderLogoutButton = () => (
    <button
      onClick={handleLogout}
      className="absolute top-4 right-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Logout
    </button>
  );

  useEffect(() => {
    const fetchLicenseData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check for token in URL
        if (!token) {
          throw new Error("No token provided in the URL");
        }

        // Get current user data from session storage
        const currentUser = getCurrentUser();
        console.log("Current User:", currentUser);
        if (!currentUser) {
          throw new Error("User not authenticated. Please log in again.");
        }

        // Set user state for other parts of the component
        setUser(currentUser);

        // Fetch license data
        const response = await axios.post(`${API_BASE_URL}/dev/renew-license`, {
          token,
        });
        console.log("License data:", response.data.data);

        if (!response.data.success) {
          if (response.data.data?.isAlreadyRenewed) {
            setLicenseState({ isAlreadyRenewed: true });
            setLicenseData(response.data.data);
            return;
          }
          if (response.data.data?.isNotExpired) {
            setLicenseState({ isNotExpired: true });
            setLicenseData(response.data.data);
            return;
          }
          throw new Error(
            response.data.message || "Failed to fetch license data"
          );
        }

        const licenseData = response.data.data;

        // Check if the logged-in user is the CEM for this license
        // Use currentUser directly to avoid race condition with state updates
        if (currentUser.employeeID !== licenseData?.cem?.cem_code) {
          console.log("License Data:", licenseData);
          console.log("Current User:", currentUser);
          setError(
            `You are not authorized to renew this license. Only the designated CEM (${licenseData?.cem?.name} - ${licenseData?.cem?.cem_code}) can renew this license.`
          );
          setLoading(false);
          return;
        }

        setLicenseData(licenseData);
        setLicenseState({ canBeRenewed: licenseData?.canBeRenewed });
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosErr = err as AxiosError<{ message?: string }>;
          setError(
            axiosErr.response?.data?.message ||
              axiosErr.message ||
              "Failed to fetch license data. Please try again later."
          );
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("An unknown error occurred.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchLicenseData();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseData || (!extensionDays && !extensionMonths)) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Calculate new expiry date from current date
      const currentDate = new Date();
      const daysToAdd = extensionMonths
        ? Number(extensionMonths) * 30
        : Number(extensionDays);
      const newExpiry = new Date(
        currentDate.getTime() + daysToAdd * 24 * 60 * 60 * 1000
      );

      const payload = {
        app_id: licenseData.app_id,
        user: {
          id: licenseData.user.id,
          name: licenseData.user.name,
          contact: licenseData.user.contact,
        },
        client: {
          id: licenseData.client.id,
          name: licenseData.client.name,
          contact: licenseData.client.contact,
        },
        cem: {
          name: licenseData.cem.name,
          email: licenseData.cem.email,
          cem_code: licenseData.cem.cem_code,
        },
        grace_period: licenseData.grace_period,
        expiry: newExpiry.toISOString(),
        action: "renew",
      };

      const response = await axios.post(`${API_BASE_URL}/dev/issue`, payload);

      setLicenseData({
        ...licenseData,
        licenseKey: response.data.license.licenseKey,
        expiry: response.data.license.expiry,
      });

      setSuccessMessage(
        `License renewed successfully! New expiry date: ${new Date(
          response.data.license.expiry
        ).toLocaleDateString()}`
      );

      // Clear auth token and redirect to login after a short delay
      setTimeout(() => {
        removeAuthToken();
        window.location.href = "/login";
      }, 10000);
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        console.error("Error renewing license:", axiosErr);

        if (
          axiosErr.response?.data?.message?.includes("not authorized to renew")
        ) {
          setError(
            "You are not authorized to renew this license. Please contact your administrator."
          );
        } else {
          const errorMessage =
            axiosErr.response?.data?.message ||
            axiosErr.message ||
            "Failed to renew license. Please try again later.";
          setError(errorMessage);
        }
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen relative">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (licenseState.isAlreadyRenewed && licenseData) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative">
        {renderLogoutButton()}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">Already Renewed</p>
          <p>
            This license has already been renewed and cannot be renewed again.
          </p>
          <div className="mt-4">
            <p>
              <strong>License Key:</strong> {licenseData.licenseKey}
            </p>
            <p>
              <strong>Expiry Date:</strong>{" "}
              {new Date(licenseData.expiry).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (licenseState.isNotExpired && licenseData) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative">
        {renderLogoutButton()}
        <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 rounded">
          <p className="font-bold">License Active</p>
          <p>This license is still active and does not need renewal.</p>
          <div className="mt-4">
            <p>
              <strong>License Key:</strong> {licenseData.licenseKey}
            </p>
            <p>
              <strong>Expiry Date:</strong>{" "}
              {new Date(licenseData.expiry).toLocaleDateString()}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative">
        <div
          className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded"
          role="alert"
        >
          <p className="font-bold">Error</p>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!licenseData) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative">
        {renderLogoutButton()}
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">No License Data</p>
          <p>
            Unable to load license information. Please check the token and try
            again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {renderLogoutButton()}
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              License Renewal
            </h1>

            {successMessage && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded mb-6">
                <p className="font-bold">Success</p>
                <p>{successMessage}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    License Key
                  </label>
                  <p className="text-gray-900">{licenseData.licenseKey}</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    User Name
                  </label>
                  <p className="text-gray-900">
                    {licenseData.user?.name || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Current Expiry Date
                  </label>
                  <p className="text-gray-900">
                    {new Date(licenseData.expiry).toLocaleDateString()}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Client Name
                  </label>
                  <p className="text-gray-900">
                    {licenseData.client?.name || "N/A"}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    Grace Period (days)
                  </label>
                  <p className="text-gray-900">
                    {licenseData.grace_period / 24}
                  </p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-gray-500">
                    CEM
                  </label>
                  <p className="text-gray-900">
                    {licenseData.cem?.name || "N/A"}
                  </p>
                </div>
              </div>

              <div className="border-t border-gray-200 pt-6">
                <div className="space-y-4">
                  <div>
                    <label
                      htmlFor="extensionMonths"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Extend License For (Months)
                    </label>
                    <select
                      id="extensionMonths"
                      value={extensionMonths}
                      onChange={(e) => {
                        setExtensionMonths(Number(e.target.value) || "");
                        setExtensionDays("");
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="1">1 Month (30 days)</option>
                      <option value="3">3 Months (90 days)</option>
                      <option value="6">6 Months (180 days)</option>
                      <option value="12">12 Months (360 days)</option>
                      {/* <option value="">Custom (Days)</option> */}
                    </select>
                  </div>

                  {/* {!extensionMonths && (
                    <div>
                      <label
                        htmlFor="extensionDays"
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        Or Enter Custom Days
                      </label>
                      <input
                        type="number"
                        id="extensionDays"
                        value={extensionDays}
                        onChange={(e) =>
                          setExtensionDays(Number(e.target.value) || "")
                        }
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter number of days"
                      />
                    </div>
                  )} */}
                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={
                        submitting || (!extensionDays && !extensionMonths)
                      }
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        submitting || (!extensionDays && !extensionMonths)
                          ? "bg-blue-300 cursor-not-allowed"
                          : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      }`}
                    >
                      {submitting ? (
                        <>
                          <svg
                            className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          Processing...
                        </>
                      ) : (
                        "Renew License"
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

const LoadingComponent = () => (
  <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
    <CircularProgress />
    <Typography variant="body1" sx={{ mt: 2 }}>
      Loading license information...
    </Typography>
  </Container>
);

const UnauthorizedComponent = () => (
  <Container maxWidth="md" sx={{ mt: 4, textAlign: "center" }}>
    <Alert severity="error">
      <AlertTitle>Authentication Required</AlertTitle>
      Please sign in to access the license renewal page.
    </Alert>
  </Container>
);

export default withAuth({
  ComponentIfLoggedIn: () => (
    <Suspense fallback={<LoadingComponent />}>
      <LicenseRenewalContent />
    </Suspense>
  ),
  ComponentIfLoggedOut: UnauthorizedComponent,
});
