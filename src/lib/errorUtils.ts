/**
 * Map internal error messages to user-friendly messages
 * This prevents exposing internal implementation details to users
 */
const errorMap: Record<string, string> = {
  'Invalid login credentials': 'Invalid email or password.',
  'Email not confirmed': 'Please verify your email before signing in.',
  'User already registered': 'An account with this email already exists.',
  'Email already registered': 'An account with this email already exists.',
  'Password should be at least 6 characters': 'Password must be at least 6 characters.',
  'Invalid email': 'Please enter a valid email address.',
  'Signup requires a valid password': 'Please enter a valid password.',
  'Email rate limit exceeded': 'Too many attempts. Please try again later.',
  'For security purposes': 'Too many attempts. Please try again later.',
  'duplicate key': 'This record already exists.',
  'violates row-level security': 'You do not have permission to perform this action.',
  'JWT expired': 'Your session has expired. Please sign in again.',
  'Network': 'Network error. Please check your connection.',
  'Failed to fetch': 'Network error. Please check your connection.',
};

/**
 * Get a user-friendly error message from an error object
 * Logs the full error for debugging while returning a safe message to users
 */
export const getUserFriendlyError = (error: unknown): string => {
  const errorMessage = error instanceof Error 
    ? error.message 
    : typeof error === 'object' && error !== null && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error);

  // Check for known error patterns
  for (const [pattern, message] of Object.entries(errorMap)) {
    if (errorMessage.toLowerCase().includes(pattern.toLowerCase())) {
      return message;
    }
  }

  // Log the full error for debugging (visible in console logs)
  console.error('Application error:', error);

  // Return a generic message for unknown errors
  return 'An error occurred. Please try again later.';
};
