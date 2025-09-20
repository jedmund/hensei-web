/**
 * Error handling utilities for the adapter system
 *
 * This module provides custom error classes and utility functions
 * for consistent error handling across all adapters.
 *
 * @module adapters/errors
 */

import type { AdapterError } from './types'

/**
 * Custom error class for adapter-specific errors
 * Extends the native Error class with additional properties
 */
export class ApiError extends Error implements AdapterError {
	name: 'AdapterError' = 'AdapterError'
	code: string
	status: number
	details?: any

	/**
	 * Creates a new ApiError instance
	 *
	 * @param code - Error code (e.g., 'NOT_FOUND', 'UNAUTHORIZED')
	 * @param status - HTTP status code
	 * @param message - Human-readable error message
	 * @param details - Additional error details from the API
	 */
	constructor(code: string, status: number, message: string, details?: any) {
		super(message)
		this.code = code
		this.status = status
		this.details = details

		// Maintains proper stack trace for where error was thrown
		if (Error.captureStackTrace) {
			Error.captureStackTrace(this, ApiError)
		}
	}

	/**
	 * Converts the error to a plain object
	 * Useful for serialization and logging
	 */
	toJSON(): AdapterError {
		return {
			name: this.name,
			code: this.code,
			status: this.status,
			message: this.message,
			details: this.details
		}
	}

	/**
	 * Creates an ApiError from a plain object
	 * Useful for deserializing errors from API responses
	 */
	static fromJSON(json: any): ApiError {
		return new ApiError(
			json.code || 'UNKNOWN_ERROR',
			json.status || 0,
			json.message || 'An unknown error occurred',
			json.details
		)
	}
}

/**
 * Error class for network-related failures
 */
export class NetworkError extends ApiError {
	constructor(message = 'Network request failed', details?: any) {
		super('NETWORK_ERROR', 0, message, details)
		this.name = 'NetworkError' as any
	}
}

/**
 * Error class for request timeout
 */
export class TimeoutError extends ApiError {
	constructor(timeout: number, details?: any) {
		super('TIMEOUT', 0, `Request timed out after ${timeout}ms`, details)
		this.name = 'TimeoutError' as any
	}
}

/**
 * Error class for request cancellation
 */
export class CancelledError extends ApiError {
	constructor(details?: any) {
		super('CANCELLED', 0, 'Request was cancelled', details)
		this.name = 'CancelledError' as any
	}
}

/**
 * Error class for validation failures
 */
export class ValidationError extends ApiError {
	constructor(message: string, details?: any) {
		super('VALIDATION_ERROR', 422, message, details)
		this.name = 'ValidationError' as any
	}
}

/**
 * Error class for authentication failures
 */
export class AuthenticationError extends ApiError {
	constructor(message = 'Authentication required', details?: any) {
		super('UNAUTHORIZED', 401, message, details)
		this.name = 'AuthenticationError' as any
	}
}

/**
 * Error class for authorization failures
 */
export class AuthorizationError extends ApiError {
	constructor(message = 'Access denied', details?: any) {
		super('FORBIDDEN', 403, message, details)
		this.name = 'AuthorizationError' as any
	}
}

/**
 * Error class for resource not found
 */
export class NotFoundError extends ApiError {
	constructor(resource?: string, details?: any) {
		const message = resource ? `${resource} not found` : 'Resource not found'
		super('NOT_FOUND', 404, message, details)
		this.name = 'NotFoundError' as any
	}
}

/**
 * Error class for conflict errors (e.g., duplicate resources)
 */
export class ConflictError extends ApiError {
	constructor(message = 'Resource conflict', details?: any) {
		super('CONFLICT', 409, message, details)
		this.name = 'ConflictError' as any
	}
}

/**
 * Error class for rate limiting
 */
export class RateLimitError extends ApiError {
	retryAfter?: number

	constructor(retryAfter?: number, details?: any) {
		const message = retryAfter
			? `Rate limit exceeded. Retry after ${retryAfter} seconds`
			: 'Rate limit exceeded'

		super('RATE_LIMITED', 429, message, details)
		this.name = 'RateLimitError' as any
		this.retryAfter = retryAfter
	}
}

/**
 * Maps HTTP status codes to specific error classes
 *
 * @param status - HTTP status code
 * @param message - Error message
 * @param details - Additional error details
 * @returns Appropriate error instance based on status code
 */
export function createErrorFromStatus(
	status: number,
	message?: string,
	details?: any
): ApiError {
	switch (status) {
		case 400:
			return new ApiError('BAD_REQUEST', status, message || 'Bad request', details)

		case 401:
			return new AuthenticationError(message, details)

		case 403:
			return new AuthorizationError(message, details)

		case 404:
			// Pass the message to NotFoundError if provided
			return message ? new ApiError('NOT_FOUND', 404, message, details) : new NotFoundError(undefined, details)

		case 409:
			return new ConflictError(message, details)

		case 422:
			return new ValidationError(message || 'Validation failed', details)

		case 429:
			// Try to extract retry-after header from details
			const retryAfter = details?.headers?.['retry-after']
			return new RateLimitError(retryAfter, details)

		case 500:
			return new ApiError('SERVER_ERROR', status, message || 'Internal server error', details)

		case 502:
			return new ApiError('BAD_GATEWAY', status, message || 'Bad gateway', details)

		case 503:
			return new ApiError('SERVICE_UNAVAILABLE', status, message || 'Service unavailable', details)

		case 504:
			return new ApiError('GATEWAY_TIMEOUT', status, message || 'Gateway timeout', details)

		default:
			// For any other status codes
			if (status >= 400 && status < 500) {
				return new ApiError('CLIENT_ERROR', status, message || 'Client error', details)
			} else if (status >= 500) {
				return new ApiError('SERVER_ERROR', status, message || 'Server error', details)
			}

			return new ApiError('UNKNOWN_ERROR', status, message || 'Unknown error', details)
	}
}

