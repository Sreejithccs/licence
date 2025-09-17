"use client";

import { useState, useEffect } from "react";
import {
  Typography,
  TextField,
  Button,
  Box,
  MenuItem,
  Alert,
  CircularProgress,
} from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LicenseFormData, LicenseSubmitData } from "@/types/license";
import { Application, Client, User } from "@/types/models";

interface LicenseFormProps {
  initialData: LicenseFormData;
  onSubmit: (data: LicenseSubmitData) => Promise<void>;
  applications: Application[];
  clients: Client[];
  cemOptions: User[];
  loading: {
    applications: boolean;
    clients: boolean;
    cems: boolean;
    submit: boolean;
  };
  error?: string;
  success?: string;
  isEditMode?: boolean;
  onCancel: () => void;
  editableFields?: string[];
}

export default function LicenseForm({
  initialData,
  onSubmit,
  applications,
  clients,
  cemOptions,
  loading,
  error: propError,
  success,
  isEditMode = false,
  onCancel,
  editableFields = [],
}: LicenseFormProps) {
  const [formData, setFormData] = useState<LicenseFormData>(initialData);
  const [error, setError] = useState<string | undefined>(propError);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Update form data when initialData changes (for edit mode)
  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    // Handle nested source_key updates
    if (name.startsWith("source_key.")) {
      const key = name.split(".")[1] as "android" | "ios";
      setFormData((prev) => ({
        ...prev,
        source_key: {
          ...prev.source_key,
          [key]: value,
        },
      }));
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }

    // Clear error when user makes changes
    setError(undefined);
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, expiry: date }));
    setError(undefined);
  };

  const validateForm = () => {
    const errors: string[] = [];

    if (!formData.source_key?.android && !formData.source_key?.ios) {
      errors.push("At least one source key (Android or iOS) is required");
    }

    if (!formData.application) {
      errors.push("Application selection is required");
    }

    if (!formData.client) {
      errors.push("Client selection is required");
    }

    if (!formData.grace_period) {
      errors.push("Grace period is required");
    } else if (
      isNaN(Number(formData.grace_period)) ||
      Number(formData.grace_period) < 0
    ) {
      errors.push("Grace period must be a positive number");
    }

    if (!formData.expiry) {
      errors.push("Expiry date is required");
    } else if (new Date(formData.expiry) < new Date()) {
      errors.push("Expiry date must be in the future");
    }

    if (!formData.cem) {
      errors.push("CEM selection is required");
    }

    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Perform validation first
    const validationErrors = validateForm();
    if (validationErrors.length > 0) {
      setIsSubmitted(true);
      setError(validationErrors.join(", "));
      return;
    }

    // Clear any previous errors
    setError("");

    // Transform form data to match backend expectations
    const submitData: LicenseSubmitData = {
      application: formData.application,
      client: formData.client,
      cem: formData.cem,
      source_key: {
        android: formData.source_key.android || undefined,
        ios: formData.source_key.ios || undefined,
      },
      expiry: formData.expiry ? formData.expiry.toISOString() : "",
      grace_period: Number(formData.grace_period) * 24,
      ...(isEditMode && formData.status ? { status: formData.status } : {}),
    };

    try {
      // Set submitting state
      setIsSubmitted(true);

      // Call the parent's onSubmit handler and wait for it to complete
      await onSubmit(submitData);

      // Only reset form if we're in create mode and submission was successful
      if (!isEditMode) {
        setFormData(initialData);
        setIsSubmitted(false);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit form");
      setIsSubmitted(false);
    }
  };

  // Only render the form when all required data is loaded
  const isFormReady =
    !loading.applications && !loading.clients && !loading.cems;

  if (!isFormReady) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", my: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: "auto", p: 2 }}>
      <Typography variant="h5" sx={{ mb: 2 }}>
        {isEditMode ? "Edit" : "Create"} License
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <form onSubmit={handleSubmit}>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            select
            required
            fullWidth
            label="Application"
            name="application"
            value={formData.application || ""}
            onChange={handleChange}
            disabled={
              loading.applications ||
              (isEditMode && !editableFields.includes("application"))
            }
            error={isSubmitted && !formData.application}
            helperText={
              isSubmitted && !formData.application
                ? "Application selection is required"
                : ""
            }
          >
            {loading.applications ? (
              <MenuItem disabled>Loading applications...</MenuItem>
            ) : applications.length > 0 ? (
              applications.map((app: Application) => (
                <MenuItem key={app._id} value={app._id}>
                  {app.name}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No applications available</MenuItem>
            )}
          </TextField>

          <TextField
            select
            required
            fullWidth
            label="Client"
            name="client"
            value={formData.client || ""}
            onChange={handleChange}
            disabled={
              loading.clients ||
              (isEditMode && !editableFields.includes("client"))
            }
          >
            {clients.map((client: Client) => (
              <MenuItem key={client._id} value={client._id}>
                {client.name}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            required
            fullWidth
            label="Select CEM"
            name="cem"
            value={formData.cem || ""}
            onChange={handleChange}
            disabled={
              loading.cems || (isEditMode && !editableFields.includes("cem"))
            }
          >
            {cemOptions.map((cem: User) => (
              <MenuItem key={cem._id} value={cem._id}>
                {cem.name} ({cem.empCode})
              </MenuItem>
            ))}
          </TextField>

          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              fullWidth
              label="Android Key"
              name="source_key.android"
              value={formData.source_key?.android || ""}
              onChange={handleChange}
              disabled={isEditMode && !editableFields.includes("source_key")}
            />
            <TextField
              fullWidth
              label="iOS Key"
              name="source_key.ios"
              value={formData.source_key?.ios || ""}
              onChange={handleChange}
              disabled={isEditMode && !editableFields.includes("source_key")}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 2 }}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="Expiry Date"
                value={formData.expiry}
                onChange={handleDateChange}
                disabled={isEditMode && !editableFields.includes("expiry")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    required: true,
                    disabled: isEditMode && !editableFields.includes("expiry"),
                  },
                }}
              />
            </LocalizationProvider>
            <TextField
              fullWidth
              required={isSubmitted}
              label="Grace Period (days)"
              name="grace_period"
              type="number"
              inputProps={{ min: 0 }}
              value={formData.grace_period}
              onChange={handleChange}
              disabled={isEditMode && !editableFields.includes("grace_period")}
            />
          </Box>

          <Box
            sx={{ display: "flex", justifyContent: "flex-end", gap: 2, mt: 2 }}
          >
            <Button
              variant="outlined"
              onClick={onCancel}
              disabled={loading.submit}
            >
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={loading.submit}>
              {loading.submit
                ? isEditMode
                  ? "Saving..."
                  : "Creating..."
                : isEditMode
                ? "Save"
                : "Create"}
            </Button>
          </Box>
        </Box>
      </form>
    </Box>
  );
}
