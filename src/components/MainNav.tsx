'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getAuthToken, removeAuthToken } from '@/utils/auth';
import { Button, AppBar, Toolbar, Typography, Box, IconButton } from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import GppGoodIcon from '@mui/icons-material/GppGood';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';

export default function MainNav() {
  const pathname = usePathname();
  const isAuthenticated = !!getAuthToken();

  const handleLogout = () => {
    removeAuthToken();
    window.location.href = '/login';
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}>
          <VpnKeyIcon sx={{ mr: 1 }} />
          License Manager
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            color="inherit" 
            component={Link} 
            href="/"
            startIcon={<HomeIcon />}
            sx={{ 
              bgcolor: pathname === '/' ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Home
          </Button>
          
          <Button 
            color="inherit" 
            component={Link} 
            href="/licenses"
            startIcon={<VpnKeyIcon />}
            sx={{ 
              bgcolor: pathname.startsWith('/licenses') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Manage Licenses
          </Button>
          
          <Button 
            color="inherit" 
            component={Link} 
            href="/validate-license"
            startIcon={<GppGoodIcon />}
            sx={{ 
              bgcolor: pathname.startsWith('/validate-license') ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
              '&:hover': { bgcolor: 'rgba(255, 255, 255, 0.1)' }
            }}
          >
            Validate License
          </Button>
          
          <IconButton 
            color="inherit" 
            onClick={handleLogout}
            sx={{ ml: 1 }}
            title="Logout"
          >
            <ExitToAppIcon />
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
