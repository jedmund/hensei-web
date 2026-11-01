<script lang="ts">
	// The event's staff picks. Curators manage them until the event ends;
	// editors always can.
	import StaffPicksSection from '$lib/components/database/StaffPicksSection.svelte'
	import { canEditStaffPicks } from '$lib/auth/roles'
	import type { RecordTabProps } from '$lib/features/database/schema/types'
	import type { GameEvent } from '$lib/types/api/event'

	let { record, role }: RecordTabProps<GameEvent> = $props()
</script>

<StaffPicksSection eventId={record.id} readonly={!canEditStaffPicks(role, record.endsAt)} />
