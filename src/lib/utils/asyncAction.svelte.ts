/**
 * Wrap an async handler with a busy flag so callers can disable triggers
 * while the action is in flight. Catches errors and either toasts them
 * (default) or hands them to a caller-provided `onError` callback for inline
 * UX (banners, field-level messages, etc.).
 *
 * @example Toast (default)
 * ```ts
 * const remove = useAsyncAction(async () => {
 *   await gridService.removeWeapon(partyId, item.id, editKey)
 * }, 'Failed to remove weapon')
 *
 * <Button disabled={remove.busy} onclick={remove.run}>Remove</Button>
 * ```
 *
 * @example Inline banner
 * ```ts
 * let saveError = $state<string | null>(null)
 * const save = useAsyncAction(handleSave, m.save_failed(), {
 *   onError: (_, msg) => (saveError = msg)
 * })
 * ```
 */
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'

export interface AsyncActionOptions {
	/**
	 * Override the default toast error UX. Receives the raw error and the
	 * already-extracted message string so the caller can surface it however
	 * fits (banner, form field, custom toast, etc.).
	 */
	onError?: (error: unknown, message: string) => void
}

export interface AsyncAction<TArgs extends unknown[] = []> {
	readonly busy: boolean
	run(...args: TArgs): Promise<void>
}

export function useAsyncAction<TArgs extends unknown[] = []>(
	fn: (...args: TArgs) => Promise<void>,
	fallbackMsg: string,
	opts: AsyncActionOptions = {}
): AsyncAction<TArgs> {
	let busy = $state(false)
	async function run(...args: TArgs): Promise<void> {
		if (busy) return
		busy = true
		try {
			await fn(...args)
		} catch (err) {
			console.error(fallbackMsg, err)
			const message = extractErrorMessage(err, fallbackMsg)
			if (opts.onError) {
				opts.onError(err, message)
			} else {
				toast.error(message)
			}
		} finally {
			busy = false
		}
	}
	return {
		get busy() {
			return busy
		},
		run
	}
}
