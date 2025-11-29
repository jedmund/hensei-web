/**
 * Error message extraction utilities
 * Handles complex nested error structures from API responses
 */

export interface NestedErrorDetails {
	details?: NestedErrorDetails
	errors?: { message?: string; [key: string]: any }
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
	error: any,
	fallbackMessage: string = 'An error occurred'
): string {
	if (!error) return fallbackMessage

	// Navigate through nested details structure
	let errorDetails: NestedErrorDetails | undefined = error?.details
	while (errorDetails?.details) {
		errorDetails = errorDetails.details
	}

	// Try to extract message from various formats
	if (errorDetails?.errors) {
		// Simple message format
		if (errorDetails.errors.message) {
			return errorDetails.errors.message
		}

		// Field-based errors - combine all messages
		const errorMessages = Object.entries(errorDetails.errors)
			.map(([field, messages]) => {
				if (Array.isArray(messages)) {
					return messages.join(', ')
				}
				return String(messages)
			})
			.filter((msg) => msg && msg !== 'undefined')
			.join('; ')

		if (errorMessages) return errorMessages
	}

	// Fallback to error.message
	return error?.message || fallbackMessage
}
