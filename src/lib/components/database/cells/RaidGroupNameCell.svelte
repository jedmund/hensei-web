<svelte:options runes={true} />

<script lang="ts">
	import typography from '$src/themes/_typography.scss?inline'

	interface Props {
		row: any
	}

	const { row }: Props = $props()

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') return maybe.en || maybe.ja || '—'
		return '—'
	}
</script>

<span class="name">{displayName(row)}</span>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.name {
		font-weight: typography.$bold;
	}
</style>
