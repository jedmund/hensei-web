import { describe, it, expect, afterEach, beforeEach, vi } from 'vitest'
import { flushSync, mount, tick, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/character-roles?open=8bbd9870&edit=1'),
	params: { resource: 'character-roles' } as Record<string, string>,
	state: {},
	data: {}
}))

// jsdom has no ResizeObserver or matchMedia; hoisted, as modules read them on import
vi.hoisted(() => {
	globalThis.ResizeObserver ??= class {
		observe() {}
		unobserve() {}
		disconnect() {}
	} as unknown as typeof ResizeObserver
	window.matchMedia ??= ((query: string) => ({
		matches: true,
		media: query,
		addEventListener() {},
		removeEventListener() {}
	})) as unknown as typeof window.matchMedia
})

// The unsaved-changes guard registers through beforeNavigate: keep its callbacks
const navigation = vi.hoisted(() => ({
	guards: [] as Array<(nav: unknown) => void>,
	goto: null as unknown as ReturnType<typeof vi.fn>
}))
vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', async () => {
	const { vi } = await import('vitest')
	navigation.goto = vi.fn(async () => {})
	return {
		goto: navigation.goto,
		beforeNavigate: (fn: (nav: unknown) => void) => navigation.guards.push(fn)
	}
})
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

const toasts = vi.hoisted(() => ({ error: vi.fn(), success: vi.fn() }))
vi.mock('svelte-sonner', () => ({ toast: toasts }))

const roles = vi.hoisted(() => ({ update: vi.fn() }))
vi.mock('$lib/api/adapters/role.adapter', async (importOriginal) => {
	const actual = await importOriginal<typeof import('$lib/api/adapters/role.adapter')>()
	return {
		...actual,
		roleAdapter: { ...actual.roleAdapter, updateRole: roles.update }
	}
})

// One client for the whole file, in place of the app layout's provider
const queries = vi.hoisted(() => ({ clear: () => {} }))
vi.mock('@tanstack/svelte-query', async (importOriginal) => {
	const actual = await importOriginal<typeof import('@tanstack/svelte-query')>()
	const client = new actual.QueryClient({ defaultOptions: { queries: { retry: false } } })
	queries.clear = () => client.clear()
	return {
		...actual,
		useQueryClient: () => client,
		createQuery: ((options: never) =>
			actual.createQuery(options, () => client)) as typeof actual.createQuery
	}
})

import RecordEditBody from './RecordEditBody.svelte'
import { toRoleRecord } from '$lib/features/database/character-roles/record'
import { characterRolesResource } from '$lib/features/database/character-roles/resource'
import { detailRecords } from '$lib/features/database/character-roles/__fixtures__/detailRecords'
import type { AnyResourceDef } from '$lib/features/database/schema/registry'

const def = characterRolesResource as unknown as AnyResourceDef
const record = toRoleRecord(detailRecords.full)

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement
let body: { save: () => Promise<boolean> }
const onSaved = vi.fn()

function render() {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(RecordEditBody, { target, props: { def, record, onSaved } })
	body = mounted as unknown as typeof body
	flushSync()
}

function input(label: string): HTMLInputElement {
	const item = [...target.querySelectorAll('.detail-item')].find(
		(i) => i.querySelector('.label')?.textContent?.trim() === label
	)
	return item!.querySelector<HTMLInputElement>('input')!
}

function type(label: string, value: string) {
	const el = input(label)
	el.value = value
	el.dispatchEvent(new Event('input', { bubbles: true }))
	flushSync()
}

/** Runs the guard's beforeNavigate as an in-app navigation (j/k, close, a link) */
function navigate() {
	const cancel = vi.fn()
	for (const guard of navigation.guards) {
		guard({
			type: 'goto',
			to: { url: new URL('http://localhost/database/character-roles') },
			cancel
		})
	}
	flushSync()
	return cancel
}

beforeEach(() => {
	navigation.guards = []
	roles.update.mockReset()
	toasts.error.mockReset()
	onSaved.mockReset()
})

afterEach(() => {
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

describe('RecordEditBody (editing in the record panel)', () => {
	it("shows the record's generated edit form", () => {
		render()
		expect(input('Name (EN)').value).toBe('Attacker')
		expect(input('Name (JP)').value).toBe('アタッカー')
	})

	it('saves through save.update, then hands back to the panel', async () => {
		roles.update.mockResolvedValue({ ...detailRecords.full, nameEn: 'Striker' })
		render()
		type('Name (EN)', 'Striker')
		expect(await body.save()).toBe(true)
		expect(roles.update).toHaveBeenCalledWith(
			record.id,
			expect.objectContaining({ name_en: 'Striker' })
		)
		expect(onSaved).toHaveBeenCalledOnce()
		expect(toasts.error).not.toHaveBeenCalled()
	})

	it('keeps the form open and says why when the values are invalid', async () => {
		render()
		type('Name (EN)', '')
		expect(await body.save()).toBe(false)
		expect(roles.update).not.toHaveBeenCalled()
		expect(onSaved).not.toHaveBeenCalled()
		expect(toasts.error).toHaveBeenCalledOnce()
	})

	it('keeps the form open when the server rejects the save', async () => {
		roles.update.mockRejectedValue({ status: 422, details: { name_en: ["can't be blank"] } })
		render()
		type('Name (EN)', 'Striker')
		expect(await body.save()).toBe(false)
		expect(onSaved).not.toHaveBeenCalled()
		expect(toasts.error).toHaveBeenCalledOnce()
	})

	it('lets navigation through while nothing has changed', () => {
		render()
		expect(navigate()).not.toHaveBeenCalled()
	})

	it('stops navigation with unsaved changes and asks first', async () => {
		render()
		type('Name (EN)', 'Striker')
		expect(navigate()).toHaveBeenCalledOnce()
		await tick()
		expect(document.body.textContent).toContain('You have unsaved changes')
	})

	it('lets navigation through once the changes are saved', async () => {
		roles.update.mockResolvedValue({ ...detailRecords.full, nameEn: 'Striker' })
		render()
		type('Name (EN)', 'Striker')
		await body.save()
		expect(navigate()).not.toHaveBeenCalled()
	})
})
