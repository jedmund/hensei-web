/**
 * Error message extraction utilities
 * Handles complex nested error structures from API responses
 */

export interface NestedErrorDetails {
	details?: NestedErrorDetails
	errors?: { message?: string; [key: string]: unknown }
	message?: string
}

/**
 * Extracts user-friendly error message from nested API error structures
 * Handles the pattern: error.details.details.errors.message
 *
 * @param error - The error object to extract from
 * @param fallbackMessage - Message to return if extraction fails
 * @returns Extracted error message or fallback
 *
 * @example
 * ```typescript
 * try {
 *   await api.updateParty(...)
 * } catch (e) {
 *   error = extractErrorMessage(e, 'Failed to update party')
 * }
 * ```
 */
export function extractErrorMessage(
	error: unknown,
	fallbackMessage: string = 'An error occurred'
): string {
	if (!error) return fallbackMessage

	const err = error as Record<string, unknown>

	// Navigate through nested details structure
	let errorDetails: NestedErrorDetails | undefined = err?.details as NestedErrorDetails | undefined
	while (errorDetails?.details) {
		errorDetails = errorDetails.details
	}

	// Try to extract message from various formats
	if (errorDetails?.errors) {
		// Simple message format
		if (errorDetails.errors.message) {
			return errorDetails.errors.message
		}

		// Field-based errors - combine all messages with humanized field names
		const errorMessages = Object.entries(errorDetails.errors)
			.map(([field, messages]) => {
				const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
				if (Array.isArray(messages)) {
					return `${fieldName} ${messages.join(', ')}`
				}
				return `${fieldName} ${String(messages)}`
			})
			.filter((msg) => msg && msg !== 'undefined')
			.join('; ')

		if (errorMessages) return errorMessages
	}

	// Fallback to error.message
	return (typeof err?.message === 'string' ? err.message : undefined) || fallbackMessage
}