/**
 * Determines if an error is retryable based on its type and code
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: any): boolean {
	// Network-like conditions are retryable
	// Handle both class instances and normalized plain objects
	if (
		error instanceof NetworkError ||
		error instanceof TimeoutError ||
		error?.name === 'NetworkError' ||
		error?.code === 'NETWORK_ERROR' ||
		// Some environments normalize to status 0 without specific codes
		error?.status === 0
	) {
		return true
	}

	// Rate limit errors are retryable after delay
	if (error instanceof RateLimitError) {
		return true
	}

	// Check by error code (handles both ApiError instances and plain objects)
	// Note: NetworkError sets name to 'NetworkError' but still has AdapterError structure
	if (error instanceof ApiError || error?.name === 'AdapterError' || error?.name === 'NetworkError') {
		const retryableCodes = [
			'NETWORK_ERROR',
			'TIMEOUT',
			'GATEWAY_TIMEOUT',
			'SERVICE_UNAVAILABLE',
			'BAD_GATEWAY',
			'SERVER_ERROR'
		]

		if (retryableCodes.includes(error.code)) {
			return true
		}

		// Server errors (5xx) are generally retryable
		if (error.status >= 500 && error.status < 600) {
			return true
		}
	}

	// Check for specific error properties
	if (error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT' || error.code === 'ENOTFOUND') {
		return true
	}

	// Client errors (4xx) are not retryable except rate limits
	if (error.status >= 400 && error.status < 500) {
		return error.status === 429 // Only rate limit is retryable
	}

	return false
}

/**
 * Normalizes various error types into a consistent AdapterError structure
 *
 * @param error - Any error type
 * @returns Normalized AdapterError
 */
export function normalizeError(error: any): AdapterError {
	// Already an AdapterError
	if (error?.name === 'AdapterError') {
		return error
	}

	// ApiError instance
	if (error instanceof ApiError) {
		return error.toJSON()
	}

	// Fetch abort error
	if (error?.name === 'AbortError') {
		return new CancelledError().toJSON()
	}

	// Network error
	if (error?.name === 'NetworkError' || error?.name === 'TypeError') {
		return new NetworkError(error.message).toJSON()
	}

	// Timeout error
	if (error?.name === 'TimeoutError') {
		return new TimeoutError(0, error).toJSON()
	}

	// Generic Error with status
	if (error?.status) {
		return createErrorFromStatus(
			error.status,
			error.message || error.statusText,
			error
		).toJSON()
	}

	// Fallback to generic error
	return new ApiError(
		error?.code || 'UNKNOWN_ERROR',
		error?.status || 0,
		error?.message || 'An unknown error occurred',
		error
	).toJSON()
}

/**
 * Extracts user-friendly error message from an error
 *
 * @param error - The error to extract message from
 * @returns User-friendly error message
 */
export function getErrorMessage(error: any): string {
	if (!error) {
		return 'An unknown error occurred'
	}

	// Try to get message from various error formats
	const message = error.message ||
					error.error ||
					error.errors?.[0]?.message ||
					error.statusText ||
					'An unknown error occurred'

	// Make network errors more user-friendly
	if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
		return 'Unable to connect to the server. Please check your internet connection.'
	}

	if (message.includes('TimeoutError')) {
		return 'The request took too long. Please try again.'
	}

	if (message.includes('AbortError') || message.includes('cancelled')) {
		return 'The request was cancelled.'
	}

	return message
}

/**
 * Calculates retry delay based on attempt number and error type
 *
 * @param attempt - Current attempt number (1-indexed)
 * @param error - The error that triggered the retry
 * @param baseDelay - Base delay in milliseconds (default: 1000)
 * @param maxDelay - Maximum delay in milliseconds (default: 30000)
 * @returns Delay in milliseconds before next retry
 */
export function calculateRetryDelay(
	attempt: number,
	error: any,
	baseDelay = 1000,
	maxDelay = 30000
): number {
	// Use retry-after header for rate limit errors
	if (error instanceof RateLimitError && error.retryAfter) {
		return error.retryAfter * 1000
	}

	// Exponential backoff: 1s, 2s, 4s, 8s, ...
	let delay = Math.pow(2, attempt - 1) * baseDelay

	// Add jitter (±25%) to prevent thundering herd
	const jitter = delay * 0.25
	delay = delay + (Math.random() * jitter * 2 - jitter)

	// Cap at maximum delay
	return Math.min(delay, maxDelay)
}
