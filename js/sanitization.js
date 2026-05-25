// ===== Input Sanitization & Security Utilities =====

// HTML special characters map for escaping
const HTML_ESCAPE_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#x27;',
  '/': '&#x2F;'
};

// Escape HTML special characters to prevent XSS
function escapeHTML(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"'\/]/g, (char) => HTML_ESCAPE_MAP[char]);
}

// Remove potentially dangerous characters and scripts
function sanitizeInput(str, maxLength = 500) {
  if (!str) return '';

  let sanitized = String(str).trim();

  // Enforce max length
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }

  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');

  // Remove script tags and event handlers
  sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*["'][^"']*["']/gi, '');
  sanitized = sanitized.replace(/on\w+\s*=\s*[^\s>]*/gi, '');

  // Remove iframe, object, embed tags
  sanitized = sanitized.replace(/<(iframe|object|embed|form|input|button)\b[^<]*>/gi, '');

  // Remove javascript: protocol
  sanitized = sanitized.replace(/javascript:/gi, '');

  return sanitized;
}

// Sanitize name field specifically
function sanitizeName(name) {
  const maxLength = 100;
  let sanitized = sanitizeInput(name, maxLength);

  // Remove numbers and special characters (keep only letters, spaces, hyphens, apostrophes)
  sanitized = sanitized.replace(/[^a-zA-Z\s\-']/g, '');

  // Remove multiple spaces
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}

// Sanitize email field
function sanitizeEmail(email) {
  const maxLength = 254; // RFC 5321
  let sanitized = sanitizeInput(email, maxLength);

  // Convert to lowercase and remove whitespace
  sanitized = sanitized.toLowerCase().replace(/\s/g, '');

  // Remove potentially dangerous characters (keep only valid email chars)
  sanitized = sanitized.replace(/[^a-z0-9@._\-+]/g, '');

  return sanitized;
}

// Sanitize message/textarea field
function sanitizeMessage(message) {
  const maxLength = 5000;
  let sanitized = sanitizeInput(message, maxLength);

  // Remove extra newlines (max 3 consecutive)
  sanitized = sanitized.replace(/\n\n\n+/g, '\n\n');

  // Remove special control characters but keep newlines and basic punctuation
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  return sanitized;
}

// Validate name format
function isValidName(name) {
  if (!name || name.length < 2 || name.length > 100) return false;
  return /^[a-zA-Z\s\-']+$/.test(name);
}

// Validate email format
function isValidEmail(email) {
  if (!email || email.length < 5 || email.length > 254) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Validate message length and content
function isValidMessage(message) {
  if (!message || message.length < 10 || message.length > 5000) return false;
  return /[a-zA-Z0-9]/.test(message);
}

// Comprehensive input validation with sanitization
function validateAndSanitizeContactForm(name, email, message) {
  const errors = {};

  // Sanitize inputs first
  const sanitizedName = sanitizeName(name);
  const sanitizedEmail = sanitizeEmail(email);
  const sanitizedMessage = sanitizeMessage(message);

  // Validate name
  if (!sanitizedName) {
    errors.name = "Name is required.";
  } else if (!isValidName(sanitizedName)) {
    errors.name = "Name must contain only letters, spaces, hyphens, and apostrophes.";
  } else if (sanitizedName.length < 2) {
    errors.name = "Name must be at least 2 characters.";
  }

  // Validate email
  if (!sanitizedEmail) {
    errors.email = "Email is required.";
  } else if (!isValidEmail(sanitizedEmail)) {
    errors.email = "Please enter a valid email address.";
  }

  // Validate message
  if (!sanitizedMessage) {
    errors.message = "Message is required.";
  } else if (!isValidMessage(sanitizedMessage)) {
    errors.message = "Message must contain at least 10 characters and valid content.";
  } else if (sanitizedMessage.length < 10) {
    errors.message = "Message must be at least 10 characters.";
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
    data: {
      name: sanitizedName,
      email: sanitizedEmail,
      message: sanitizedMessage
    }
  };
}

// Validate and sanitize newsletter email
function validateAndSanitizeEmail(email) {
  const sanitizedEmail = sanitizeEmail(email);

  if (!sanitizedEmail) {
    return { valid: false, error: "Email is required.", data: null };
  }

  if (!isValidEmail(sanitizedEmail)) {
    return { valid: false, error: "Please enter a valid email address.", data: null };
  }

  return { valid: true, error: null, data: sanitizedEmail };
}

// Make functions available globally
window.sanitizeInput = sanitizeInput;
window.sanitizeName = sanitizeName;
window.sanitizeEmail = sanitizeEmail;
window.sanitizeMessage = sanitizeMessage;
window.escapeHTML = escapeHTML;
window.validateAndSanitizeContactForm = validateAndSanitizeContactForm;
window.validateAndSanitizeEmail = validateAndSanitizeEmail;
