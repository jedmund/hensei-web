/**
 * Error handling utilities for the adapter system
 *
 * This module provides custom error classes and utility functions
 * for consistent error handling across all adapters.
 *
 * @module adapters/errors
 */

import type { AdapterError } from './types'
import * as m from '$lib/paraglide/messages'

/**
 * Custom error class for adapter-specific errors
 * Extends the native Error class with additional properties
 */
export class ApiError extends Error implements AdapterError {
	override name = 'AdapterError'
	code: string
	status: number
	details?: unknown

	/**
	 * Creates a new ApiError instance
	 *
	 * @param code - Error code (e.g., 'NOT_FOUND', 'UNAUTHORIZED')
	 * @param status - HTTP status code
	 * @param message - Human-readable error message
	 * @param details - Additional error details from the API
	 */
	constructor(code: string, status: number, message: string, details?: unknown) {
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
	static fromJSON(json: Record<string, unknown>): ApiError {
		return new ApiError(
			(json.code as string) || 'UNKNOWN_ERROR',
			(json.status as number) || 0,
			(json.message as string) || 'An unknown error occurred',
			json.details
		)
	}
}

/**
 * Error class for network-related failures
 */
export class NetworkError extends ApiError {
	constructor(message = 'Network request failed', details?: unknown) {
		super('NETWORK_ERROR', 0, message, details)
		this.name = 'NetworkError' as const
	}
}

/**
 * Error class for request timeout
 */
export class TimeoutError extends ApiError {
	constructor(timeout: number, details?: unknown) {
		super('TIMEOUT', 0, `Request timed out after ${timeout}ms`, details)
		this.name = 'TimeoutError'
	}
}

/**
 * Error class for request cancellation
 */
export class CancelledError extends ApiError {
	constructor(details?: unknown) {
		super('CANCELLED', 0, 'Request was cancelled', details)
		this.name = 'CancelledError'
	}
}

/**
 * Error class for validation failures
 */
export class ValidationError extends ApiError {
	constructor(message: string, details?: unknown) {
		super('VALIDATION_ERROR', 422, message, details)
		this.name = 'ValidationError'
	}
}

/**
 * Error class for authentication failures
 */
export class AuthenticationError extends ApiError {
	constructor(message = 'Authentication required', details?: unknown) {
		super('UNAUTHORIZED', 401, message, details)
		this.name = 'AuthenticationError'
	}
}

/**
 * Error class for authorization failures
 */
export class AuthorizationError extends ApiError {
	constructor(message = 'Access denied', details?: unknown) {
		super('FORBIDDEN', 403, message, details)
		this.name = 'AuthorizationError'
	}
}

/**
 * Error class for resource not found
 */
export class NotFoundError extends ApiError {
	constructor(resource?: string, details?: unknown) {
		const message = resource ? `${resource} not found` : 'Resource not found'
		super('NOT_FOUND', 404, message, details)
		this.name = 'NotFoundError'
	}
}

/**
 * Error class for conflict errors (e.g., duplicate resources)
 */
export class ConflictError extends ApiError {
	constructor(message = 'Resource conflict', details?: unknown) {
		super('CONFLICT', 409, message, details)
		this.name = 'ConflictError'
	}
}

/**
 * Error class for rate limiting
 */
export class RateLimitError extends ApiError {
	retryAfter?: number

