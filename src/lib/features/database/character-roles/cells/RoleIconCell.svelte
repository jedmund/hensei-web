<script lang="ts">
	// A role's icon in the ordered list: the uploaded icon, or the empty circle
	import EntityIcon from '$lib/components/EntityIcon.svelte'
	import type { AdminCharacterRoleRow } from '$lib/types/api/admin'

	const { row }: { row: AdminCharacterRoleRow } = $props()
</script>

<EntityIcon iconKey={row.iconKey} name={row.nameEn} size={40} imageSize={32} />
