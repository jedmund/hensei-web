<!-- Test-only: SkillDescription inside the Tooltip.Provider the app layout supplies. -->
<script lang="ts">
	import { Tooltip } from 'bits-ui'
	import SkillDescription from './SkillDescription.svelte'
	import type { DescriptionSegment } from '$lib/types/api/entities'

	const { segments }: { segments: DescriptionSegment[] } = $props()
</script>

<Tooltip.Provider><SkillDescription {segments} /></Tooltip.Provider>
