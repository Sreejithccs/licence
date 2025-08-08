"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useDecryptedTokenData } from "../../utils/crypto";
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

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3000";

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

function LicenseRenewalContent() {
  const clientSearchParams = useSearchParams();
  const token = clientSearchParams.get("token");

  const [tokenData, tokenLoading, tokenError] = useDecryptedTokenData();
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [extensionDays, setExtensionDays] = useState<number | "">("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (tokenLoading) return;

    if (tokenError) {
      setError(tokenError.message);
      setLoading(false);
      return;
    }

    if (!token) {
      setError("No token provided in the URL");
      setLoading(false);
      return;
    }

    const fetchLicenseData = async (appId: string) => {
      try {
        setLoading(true);
        setError(null);

        const response = await axios.get(
          `${API_BASE_URL}/dev/licenses/${appId}`
        );

        if (!response.data) {
          throw new Error("No data received from server");
        }

        const licenseData: LicenseData = {
          licenseKey: response.data.licenseKey,
          user: response.data.user,
          expiry: response.data.expiry,
          app_id: response.data.app_id,
          client: response.data.client,
          grace_period: response.data.grace_period,
          cem: response.data.cem,
        };

        setLicenseData(licenseData);
      } catch (err: unknown) {
        if (axios.isAxiosError(err)) {
          const axiosErr = err as AxiosError<{ message?: string }>;
          console.error("Error fetching license data:", axiosErr);
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

    if (tokenData?.app_id) {
      fetchLicenseData(tokenData.app_id);
    } else {
      setLoading(false);
    }
  }, [token, tokenData, tokenLoading, tokenError]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!licenseData || !extensionDays) {
      setError("Please fill in all required fields");
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      // Calculate new expiry date
      const currentExpiry = new Date(licenseData.expiry);
      const newExpiry = new Date(
        currentExpiry.setDate(
          currentExpiry.getDate() + (extensionDays as number)
        )
      );

      // Prepare the payload with all required fields
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
      };

      // Call the issue endpoint to create a new license
      const response = await axios.post(`${API_BASE_URL}/dev/issue`, payload);

      // Update the UI with the new license data
      setLicenseData({
        ...licenseData,
        licenseKey: response.data.license.licenseKey,
        expiry: response.data.license.expiry,
      });

      setSuccess(true);
      setExtensionDays("");
      setSuccessMessage(
        `License renewed successfully! New expiry date: ${new Date(
          response.data.license.expiry
        ).toLocaleDateString()}`
      );
    } catch (err: unknown) {
      if (axios.isAxiosError(err)) {
        const axiosErr = err as AxiosError<{ message?: string }>;
        console.error("Error renewing license:", axiosErr);

        // Handle specific error for CEM authorization
        if (axiosErr.response?.data?.message?.includes("not authorized to renew")) {
          setError(
            "You are not authorized to renew this license. Please contact your administrator."
          );
        } else {
          // Handle other errors
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto p-6">
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
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 rounded">
          <p className="font-bold">No License Data</p>
          <p>
            Unable to load license information. Please check the app_id and try
            again.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="p-6 sm:p-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-6">
              License Renewal
            </h1>

            {success && (
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
                      htmlFor="extensionDays"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Extension Days
                    </label>
                    <input
                      type="number"
                      id="extensionDays"
                      min="1"
                      value={extensionDays}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setExtensionDays(
                          isNaN(value) ? "" : Math.max(1, value)
                        );
                      }}
                      className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm p-2 border ${
                        error && !extensionDays ? "border-red-500" : ""
                      }`}
                      required
                    />
                    {!extensionDays && (
                      <p className="mt-1 text-sm text-red-600">
                        Please enter the number of days to extend the license
                      </p>
                    )}
                  </div>

                  <div className="pt-2">
                    <button
                      type="submit"
                      disabled={submitting || !extensionDays}
                      className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                        submitting || !extensionDays
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

export default function LicenseRenewalPage({ searchParams }: PageProps) {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    }>
      <LicenseRenewalContent />
    </Suspense>
  );
}
