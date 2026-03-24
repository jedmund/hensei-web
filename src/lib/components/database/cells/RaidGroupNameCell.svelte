<script lang="ts">
	import typography from '$src/themes/_typography.scss?inline'

	interface Props {
		row: Record<string, unknown>
	}

	const { row }: Props = $props()

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

<span class="name">{displayName(row)}</span>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.name {
		font-weight: typography.$bold;
	}
</style>
