import React from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  Grid,
  Paper,
  TextField,
  Typography
} from '@mui/material';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';
import { useThemeMode } from '@/contexts/ThemeContext';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required')
});

type ProfileForm = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password required'),
  newPassword: z.string().min(12, 'Minimum 12 characters').regex(/[A-Z]/, 'Include uppercase').regex(/[a-z]/, 'Include lowercase').regex(/\d/, 'Include a number').regex(/[^A-Za-z0-9]/, 'Include a special character'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, { message: 'Passwords must match', path: ['confirmPassword'] });

type PasswordForm = z.infer<typeof passwordSchema>;

const Profile: React.FC = () => {
  const { user, updateUserProfile, changePassword, startMfaSetup, confirmMfaSetup, disableMfa } = useAuth();
  const { mode, toggle } = useThemeMode();
  const profileForm = useForm<ProfileForm>({ resolver: zodResolver(profileSchema), defaultValues: { firstName: user?.firstName || '', lastName: user?.lastName || '' } });
  const passwordForm = useForm<PasswordForm>({ resolver: zodResolver(passwordSchema) });
  const [profileMessage, setProfileMessage] = React.useState<string | null>(null);
  const [passwordMessage, setPasswordMessage] = React.useState<string | null>(null);
  const [mfaQr, setMfaQr] = React.useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = React.useState<string | null>(null);
  const [mfaCode, setMfaCode] = React.useState('');

  const handleProfileSubmit = async (values: ProfileForm) => {
    await updateUserProfile(values);
    setProfileMessage('Profile updated successfully.');
  };

  const handlePasswordSubmit = async (values: PasswordForm) => {
    await changePassword(values.currentPassword, values.newPassword);
    setPasswordMessage('Password changed successfully.');
    passwordForm.reset();
  };

  const handleStartMfa = async () => {
    const { otpauth, secret } = await startMfaSetup();
    setMfaQr(otpauth);
    setMfaSecret(secret);
  };

  const handleConfirmMfa = async () => {
    await confirmMfaSetup(mfaCode);
    setMfaQr(null);
    setMfaSecret(null);
    setMfaCode('');
  };

  const handleDisableMfa = async () => {
    const password = prompt('Enter your password to disable MFA');
    if (password) {
      await disableMfa(password);
    }
  };

  return (
    <Box display="flex" flexDirection="column" gap={3}>
      <Typography variant="h4" fontWeight={700}>Profile & Security</Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" gutterBottom>Profile information</Typography>
            {profileMessage && <Alert severity="success" sx={{ mb: 2 }}>{profileMessage}</Alert>}
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={profileForm.handleSubmit(handleProfileSubmit)}>
              <TextField
                label="First name"
                {...profileForm.register('firstName')}
                error={!!profileForm.formState.errors.firstName}
                helperText={profileForm.formState.errors.firstName?.message}
              />
              <TextField
                label="Last name"
                {...profileForm.register('lastName')}
                error={!!profileForm.formState.errors.lastName}
                helperText={profileForm.formState.errors.lastName?.message}
              />
              <TextField label="Email" value={user?.email || ''} disabled />
              <Button type="submit" variant="contained">Save changes</Button>
            </Box>
          </Paper>
        </Grid>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3, borderRadius: 4 }}>
            <Typography variant="h6" gutterBottom>Password management</Typography>
            {passwordMessage && <Alert severity="success" sx={{ mb: 2 }}>{passwordMessage}</Alert>}
            <Box component="form" display="flex" flexDirection="column" gap={2} onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)}>
              <TextField
                label="Current password"
                type="password"
                {...passwordForm.register('currentPassword')}
                error={!!passwordForm.formState.errors.currentPassword}
                helperText={passwordForm.formState.errors.currentPassword?.message}
              />
              <TextField
                label="New password"
                type="password"
                {...passwordForm.register('newPassword')}
                error={!!passwordForm.formState.errors.newPassword}
                helperText={passwordForm.formState.errors.newPassword?.message}
              />
              <TextField
                label="Confirm new password"
                type="password"
                {...passwordForm.register('confirmPassword')}
                error={!!passwordForm.formState.errors.confirmPassword}
                helperText={passwordForm.formState.errors.confirmPassword?.message}
              />
              <Button type="submit" variant="contained">Update password</Button>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" gutterBottom>Multi-factor authentication</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Protect your account by requiring a time-based one-time code at sign in.
        </Typography>
        <Box display="flex" alignItems="center" gap={2}>
          {!user?.mfaEnabled ? (
            <Button variant="contained" onClick={handleStartMfa}>Enable MFA</Button>
          ) : (
            <Button variant="outlined" color="error" onClick={handleDisableMfa}>Disable MFA</Button>
          )}
          {mfaSecret && <Typography variant="body2">Secret: {mfaSecret}</Typography>}
        </Box>
        {mfaQr && (
          <Box mt={2} display="flex" flexDirection="column" gap={2}>
            <Typography variant="body2">Scan this QR code in your authenticator app or use the secret above.</Typography>
            <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(mfaQr)}`} alt="MFA QR" style={{ width: 180 }} />
            <Box display="flex" gap={2} alignItems="center">
              <TextField label="Verification code" value={mfaCode} onChange={(event) => setMfaCode(event.target.value)} />
              <Button variant="contained" onClick={handleConfirmMfa} disabled={mfaCode.length !== 6}>Confirm</Button>
            </Box>
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 3, borderRadius: 4 }}>
        <Typography variant="h6" gutterBottom>Experience preferences</Typography>
        <Typography variant="body2" color="text.secondary" mb={2}>
          Switch between light and dark themes.
        </Typography>
        <Button variant="outlined" onClick={toggle}>
          Toggle to {mode === 'light' ? 'dark' : 'light'} mode
        </Button>
      </Paper>
    </Box>
  );
};

export default Profile;
