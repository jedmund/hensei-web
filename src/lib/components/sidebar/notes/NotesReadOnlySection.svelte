<script lang="ts">
	/**
	 * Read-only Notes section for the Team view of `DetailsSidebar`.
	 *
	 * Renders only the sub-blocks that have data: (characters only) role chips,
	 * rich-text description, substitutes list. Whole section collapses to
	 * nothing if the slot has no data at all.
	 */
	import type {
		GridCharacter,
		GridWeapon,
		GridSummon,
		Role,
		Substitution,
		Description
	} from '$lib/types/api/party'
	import DetailsSection from '$lib/components/sidebar/details/DetailsSection.svelte'
	import CharacterTags from '$lib/components/tags/CharacterTags.svelte'
	import ElementLabel from '$lib/components/labels/ElementLabel.svelte'
	import ProficiencyLabel from '$lib/components/labels/ProficiencyLabel.svelte'
	import CollectionBadge from '$lib/components/CollectionBadge.svelte'
	import { getRoleIconUrl } from '$lib/utils/roles'
	import DescriptionView from './DescriptionView.svelte'
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

	const roles = $derived.by((): Role[] => {
		if (type !== 'character') return []
		const list = ((item as GridCharacter).roles ?? []) as Role[]
		// Server already sorts by sort_order, but defend against snapshots that
		// went through optimistic-update paths and might not be ordered.
		return [...list].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
	})
	const description = $derived((item as GridWeapon).description as Description | null | undefined)
	const substitutions = $derived(
		[...(((item as GridWeapon).substitutions ?? []) as Substitution[])].sort(
			(a, b) => a.position - b.position
		)
	)

	const hasDescription = $derived.by(() => {
		if (description == null) return false
		const content = (description as { content?: unknown[] }).content
		if (!Array.isArray(content) || content.length === 0) return false
		// Treat single empty paragraph as no content.
		if (content.length === 1) {
			const para = content[0] as { type?: string; content?: unknown[] }
			if (para?.type === 'paragraph' && (!para.content || para.content.length === 0)) return false
		}
		return true
	})

	const hasAny = $derived(roles.length > 0 || hasDescription || substitutions.length > 0)

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

	function getSubstituteElement(sub: Substitution): number | undefined {
		return (
			sub.gridCharacter?.character?.element ??
			sub.gridWeapon?.weapon?.element ??
			sub.gridSummon?.summon?.element
		)
	}

	function getSubstituteProficiencies(sub: Substitution): number[] {
		const charProfs = sub.gridCharacter?.character?.proficiency
		if (Array.isArray(charProfs)) return charProfs.filter((p): p is number => p !== undefined)
		const weaponProf = sub.gridWeapon?.weapon?.proficiency
		if (typeof weaponProf === 'number') return [weaponProf]
		return []
	}

	function isFromCollection(sub: Substitution): boolean {
		// `owned` is stamped by the API per current_user's collection.
		return !!(sub.gridCharacter?.owned || sub.gridWeapon?.owned || sub.gridSummon?.owned)
	}
</script>

{#if hasAny}
	<div class="notes-readonly-section">
		{#if roles.length > 0}
			<DetailsSection title={m.notes_roles_section_readonly()}>
				<ul class="role-chips">
					{#each roles as role (role.id)}
						{@const iconUrl = getRoleIconUrl(role.iconKey)}
						<li class="role-chip">
							<span class="chip-icon">
								{#if iconUrl}
									<img src={iconUrl} alt="" />
								{/if}
							</span>
							<span class="chip-label">{localizedName({ en: role.nameEn, ja: role.nameJp })}</span>
						</li>
					{/each}
				</ul>
			</DetailsSection>
		{/if}

		{#if hasDescription}
			<DetailsSection title={m.notes_description_section()}>
				<DescriptionView value={description ?? null} />
			</DetailsSection>
		{/if}

		{#if substitutions.length > 0}
			<DetailsSection title={m.substitution_substitutes()}>
				<ol class="substitution-list">
					{#each substitutions as sub (sub.id)}
						{@const character = sub.gridCharacter?.character}
						{@const element = getSubstituteElement(sub)}
						{@const proficiencies = getSubstituteProficiencies(sub)}
						{@const fromCollection = isFromCollection(sub)}
						<li class="substitution-item">
							<div class="thumb-wrapper">
								<img
									src={getSubstituteImage(sub)}
									alt=""
									class="thumb"
									loading="lazy"
									onerror={(e) => handleImageFallback(e, getSubstituteFallbackImage(sub))}
								/>
								{#if fromCollection}
									<CollectionBadge />
								{/if}
							</div>
							<div class="info">
								<span class="name">{getSubstituteName(sub)}</span>
								{#if element !== undefined || proficiencies.length > 0}
									<div class="labels">
										{#if element !== undefined}
											<ElementLabel {element} size="small" />
										{/if}
										{#each proficiencies as prof (prof)}
											<ProficiencyLabel proficiency={prof} size="small" />
										{/each}
									</div>
								{/if}
							</div>
							{#if character}
								<CharacterTags {character} />
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
	@use '$src/themes/layout' as layout;

	.notes-readonly-section {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x + spacing.$unit-half;
	}

	.role-chips {
		list-style: none;
		padding: 0 spacing.$unit;
		margin: 0;
		display: flex;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}

	.role-chip {
		display: inline-flex;
		align-items: center;
		gap: spacing.$unit-half;
		padding: spacing.$unit-half spacing.$unit spacing.$unit-half spacing.$unit-half;
		background: var(--input-bound-bg);
		border-radius: 999px;
		font-size: typography.$font-small;
		color: var(--text-primary);

		.chip-icon {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 24px;
			height: 24px;
			flex-shrink: 0;
			background: var(--placeholder-bg);
			border-radius: 50%;
			overflow: hidden;

			img {
				width: 16px;
				height: 16px;
				object-fit: contain;
			}
		}

		.chip-label {
			line-height: 1;
		}
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

	.thumb-wrapper {
		position: relative;
		width: 48px;
		height: 48px;
		flex-shrink: 0;
	}

	.thumb {
		display: block;
		width: 100%;
		height: 100%;
		object-fit: cover;
		border-radius: layout.$item-corner-small;
		border: 1px solid var(--border-primary);
		background: var(--placeholder-bg);
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
		font-size: typography.$font-regular;
	}

	.labels {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: spacing.$unit-half;
	}
</style>
