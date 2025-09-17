"use client";

import React, { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Typography from "@mui/material/Typography";
import Alert from "@mui/material/Alert";
import AlertTitle from "@mui/material/AlertTitle";
import { getCurrentUser, removeAuthToken } from "@/utils/auth";
import api from "@/utils/api";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogTitle from "@mui/material/DialogTitle";
import Radio from "@mui/material/Radio";
import RadioGroup from "@mui/material/RadioGroup";
import FormControlLabel from "@mui/material/FormControlLabel";
import FormControl from "@mui/material/FormControl";
import FormLabel from "@mui/material/FormLabel";
import Container from "@mui/material/Container";
import CircularProgress from "@mui/material/CircularProgress";
import Box from "@mui/material/Box";

interface ExtensionPeriod {
  _id: string;
  name: string;
  days: number;
  description: string;
}

interface Client {
  _id: string;
  name: string;
  email?: string;
  contact?: string;
  code?: string;
  country?: string;
}

interface CEM {
  _id: string;
  name: string;
  email: string;
  empCode: string;
  role?: string;
}

interface Application {
  _id: string;
  name: string;
  identifier: string;
}

interface LicenseData {
  licenseKey: string;
  expiry: string;
  app_id: string;
  application: Application;
  client: Client;
  grace_period: number;
  source_key: {
    android: string;
    ios: string;
  };
  cem: CEM;
  _id?: string;
  status?: string;
}

export default function LicenseRenewalPage() {
  const searchParams = useSearchParams();
  const id = searchParams.get("id") || "";
  const token = searchParams.get("token") || "";
  const [licenseData, setLicenseData] = useState<LicenseData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [extensionPeriods, setExtensionPeriods] = useState<ExtensionPeriod[]>(
    []
  );
  const [selectedPeriod, setSelectedPeriod] = useState<string>("");
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogContent, setDialogContent] = useState<{
    title: string;
    message: string;
    isError: boolean;
  }>({ title: "", message: "", isError: false });
  const [newExpiryDate, setNewExpiryDate] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [licenseState, setLicenseState] = useState<{
    isAlreadyRenewed?: boolean;
    isNotExpired?: boolean;
    canBeRenewed?: boolean;
  }>({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        // If we have a token, we're in the public flow
        if (token) {
          await fetchLicenseData(token);
        } else if (id) {
          // If we're logged in, we use the ID to fetch license data
          await fetchLicenseData(id);
        } else {
          setError("License ID or token is required");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error in fetchData:", err);
        let errorMessage = "Failed to load license data. Please try again.";
        if (err instanceof Error) {
          if ('response' in err) {
            const axiosError = err as { response?: { data?: any } };
            console.error("API Error Response:", axiosError.response?.data);
            errorMessage = axiosError.response?.data?.error || 
                         axiosError.response?.data?.message || 
                         errorMessage;
          } else {
            errorMessage = err.message;
          }
        }
        setError(errorMessage);
        setLoading(false);
      }
    };

    fetchData();
  }, [id, token]);

  const fetchLicenseData = async (idOrToken: string) => {
    try {
      let loaded: LicenseData | null = null;
      
      // Check if the parameter is a token (contains a colon)
      const isToken = idOrToken.includes(':');
      
      if (isToken) {
        // Token-based authentication path (public flow)
        const response = await api.post("/renew-license", { token: idOrToken });
        if (!response.data.success) {
          if (response.data.data?.isAlreadyRenewed) {
            setLicenseState({ isAlreadyRenewed: true });
            setLicenseData(response.data.data);
            return;
          }
          throw new Error(
            response.data.message || "Failed to fetch license data with token"
          );
        }
        loaded = response.data.data as LicenseData;
      } else {
        // ID-based authentication path (logged-in user)
        // Only use the ID path if it's a valid MongoDB ObjectId (24 hex characters)
        const isMongoId = /^[0-9a-fA-F]{24}$/.test(idOrToken);
        
        if (isMongoId) {
          const byId = await api.get(`/license/${idOrToken}`);
          loaded = byId.data as LicenseData;
          console.log("Loaded by ID:", loaded);
        } else {
          throw new Error("Invalid license ID format. Please check the URL and try again.");
        }
      }

      if (!loaded) throw new Error("Unable to load license data");

      // Check if the logged-in user is the CEM for this license or an admin
      const currentUser = getCurrentUser();
      if (
        currentUser?.empCode !== loaded?.cem?.empCode &&
        currentUser?.role !== "admin"
      ) {
        setError(
          `You are not authorized to renew this license. Only the designated CEM or an admin can renew this license.`
        );
        setLoading(false);
        return;
      }

      // Handle already renewed status consistently
      if (loaded.status === "renewed") {
        setLicenseData(loaded);
        setLicenseState({ isAlreadyRenewed: true });
        return;
      }

      setLicenseData(loaded);
      setLicenseState({ canBeRenewed: true });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if ("response" in error) {
          const axiosError = error as {
            response?: { data?: { message?: string } };
          };
          setError(
            axiosError.response?.data?.message ||
              error.message ||
              "Failed to fetch license data. Please try again later."
          );
        } else {
          setError(error.message);
        }
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchExtensionPeriods = async () => {
    try {
      const response = await api.get("/extension-periods");
      setExtensionPeriods(response.data);
      if (response.data.length > 0) {
        setSelectedPeriod(response.data[0]._id);
      }
    } catch (error) {
      console.error("Error fetching extension periods:", error);
      setError("Failed to load extension periods. Using default options.");
    }
  };

  useEffect(() => {
    fetchExtensionPeriods();
  }, []);

  const handleExtensionChange = (
    event: React.ChangeEvent<HTMLSelectElement>
  ) => {
    setSelectedPeriod(event.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Using predefined extension period
    const selectedExtension = extensionPeriods.find(
      (p) => p._id === selectedPeriod
    );
    if (!selectedExtension) {
      setError("Please select an extension period");
      return;
    }

    const daysToAdd = selectedExtension.days;
    const currentDate = new Date();
    const expiryDate = new Date(licenseData!.expiry);
    const gracePeriodEnd = new Date(expiryDate);
    gracePeriodEnd.setDate(
      gracePeriodEnd.getDate() + (licenseData?.grace_period || 0)
    );

    // Calculate new expiry date based on license status
    const newExpiry = new Date();

    if (currentDate > gracePeriodEnd) {
      // If license is expired (past expiry + grace period), extend from current date
      newExpiry.setDate(currentDate.getDate() + daysToAdd);
    } else {
      // If license is active or in grace period, extend from expiry date
      newExpiry.setTime(expiryDate.getTime());
      newExpiry.setDate(expiryDate.getDate() + daysToAdd);
    }

    // Save the new expiry date for use in the confirmation
    setNewExpiryDate(newExpiry);

    // Show confirmation dialog
    setOpenDialog(true);
    setDialogContent({
      title: "Confirm License Renewal",
      message: `Are you sure you want to renew this license? The license will be extended by ${daysToAdd} days until ${newExpiry.toLocaleDateString()}.`,
      isError: false,
    });
  };

  const confirmRenewal = async () => {
    console.log("Confirming renewal for license:", licenseData);
    if (!licenseData) return;

    try {
      setIsSubmitting(true);
      setError(null);

      const payload = {
        application: licenseData.application
          ? {
              _id: licenseData.application._id,
              name: licenseData.application.name,
              identifier:
                licenseData.application.identifier || licenseData.app_id,
            }
          : null,
        client: {
          _id: licenseData.client._id,
          name: licenseData.client.name,
          email: licenseData.client.email || "",
          contact: licenseData.client.contact || "",
          code: licenseData.client.code || "",
          country: licenseData.client.country || "",
        },
        cem: {
          _id: licenseData.cem._id,
          name: licenseData.cem.name,
          email: licenseData.cem.email,
          empCode: licenseData.cem.empCode,
          role: "cem",
        },
        source_key: {
          android: licenseData.source_key?.android || "",
          ios: licenseData.source_key?.ios || "",
        },
        grace_period: licenseData.grace_period,
        expiry: newExpiryDate
          ? newExpiryDate.toISOString()
          : new Date(licenseData.expiry).toISOString(),
        action: "renew",
      };

      // Use base URL's /issue (don't duplicate /dev)
      const response = await api.post("/issue", payload);

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

      // Reset form
      setSelectedPeriod("");
      setNewExpiryDate(null);
    } catch (error: unknown) {
      console.error("Error renewing license:", error);

      if (error instanceof Error) {
        if ("response" in error) {
          const axiosError = error as {
            response?: {
              data?: {
                message?: string;
              };
            };
          };

          if (
            axiosError.response?.data?.message?.includes(
              "not authorized to renew"
            )
          ) {
            setError(
              "You are not authorized to renew this license. Please contact your administrator."
            );
          } else {
            setError(
              axiosError.response?.data?.message ||
                error.message ||
                "Failed to renew license. Please try again later."
            );
          }
        } else {
          setError(error.message);
        }
      } else {
        setError("An unknown error occurred.");
      }
    } finally {
      setIsSubmitting(false);
      setOpenDialog(false);
    }
  };

  if (loading) {
    return (
      <Container
        maxWidth="md"
        sx={{ mt: 4, display: "flex", justifyContent: "center" }}
      >
        <CircularProgress />
      </Container>
    );
  }

  if (licenseState.isAlreadyRenewed && licenseData) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative">
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
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative">
      <Container maxWidth="md">
        {/* Confirmation Dialog */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          aria-labelledby="alert-dialog-title"
          aria-describedby="alert-dialog-description"
        >
          <DialogTitle id="alert-dialog-title">
            {dialogContent.title}
          </DialogTitle>
          <DialogContent>
            <DialogContentText id="alert-dialog-description">
              {dialogContent.message}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)} color="primary">
              Cancel
            </Button>
            <Button
              onClick={confirmRenewal}
              color="primary"
              autoFocus
              disabled={isSubmitting}
            >
              {isSubmitting ? "Renewing..." : "Confirm Renewal"}
            </Button>
          </DialogActions>
        </Dialog>
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
                      Application
                    </label>
                    <p className="text-gray-900">
                      {licenseData.application?.name || "N/A"}
                      {licenseData.application?.name &&
                        licenseData.app_id &&
                        " - "}
                      {licenseData.app_id}
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
                    <p className="text-gray-900">{licenseData.grace_period}</p>
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

                <div className="mt-6">
                  <div className="space-y-2">
                    <label
                      htmlFor="extensionPeriod"
                      className="block text-sm font-medium text-gray-700 mb-1"
                    >
                      Select Extension Period
                    </label>
                    <select
                      id="extensionPeriod"
                      value={selectedPeriod}
                      onChange={handleExtensionChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">-- Select an option --</option>
                      {extensionPeriods.map((period) => (
                        <option key={period._id} value={period._id}>
                          {period.name} - {period.days} days
                        </option>
                      ))}
                    </select>
                    {extensionPeriods.length === 0 && (
                      <p className="text-sm text-gray-500 mt-1">
                        No extension periods available
                      </p>
                    )}
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-200">
                  <button
                    type="submit"
                    disabled={isSubmitting || !selectedPeriod}
                    className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white ${
                      isSubmitting || !selectedPeriod
                        ? "bg-blue-300 cursor-not-allowed"
                        : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    }`}
                  >
                    {isSubmitting ? (
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
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
