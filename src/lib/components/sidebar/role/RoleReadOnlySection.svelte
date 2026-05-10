<script lang="ts">
	/**
	 * Read-only Role section for the Team view of `DetailsSidebar`.
	 *
	 * Renders only the sub-blocks that have data: role name, rich-text note,
	 * substitutes list. The whole section collapses to nothing if the slot has
	 * no role data at all.
	 */
	import type {
		GridCharacter,
		GridWeapon,
		GridSummon,
		Role,
		Substitution,
		SubstitutionNote
	} from '$lib/types/api/party'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import RoleIcon from '$lib/components/database/RoleIcon.svelte'
	import RoleNoteView from './RoleNoteView.svelte'
	import { localizedName } from '$lib/utils/locale'
	import {
		getCharacterImage,
		getWeaponImage,
		getSummonImage,
		getPlaceholder
	} from '$lib/features/database/detail/image'
	import { getWeaponFallbackImage, handleImageFallback, STYLE_SWAP_POSE } from '$lib/utils/images'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item }: Props = $props()

	const role = $derived((item as GridWeapon).role as Role | undefined)
	const note = $derived(
		(item as GridWeapon).substitutionNote as SubstitutionNote | null | undefined
	)
	const substitutions = $derived(
		[...(((item as GridWeapon).substitutions ?? []) as Substitution[])].sort(
			(a, b) => a.position - b.position
		)
	)

	const hasNote = $derived.by(() => {
		if (note == null) return false
		const content = (note as { content?: unknown[] }).content
		if (!Array.isArray(content) || content.length === 0) return false
		// Treat single empty paragraph as no content.
		if (content.length === 1) {
			const para = content[0] as { type?: string; content?: unknown[] }
			if (para?.type === 'paragraph' && (!para.content || para.content.length === 0)) return false
		}
		return true
	})

	const hasAny = $derived(!!role || hasNote || substitutions.length > 0)

	function getSubstituteName(sub: Substitution): string {
		if (sub.gridCharacter) return localizedName(sub.gridCharacter.character?.name) ?? '—'
		if (sub.gridWeapon) return localizedName(sub.gridWeapon.weapon?.name) ?? '—'
		if (sub.gridSummon) return localizedName(sub.gridSummon.summon?.name) ?? '—'
		return '—'
	}

	function getSubstituteImage(sub: Substitution): string {
		if (sub.gridCharacter?.character) {
			const c = sub.gridCharacter.character
			return getCharacterImage(c.granblueId, 'square', c.styleSwap ? STYLE_SWAP_POSE : '01')
		}
		if (sub.gridWeapon?.weapon) {
			const w = sub.gridWeapon.weapon
			return getWeaponImage(w.granblueId, 'square', w.element === 0 ? 0 : undefined)
		}
		if (sub.gridSummon?.summon) {
			return getSummonImage(sub.gridSummon.summon.granblueId, 'square')
		}
		return getPlaceholder(type, 'square')
	}

	function getSubstituteFallbackImage(sub: Substitution): string | undefined {
		if (sub.gridWeapon?.weapon && sub.gridWeapon.weapon.element === 0) {
			return getWeaponFallbackImage(sub.gridWeapon.weapon.granblueId, 'square')
		}
		return undefined
	}

	function isFromCollection(sub: Substitution): boolean {
		return !!(
			sub.gridCharacter?.collectionCharacterId ||
			sub.gridWeapon?.collectionWeaponId ||
			sub.gridSummon?.collectionSummonId
		)
	}
</script>

{#if hasAny}
	<div class="role-readonly-section">
		{#snippet noteDescription()}
			<RoleNoteView value={note ?? null} />
		{/snippet}

		{#if role || hasNote}
			<DetailsSection
				title={m.substitution_role()}
				description={hasNote ? noteDescription : undefined}
			>
				{#if role}
					<div class="role-row">
						<RoleIcon iconKey={role.iconKey} name={role.nameEn} size={32} />
						<p class="role-name">{localizedName({ en: role.nameEn, ja: role.nameJp })}</p>
					</div>
				{/if}
			</DetailsSection>
		{/if}

		{#if substitutions.length > 0}
			<DetailsSection title={m.substitution_substitutes()}>
				<ol class="substitution-list">
					{#each substitutions as sub (sub.id)}
						{@const character = sub.gridCharacter?.character}
						{@const fromCollection = isFromCollection(sub)}
						<li class="substitution-item">
							<img
								src={getSubstituteImage(sub)}
								alt=""
								class="thumb"
								loading="lazy"
								onerror={(e) => handleImageFallback(e, getSubstituteFallbackImage(sub))}
							/>
							<div class="info">
								<span class="name">{getSubstituteName(sub)}</span>
								{#if character}
									<div class="meta">
										<CharacterTags {character} />
									</div>
								{/if}
							</div>
							{#if fromCollection}
								<Icon name="bookmark" size={14} class="collection-indicator" />
							{/if}
						</li>
					{/each}
				</ol>
			</DetailsSection>
		{/if}
	</div>
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.role-readonly-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x + spacing.$unit-half;
	}

	.role-row {
		display: flex;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: calc(spacing.$unit * 1.5) spacing.$unit;
	}

	.role-name {
		font-size: typography.$font-regular;
		font-weight: typography.$medium;
		margin: 0;
		color: var(--text-primary);
	}

	.substitution-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.substitution-item {
		display: flex;
		align-items: center;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border-radius: spacing.$unit;
	}

	.thumb {
		width: 48px;
		height: 48px;
		object-fit: cover;
		border-radius: spacing.$unit-half;
		background: var(--placeholder-bg);
		flex-shrink: 0;
	}

	.info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.name {
		min-width: 0;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		color: var(--text-primary);
	}

	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: spacing.$unit-half;
	}

	:global(.collection-indicator) {
		color: var(--accent-blue);
		flex-shrink: 0;
	}
</style>
