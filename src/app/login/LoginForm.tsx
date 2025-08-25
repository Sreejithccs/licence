"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthData } from "@/utils/auth";
import {
  TextField,
  Button,
  Typography,
  Box,
  Paper,
  Alert,
  CircularProgress,
  Container,
} from "@mui/material";
import Link from "next/link";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  useEffect(() => {
    // If already logged in, redirect to callbackUrl
    if (typeof window !== "undefined" && localStorage.getItem("authToken")) {
      router.push(callbackUrl);
    }
  }, [router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (!process.env.NEXT_PUBLIC_AUTH_URL) {
        throw new Error("Authentication URL is not configured");
      }

      const response = await fetch(process.env.NEXT_PUBLIC_AUTH_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Authentication failed");
      }

      const data = await response.json();
      setAuthData(data.token, data.userData);
      router.push(callbackUrl);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "An error occurred during login"
      );
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Paper
          elevation={3}
          sx={{ p: 4, width: "100%", display: "flex", flexDirection: "column" }}
        >
          <Typography component="h1" variant="h5" align="center" gutterBottom>
            Sign in
          </Typography>
          {error && <Alert severity="error">{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={isLoading}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={isLoading}
            >
              {isLoading ? <CircularProgress size={24} /> : "Sign In"}
            </Button>
            <Box sx={{ textAlign: "center" }}>
              <Link href="/forgot-password" passHref>
                <Typography
                  variant="body2"
                  color="primary"
                  sx={{ cursor: "pointer" }}
                >
                  Forgot password?
                </Typography>
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
