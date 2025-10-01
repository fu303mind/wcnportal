import React from 'react';
import { Box, Button, Paper, TextField, Typography, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({
  password: z.string().min(12, 'Password must be at least 12 characters').regex(/[A-Z]/, 'Include uppercase').regex(/[a-z]/, 'Include lowercase').regex(/\d/, 'Include a number').regex(/[^A-Za-z0-9]/, 'Include a special character'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  path: ['confirmPassword'],
  message: 'Passwords must match'
});

type FormValues = z.infer<typeof schema>;

const ResetPassword: React.FC = () => {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token') || '';
  const { resetPassword } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    try {
      await resetPassword(token, values.password);
      setSuccess('Password updated. You can now sign in with your new password.');
      setTimeout(() => navigate('/login'), 2500);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to reset password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ backgroundColor: 'background.default' }}>
      <Paper elevation={4} sx={{ width: 420, p: 4, borderRadius: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Set a new password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Ensure your password is unique and secure.
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="New password"
            type="password"
            {...form.register('password')}
            error={!!form.formState.errors.password}
            helperText={form.formState.errors.password?.message}
          />
          <TextField
            label="Confirm password"
            type="password"
            {...form.register('confirmPassword')}
            error={!!form.formState.errors.confirmPassword}
            helperText={form.formState.errors.confirmPassword?.message}
          />
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Resetting…' : 'Reset password'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ResetPassword;
