<script lang="ts">
	// A reference's input, by the resource it points at: a typeahead for
	// characters and weapons, a select for weapon series, summon series and raid
	// groups, and a select of the chosen weapon series' variants (no row when it has none)
	import { createQuery } from '@tanstack/svelte-query'
	import * as m from '$lib/paraglide/messages'
	import { entityQueries } from '$lib/api/queries/entity.queries'
	import { raidQueries } from '$lib/api/queries/raid.queries'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import CharacterTypeahead from '$lib/components/ui/CharacterTypeahead.svelte'
	import WeaponTypeahead from '$lib/components/ui/WeaponTypeahead.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { compareRaidGroups } from '$lib/utils/raidSection'
	import { readField } from '../fields'
	import type { InputProps } from './types'

	let { field, form, record }: InputProps = $props()

	const resource = $derived(field.kind === 'reference' ? field.resource : null)
	const value = $derived((form.values[field.key] ?? null) as string | null)
	const sublabel = $derived(field.sublabel?.())
	const error = $derived(form.error(field.key))
	// What the record points at, so a typeahead shows it before it changes
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- the reference's own shape
	const current = $derived(readField(field, record) as any)

	const none = { value: '', label: m.option_none() }

	// Series drawn as a select: the list for the resource the field points at
	const weaponSeriesQuery = createQuery(() => ({
		...entityQueries.weaponSeriesList(),
		enabled: resource === 'weaponSeries'
	}))
	const summonSeriesQuery = createQuery(() => ({
		...entityQueries.summonSeriesList(),
		enabled: resource === 'summonSeries'
	}))

	// Fresh on every form, so a group created a moment ago is there
	const raidGroupsQuery = createQuery(() => ({
		...raidQueries.groups(),
		staleTime: 0,
		enabled: resource === 'raidGroup'
	}))

	// A variant belongs to the series picked on the same form
	const seriesId = $derived((form.values.series as string | null) ?? '')
	const seriesQuery = createQuery(() => ({
		...entityQueries.weaponSeries(seriesId),
		enabled: resource === 'weaponSeriesVariant' && !!seriesId
	}))

	const options = $derived.by(() => {
		// No select until the list loads: one without the current series could
		// write it back as blank
		if (resource === 'weaponSeries' || resource === 'summonSeries') {
			const series = resource === 'summonSeries' ? summonSeriesQuery.data : weaponSeriesQuery.data
			if (!series) return []
			return [none, ...series.map((s) => ({ value: s.id, label: localizedName(s.name) }))]
		}
		if (resource === 'raidGroup') {
			const groups = raidGroupsQuery.data
			if (!groups) return []
			const sorted = groups.toSorted(compareRaidGroups)
			return [
				...(field.required ? [] : [none]),
				...sorted.map((g) => ({ value: g.id, label: localizedName(g.name) }))
			]
		}
		if (resource === 'weaponSeriesVariant') {
			const variants = seriesQuery.data?.variants ?? []
			return variants.length
				? [none, ...variants.map((v) => ({ value: v.id, label: v.name || 'Unnamed' }))]
				: []
		}
		return []
	})

	function set(id: string | number | null | undefined) {
		form.set(field.key, id === '' || id === undefined ? null : id)
	}
</script>

{#if resource === 'character'}
	<DetailItem label={field.label()} {sublabel} {error} editable>
		<CharacterTypeahead
			bind:value={() => value, set}
			initialCharacter={current && typeof current === 'object'
				? {
						id: current.id,
						label:
							localizedName(current.name) !== '—'
								? localizedName(current.name)
								: current.granblueId,
						granblueId: current.granblueId,
						element: current.element,
						season: current.season,
						series: current.series,
						styleSwap: current.styleSwap
					}
				: null}
			contained
		/>
	</DetailItem>
{:else if resource === 'weapon'}
	<DetailItem label={field.label()} {sublabel} {error} editable>
		<WeaponTypeahead
			bind:value={() => value, set}
			initialWeapon={current && typeof current === 'object'
				? {
						id: current.id,
						name: current.name?.en || current.name?.ja || current.granblueId,
						granblueId: current.granblueId
					}
				: null}
			contained
		/>
	</DetailItem>
{:else if options.length}
	<DetailItem
		label={field.label()}
		{sublabel}
		{error}
		editable
		type="select"
		{options}
		bind:value={() => value ?? '', set}
	/>
{/if}
