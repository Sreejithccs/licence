"use client";

import { useRouter } from 'next/navigation';
import { getCurrentUser, UserRole } from "@/utils/auth";
import { handleLogout } from "@/utils/logout";
import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
} from "@mui/material";
import Link from "next/link";

interface SharedToolbarProps {
  title: string;
}

export default function SharedToolbar({ title }: SharedToolbarProps) {
  const router = useRouter();
  const user = getCurrentUser();

  const getHomePath = () => {
    if (!user) return '/';
    switch (user.role) {
      case UserRole.ADMIN:
        return '/admin';
      case UserRole.CEM:
        return '/cem-dashboard';
      default:
        return '/';
    }
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          {title}
        </Typography>
        <Box sx={{ display: "flex", gap: 2 }}>
          <Button 
            color="inherit" 
            component={Link} 
            href={getHomePath()}
          >
            Home
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            href="/validate-license"
          >
            Validate License
          </Button>
          <Button 
            color="inherit" 
            onClick={() => handleLogout(router)}
          >
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
