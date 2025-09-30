<script lang="ts">
	interface Props {
		type: 'character' | 'weapon' | 'summon'
		itemData: any
	}

	let { type, itemData }: Props = $props()

	function displayName(input: any): string {
		if (!input) return '—'
		const maybe = input.name ?? input
		if (typeof maybe === 'string') return maybe
		if (maybe && typeof maybe === 'object') {
			return maybe.en || maybe.ja || '—'
		}
		return '—'
	}
</script>

{#if type === 'weapon' && itemData?.weaponSkills && itemData.weaponSkills.length > 0}
	<div class="details-section">
		<h3>Skills</h3>
		<div class="skills-list">
			{#each itemData.weaponSkills as skill}
				<div class="skill-item">
					<h4>{displayName(skill) || 'Unknown Skill'}</h4>
					{#if skill.description}
						<p>{skill.description}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if type === 'summon' && itemData?.summonAuras && itemData.summonAuras.length > 0}
	<div class="details-section">
		<h3>Auras</h3>
		<div class="auras-list">
			{#each itemData.summonAuras as aura}
				<div class="aura-item">
					<h4>{displayName(aura) || 'Unknown Aura'}</h4>
					{#if aura.description}
						<p>{aura.description}</p>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if type === 'weapon' && itemData?.weaponKeys && itemData.weaponKeys.length > 0}
	<div class="details-section">
		<h3>Weapon Keys</h3>
		<div class="keys-list">
			{#each itemData.weaponKeys as key}
				<div class="key-item">
					<span class="key-slot">Slot {key.slot}</span>
					<span class="key-name">{displayName(key.weaponKey1) || '—'}</span>
				</div>
			{/each}
		</div>
	</div>
{/if}

{#if type === 'character' && itemData?.special}
	<div class="details-section">
		<div class="detail-row special-indicator">
			<span class="label">Special Character</span>
			<span class="value">✓</span>
		</div>
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/colors' as colors;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.details-section {
		margin-bottom: spacing.$unit-3x;

		h3 {
			margin: 0 0 calc(spacing.$unit * 1.5) 0;
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			color: var(--text-secondary, colors.$grey-40);
			text-transform: uppercase;
			letter-spacing: 0.5px;
		}

		h4 {
			font-size: typography.$font-regular;
			font-weight: typography.$medium;
			color: var(--text-primary, colors.$grey-10);
			margin: 0 0 calc(spacing.$unit * 0.5) 0;
		}

		p {
			font-size: typography.$font-small;
			color: var(--text-secondary, colors.$grey-50);
			line-height: 1.5;
			margin: 0;
		}
	}

	.skills-list,
	.auras-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.skill-item,
	.aura-item {
		padding: spacing.$unit;
		background: var(--page-hover, colors.$grey-80);
		border-radius: 4px;
	}

	.keys-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.key-item {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(spacing.$unit * 0.75) spacing.$unit;
		background: var(--page-hover, colors.$grey-80);
		border-radius: 4px;

		.key-slot {
			font-size: typography.$font-small;
			color: var(--text-secondary, colors.$grey-50);
			font-weight: typography.$medium;
		}

		.key-name {
			font-size: typography.$font-small;
			color: var(--text-primary, colors.$grey-10);
		}
	}

	.detail-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: calc(spacing.$unit * 0.75) 0;

		&.special-indicator {
			border-top: 1px solid rgba(colors.$grey-70, 0.5);
			padding-top: spacing.$unit;
		}

		.label {
			font-size: typography.$font-regular;
			color: var(--text-secondary, colors.$grey-50);
		}

		.value {
			font-size: typography.$font-regular;
			color: var(--text-primary, colors.$grey-10);
			font-weight: typography.$medium;
		}
	}
</style>