"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Container, Typography, Paper, TextField, Button, Grid, MenuItem, Box, Alert } from "@mui/material";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

export default function CreateLicensePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [formData, setFormData] = useState({
    appId: "",
    clientId: "",
    clientName: "",
    clientContact: "",
    cemName: "",
    cemEmail: "",
    cemCode: "",
    gracePeriod: "5",
    androidKey: "",
    iosKey: "",
    expiryDate: null as Date | null,
  });

  const [cemOptions, setCemOptions] = useState<Array<{ name: string; cem_code: string }>>([]);
  const [cemLoading, setCemLoading] = useState(false);
  const [cemError, setCemError] = useState("");

  useEffect(() => {
    const fetchCems = async () => {
      try {
        setCemLoading(true);
        setCemError("");
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/dev';
        const token = sessionStorage.getItem('authToken');
        const resp = await fetch(`${apiBaseUrl}/users/cems`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!resp.ok) {
          const text = await resp.text();
          throw new Error(text || 'Failed to load CEMs');
        }
        const data = await resp.json();
        setCemOptions(Array.isArray(data) ? data : []);
      } catch (e: any) {
        setCemError(e?.message || 'Failed to load CEMs');
      } finally { setCemLoading(false); }
    };
    fetchCems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateChange = (date: Date | null) => {
    setFormData((prev) => ({ ...prev, expiryDate: date }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/dev';
      const token = sessionStorage.getItem('authToken');
      const response = await fetch(`${apiBaseUrl}/issue`, {
        method: "POST",
        headers: { "Content-Type": "application/json", 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          app_id: formData.appId,
          client: { id: formData.clientId, name: formData.clientName, contact: formData.clientContact },
          cem: { name: formData.cemName, cem_code: formData.cemCode },
          // Backend stores grace_period in hours; convert days -> hours
          grace_period: parseInt(formData.gracePeriod, 10) * 24,
          source_key: { android: formData.androidKey, ios: formData.iosKey },
          expiry: formData.expiryDate,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Failed to create license");

      setSuccess("License created successfully!");
      setTimeout(() => { router.push("/admin"); }, 1200);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally { setLoading(false); }
  };

  return (
    <Container maxWidth="md">
      <Typography variant="h4" component="h1" gutterBottom>Create License</Typography>
      <Paper sx={{ p: 3, mt: 3 }}>
        {error && (<Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>)}
        {success && (<Alert severity="success" sx={{ mb: 3 }}>{success}</Alert>)}
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid size={{xs: 12}}><TextField required fullWidth label="Application ID" name="appId" value={formData.appId} onChange={handleChange} /></Grid>
            <Grid size={{xs: 12}}>
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <DatePicker label="Expiry Date" value={formData.expiryDate} onChange={handleDateChange} slotProps={{ textField: { fullWidth: true, required: true } }} />
              </LocalizationProvider>
            </Grid>
            <Grid size={{xs: 12}}><Typography variant="h6">Client</Typography></Grid>
            <Grid size={{xs: 12, md: 6}}><TextField required fullWidth label="Client ID" name="clientId" value={formData.clientId} onChange={handleChange} /></Grid>
            <Grid size={{xs: 12, md: 6}}><TextField required fullWidth label="Client Name" name="clientName" value={formData.clientName} onChange={handleChange} /></Grid>
            <Grid size={{xs: 12}}><TextField required fullWidth label="Client Contact" name="clientContact" value={formData.clientContact} onChange={handleChange} /></Grid>
            <Grid size={{xs: 12}}><Typography variant="h6">CEM</Typography></Grid>
            <Grid size={{xs: 12, md: 8}}>
              <TextField 
                select 
                required 
                fullWidth 
                label="Select CEM" 
                value={formData.cemCode}
                onChange={(e) => {
                  const code = e.target.value;
                  const selected = cemOptions.find(o => o.cem_code === code);
                  setFormData(prev => ({ ...prev, cemCode: code, cemName: selected?.name || '' }));
                }}
                helperText={cemError || (cemLoading ? 'Loading CEMs...' : '')}
                disabled={cemLoading}
              >
                {cemOptions.map(opt => (
                  <MenuItem key={opt.cem_code} value={opt.cem_code}>{`${opt.name} (${opt.cem_code})`}</MenuItem>
                ))}
              </TextField>
            </Grid>
            {/* CEM email is sourced from User collection; no manual input */}
            <Grid size={{xs: 12, md: 6}}><TextField fullWidth label="Android Key" name="androidKey" value={formData.androidKey} onChange={handleChange} /></Grid>
            <Grid size={{xs: 12, md: 6}}><TextField fullWidth label="iOS Key" name="iosKey" value={formData.iosKey} onChange={handleChange} /></Grid>
            <Grid size={{xs: 12, md: 6}}>
              <TextField 
                fullWidth 
                label="Grace Period (days)" 
                name="gracePeriod" 
                type="number"
                inputProps={{ min: 0 }}
                value={formData.gracePeriod}
                onChange={handleChange}
              />
            </Grid>
            <Grid size={{xs: 12}} sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button variant="outlined" onClick={() => router.push('/admin')} disabled={loading}>Cancel</Button>
              <Button type="submit" variant="contained" disabled={loading}>{loading ? 'Creating…' : 'Create License'}</Button>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Container>
  );
}
