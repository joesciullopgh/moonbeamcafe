export interface PasswordCheck {
  label: string
  met: boolean
}

export function validatePassword(password: string): PasswordCheck[] {
  return [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter', met: /[A-Z]/.test(password) },
    { label: 'One lowercase letter', met: /[a-z]/.test(password) },
    { label: 'One number', met: /\d/.test(password) },
    { label: 'One special character (!@#$%^&*…)', met: /[^A-Za-z0-9]/.test(password) },
  ]
}

export function isPasswordStrong(password: string): boolean {
  return validatePassword(password).every(c => c.met)
}

export const PASSWORD_POLICY_TEXT =
  'Password must be at least 8 characters and include uppercase, lowercase, a number, and a special character.'