	constructor(retryAfter?: number, details?: unknown) {
		const message = retryAfter
			? `Rate limit exceeded. Retry after ${retryAfter} seconds`
			: 'Rate limit exceeded'

		super('RATE_LIMITED', 429, message, details)
		this.name = 'RateLimitError'
		if (retryAfter !== undefined) {
			this.retryAfter = retryAfter
		}
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
	details?: unknown
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
			return message
				? new ApiError('NOT_FOUND', 404, message, details)
				: new NotFoundError(undefined, details)

		case 409:
			return new ConflictError(message, details)

		case 422:
			return new ValidationError(message || 'Validation failed', details)

		case 429: {
			// Try to extract retry-after header from details
			const detailsObj = details as Record<string, unknown> | undefined
			const headers = detailsObj?.headers as Record<string, unknown> | undefined
			const retryAfter =
				typeof headers?.['retry-after'] === 'number' ? headers['retry-after'] : undefined
			return new RateLimitError(retryAfter, details)
		}

		case 500:
			return new ApiError('SERVER_ERROR', status, message || m.error_internal_server(), details)

		case 502:
			return new ApiError('BAD_GATEWAY', status, message || m.error_bad_gateway(), details)

		case 503:
			return new ApiError(
				'SERVICE_UNAVAILABLE',
				status,
				message || m.error_service_unavailable(),
				details
			)

		case 504:
			return new ApiError('GATEWAY_TIMEOUT', status, message || m.error_gateway_timeout(), details)

		default:
			// For any other status codes
			if (status >= 400 && status < 500) {
				return new ApiError('CLIENT_ERROR', status, message || m.error_client(), details)
			} else if (status >= 500) {
				return new ApiError('SERVER_ERROR', status, message || m.error_server(), details)
			}

			return new ApiError('UNKNOWN_ERROR', status, message || m.error_unknown(), details)
	}
}

/**
 * Determines if an error is retryable based on its type and code
 *
 * @param error - The error to check
 * @returns True if the error is retryable
 */
export function isRetryableError(error: unknown): boolean {
	// Network-like conditions are retryable
	// Handle both class instances and normalized plain objects
	if (error instanceof NetworkError || error instanceof TimeoutError) {
		return true
	}

	// Rate limit errors are retryable after delay
	if (error instanceof RateLimitError) {
		return true
	}

	// For duck-typed error objects, safely extract properties
	const err = error as Record<string, unknown> | null | undefined
	const name = typeof err?.name === 'string' ? err.name : undefined
	const code = typeof err?.code === 'string' ? err.code : undefined
	const status = typeof err?.status === 'number' ? err.status : undefined

	if (
		name === 'NetworkError' ||
		code === 'NETWORK_ERROR' ||
		// Some environments normalize to status 0 without specific codes
		status === 0
	) {
		return true
	}

	// Check by error code (handles both ApiError instances and plain objects)
	// Note: NetworkError sets name to 'NetworkError' but still has AdapterError structure
	if (error instanceof ApiError || name === 'AdapterError' || name === 'NetworkError') {
		const retryableCodes = [
			'NETWORK_ERROR',
			'TIMEOUT',
			'GATEWAY_TIMEOUT',
			'SERVICE_UNAVAILABLE',
			'BAD_GATEWAY',
			'SERVER_ERROR'
		]

		if (code && retryableCodes.includes(code)) {
			return true
		}

		// Server errors (5xx) are generally retryable
		if (status !== undefined && status >= 500 && status < 600) {
			return true
		}
	}

	// Check for specific error properties
	if (code === 'ECONNRESET' || code === 'ETIMEDOUT' || code === 'ENOTFOUND') {
		return true
	}

	// Client errors (4xx) are not retryable except rate limits
	if (status !== undefined && status >= 400 && status < 500) {
		return status === 429 // Only rate limit is retryable
	}

	return false
}

/**
 * Normalizes various error types into a consistent AdapterError structure
 *
 * @param error - Any error type
 * @returns Normalized AdapterError
 */
export function normalizeError(error: unknown): AdapterError {
	const err = error as Record<string, unknown> | null | undefined
	const name = typeof err?.name === 'string' ? err.name : undefined
	const code = typeof err?.code === 'string' ? err.code : undefined
	const status = typeof err?.status === 'number' ? err.status : undefined
	const message = typeof err?.message === 'string' ? err.message : undefined
	const statusText = typeof err?.statusText === 'string' ? err.statusText : undefined

	// Already an AdapterError
	if (name === 'AdapterError') {
		return err as unknown as AdapterError
	}

	// ApiError instance
	if (error instanceof ApiError) {
		return error.toJSON()
	}

	// Fetch abort error
	if (name === 'AbortError') {
		return new CancelledError().toJSON()
	}

	// Network error
	if (name === 'NetworkError' || name === 'TypeError') {
		return new NetworkError(message).toJSON()
	}

	// Timeout error
	if (name === 'TimeoutError') {
		return new TimeoutError(0, error).toJSON()
	}

	// Generic Error with status
	if (status) {
		return createErrorFromStatus(status, message || statusText, error).toJSON()
	}

	// Fallback to generic error
	return new ApiError(
		code || 'UNKNOWN_ERROR',
		status || 0,
		message || m.error_unknown(),
		error
	).toJSON()
}

/**
 * Extracts user-friendly error message from an error
 *
 * @param error - The error to extract message from
 * @returns User-friendly error message
 */
export function getErrorMessage(error: unknown): string {
	if (!error) {
		return m.error_unknown()
	}

	const err = error as Record<string, unknown>
	const errors = Array.isArray(err.errors) ? err.errors : undefined

	// Try to get message from various error formats
	const message =
		(typeof err.message === 'string' ? err.message : undefined) ||
		(typeof err.error === 'string' ? err.error : undefined) ||
		(typeof errors?.[0]?.message === 'string' ? errors[0].message : undefined) ||
		(typeof err.statusText === 'string' ? err.statusText : undefined) ||
		m.error_unknown()

	// Make network errors more user-friendly
	if (message.includes('NetworkError') || message.includes('Failed to fetch')) {
		return m.error_network()
	}

	if (message.includes('TimeoutError')) {
		return m.error_timeout()
	}

	if (message.includes('AbortError') || message.includes('cancelled')) {
		return m.error_cancelled()
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
	error: unknown,
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
