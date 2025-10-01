import React from 'react';
import {
  Box,
  Button,
  Link,
  Paper,
  TextField,
  Typography,
  Alert
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(1, 'Password is required')
});

type LoginForm = z.infer<typeof loginSchema>;

const mfaSchema = z.object({
  mfaCode: z.string().length(6, 'Enter the 6-digit code')
});

type MfaForm = z.infer<typeof mfaSchema>;

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [error, setError] = React.useState<string | null>(null);
  const [mfaRequired, setMfaRequired] = React.useState(false);
  const [pendingCredentials, setPendingCredentials] = React.useState<LoginForm | null>(null);
  const [loading, setLoading] = React.useState(false);

  const loginForm = useForm<LoginForm>({ resolver: zodResolver(loginSchema) });
  const mfaForm = useForm<MfaForm>({ resolver: zodResolver(mfaSchema) });

  const handleLogin = async (values: LoginForm) => {
    setError(null);
    setLoading(true);
    try {
      const result = await login(values);
      if (result.mfaRequired) {
        setPendingCredentials(values);
        setMfaRequired(true);
      } else {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Unable to sign in');
    } finally {
      setLoading(false);
    }
  };

  const handleMfa = async (values: MfaForm) => {
    if (!pendingCredentials) return;
    setLoading(true);
    setError(null);
    try {
      const result = await login({ ...pendingCredentials, mfaCode: values.mfaCode });
      if (!result.mfaRequired) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid MFA code');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh" sx={{ background: (theme) => theme.palette.mode === 'light' ? 'linear-gradient(135deg, #eff6ff, #e0f2f1)' : 'linear-gradient(135deg, #1e293b, #111827)' }}>
      <Paper elevation={6} sx={{ width: 420, p: 4, borderRadius: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom fontWeight={700}>
          Secure Client Portal
        </Typography>
        <Typography variant="body2" color="text.secondary" mb={3}>
          Sign in to continue to your client workspace.
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {!mfaRequired ? (
          <Box component="form" onSubmit={loginForm.handleSubmit(handleLogin)} display="flex" flexDirection="column" gap={2}>
            <TextField
              label="Email"
              type="email"
              fullWidth
              {...loginForm.register('email')}
              error={!!loginForm.formState.errors.email}
              helperText={loginForm.formState.errors.email?.message}
            />
            <TextField
              label="Password"
              type="password"
              fullWidth
              {...loginForm.register('password')}
              error={!!loginForm.formState.errors.password}
              helperText={loginForm.formState.errors.password?.message}
            />
            <Button type="submit" variant="contained" size="large" disabled={loading}>
              {loading ? 'Signing in…' : 'Sign In'}
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={mfaForm.handleSubmit(handleMfa)} display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2">Multi-factor authentication is enabled. Enter the verification code from your authenticator app.</Typography>
            <TextField
              label="MFA Code"
              fullWidth
              {...mfaForm.register('mfaCode')}
              error={!!mfaForm.formState.errors.mfaCode}
              helperText={mfaForm.formState.errors.mfaCode?.message}
            />
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? 'Verifying…' : 'Verify Code'}
            </Button>
          </Box>
        )}

        {!mfaRequired && (
          <Box mt={3} display="flex" justifyContent="space-between">
            <Link component={RouterLink} to="/register" variant="body2">
              Create account
            </Link>
            <Link component={RouterLink} to="/forgot-password" variant="body2">
              Forgot password?
            </Link>
          </Box>
        )}
      </Paper>
    </Box>
  );
};

export default Login;
