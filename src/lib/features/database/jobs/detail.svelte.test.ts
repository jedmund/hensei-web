import { describe, it, expect, afterEach, vi } from 'vitest'
import { flushSync, mount, unmount } from 'svelte'

const pageState = vi.hoisted(() => ({
	url: new URL('http://localhost/database/jobs/j-paladin'),
	params: { resource: 'jobs', id: 'j-paladin' } as Record<string, string>,
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

vi.mock('$app/state', () => ({ page: pageState }))
vi.mock('$app/navigation', () => ({ goto: vi.fn(async () => {}) }))
vi.mock('$app/environment', () => ({ browser: true, dev: false, building: false }))

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

import { jobAdapter } from '$lib/api/adapters/job.adapter'
import ResourceDetail from '$lib/features/database/schema/ResourceDetail.svelte'
import type { AnyResourceDef } from '$lib/features/database/schema/registry'
import { jobAccessoriesResource } from '$lib/features/database/job-accessories/resource'
import { jobSkillsResource } from '$lib/features/database/job-skills/resource'
import { jobsResource } from './resource'
import { detailRecords as jobs } from './__fixtures__/detailRecords'
import { detailRecords as skills } from '../job-skills/__fixtures__/detailRecords'
import { detailRecords as accessories } from '../job-accessories/__fixtures__/detailRecords'
import jobsBaseline from './__fixtures__/detail-baseline.json'
import skillsBaseline from '../job-skills/__fixtures__/detail-baseline.json'
import accessoriesBaseline from '../job-accessories/__fixtures__/detail-baseline.json'

/** Visible text, one line per text node, as the baselines were captured */
function lines(el: Element | null): string[] {
	if (!el) return []
	const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT)
	const out: string[] = []
	while (walker.nextNode()) {
		const text = walker.currentNode.textContent?.replace(/\s+/g, ' ').trim()
		if (text) out.push(text)
	}
	return out
}

let mounted: ReturnType<typeof mount> | null = null
let target: HTMLElement

function render(def: AnyResourceDef, record: { id: string }, props: { tab?: string } = {}) {
	target = document.createElement('div')
	document.body.appendChild(target)
	mounted = mount(ResourceDetail, {
		target,
		props: {
			def,
			granblueId: def.record!.routeId(record),
			initialData: record,
			role: 7,
			tab: props.tab ?? null,
			onTabChange: () => {}
		}
	})
	flushSync()
}

afterEach(() => {
	vi.restoreAllMocks()
	if (mounted) unmount(mounted)
	mounted = null
	target?.remove()
	queries.clear()
})

type Baseline = Record<string, { id: string; info: string[] }>

/**
 * Each resource's Info tab must draw what its hand-written page drew, but
 * for the decided changes `adjust` applies
 */
function matchesBaseline(
	def: AnyResourceDef,
	records: Record<string, { id: string }>,
	baseline: Baseline,
	adjust: (info: string[], name: string) => string[] = (info) => info
) {
	for (const name of Object.keys(baseline)) {
		it(name, () => {
			render(def, records[name]!)
			expect(lines(target.querySelector('.details'))).toEqual(
				adjust([...baseline[name]!.info], name)
			)
		})
	}
}

describe('jobs detail: the Info tab matches the hand-written detail', () => {
	matchesBaseline(jobsResource, jobs, jobsBaseline)

	it('draws both proficiency labels', () => {
		render(jobsResource, jobs.paladin!)
		const items = [...target.querySelectorAll('.detail-item')]
		const item = (label: string) =>
			items.find((i) => i.querySelector('.label')?.textContent === label)
		expect(item('Proficiency 1')?.querySelector('img')).not.toBeNull()
		expect(item('Proficiency 2')?.querySelector('img')).not.toBeNull()
	})

	it('has Skills and Images tabs; Skills loads the job by id', () => {
		const getSkills = vi.spyOn(jobAdapter, 'getSkills').mockResolvedValue([])
		render(jobsResource, jobs.fighter!, { tab: 'skills' })
		const labels = [...target.querySelectorAll('[role="radio"], button')].map((b) =>
			b.textContent?.trim()
		)
		expect(labels).toEqual(expect.arrayContaining(['Info', 'Skills', 'Images']))
		expect(getSkills).toHaveBeenCalledWith('j-fighter')
	})
})

describe('job skills detail: the Info tab matches the hand-written page', () => {
	const KIND_LABELS = { main: 'Main', sub: 'Subskill', emp: 'EMP', base: 'Base' } as const

	// Decided: the kinds are four rows instead of one Skill Type badge (which
	// showed only the first), and a blank Japanese name shows a dash
	matchesBaseline(jobSkillsResource, skills, skillsBaseline as Baseline, (info, name) => {
		const skill = skills[name as keyof typeof skills]
		const at = info.indexOf('Skill Type')
		const kinds = Object.entries(KIND_LABELS).flatMap(([key, label]) => [
			label,
			skill[key as keyof typeof KIND_LABELS] ? 'Yes' : 'No'
		])
		info.splice(at, 2, ...kinds)
		const ja = info.indexOf('Name (JP)')
		if (info[ja + 1] === 'Slug') info.splice(ja + 1, 0, '—')
		return info
	})

	it("links the skill's job by id", () => {
		render(jobSkillsResource, skills.mainSub!)
		expect(target.querySelector('a[href*="/database/jobs/j-paladin"]')).not.toBeNull()
	})
})

describe('job accessories detail: the Info tab matches the hand-written page', () => {
	matchesBaseline(jobAccessoriesResource, accessories, accessoriesBaseline)

	it('has an Images tab with both sizes', () => {
		render(jobAccessoriesResource, accessories.shield!, { tab: 'images' })
		const sources = [...target.querySelectorAll('img')].map((i) => i.getAttribute('src') ?? '')
		expect(sources.some((src) => src.includes('4013'))).toBe(true)
		expect(target.querySelector('.details')).toBeNull()
	})
})
