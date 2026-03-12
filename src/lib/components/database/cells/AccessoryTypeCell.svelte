
<script lang="ts">
	import type { Cell } from 'wx-svelte-grid'
	import { getAccessoryTypeName, ACCESSORY_TYPES } from '$lib/utils/jobAccessoryUtils'

	const { row }: Cell = $props()

	const typeName = $derived(getAccessoryTypeName(row.accessoryType))
	const typeClass = $derived(row.accessoryType === ACCESSORY_TYPES.SHIELD ? 'shield' : 'manatura')
</script>

<span class="type-badge {typeClass}">{typeName}</span>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/typography' as typography;

	.type-badge {
		display: inline-block;
		padding: 2px 8px;
		border-radius: layout.$item-corner-small;
		font-size: typography.$font-small;
		font-weight: typography.$medium;

		&.shield {
			background: color-mix(in srgb, var(--water-button-bg) 20%, transparent);
			color: var(--water-text);
		}

		&.manatura {
			background: color-mix(in srgb, var(--fire-button-bg) 20%, transparent);
			color: var(--fire-text);
		}
	}
</style>
