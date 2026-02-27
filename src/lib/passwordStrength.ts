export interface PasswordCriteria {
  label: string
  met: boolean
}

export interface PasswordStrengthResult {
  isValid: boolean
  criteria: PasswordCriteria[]
}

export function checkPasswordStrength(password: string): PasswordStrengthResult {
  const criteria: PasswordCriteria[] = [
    {
      label: 'At least 8 characters',
      met: password.length >= 8
    },
    {
      label: 'Contains uppercase letter',
      met: /[A-Z]/.test(password)
    },
    {
      label: 'Contains lowercase letter',
      met: /[a-z]/.test(password)
    },
    {
      label: 'Contains number',
      met: /[0-9]/.test(password)
    },
    {
      label: 'Contains special character',
      met: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    }
  ]

  const isValid = criteria.every(c => c.met)

  return {
    isValid,
    criteria
  }
}
