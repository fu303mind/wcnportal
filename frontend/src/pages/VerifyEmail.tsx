import React from 'react';
import { Box, Button, CircularProgress, Paper, Typography, Alert } from '@mui/material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const VerifyEmail: React.FC = () => {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { verifyEmail } = useAuth();
  const [status, setStatus] = React.useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = React.useState<string>('');

  React.useEffect(() => {
    const run = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Verification token missing.');
        return;
      }
      setStatus('loading');
      try {
        await verifyEmail(token);
        setStatus('success');
        setMessage('Email verified successfully! Redirecting to dashboard…');
        setTimeout(() => navigate('/dashboard'), 2500);
      } catch (err: any) {
        setStatus('error');
        setMessage(err.response?.data?.message || 'Unable to verify email.');
      }
    };
    run();
  }, [navigate, token, verifyEmail]);

  return (
    <Box minHeight="100vh" display="flex" alignItems="center" justifyContent="center" sx={{ backgroundColor: 'background.default' }}>
      <Paper elevation={4} sx={{ width: 420, p: 4, borderRadius: 4, textAlign: 'center' }}>
        <Typography variant="h5" fontWeight={700} gutterBottom>
          Verifying email
        </Typography>
        {status === 'loading' && <CircularProgress />}
        {status !== 'loading' && (
          <Alert severity={status === 'success' ? 'success' : 'error'} sx={{ mt: 2 }}>
            {message}
          </Alert>
        )}
        {status === 'error' && (
          <Button sx={{ mt: 2 }} variant="contained" onClick={() => navigate('/login')}>
            Return to login
          </Button>
        )}
      </Paper>
    </Box>
  );
};

export default VerifyEmail;
