"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { getCurrentUser, UserRole } from "@/utils/auth";
import { Alert, Snackbar } from "@mui/material";
import {
  Container,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  IconButton,
  Chip,
  Box,
  TextField,
  InputAdornment,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Autorenew as RenewIcon,
} from "@mui/icons-material";
import type { ChipProps } from "@mui/material";
import { format } from "date-fns";

// Deprecated token-based renewal utility removed (unused)

type License = {
  _id: string;
  licenseKey: string;
  application: {
    _id: string;
    name: string;
  };
  client: {
    _id: string;
    name: string;
    email: string;
  };
  cem: {
    id: string;
    name: string;
    empCode: string;
  };
  expiry: string;
  status: "active" | "expired" | "revoked" | "suspended";
  grace_period: number;
  source_key: {
    android?: string;
    ios?: string;
  };
  createdAt: string;
  updatedAt: string;
  __v?: number;
};

interface LicenseListingProps {
  showAddButton?: boolean;
  title?: string;
  hideCemColumn?: boolean;
}

export default function LicenseListing({
  showAddButton = false,
  title = "License Management",
  hideCemColumn = false,
}: LicenseListingProps) {
  const router = useRouter();
  const user = getCurrentUser();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [licenseToDelete, setLicenseToDelete] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [toastOpen, setToastOpen] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchLicenses = async () => {
    try {
      setLoading(true);
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(`${apiBaseUrl}/licenses`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) throw new Error("Failed to fetch licenses");
      const data = await response.json();
      setLicenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load licenses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLicenses();
  }, []);

  // Filter and sort licenses by expiry date (soonest first)
  const getFilteredLicenses = () => {
    let filtered = [...licenses]; // Create a copy to avoid mutating the original array

    // Apply search filter if search term exists
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (l: License) =>
          l.application.name.toLowerCase().includes(q) ||
          l.client.name.toLowerCase().includes(q) ||
          l.client.email.toLowerCase().includes(q) ||
          l.cem.empCode.toLowerCase().includes(q) ||
          l.licenseKey.toLowerCase().includes(q) ||
          l.status.toLowerCase().includes(q)
      );
    }

    // Sort by expiry date (soonest first)
    filtered.sort((a, b) => {
      const dateA = new Date(a.expiry).getTime();
      const dateB = new Date(b.expiry).getTime();
      return dateA - dateB; // Ascending order (earliest date first)
    });

    return filtered;
  };

  const filteredLicenses = getFilteredLicenses();
  const pagedLicenses = filteredLicenses.slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage
  );

  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDeleteConfirm = async () => {
    if (!licenseToDelete) return;
    try {
      const apiBaseUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/dev";
      const token = sessionStorage.getItem("authToken");
      const response = await fetch(
        `${apiBaseUrl}/licenses/${licenseToDelete}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to delete license");
      }
      await fetchLicenses();
      setDeleteDialogOpen(false);
      setLicenseToDelete(null);
      setToastOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete license");
    }
  };

  const getStatusColor = (status: string): ChipProps["color"] => {
    switch (status) {
      case "active":
        return "success";
      case "expired":
        return "error";
      case "suspended":
        return "warning";
      case "revoked":
        return "error";
      default:
        return "default";
    }
  };

  const canEdit = () => {
    // Only admin can edit licenses
    return user?.role === UserRole.ADMIN;
  };

  const canDelete = () => {
    // Only admin can delete licenses
    return user?.role === UserRole.ADMIN;
  };

  const canRenew = (license: License) => {
    // Admin can renew all licenses
    if (user?.role === UserRole.ADMIN) return true;
    // CEM can only renew licenses where their empCode matches empCode
    if (user?.role === UserRole.CEM)
      return license.cem.empCode === user.empCode;
    return false;
  };

  const handleRenewClick = (license: License) => {
    if (!canRenew(license)) return;
    // Pass plain params when authenticated
    router.push(`/license-renewal?id=${encodeURIComponent(license._id)}`);
  };

  if (loading && licenses.length === 0) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h4" component="h1">
          {title}
        </Typography>
        {showAddButton && user?.role === UserRole.ADMIN && (
          <Button
            variant="contained"
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => router.push("/admin/create")}
          >
            Add New License
          </Button>
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2, mb: 3 }}>
        <TextField
          fullWidth
          variant="outlined"
          placeholder="Search licenses..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper sx={{ width: "100%", overflow: "hidden" }}>
        <TableContainer sx={{ maxHeight: "calc(100vh - 300px)" }}>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>App</TableCell>
                <TableCell>Client</TableCell>
                {!hideCemColumn && <TableCell>CEM</TableCell>}
                <TableCell>Expiry Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedLicenses.length > 0 ? (
                pagedLicenses.map((license) => (
                  <TableRow key={license._id} hover>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {license.application.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2">
                          {license.client.name}
                        </Typography>
                      </Box>
                    </TableCell>
                    {!hideCemColumn && (
                      <TableCell>
                        <Box>
                          <Typography variant="subtitle2">
                            {license.cem.name}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                    <TableCell>
                      {format(new Date(license.expiry), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={license.status.toUpperCase()}
                        color={getStatusColor(license.status)}
                        size="small"
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Box display="flex" justifyContent="flex-end" gap={1}>
                        {canEdit() && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() =>
                                router.push(`/admin/edit/${license._id}`)
                              }
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canRenew(license) && (
                          <Tooltip title="Renew">
                            <IconButton
                              size="small"
                              onClick={() => handleRenewClick(license)}
                            >
                              <RenewIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {canDelete() && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              color="error"
                              onClick={() => {
                                setLicenseToDelete(license._id);
                                setDeleteDialogOpen(true);
                              }}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">
                      {searchTerm
                        ? "No matching licenses found"
                        : "No licenses found"}
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={filteredLicenses.length}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25, 50]}
        />
      </Paper>

      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle className="text-lg font-semibold">
          Confirm Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText className="text-gray-600">
            Are you sure you want to delete this license? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialogOpen(false)} variant="outlined">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={toastOpen}
        autoHideDuration={2500}
        onClose={() => setToastOpen(false)}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert
          onClose={() => setToastOpen(false)}
          severity="success"
          variant="filled"
          sx={{ width: "100%" }}
        >
          License deleted successfully
        </Alert>
      </Snackbar>
    </Container>
  );
}
