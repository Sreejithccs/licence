"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Container, Paper, TextField, Button, Grid, Alert, Typography, MenuItem } from "@mui/material";
import Loader from "@/components/Loader";

interface LicenseForm {
  app_id: string;
  client: { id: string; name: string; contact: string };
  cem: { name: string; email: string; cem_code: string };
  source_key: { android?: string; ios?: string };
  grace_period: number;
  expiry: string;
}

export default function EditLicensePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params?.id as string;
  const [form, setForm] = useState<LicenseForm | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [cemOptions, setCemOptions] = useState<Array<{ name: string; cem_code: string }>>([]);
  const [cemLoading, setCemLoading] = useState(false);
  const [cemError, setCemError] = useState("");

  useEffect(() => {
    const fetchCems = async () => {
      try {
        setCemLoading(true);
        setCemError("");
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
        const token = sessionStorage.getItem("authToken");
        const resp = await fetch(`${apiBaseUrl}/users/cems`, { headers: { Authorization: `Bearer ${token}` } });
        if (!resp.ok) throw new Error(await resp.text());
        const data = await resp.json();
        setCemOptions(Array.isArray(data) ? data : []);
      } catch (e: any) { setCemError(e?.message || 'Failed to load CEMs'); }
      finally { setCemLoading(false); }
    };
    fetchCems();
    const fetchLicense = async () => {
      try {
        setLoading(true);
        setError("");
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
        const token = sessionStorage.getItem("authToken");
        console.log("Fetching license with ID:", id);
        console.log("API URL:", `${apiBaseUrl}/license/${id}`);
        
        const resp = await fetch(`${apiBaseUrl}/license/${id}`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });
        
        console.log("Response status:", resp.status);
        
        if (!resp.ok) {
          const errorText = await resp.text();
          console.error("Error response:", errorText);
          throw new Error(`Failed to load license: ${resp.status} ${errorText}`);
        }
        
        const data = await resp.json();
        console.log("License data received:", data);
        
        const formData = {
          app_id: data.app_id,
          client: data.client,
          cem: data.cem,
          source_key: data.source_key || {},
          // Backend stores grace_period in hours; convert to days string for UI
          grace_period: Math.max(0, Math.round((data.grace_period || 0) / 24)),
          expiry: new Date(data.expiry).toISOString().slice(0, 10),
        };
        console.log("Setting form data:", formData);
        setForm(formData);
      } catch (e: any) { 
        console.error("Error fetching license:", e);
        setError(e?.message || "Failed to load license"); 
      }
      finally { setLoading(false); }
    };
    if (id) fetchLicense();
  }, [id]);

  const onChange = (path: string, value: any) => {
    if (!form) return;
    
    console.log("onChange called:", path, value);
    
    // Deep clone the form object to avoid mutation issues
    const clone: any = {
      ...form,
      client: { ...form.client },
      cem: { ...form.cem },
      source_key: { ...form.source_key }
    };
    
    const parts = path.split(".");
    let cur = clone;
    
    // Navigate to the parent of the target property
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) {
        cur[parts[i]] = {};
      }
      cur = cur[parts[i]];
    }
    
    // Set the final value
    cur[parts[parts.length - 1]] = value;
    console.log("Updated form:", clone);
    setForm(clone);
  };

  const onSave = async () => {
    if (!form) return;
    try {
      setSaving(true);
      setError("");
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
      const token = sessionStorage.getItem("authToken");
      const dateOnly = form.expiry; // YYYY-MM-DD
      const isoExpiry = new Date(`${dateOnly}T00:00:00.000Z`).toISOString();
      // Convert grace_period days back to hours for backend
      const graceHours = Number(form.grace_period) * 24;
      // Only send editable fields: cem (name and cem_code) and grace_period
      const updateData: any = {
        cem: { name: form.cem.name, cem_code: form.cem.cem_code },
        grace_period: graceHours,
      };
      
      console.log("Saving license with ID:", id);
      console.log("Update data:", updateData);
      console.log("API URL:", `${apiBaseUrl}/license/${id}`);
      
      const resp = await fetch(`${apiBaseUrl}/license/${id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(updateData),
      });
      
      console.log("Save response status:", resp.status);
      
      if (!resp.ok) {
        const errorText = await resp.text();
        console.error("Save error response:", errorText);
        throw new Error(`Failed to save license: ${resp.status} ${errorText}`);
      }
      
      console.log("License saved successfully");
      router.push("/admin");
    } catch (e: any) { 
      console.error("Error saving license:", e);
      setError(e?.message || "Failed to save license"); 
    }
    finally { setSaving(false); }
  };

  if (loading) return <Loader message="Loading license…" />;
  if (error) return <Container sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;
  if (!form) return null;

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" sx={{ mb: 2 }}>Edit License</Typography>
        <Grid container spacing={2}>
          <Grid size={{xs: 12}}><TextField label="App ID" fullWidth value={form.app_id} disabled /></Grid>
          <Grid size={{xs: 12, md: 6}}><TextField label="Client ID" fullWidth value={form.client.id} disabled /></Grid>
          <Grid size={{xs: 12, md: 6}}><TextField label="Client Name" fullWidth value={form.client.name} disabled /></Grid>
          <Grid size={{xs: 12}}><TextField label="Client Contact" fullWidth value={form.client.contact} disabled /></Grid>
          <Grid size={{xs: 12, md: 8}}>
            <TextField 
              select 
              label="Select CEM" 
              fullWidth 
              value={form.cem.cem_code}
              onChange={(e) => {
                const code = e.target.value;
                const selected = cemOptions.find(o => o.cem_code === code);
                onChange("cem.cem_code", code);
                if (selected) onChange("cem.name", selected.name);
              }}
              helperText={cemError || (cemLoading ? 'Loading CEMs...' : '')}
              disabled={cemLoading}
            >
              {cemOptions.map(opt => (
                <MenuItem key={opt.cem_code} value={opt.cem_code}>{`${opt.name} (${opt.cem_code})`}</MenuItem>
              ))}
            </TextField>
          </Grid>
          {/* CEM email is read-only/sourced from User collection; no manual input */}
          <Grid size={{xs: 12, md: 6}}><TextField label="Android Key" fullWidth value={form.source_key.android || ''} disabled /></Grid>
          <Grid size={{xs: 12, md: 6}}><TextField label="iOS Key" fullWidth value={form.source_key.ios || ''} disabled /></Grid>
          <Grid size={{xs: 12, md: 6}}>
            <TextField 
              type="number" 
              label="Grace Period (days)" 
              fullWidth 
              value={form.grace_period}
              inputProps={{ min: 0 }}
              onChange={(e) => onChange("grace_period", Number(e.target.value))} 
            />
          </Grid>
          <Grid size={{xs: 12, md: 6}}><TextField type="date" label="Expiry" fullWidth value={form.expiry} disabled /></Grid>
          <Grid size={{xs: 12}} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
            <Button variant="outlined" onClick={() => router.push('/admin')}>Cancel</Button>
            <Button variant="contained" onClick={onSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
}
