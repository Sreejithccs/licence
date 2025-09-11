"use client";

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setAuthData, UserRole, getAuthToken } from "@/utils/auth";
import { getUserByEmpCode } from "@/utils/userService";
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

interface AuthResponse {
  token: string;
  userData: {
    _id: string;
    userId: string;
    employeeID: string;
    role: {
      roleType: string;
      read: boolean;
      write: boolean;
      edit: boolean;
    };
    name: string;
    mail: string;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

interface LoginFormProps {
  callbackUrl?: string;
}

export default function LoginForm({ callbackUrl = "/" }: LoginFormProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // If already logged in, redirect to callbackUrl
    if (typeof window !== "undefined" && sessionStorage.getItem("authToken")) {
      router.push(callbackUrl);
    }
  }, [router, callbackUrl]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (!username || !password) {
      setError("Please enter both username and password");
      return;
    }

    setIsLoading(true);

    try {
      const authUrl =
        process.env.NEXT_PUBLIC_AUTH_URL || "http://localhost:3000/dev/login";
      const response = await fetch(authUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          username: username.trim(),
          password: password,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Authentication failed");
      }

      const data: AuthResponse = await response.json();
      console.log("Login response data:", data);

      if (!data.token || !data.userData) {
        throw new Error("Invalid response from authentication server");
      }

      console.log("Token received:", data.token.substring(0, 50) + "...");

      // First, set the basic auth data
      const tempUserData = {
        id: data.userData._id,
        username: data.userData.userId,
        empCode: data.userData.employeeID,
        role: data.userData.role.roleType as UserRole, // This will be updated from server
        isActive: true,
        name: data.userData.name,
        mail: data.userData.mail,
        createdAt: data.userData.createdAt,
        updatedAt: data.userData.updatedAt,
        __v: data.userData.__v,
      };

      // Store the token and temporary user data
      setAuthData(data.token, tempUserData);
      console.log(
        "Token stored in sessionStorage:",
        sessionStorage.getItem("authToken") ? "Yes" : "No"
      );
      console.log(
        "Stored token preview:",
        sessionStorage.getItem("authToken")?.substring(0, 50) + "..."
      );

      try {
        // Fetch the latest user data from the server using the serverless endpoint
        const serverUserData = await getUserByEmpCode(
          data.userData.employeeID,
          data.token
        );

        // Update the user data with the role from the server
        const updatedUserData = {
          ...tempUserData,
          role: serverUserData.role as UserRole,
        };

        // Update the stored user data with the role from the server
        sessionStorage.setItem("userData", JSON.stringify(updatedUserData));
      } catch (error) {
        console.error("Error fetching user role:", error);
        // Continue with the original data if there's an error
      }

      // Clear form fields
      setUsername("");
      setPassword("");

      // Get the final user data (either from server or fallback to temp data)
      const finalUserData = JSON.parse(
        sessionStorage.getItem("userData") || "{}"
      );
      const userRole = finalUserData.role || tempUserData.role;
      // Use the callbackUrl if provided, otherwise use role-based redirect
      if (callbackUrl) {
        router.push(callbackUrl);
      } else if (userRole === UserRole.ADMIN) {
        router.push("/admin");
      } else if (userRole === UserRole.CEM) {
        router.push("/cem-dashboard");
      } else {
        router.push("/");
      }
    } catch (err) {
      console.error("Login error:", err);
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
          <Box
            component="form"
            onSubmit={handleSubmit}
            sx={{ mt: 2 }}
            method="post"
            action="#"
          >
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
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
