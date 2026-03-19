<script lang="ts">
	import { createQuery, queryOptions } from '@tanstack/svelte-query'
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import type { Bullet } from '$lib/types/api/entities'
	import { BULLET_TYPES } from '$lib/types/api/entities'
	import Select from '$lib/components/ui/Select.svelte'
	import { localizedName } from '$lib/utils/locale'
	import { getBulletImage } from '$lib/utils/images'

	interface Props {
		/** The bullet type for this slot (1=Parabellum, 2=Rifle, 3=Cartridge, 4=Aetherial) */
		bulletType: number
		/** Currently selected bullet ID */
		value?: string
		/** Called when selection changes */
		onchange?: (bullet: Bullet | undefined) => void
	}

	let { bulletType, value = $bindable(), onchange }: Props = $props()

	const bulletsQuery = createQuery(() =>
		queryOptions({
			queryKey: ['bullets', bulletType] as const,
			queryFn: () => entityAdapter.getBullets(bulletType),
			staleTime: 1000 * 60 * 60,
			gcTime: 1000 * 60 * 60 * 24
		})
	)

	const typeName = $derived(BULLET_TYPES[bulletType] ?? 'Bullet')

	const options = $derived.by(() => {
		const bullets = bulletsQuery.data ?? []
		const result: Array<{ value: string; label: string; image?: string }> = [
			{ value: '', label: `No ${typeName}` }
		]

		for (const bullet of bullets.sort((a, b) => a.order - b.order)) {
			const name = localizedName(bullet.name)
			const label = bullet.atk > 0 ? `${name} (ATK ${bullet.atk})` : name
			result.push({
				value: bullet.id,
				label,
				image: bullet.granblueId ? getBulletImage(bullet.granblueId) : undefined
			})
		}

		return result
	})

	function findBulletById(id: string | undefined): Bullet | undefined {
		if (!id) return undefined
		return (bulletsQuery.data ?? []).find((b: Bullet) => b.id === id)
	}

	function handleChange(newValue: string | undefined) {
		value = newValue
		onchange?.(findBulletById(newValue))
	}
</script>

<div class="bullet-select">
	{#if bulletsQuery.isPending}
		<div class="loading">Loading bullets...</div>
	{:else if bulletsQuery.error}
		<div class="error">Failed to load bullets</div>
	{:else}
		<Select
			options={options}
			value={value ?? ''}
			onValueChange={handleChange}
			placeholder="Select {typeName}"
			size="medium"
			fullWidth
			contained
		/>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.bullet-select {
		width: 100%;
	}

	.loading,
	.error {
		padding: spacing.$unit-2x;
		font-size: typography.$font-small;
		color: var(--text-tertiary);
	}

	.error {
		color: var(--text-error);
	}
</style>
