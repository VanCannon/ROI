/**
 * Form Validation Logic
 * Email validation with personal domain blocking + form field validation
 */

const BLOCKED_DOMAINS = [
  'gmail.com',
  'googlemail.com',
  'yahoo.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'aol.com',
  'icloud.com',
  'proton.me',
  'protonmail.com',
  'gmx.com',
  'mail.com',
  'yandex.com',
  'mailinator.com',
  '10minutemail.com',
  'guerrillamail.com',
  'tempmail.com',
  'trashmail.com',
  'sharklasers.com',
  'getnada.com',
];

const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export interface ValidationResult {
  valid: boolean;
  message: string;
}

/**
 * Validate email format and check against blocked personal domains
 */
export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim().toLowerCase();

  if (!trimmed) {
    return { valid: false, message: 'Email is required.' };
  }

  if (!EMAIL_REGEX.test(trimmed)) {
    return { valid: false, message: 'Please enter a valid email address.' };
  }

  const domain = trimmed.split('@')[1];
  if (BLOCKED_DOMAINS.includes(domain)) {
    return {
      valid: false,
      message: 'Please use your business email address. Personal email domains are not accepted.',
    };
  }

  return { valid: true, message: '' };
}

/**
 * Validate country selection
 */
export function validateCountry(value: string): ValidationResult {
  if (!value) {
    return { valid: false, message: 'Please select your country.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate a number input with minimum value
 */
export function validateNumber(value: string | number, fieldName: string, min: number = 1): ValidationResult {
  const num = typeof value === 'string' ? parseInt(value, 10) : value;

  if (isNaN(num) || value === '') {
    return { valid: false, message: `${fieldName} is required.` };
  }

  if (num < min) {
    return { valid: false, message: `${fieldName} must be at least ${min}.` };
  }

  return { valid: true, message: '' };
}

/**
 * Validate annual revenue selection
 */
export function validateRevenue(value: string): ValidationResult {
  if (!value) {
    return { valid: false, message: 'Please select your annual revenue range.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate considering identity security selection
 */
export function validateIdentitySecurity(value: string): ValidationResult {
  if (!value) {
    return { valid: false, message: 'Please select Yes or No.' };
  }
  return { valid: true, message: '' };
}

/**
 * Validate admins count (must not exceed 25% of limited_admins)
 */
export function validateAdmins(admins: number, limitedAdmins: number): ValidationResult {
  if (isNaN(admins) || admins < 1) {
    return { valid: false, message: 'Number of identity/access engineers is required (minimum 1).' };
  }

  const maxAdmins = Math.ceil(limitedAdmins * 0.25);
  if (admins > maxAdmins) {
    return {
      valid: false,
      message: `Identity/access engineers cannot exceed 25% of IT and security staff (max ${maxAdmins}).`,
    };
  }

  return { valid: true, message: '' };
}

/**
 * Show error on a form field
 */
export function showFieldError(fieldId: string, message: string): void {
  const field = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | null;
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.add('error');
  }
  if (errorEl) {
    errorEl.textContent = message;
    errorEl.classList.add('visible');
  }
}

/**
 * Clear error on a form field
 */
export function clearFieldError(fieldId: string): void {
  const field = document.getElementById(fieldId) as HTMLInputElement | HTMLSelectElement | null;
  const errorEl = document.getElementById(`${fieldId}-error`);

  if (field) {
    field.classList.remove('error');
  }
  if (errorEl) {
    errorEl.textContent = '';
    errorEl.classList.remove('visible');
  }
}

/**
 * Validate the entire form and return whether it's valid
 */
export function validateForm(): boolean {
  let isValid = true;

  // Q1 — Email
  const email = (document.getElementById('email') as HTMLInputElement)?.value ?? '';
  const emailResult = validateEmail(email);
  if (!emailResult.valid) {
    showFieldError('email', emailResult.message);
    isValid = false;
  } else {
    clearFieldError('email');
  }

  // Q2 — Country
  const country = (document.getElementById('country') as HTMLSelectElement)?.value ?? '';
  const countryResult = validateCountry(country);
  if (!countryResult.valid) {
    showFieldError('country', countryResult.message);
    isValid = false;
  } else {
    clearFieldError('country');
  }

  // Q3 — Endpoints
  const endpoints = (document.getElementById('endpoints') as HTMLInputElement)?.value ?? '';
  const endpointsResult = validateNumber(endpoints, 'Number of employees', 1);
  if (!endpointsResult.valid) {
    showFieldError('endpoints', endpointsResult.message);
    isValid = false;
  } else {
    clearFieldError('endpoints');
  }

  // Q4 — Annual Revenue
  const revenue = (document.getElementById('annual_revenue') as HTMLSelectElement)?.value ?? '';
  const revenueResult = validateRevenue(revenue);
  if (!revenueResult.valid) {
    showFieldError('annual_revenue', revenueResult.message);
    isValid = false;
  } else {
    clearFieldError('annual_revenue');
  }

  // Q5 — Considering Identity Security
  const identitySecurity = (document.getElementById('considering_identity_security') as HTMLSelectElement)?.value ?? '';
  const identityResult = validateIdentitySecurity(identitySecurity);
  if (!identityResult.valid) {
    showFieldError('considering_identity_security', identityResult.message);
    isValid = false;
  } else {
    clearFieldError('considering_identity_security');
  }

  // Q6 — Limited Admins
  const limitedAdmins = (document.getElementById('limited_admins') as HTMLInputElement)?.value ?? '';
  const limitedAdminsResult = validateNumber(limitedAdmins, 'Number of IT and security staff', 1);
  if (!limitedAdminsResult.valid) {
    showFieldError('limited_admins', limitedAdminsResult.message);
    isValid = false;
  } else {
    clearFieldError('limited_admins');
  }

  // Q7 — Admins (depends on Q6)
  const admins = (document.getElementById('admins') as HTMLInputElement)?.value ?? '';
  const adminsNum = parseInt(admins, 10);
  const limitedAdminsNum = parseInt(limitedAdmins, 10);

  if (isNaN(adminsNum) || adminsNum < 1) {
    showFieldError('admins', 'Number of identity/access engineers is required (minimum 1).');
    isValid = false;
  } else if (!isNaN(limitedAdminsNum) && limitedAdminsNum > 0) {
    const adminsResult = validateAdmins(adminsNum, limitedAdminsNum);
    if (!adminsResult.valid) {
      showFieldError('admins', adminsResult.message);
      isValid = false;
    } else {
      clearFieldError('admins');
    }
  } else {
    clearFieldError('admins');
  }

  return isValid;
}
