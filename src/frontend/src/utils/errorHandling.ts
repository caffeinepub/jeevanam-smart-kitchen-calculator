/**
 * Utility functions for error detection, classification, and user-friendly messaging
 */

/**
 * Detects if an error is due to canister being stopped (IC0508 or IC0503)
 */
export function isCanisterStoppedError(error: any): boolean {
  if (!error?.message) return false;
  const errorStr = error.message.toLowerCase();
  return (
    errorStr.includes('ic0508') ||
    errorStr.includes('ic0503') ||
    (errorStr.includes('canister') && errorStr.includes('stopped')) ||
    errorStr.includes('service temporarily unavailable') ||
    errorStr.includes('canister is not running')
  );
}

/**
 * Detects network-related errors (timeouts, connection failures)
 */
export function isNetworkError(error: any): boolean {
  if (!error?.message) return false;
  const errorStr = error.message.toLowerCase();
  return (
    errorStr.includes('network') ||
    errorStr.includes('timeout') ||
    errorStr.includes('fetch') ||
    errorStr.includes('connection') ||
    errorStr.includes('econnrefused') ||
    errorStr.includes('failed to fetch')
  );
}

/**
 * Detects authentication-related errors
 */
export function isAuthError(error: any): boolean {
  if (!error?.message) return false;
  const errorStr = error.message.toLowerCase();
  return (
    errorStr.includes('admin not set up') ||
    errorStr.includes('only the admin') ||
    errorStr.includes('authentication') ||
    errorStr.includes('unauthorized')
  );
}

/**
 * Detects validation errors (user input issues)
 */
export function isValidationError(error: any): boolean {
  if (!error?.message) return false;
  const errorStr = error.message.toLowerCase();
  return (
    errorStr.includes('already exists') ||
    errorStr.includes('not found') ||
    errorStr.includes('cannot be negative') ||
    errorStr.includes('cannot be empty') ||
    errorStr.includes('invalid')
  );
}

/**
 * Determines if an error should be retried
 */
export function shouldRetryError(error: any, attemptCount: number, maxRetries: number = 5): boolean {
  // Don't retry validation or auth errors
  if (isValidationError(error) || isAuthError(error)) {
    return false;
  }

  // Retry canister stopped and network errors up to max retries
  if ((isCanisterStoppedError(error) || isNetworkError(error)) && attemptCount < maxRetries) {
    return true;
  }

  // Retry generic rejection errors once
  const errorStr = error?.message?.toLowerCase() || '';
  if (errorStr.includes('reject') && attemptCount < 1) {
    return true;
  }

  return false;
}

/**
 * Calculates exponential backoff delay for retries
 */
export function calculateRetryDelay(attemptIndex: number, baseDelay: number = 1000, maxDelay: number = 16000): number {
  return Math.min(baseDelay * Math.pow(2, attemptIndex), maxDelay);
}

/**
 * Returns a user-friendly error message based on error type
 */
export function getErrorMessage(error: any): string {
  if (!error?.message) return 'An unexpected error occurred';

  const errorStr = error.message.toLowerCase();

  // Canister stopped errors
  if (isCanisterStoppedError(error)) {
    return 'Service temporarily unavailable. The backend is currently stopped. Please wait a moment and try again.';
  }

  // Network errors
  if (isNetworkError(error)) {
    return 'Connection error. Please check your internet connection and try again.';
  }

  // Authentication errors
  if (isAuthError(error)) {
    return 'Authentication error: Admin access not properly configured. Please log out and log back in.';
  }

  // Validation errors
  if (errorStr.includes('already exists')) {
    return 'This item already exists';
  }

  if (errorStr.includes('not found')) {
    return 'Item not found';
  }

  if (errorStr.includes('cannot be negative')) {
    return 'Value cannot be negative';
  }

  if (errorStr.includes('cannot be empty')) {
    return 'Value cannot be empty';
  }

  // Generic rejection
  if (errorStr.includes('reject')) {
    return 'Request was rejected by the service. Please try again.';
  }

  // Return original message if it's user-friendly (doesn't contain technical jargon)
  if (!errorStr.includes('actor') && !errorStr.includes('undefined') && !errorStr.includes('null')) {
    return error.message;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Returns recovery instructions based on error type
 */
export function getRecoveryInstructions(error: any): string {
  if (isCanisterStoppedError(error)) {
    return 'The service is temporarily unavailable. It will automatically retry. You can also refresh the page in a few moments.';
  }

  if (isNetworkError(error)) {
    return 'Please check your internet connection and try again. If the problem persists, the service may be temporarily down.';
  }

  if (isAuthError(error)) {
    return 'Please log out and log back in to refresh your authentication.';
  }

  return 'Please try again. If the problem persists, contact support.';
}
