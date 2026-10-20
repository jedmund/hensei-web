/**
 * State for the two refresh dialogs, kept out of the components so every
 * state (previewing, nothing changed, expired token, rate limited, batch
 * polling…) is unit-tested against the C6 fixtures.
 */

import {
	MAX_BATCH_CHARACTERS,
	refreshFailure,
	type CharacterRefreshAdapter,
	type CharacterRefreshResult,
	type CharacterReparseResponse,
	type RefreshBatch,
	type RefreshFailure
} from '$lib/api/adapters/characterRefresh.adapter'
import type { CharacterTypeaheadOption } from '$lib/components/ui/characterTypeahead'
import { defaultSelection, isBatchWorking, isSelectable, refreshOutcome } from './refresh'

function errorMessage(error: unknown): string | null {
	const message = (error as { message?: unknown } | null)?.message
	return typeof message === 'string' ? message : null
}

// ---- Single character --------------------------------------------------------

export type SinglePhase = 'idle' | 'previewing' | 'previewed' | 'applying' | 'applied' | 'failed'

export class CharacterRefreshSession {
	phase = $state<SinglePhase>('idle')
	includeJp = $state(false)
	result = $state<CharacterRefreshResult | null>(null)
	failure = $state<RefreshFailure | null>(null)
	failureDetail = $state<string | null>(null)

	readonly outcome = $derived(this.result ? refreshOutcome(this.result) : null)
	readonly busy = $derived(this.phase === 'previewing' || this.phase === 'applying')
	/** Apply is offered only for a live preview that would change something. */
	readonly canApply = $derived(
		!!this.result?.previewToken &&
			this.outcome !== 'none' &&
			(this.phase === 'previewed' ||
				(this.phase === 'failed' && this.failure !== 'preview_expired'))
	)

	#seq = 0
	readonly #characterId: string
	readonly #adapter: Pick<CharacterRefreshAdapter, 'preview' | 'apply'>

	constructor(characterId: string, adapter: Pick<CharacterRefreshAdapter, 'preview' | 'apply'>) {
		this.#characterId = characterId
		this.#adapter = adapter
	}

	async preview(): Promise<void> {
		const seq = ++this.#seq
		this.phase = 'previewing'
		this.result = null
		this.#clearFailure()
		try {
			const response = await this.#adapter.preview(this.#characterId, {
				refetchJp: this.includeJp
			})
			if (seq !== this.#seq) return
			this.result = response.refresh
			this.phase = 'previewed'
		} catch (error) {
			if (seq !== this.#seq) return
			this.#fail(error)
		}
	}

	/** Writes the previewed text. Resolves with the response once written, else null. */
	async apply(): Promise<CharacterReparseResponse | null> {
		const token = this.result?.previewToken
		if (!token || !this.canApply) return null
		const seq = ++this.#seq
		this.phase = 'applying'
		this.#clearFailure()
		try {
			const response = await this.#adapter.apply(this.#characterId, token)
			if (seq !== this.#seq) return null
			this.phase = 'applied'
			return response
		} catch (error) {
			if (seq !== this.#seq) return null
			this.#fail(error)
			// The stored text is gone; what's on screen can no longer be applied.
			if (this.failure === 'preview_expired') this.result = null
			return null
		}
	}

	/** Back to the start, ignoring any request still in flight. */
	reset(): void {
		this.#seq++
		this.phase = 'idle'
		this.result = null
		this.#clearFailure()
	}

	#clearFailure() {
		this.failure = null
		this.failureDetail = null
	}

	#fail(error: unknown) {
		this.failure = refreshFailure(error)
		this.failureDetail = errorMessage(error)
		this.phase = 'failed'
	}
}

// ---- Batch -------------------------------------------------------------------

export type BatchPhase =
	'picking' | 'starting' | 'running' | 'previewed' | 'applying' | 'applied' | 'failed'

type Schedule = (fn: () => void, ms: number) => () => void

const defaultSchedule: Schedule = (fn, ms) => {
	const id = setTimeout(fn, ms)
	return () => clearTimeout(id)
}

export interface BatchSessionOptions {
	pollMs?: number
	schedule?: Schedule
	/** Called once when an apply finishes, with how many characters were written. */
	onApplied?: (count: number) => void
}

type BatchAdapter = Pick<CharacterRefreshAdapter, 'createBatch' | 'getBatch' | 'applyBatch'>

export class BatchRefreshSession {
	picks = $state<CharacterTypeaheadOption[]>([])
	includeJp = $state(false)
	/** Set as soon as the API accepts the refresh, before its first poll returns */
	refreshId = $state<string | null>(null)
	batch = $state<RefreshBatch | null>(null)
	selected = $state<string[]>([])
	failure = $state<RefreshFailure | null>(null)
	failureDetail = $state<string | null>(null)
	/** Polling stopped on an error; `resume()` tries again. */
	pollStopped = $state(false)

	#starting = $state(false)
	#applying = $state(false)

