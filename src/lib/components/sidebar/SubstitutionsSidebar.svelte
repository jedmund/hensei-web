<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon, Substitution } from '$lib/types/api/party'
	import { localizedName } from '$lib/utils/locale'
	import { getWeaponImage } from '$lib/features/database/detail/image'
	import { getCharacterImageWithPose } from '$lib/utils/images'
	import { getSummonImage } from '$lib/features/database/detail/image'
	import { getSummonTransformation } from '$lib/utils/images'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'weapon' | 'character' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item }: Props = $props()

	let substitutions = $derived(item.substitutions ?? [])
	let role = $derived(item.role)
	let note = $derived(item.substitutionNote)

	function getSubstituteItem(sub: Substitution) {
		if (type === 'character') return sub.gridCharacter
		if (type === 'weapon') return sub.gridWeapon
		if (type === 'summon') return sub.gridSummon
		return undefined
	}

	function getSubstituteImageUrl(sub: Substitution): string {
		const gridItem = getSubstituteItem(sub)
		if (!gridItem) return ''

		if (type === 'weapon') {
			const w = gridItem as GridWeapon
			const element = w.weapon?.element === 0 ? (w.element ?? 0) : undefined
			return getWeaponImage(w.weapon?.granblueId, 'grid', element)
		} else if (type === 'character') {
			const c = gridItem as GridCharacter
			return getCharacterImageWithPose(c.character?.granblueId, 'main', c.uncapLevel ?? 0, c.transcendenceStep ?? 0)
		} else {
			const s = gridItem as GridSummon
			const transformation = getSummonTransformation(s.summon?.granblueId, s.uncapLevel, s.transcendenceStep)
			return getSummonImage(s.summon?.granblueId, 'grid', transformation)
		}
	}

	function getSubstituteName(sub: Substitution): string {
		const gridItem = getSubstituteItem(sub)
		if (!gridItem) return ''

		if (type === 'weapon') return localizedName((gridItem as GridWeapon).weapon?.name)
		if (type === 'character') return localizedName((gridItem as GridCharacter).character?.name)
		if (type === 'summon') return localizedName((gridItem as GridSummon).summon?.name)
		return ''
	}
</script>

<div class="substitutions-sidebar">
	{#if role}
		<div class="section">
			<h3 class="section-label">{m.substitution_role()}</h3>
			<div class="role-badge">
				{localizedName({ en: role.nameEn, ja: role.nameJp })}
			</div>
		</div>
	{/if}

	{#if note}
		<div class="section">
			<h3 class="section-label">{m.substitution_note()}</h3>
			<p class="note-text">{note}</p>
		</div>
	{/if}

	<div class="section">
		<h3 class="section-label">
			{m.substitution_title()}
			{#if substitutions.length > 0}
				<span class="count">({substitutions.length})</span>
			{/if}
		</h3>

		{#if substitutions.length === 0}
			<p class="empty-state">{m.substitution_empty()}</p>
		{:else}
			<ul class="substitution-list">
				{#each substitutions as sub (sub.id)}
					<li class="substitution-item">
						<div class="substitute-image">
							<img
								src={getSubstituteImageUrl(sub)}
								alt={getSubstituteName(sub)}
							/>
						</div>
						<span class="substitute-name">{getSubstituteName(sub)}</span>
					</li>
				{/each}
			</ul>
		{/if}
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.substitutions-sidebar {
		padding: 0 0 spacing.$unit-2x;
		color: var(--text-primary);
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-3x;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.section-label {
		font-size: typography.$font-small;
		font-weight: typography.$bold;
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;

		.count {
			font-weight: normal;
		}
	}

	.role-badge {
		display: inline-flex;
		align-items: center;
		padding: spacing.$unit-half spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$input-corner;
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		width: fit-content;
	}

	.note-text {
		font-size: typography.$font-body;
		line-height: 1.5;
		color: var(--text-primary);
		margin: 0;
	}

	.empty-state {
		font-size: typography.$font-small;
		color: var(--text-tertiary);
		margin: 0;
	}

	.substitution-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.substitution-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		background: var(--card-bg);
		border-radius: layout.$input-corner;
	}

	.substitute-image {
		width: 40px;
		height: 40px;
		border-radius: 4px;
		overflow: hidden;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: cover;
		}
	}

	.substitute-name {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-primary);
	}
</style>
