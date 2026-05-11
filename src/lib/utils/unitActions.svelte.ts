/**
 * Wrap an async handler with a busy flag so callers can disable triggers
 * while the action is in flight. Catches and toasts errors so callers don't
 * need their own try/catch boilerplate.
 *
 * @example
 * ```ts
 * const remove = useAsyncAction(async () => {
 *   await gridService.removeWeapon(partyId, item.id, editKey)
 * }, 'Failed to remove weapon')
 *
 * <Button disabled={remove.busy} onclick={remove.run}>Remove</Button>
 * ```
 */
import { toast } from 'svelte-sonner'
import { extractErrorMessage } from '$lib/utils/errors'

export interface AsyncAction<TArgs extends unknown[] = []> {
	readonly busy: boolean
	run(...args: TArgs): Promise<void>
}

export function useAsyncAction<TArgs extends unknown[] = []>(
	fn: (...args: TArgs) => Promise<void>,
	fallbackMsg: string
): AsyncAction<TArgs> {
	let busy = $state(false)
	async function run(...args: TArgs): Promise<void> {
		if (busy) return
		busy = true
		try {
			await fn(...args)
		} catch (err) {
			console.error(fallbackMsg, err)
			toast.error(extractErrorMessage(err, fallbackMsg))
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
