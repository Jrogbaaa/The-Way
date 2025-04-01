/**
 * Error handling utilities for the application
 */

/**
 * Custom error class for API-related errors
 */
export class APIError extends Error {
  statusCode: number;
  
  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.name = 'APIError';
    this.statusCode = statusCode;
  }
}

/**
 * Custom error class for validation errors
 */
export class ValidationError extends Error {
  field?: string;
  
  constructor(message: string, field?: string) {
    super(message);
    this.name = 'ValidationError';
    this.field = field;
  }
}

/**
 * Safe parsing function for JSON responses
 * @param response Response object from fetch
 * @returns Parsed JSON data
 * @throws APIError if the response is not OK or parsing fails
 */
export async function safeParseResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new APIError(
      `API request failed: ${response.status} ${response.statusText} - ${errorText}`,
      response.status
    );
  }
  
  try {
    return await response.json() as T;
  } catch (error) {
    throw new APIError(`Failed to parse API response: ${(error as Error).message}`);
  }
}

/**
 * Safely handles API requests with automatic error handling
 * @param apiCall Promise from an API call
 * @param fallbackValue Optional fallback value if the API call fails
 * @returns Result of the API call or the fallback value
 */
export async function safeApiCall<T>(
  apiCall: Promise<T>, 
  fallbackValue?: T
): Promise<{ data: T | undefined; error: Error | null }> {
  try {
    const data = await apiCall;
    return { data, error: null };
  } catch (error) {
    console.error('API call failed:', error);
    return { 
      data: fallbackValue,
      error: error instanceof Error ? error : new Error(String(error))
    };
  }
}

/**
 * Type guard to check if a response contains an error
 * @param response Any API response object
 * @returns True if the response contains an error property
 */
export function isErrorResponse(response: any): response is { error: string } {
  return response && typeof response === 'object' && 'error' in response;
}

/**
 * Safely formats an error message for display
 * @param error Error object or string
 * @returns Formatted error message
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isErrorResponse(error)) {
    return error.error;
  }
  return 'An unknown error occurred';
}

/**
 * Validates an object against expected properties
 * @param obj Object to validate
 * @param requiredProps Array of required property names
 * @throws ValidationError if any required property is missing
 */
export function validateObject<T>(obj: T, requiredProps: (keyof T)[]): void {
  for (const prop of requiredProps) {
    if (obj[prop] === undefined || obj[prop] === null) {
      throw new ValidationError(`Missing required property: ${String(prop)}`, String(prop));
    }
  }
}

/**
 * Type guard for checking if a value exists (not null or undefined)
 * @param value Any value
 * @returns True if the value is not null or undefined
 */
export function exists<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
} 