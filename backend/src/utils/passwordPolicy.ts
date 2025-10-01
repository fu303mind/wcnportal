interface PasswordValidationResult {
  valid: boolean;
  message?: string;
}

export const validatePassword = (password: string): PasswordValidationResult => {
  if (password.length < 12) {
    return { valid: false, message: 'Password must be at least 12 characters long.' };
  }

  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must include a lowercase letter.' };
  }

  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must include an uppercase letter.' };
  }

  if (!/\d/.test(password)) {
    return { valid: false, message: 'Password must include a number.' };
  }

  if (!/[!@#$%^&*(),.?":{}|<>\-_=+\[\];'/\\]/.test(password)) {
    return { valid: false, message: 'Password must include a special character.' };
  }

  return { valid: true };
};
