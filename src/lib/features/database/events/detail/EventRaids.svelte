<script lang="ts">
	// The Raids section of an event's detail
	import type { GameEvent } from '$lib/types/api/event'
	import EventRaidList from './EventRaidList.svelte'

	let { record }: { record: GameEvent } = $props()
</script>

<EventRaidList raids={record.raids ?? []} />
