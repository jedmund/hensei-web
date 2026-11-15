<script lang="ts">
	import SkillDescription from '$lib/components/weapon/SkillDescription.svelte'
	import { appLocale } from '$lib/utils/locale'
	import type { SummonAura } from '$lib/types/api/entities'

	interface Props {
		aura: SummonAura
		class?: string
	}

	const { aura, class: className = '' }: Props = $props()

	// Japanese text where the API has it (some tiers have none yet); English otherwise.
	const useJa = $derived(appLocale() === 'ja' && (aura.descriptionSegments?.ja?.length ?? 0) > 0)
</script>

{#if useJa}
	<SkillDescription
		class={className}
		segments={aura.descriptionSegments?.ja}
		raw={aura.description.ja}
	/>
{:else}
	<SkillDescription
		class={className}
		segments={aura.descriptionSegments?.en}
		raw={aura.description.en}
	/>
{/if}
