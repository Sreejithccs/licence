"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Paper, Box } from "@mui/material";
import LicenseForm from "@/components/LicenseForm";
import { LicenseFormData, LicenseSubmitData } from "@/types/license";
import Loader from "@/components/Loader";
import { User, Application, Client } from "@/types/models";

export default function EditLicensePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const [formData, setFormData] = useState<LicenseFormData>({
    application: {
      _id: "",
      name: "",
      identifier: "",
    },
    client: {
      _id: "",
      name: "",
      email: "",
    },
    cem: {
      _id: "",
      name: "",
      email: "",
      role: "",
      empCode: "",
    },
    grace_period: 0,
    source_key: {
      android: "",
      ios: "",
    },
    expiry: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cemOptions, setCemOptions] = useState<User[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cemLoading, setCemLoading] = useState(false);
  const [cemError, setCemError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchCems = async () => {
      try {
        setCemLoading(true);
        setCemError("");
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
        const token = sessionStorage.getItem("authToken");
        const resp = await fetch(`${apiBaseUrl}/users/cems`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        console.log("cem data: ", data);
        setCemOptions(Array.isArray(data) ? data : []);
      } catch (e: unknown) {
        setCemError(e instanceof Error ? e.message : "Failed to load CEMs");
      } finally {
        setCemLoading(false);
      }
    };

    const fetchApplications = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
        const token = sessionStorage.getItem("authToken");
        const response = await fetch(`${apiBaseUrl}/applications`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch applications");
        const data = await response.json();
        console.log("applications data: ", data.applications);
        setApplications(
          Array.isArray(data.applications) ? data.applications : []
        );
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    const fetchClients = async () => {
      try {
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
        const token = sessionStorage.getItem("authToken");
        const response = await fetch(`${apiBaseUrl}/clients`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) throw new Error("Failed to fetch clients");
        const data = await response.json();
        console.log("clients data: ", data.clients);
        setClients(Array.isArray(data.clients) ? data.clients : []);
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };

    const fetchLicense = async () => {
      try {
        setLoading(true);
        setError("");
        const apiBaseUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
        const token = sessionStorage.getItem("authToken");
        const resp = await fetch(`${apiBaseUrl}/license/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (!resp.ok) {
          const errorText = await resp.text();
          throw new Error(
            `Failed to load license: ${resp.status} ${errorText}`
          );
        }

        const data = await resp.json();
        console.log("data: ", data);

        setFormData({
          application: data.application?._id || "",
          client: data.client?._id || "",
          cem: data.cem?._id || "",
          grace_period:
            typeof data.grace_period === "number"
              ? Math.max(0, Math.round(data.grace_period / 24))
              : 0,
          source_key: {
            android: data.source_key?.android || "",
            ios: data.source_key?.ios || "",
          },
          expiry: data.expiry ? new Date(data.expiry) : null,
          status: data.status,
        });
      } catch (e: unknown) {
        console.error("Error fetching license:", e);
        setError(e instanceof Error ? e.message : "Failed to load license");
      } finally {
        setLoading(false);
      }
    };

    const loadData = async () => {
      await Promise.all([fetchCems(), fetchApplications(), fetchClients()]);
      if (id) await fetchLicense();
    };

    loadData();
  }, [id]);

  // This function handles the form submission with LicenseSubmitData
  const handleSubmit = async (submitData: LicenseSubmitData): Promise<void> => {
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
      const token = sessionStorage.getItem("authToken");

      const resp = await fetch(`${apiBaseUrl}/license/${id}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(submitData),
      });

      if (!resp.ok) {
        const errorText = await resp.text();
        throw new Error(`Failed to save license: ${resp.status} ${errorText}`);
      }

      setSuccess("License updated successfully!");
      setTimeout(() => {
        router.push("/admin");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save license");
    } finally {
      setLoading(false);
    }
  };

  // Only show loader if we haven't loaded the license data yet
  if (loading && !formData.application && !formData.client)
    return <Loader message="Loading license…" />;

  // This function is passed to the LicenseForm component
  // It handles the form submission with LicenseSubmitData
  const handleFormSubmit = async (
    submitData: LicenseSubmitData
  ): Promise<void> => {
    // Call the actual submit handler with the converted data
    await handleSubmit(submitData);
  };

  return (
    <Box
      sx={{ minHeight: "inherit", display: "flex", flexDirection: "column" }}
    >
      <Container maxWidth="md" sx={{ py: 4, flex: "1 0 auto" }}>
        <Paper sx={{ p: 3 }}>
          <LicenseForm
            initialData={formData}
            onSubmit={handleFormSubmit}
            cemOptions={cemOptions}
            applications={applications}
            clients={clients}
            loading={{
              applications: loading,
              clients: loading,
              cems: cemLoading,
              submit: submitting,
            }}
            error={error}
            success={success}
            isEditMode={true}
            onCancel={() => router.push("/admin")}
            editableFields={["cem"]} // Only allow editing CEM field
          />
        </Paper>
      </Container>
    </Box>
  );
}
