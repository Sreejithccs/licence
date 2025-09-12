"use client";

import { Box, CircularProgress, Typography } from "@mui/material";

export default function Loader({ message }: { message?: string }) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center" justifyContent="center" minHeight="60vh">
      <CircularProgress />
      {message && (
        <Typography variant="body2" sx={{ mt: 2 }}>
          {message}
        </Typography>
      )}
    </Box>
  );
}


