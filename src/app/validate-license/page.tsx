'use client';

import React, { useState } from 'react';
// removed unused useRouter and AxiosError imports
import { 
  Container, 
  Typography, 
  TextField, 
  Button, 
  Paper, 
  Box, 
  CircularProgress, 
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent
} from '@mui/material';
import api from '@/utils/api';

export default function ValidateLicense() {
  const [appId, setAppId] = useState('');
  const [sourceKey, setSourceKey] = useState('');
  const [os, setOs] = useState<'android' | 'ios'>('android');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    licenseKey?: string;
    expiry?: string;
  } | null>(null);
  // removed unused router

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!appId || !sourceKey) {
      setError('Please provide both App ID and Source Key');
      return;
    }

    try {
      setLoading(true);
      setError('');
      setValidationResult(null);

      // Format the key as os_sourceKey
      const formattedKey = `${os}_${sourceKey}`;
      
      const response = await api.get('/validate', {
        params: {
          app_id: appId,
          key: formattedKey,
        },
      });

      setValidationResult({
        valid: response.data.valid,
        message: response.data.message,
        licenseKey: response.data.license?.licenseKey,
        expiry: response.data.license?.expiry,
      });
    } catch (err) {
      console.error('Validation error:', err);
      
      if (err instanceof Error) {
        if ('response' in err) {
          const axiosError = err as { response?: { data?: { message?: string } } };
          setError(
            axiosError.response?.data?.message ||
            err.message ||
            'Failed to validate license. Please try again.'
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('An unknown error occurred during validation.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleOsChange = (e: SelectChangeEvent) => {
    setOs(e.target.value as 'android' | 'ios');
  };

  return (
    <Container maxWidth="md">
      
      <Paper sx={{ p: 4, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Enter License Details
        </Typography>
        
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <TextField
            fullWidth
            label="App ID"
            value={appId}
            onChange={(e) => setAppId(e.target.value)}
            margin="normal"
            required
            disabled={loading}
          />
          
          <FormControl fullWidth margin="normal" required>
            <InputLabel id="os-select-label">Operating System</InputLabel>
            <Select
              labelId="os-select-label"
              id="os-select"
              value={os}
              label="Operating System"
              onChange={handleOsChange}
              disabled={loading}
            >
              <MenuItem value="android">Android</MenuItem>
              <MenuItem value="ios">iOS</MenuItem>
            </Select>
          </FormControl>
          
          <TextField
            fullWidth
            label="Source Key"
            value={sourceKey}
            onChange={(e) => setSourceKey(e.target.value)}
            margin="normal"
            required
            disabled={loading}
            helperText="Enter the source key without the OS prefix"
          />
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box sx={{ mt: 2 }}>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              {loading ? 'Validating...' : 'Validate License'}
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {validationResult && (
        <Paper sx={{ p: 4, mt: 4 }}>
          <Typography variant="h6" gutterBottom>
            Validation Result
          </Typography>
          
          <Alert 
            severity={validationResult.valid ? 'success' : 'error'}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle1" fontWeight="bold">
              {validationResult.valid ? 'Valid License' : 'Invalid License'}
            </Typography>
            <Typography>{validationResult.message}</Typography>
            
            {validationResult.valid && validationResult.licenseKey && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="body2">
                  <strong>License Key:</strong> {validationResult.licenseKey}
                </Typography>
                {validationResult.expiry && (
                  <Typography variant="body2">
                    <strong>Expiry Date:</strong>{' '}
                    {new Date(validationResult.expiry).toLocaleDateString()}
                  </Typography>
                )}
              </Box>
            )}
          </Alert>
          
          {validationResult.valid && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              The license is valid for {os.toUpperCase()} devices with the provided source key.
            </Typography>
          )}
        </Paper>
      )}
    </Container>
  );
}
