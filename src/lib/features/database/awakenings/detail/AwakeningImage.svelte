<script lang="ts">
	// An awakening's icon
	import { localizedName } from '$lib/utils/locale'
	import { getAwakeningIcon } from '$lib/utils/images/icons'
	import type { Awakening } from '$lib/types/api/entities'

	let { record }: { record: Awakening } = $props()
</script>

<img class="icon" src={getAwakeningIcon(record.slug)} alt={localizedName(record.name)} />

<style lang="scss">
	.icon {
		width: 40px;
		height: 40px;
		object-fit: contain;
	}
</style>