	readonly phase: BatchPhase = $derived.by(() => {
		if (this.#applying) return 'applying'
		if (!this.batch) {
			if (this.refreshId) return 'running'
			return this.#starting ? 'starting' : 'picking'
		}
		switch (this.batch.status) {
			case 'queued':
			case 'running':
				return 'running'
			default:
				return this.batch.status
		}
	})

	readonly isFull = $derived(this.picks.length >= MAX_BATCH_CHARACTERS)
	readonly canStart = $derived(this.phase === 'picking' && this.picks.length > 0)
	readonly canApply = $derived(this.phase === 'previewed' && this.selected.length > 0)
	readonly progress = $derived.by(() => {
		const items = this.batch?.items ?? []
		const done = items.filter((i) => i.status !== 'queued' && i.status !== 'fetching').length
		return { done, total: items.length }
	})

	readonly #adapter: BatchAdapter
	readonly #pollMs: number
	readonly #schedule: Schedule
	readonly #onApplied: ((count: number) => void) | undefined
	#cancelPoll: (() => void) | null = null
	#disposed = false
	/** Set from the apply POST until the job reports it has picked the apply up. */
	#awaitingApply = false

	constructor(adapter: BatchAdapter, options: BatchSessionOptions = {}) {
		this.#adapter = adapter
		this.#pollMs = options.pollMs ?? 3000
		this.#schedule = options.schedule ?? defaultSchedule
		this.#onApplied = options.onApplied
	}

	/** Adds a picked row. False when it's already picked or the batch is full. */
	add(option: CharacterTypeaheadOption): boolean {
		if (this.phase !== 'picking' || this.isFull) return false
		if (this.picks.some((p) => p.id === option.id)) return false
		this.picks = [...this.picks, option]
		return true
	}

	remove(id: string): void {
		this.picks = this.picks.filter((p) => p.id !== id)
	}

	async start(): Promise<void> {
		if (!this.canStart) return
		this.#starting = true
		this.#clearFailure()
		try {
			const { id } = await this.#adapter.createBatch(
				this.picks.map((p) => p.id),
				this.includeJp
			)
			this.refreshId = id
			if (this.#disposed) return
			await this.#poll(id)
		} catch (error) {
			this.#fail(error)
		} finally {
			this.#starting = false
		}
	}

	toggle(characterId: string, checked: boolean): void {
		const item = this.batch?.items.find((i) => i.characterId === characterId)
		if (!item || !isSelectable(item)) return
		const rest = this.selected.filter((id) => id !== characterId)
		this.selected = checked ? [...rest, characterId] : rest
	}

	isSelected(characterId: string): boolean {
		return this.selected.includes(characterId)
	}

	async apply(): Promise<void> {
		const batch = this.batch
		if (!batch || !this.canApply) return
		this.#applying = true
		this.#clearFailure()
		try {
			await this.#adapter.applyBatch(batch.id, [...this.selected])
			if (this.#disposed) return
			this.#awaitingApply = true
			this.#applying = false
			this.batch = { ...batch, status: 'applying' }
			this.#queuePoll(batch.id)
		} catch (error) {
			this.#applying = false
			this.#fail(error)
		}
	}

	/** Polls again after polling stopped on an error. */
	resume(): void {
		if (!this.refreshId || !this.pollStopped) return
		this.pollStopped = false
		this.#clearFailure()
		void this.#poll(this.refreshId)
	}

	/** Stops polling; call when the dialog closes. */
	dispose(): void {
		this.#disposed = true
		this.#cancelPoll?.()
		this.#cancelPoll = null
	}

	async #poll(id: string): Promise<void> {
		this.#cancelPoll = null
		try {
			const next = await this.#adapter.getBatch(id)
			if (this.#disposed) return
			const previous = this.batch?.status
			if (this.#awaitingApply && next.status !== 'previewed') this.#awaitingApply = false
			// Until the job picks the apply up, the refresh still reads as previewed.
			this.batch = this.#awaitingApply ? { ...next, status: 'applying' } : next

			if (next.status === 'previewed' && previous !== 'previewed' && !this.#awaitingApply) {
				this.selected = defaultSelection(next.items)
			}
			if (next.status === 'applied' && previous !== 'applied') {
				this.#onApplied?.(next.items.filter((i) => i.status === 'applied').length)
			}

			if (isBatchWorking(next.status) || this.#awaitingApply) this.#queuePoll(id)
		} catch (error) {
			if (this.#disposed) return
			this.pollStopped = true
			this.#fail(error)
		}
	}

	#queuePoll(id: string) {
		if (this.#disposed) return
		this.#cancelPoll?.()
		this.#cancelPoll = this.#schedule(() => void this.#poll(id), this.#pollMs)
	}

	#clearFailure() {
		this.failure = null
		this.failureDetail = null
	}

	#fail(error: unknown) {
		this.failure = refreshFailure(error)
		this.failureDetail = errorMessage(error)
	}
}
