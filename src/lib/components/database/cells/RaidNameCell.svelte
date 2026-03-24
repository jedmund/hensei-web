<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'

	const { row }: Cell = $props()

	function displayName(input: unknown): string {
		if (!input) return '—'
		const obj = input as Record<string, unknown>
		const maybe = obj.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') {
			const loc = maybe as Record<string, unknown>
			return (typeof loc.en === 'string' ? loc.en : undefined) || (typeof loc.ja === 'string' ? loc.ja : undefined) || '—'
		}
		return '—'
	}
</script>

<div class="name-cell">
	<span class="name">{displayName(row)}</span>
	{#if row.slug}
		<code class="slug">{row.slug}</code>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.name-cell {
		display: flex;
		flex-direction: column;
		gap: $unit-half;
		padding: $unit-half 0;
		min-width: 0;
	}

	.name {
		font-weight: $medium;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.slug {
		font-size: $font-tiny;
		color: var(--text-tertiary);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
</style>
