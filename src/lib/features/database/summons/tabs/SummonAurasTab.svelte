<script lang="ts">
	import type { SummonAura } from '$lib/types/api/entities'

	interface Props {
		auras: SummonAura[]
	}

	let { auras }: Props = $props()

	const mainAuras = $derived(auras.filter((a) => a.slot === 'main'))
	const subAuras = $derived(auras.filter((a) => a.slot === 'sub'))

	/** "MLB" / "FLB" / "ULB" / "Lv N" transcendence tier badge, matching WeaponSkillList's idiom */
	function tierLabel(aura: SummonAura): string {
		if (aura.transcendenceStage > 0) return `Trans. ${aura.transcendenceStage}`
		switch (aura.uncapLevel) {
			case 0:
				return 'Base'
			case 3:
				return 'MLB'
			case 4:
				return 'FLB'
			case 5:
				return 'ULB'
			default:
				return `${aura.uncapLevel}★`
		}
	}

	function formatValue(aura: SummonAura): string {
		if (aura.value == null) return '—'
		return `${aura.value}%`
	}

	const targetLabels: Record<string, string> = {
		normal_frame: 'Optimus frame',
		omega_frame: 'Omega frame',
		odious_frame: 'Odious frame',
		elemental_atk: 'Elemental ATK',
		normal_atk: 'Normal ATK',
		omega_atk: 'Omega ATK',
		atk: 'ATK',
		multiattack: 'Multiattack',
		other: 'Other'
	}
</script>

{#snippet auraGroup(title: string, groupAuras: SummonAura[])}
	{#if groupAuras.length > 0}
		<section class="aura-group">
			<h3>{title}</h3>
			<table class="aura-table">
				<thead>
					<tr>
						<th>Tier</th>
						<th>Target</th>
						<th>Value</th>
						<th>Description</th>
					</tr>
				</thead>
				<tbody>
					{#each groupAuras as aura (aura.id)}
						<tr>
							<td><span class="tier-badge">{tierLabel(aura)}</span></td>
							<td>
								<span class="target-chip" class:frame={aura.target.endsWith('_frame')}>
									{targetLabels[aura.target] ?? aura.target}
								</span>
							</td>
							<td class="value">{formatValue(aura)}</td>
							<td class="description">
								{aura.description?.en ?? '—'}
								{#if aura.condition}
									<span class="condition">({aura.condition})</span>
								{/if}
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</section>
	{/if}
{/snippet}

<div class="auras-tab">
	{#if auras.length === 0}
		<p class="empty">No structured aura data. Re-parse from the Raw Data tab to generate it.</p>
	{:else}
		{@render auraGroup('Main Aura', mainAuras)}
		{@render auraGroup('Sub Aura', subAuras)}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.auras-tab {
		display: flex;
		flex-direction: column;
		gap: $unit-3x;
	}

	.empty {
		color: var(--text-tertiary);
		font-size: $font-regular;
		text-align: center;
		padding: $unit-4x 0;
	}

	.aura-group {
		display: flex;
		flex-direction: column;
		gap: $unit;

		h3 {
			font-size: $font-regular;
			font-weight: $medium;
			color: var(--text-primary);
			margin: 0;
		}
	}

	.aura-table {
		width: 100%;
		border-collapse: collapse;
		font-size: $font-small;

		th {
			text-align: left;
			font-weight: $medium;
			color: var(--text-secondary);
			padding: $unit-half $unit;
			border-bottom: 1px solid var(--border-primary, var(--border-color));
		}

		td {
			padding: $unit-half $unit;
			border-bottom: 1px solid var(--border-secondary, transparent);
			vertical-align: top;
			color: var(--text-primary);
		}
	}

	.tier-badge {
		display: inline-block;
		padding: 0 $unit-half;
		border-radius: $item-corner-small;
		background: var(--button-bg);
		color: var(--text-secondary);
		font-size: $font-tiny;
		font-weight: $medium;
		white-space: nowrap;
	}

	.target-chip {
		display: inline-block;
		padding: 0 $unit-half;
		border-radius: $item-corner-small;
		background: var(--button-bg);
		color: var(--text-secondary);
		font-size: $font-tiny;
		white-space: nowrap;

		&.frame {
			background: var(--accent-bg, var(--button-bg));
			color: var(--text-primary);
			font-weight: $medium;
		}
	}

	.value {
		font-variant-numeric: tabular-nums;
		font-weight: $medium;
		white-space: nowrap;
	}

	.description {
		color: var(--text-secondary);
	}

	.condition {
		color: var(--text-tertiary);
		font-style: italic;
	}
</style>
