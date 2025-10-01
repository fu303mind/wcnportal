import React from 'react';
import { Box, Button, Paper, TextField, Typography, Alert } from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';

const schema = z.object({ email: z.string().email('Enter a valid email') });

type FormValues = z.infer<typeof schema>;

const ForgotPassword: React.FC = () => {
  const { requestPasswordReset } = useAuth();
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const form = useForm<FormValues>({ resolver: zodResolver(schema) });

  const onSubmit = async (values: FormValues) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      await requestPasswordReset(values.email);
      setMessage('If an account exists for that email, password reset instructions have been sent.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to process request');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ backgroundColor: 'background.default' }}>
      <Paper elevation={4} sx={{ width: 420, p: 4, borderRadius: 4 }}>
        <Typography variant="h5" gutterBottom fontWeight={700}>
          Reset your password
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Enter your email address and we will send you a secure reset link.
        </Typography>

        {message && <Alert severity="success" sx={{ mb: 2 }}>{message}</Alert>}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        <Box component="form" onSubmit={form.handleSubmit(onSubmit)} display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Email"
            type="email"
            {...form.register('email')}
            error={!!form.formState.errors.email}
            helperText={form.formState.errors.email?.message}
          />
          <Button variant="contained" type="submit" disabled={loading}>
            {loading ? 'Sending…' : 'Send reset link'}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

export default ForgotPassword;
