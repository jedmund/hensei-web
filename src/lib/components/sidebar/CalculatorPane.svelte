<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { onMount } from 'svelte'
	import { onDestroy } from 'svelte'
	import { partyAdapter } from '$lib/api/adapters/party.adapter'
	import type { SkillBoosts } from '$lib/types/api/skillBoosts'
	import DetailsSection from './details/DetailsSection.svelte'
	import SkillLabel from '$lib/components/SkillLabel.svelte'
	import { skillHighlight } from '$lib/stores/skillHighlight.svelte'

	interface Props {
		shortcode: string
	}

	let { shortcode }: Props = $props()

	let boosts = $state<SkillBoosts | null>(null)
	let error = $state(false)
	let loading = $state(true)

	onMount(async () => {
		try {
			boosts = await partyAdapter.getSkillBoosts(shortcode)
		} catch {
			error = true
		} finally {
			loading = false
		}
	})

	// Never leave a stale highlight behind when the pane closes
	onDestroy(() => skillHighlight.clear())

	const enhancementRows = $derived(
		boosts
			? [
					{ key: 'optimus', label: m.calculator_enh_optimus(), value: boosts.enhancements.optimus },
					{ key: 'omega', label: m.calculator_enh_omega(), value: boosts.enhancements.omega },
					{ key: 'taboo', label: m.calculator_enh_taboo(), value: boosts.enhancements.taboo }
				].filter((row) => row.value > 0)
			: []
	)
</script>

<div class="calculator-pane">
	{#if loading}
		<div class="state">…</div>
	{:else if error}
		<div class="state">{m.calculator_error()}</div>
	{:else if boosts}
		{#if enhancementRows.length > 0}
			<DetailsSection title={m.calculator_enhancements()}>
				<ul class="rows">
					{#each enhancementRows as row (row.key)}
						<li class="row">
							<span class="name">{row.label}</span>
							<span class="value">{row.value}%</span>
						</li>
					{/each}
				</ul>
			</DetailsSection>
		{/if}

		<DetailsSection
			title={m.pane_skill_boosts()}
			empty={boosts.lines.length === 0}
			emptyMessage={m.calculator_empty()}
		>
			<ul class="rows">
				{#each boosts.lines as line (`${line.key}-${line.series ?? ''}`)}
					<li
						class="row"
						onmouseenter={() => skillHighlight.set(line.sources)}
						onmouseleave={() => skillHighlight.clear()}
					>
						<SkillLabel slug={line.labelSlug} label={line.label} />
						<span class="value" class:capped={line.capped}>{line.display}</span>
					</li>
				{/each}
			</ul>
		</DetailsSection>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/effects' as *;
	@use '$src/themes/typography' as *;

	.calculator-pane {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
		padding: $unit-2x 0;
	}

	.state {
		color: var(--text-tertiary);
		font-size: $font-regular;
		padding: $unit-2x 0;
		text-align: center;
	}

	.rows {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
	}

	.row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
		padding: $unit;
		border-radius: $item-corner;
		@include smooth-transition($duration-quick, background-color);

		&:hover {
			background: var(--button-bg);
		}
	}

	.name {
		font-size: $font-regular;
		color: var(--text-secondary);
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.value {
		font-size: $font-regular;
		font-weight: $medium;
		color: var(--text-primary);
		font-variant-numeric: tabular-nums;
		flex-shrink: 0;

		&.capped {
			color: var(--orange-text, #e08a00);
		}
	}
</style>
