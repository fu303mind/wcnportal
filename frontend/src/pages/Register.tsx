import React from 'react';
import { Box, Button, Paper, TextField, Typography, Alert, MenuItem } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(12, 'Password must be at least 12 characters').regex(/[A-Z]/, 'Include an uppercase letter').regex(/[a-z]/, 'Include a lowercase letter').regex(/\d/, 'Include a number').regex(/[^A-Za-z0-9]/, 'Include a special character'),
  role: z.enum(['client', 'manager', 'staff']).default('client'),
  clientName: z.string().optional()
});

type RegisterForm = z.infer<typeof registerSchema>;

const Register: React.FC = () => {
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const form = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { role: 'client' } });

  const role = form.watch('role');

  const onSubmit = async (values: RegisterForm) => {
    setLoading(true);
    setError(null);
    try {
      await registerUser(values);
      setSuccess('Registration successful! Please check your email to verify your account.');
      setTimeout(() => navigate('/login'), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to register');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ backgroundColor: 'background.default' }}>
      <Paper elevation={6} sx={{ width: 500, p: 4, borderRadius: 4 }}>
        <Typography variant="h4" gutterBottom fontWeight={700}>
          Create your account
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Join the secure client portal to collaborate with your team.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {success}
          </Alert>
        )}

        <Box component="form" display="grid" gap={2} gridTemplateColumns="repeat(2, 1fr)" onSubmit={form.handleSubmit(onSubmit)}>
          <TextField
            label="First name"
            {...form.register('firstName')}
            error={!!form.formState.errors.firstName}
            helperText={form.formState.errors.firstName?.message}
          />
          <TextField
            label="Last name"
            {...form.register('lastName')}
            error={!!form.formState.errors.lastName}
            helperText={form.formState.errors.lastName?.message}
          />
          <TextField
            label="Email"
            type="email"
            fullWidth
            sx={{ gridColumn: 'span 2' }}
            {...form.register('email')}
            error={!!form.formState.errors.email}
            helperText={form.formState.errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            sx={{ gridColumn: 'span 2' }}
            {...form.register('password')}
            error={!!form.formState.errors.password}
            helperText={form.formState.errors.password?.message || 'Minimum 12 chars with uppercase, lowercase, number, special character'}
          />
          <TextField
            label="Role"
            select
            {...form.register('role')}
            error={!!form.formState.errors.role}
            helperText={form.formState.errors.role?.message}
          >
            <MenuItem value="client">Client</MenuItem>
            <MenuItem value="manager">Manager</MenuItem>
            <MenuItem value="staff">Staff</MenuItem>
          </TextField>
          {role === 'client' ? (
            <TextField
              label="Client organization"
              {...form.register('clientName')}
              error={!!form.formState.errors.clientName}
              helperText={form.formState.errors.clientName?.message || 'Provide the organization name you represent'}
            />
          ) : (
            <Box />
          )}
          <Button type="submit" variant="contained" size="large" disabled={loading} sx={{ gridColumn: 'span 2', mt: 1 }}>
            {loading ? 'Creating account…' : 'Create account'}
          </Button>
          <Button component={RouterLink} to="/login" variant="text" sx={{ gridColumn: 'span 2' }}>
            Already have an account? Sign in
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default Register;
