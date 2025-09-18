"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Paper, Box } from "@mui/material";
import LicenseForm from "@/components/LicenseForm";
import { Application, Client, User } from "@/types/models";
import { LicenseFormData, LicenseSubmitData } from "@/types/license";

export default function CreateLicensePage() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [applications, setApplications] = useState<Application[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [cemOptions, setCemOptions] = useState<User[]>([]);
  const [loading, setLoading] = useState({
    applications: false,
    clients: false,
    cems: false,
    submit: false,
  });

  const apiBaseUrl =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";

  const initialFormData: LicenseFormData = {
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
    grace_period: 5,
    source_key: {
      android: "",
      ios: "",
    },
    expiry: null,
  };

  // Fetch applications, clients, and CEMs on component mount
  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem("authToken");
      const headers = { Authorization: `Bearer ${token}` };

      try {
        // Fetch applications
        setLoading((prev) => ({ ...prev, applications: true }));
        const appsResp = await fetch(`${apiBaseUrl}/applications`, { headers });
        if (!appsResp.ok) throw new Error("Failed to load applications");
        const appsData = await appsResp.json();
        console.log("appsData: ", appsData.applications);
        setApplications(appsData.applications);

        // Fetch clients
        setLoading((prev) => ({ ...prev, clients: true }));
        const clientsResp = await fetch(`${apiBaseUrl}/clients`, { headers });
        if (!clientsResp.ok) throw new Error("Failed to load clients");
        const clientsData = await clientsResp.json();
        console.log("clientsData: ", clientsData.clients);
        setClients(clientsData.clients);

        // Fetch CEMs
        setLoading((prev) => ({ ...prev, cems: true }));
        const cemResp = await fetch(`${apiBaseUrl}/users/cems`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!cemResp.ok) {
          const text = await cemResp.text();
          throw new Error(text || "Failed to load CEMs");
        }
        const cemData = await cemResp.json();
        console.log("cemData: ", cemData);
        setCemOptions(Array.isArray(cemData) ? cemData : []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load data");
      } finally {
        setLoading((prev) => ({
          ...prev,
          applications: false,
          clients: false,
          cems: false,
        }));
      }
    };
    fetchData();
  }, [apiBaseUrl]);

  const handleSubmit = async (data: LicenseSubmitData) => {
    setLoading((prev) => ({ ...prev, submit: true }));
    setError("");
    setSuccess("");

    try {
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`${apiBaseUrl}/licenses/issue`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          application: data.application,
          client: data.client,
          cem: data.cem,
          source_key: data.source_key,
          grace_period: data.grace_period,
          expiry: data.expiry,
        }),
      });

      const responseData = await response.json();
      if (!response.ok) {
        throw new Error(responseData.message || "Failed to create license");
      }

      setSuccess("License created successfully!");
      setTimeout(() => {
        router.push("/admin");
      }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading((prev) => ({ ...prev, submit: false }));
    }
  };

  return (
    <Box
      sx={{ minHeight: "inherit", display: "flex", flexDirection: "column" }}
    >
      <Container maxWidth="md" sx={{ py: 4, flex: "1 0 auto" }}>
        <Paper sx={{ p: 3 }}>
          <LicenseForm
            initialData={initialFormData}
            onSubmit={handleSubmit}
            applications={applications}
            clients={clients}
            cemOptions={cemOptions}
            loading={loading}
            error={error}
            success={success}
            onCancel={() => router.push("/admin")}
          />
        </Paper>
      </Container>
    </Box>
  );
}
