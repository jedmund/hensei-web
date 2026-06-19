<script lang="ts">
	import type {
		CharacterSkill,
		CharacterSkillLink,
		CharacterSkillVersion
	} from '$lib/types/api/entities'
	import SkillVersionCard from './SkillVersionCard.svelte'
	import * as m from '$lib/paraglide/messages'

	// Only the skill graph is needed; typed structurally so either Character shape
	// (entities vs adapter) is accepted without coupling to the full entity.
	interface Props {
		character: { skills?: CharacterSkill[]; skillLinks?: CharacterSkillLink[] }
	}

	let { character }: Props = $props()

	const skills = $derived(character.skills ?? [])

	const groups = [
		{ kind: 'ability', title: m.character_skills_group_ability },
		{ kind: 'ougi', title: m.character_skills_group_ougi },
		{ kind: 'support', title: m.character_skills_group_support }
	] as const

	// Progression versions collapse into badges on the base card rather than
	// becoming their own cards.
	const PROGRESSION = new Set(['enhanced', 'uncap_upgrade', 'transcendence_upgrade'])

	const RELATION_LABEL: Record<string, () => string> = {
		transforms_to: m.character_skills_rel_transforms_to,
		option_of: m.character_skills_rel_option_of,
		form_counterpart: m.character_skills_rel_form_counterpart
	}

	// Fallback label by battle-state variant role when a version isn't a link target.
	const VARIANT_ROLE_LABEL: Record<string, () => string> = {
		transform_alt: m.character_skills_rel_transforms_to,
		option: m.character_skills_rel_option_of,
		form_alt: m.character_skills_rel_form_counterpart,
		conditional: m.character_skills_role_conditional
	}

	function slotsOfKind(kind: string): CharacterSkill[] {
		return skills.filter((slot) => slot.kind === kind).sort((a, b) => a.position - b.position)
	}

	function primaryVersion(slot: CharacterSkill): CharacterSkillVersion | undefined {
		return slot.versions.find((version) => version.variantRole === 'base') ?? slot.versions[0]
	}

	function progressionBadges(slot: CharacterSkill): string[] {
		const badges: string[] = []
		for (const version of slot.versions) {
			if (!PROGRESSION.has(version.variantRole)) continue
			if (version.variantRole === 'enhanced') {
				badges.push(
					version.unlockLevel
						? `${m.character_skills_role_enhanced()} ${m.character_skills_level({ n: version.unlockLevel })}`
						: m.character_skills_role_enhanced()
				)
			} else if (version.variantRole === 'uncap_upgrade') {
				badges.push(
					version.minUncap
						? `${m.character_skills_role_uncap()} ${m.character_skills_uncap_star({ n: version.minUncap })}`
						: m.character_skills_role_uncap()
				)
			} else if (version.variantRole === 'transcendence_upgrade') {
				badges.push(m.character_skills_role_transcendence())
			}
		}
		return [...new Set(badges)]
	}

	// Relation label for a version that is the target of a link (precise), used
	// when present; otherwise we fall back to the version's own role.
	function relationLabelFor(versionId: string): string | undefined {
		const link = (character.skillLinks ?? []).find((edge) => edge.to === versionId)
		return link ? RELATION_LABEL[link.relation]?.() : undefined
	}

	// Battle-state variants (transform/option/form/conditional) render as linked
	// sub-cards under the slot's base; progression is excluded (it's badges).
	function subVariants(slot: CharacterSkill) {
		const primary = primaryVersion(slot)
		return slot.versions
			.filter((version) => version !== primary && !PROGRESSION.has(version.variantRole))
			.map((version) => ({
				version,
				label:
					relationLabelFor(version.id) ?? VARIANT_ROLE_LABEL[version.variantRole]?.() ?? undefined
			}))
	}
</script>

<div class="skills-tab">
	{#if !skills.length}
		<div class="empty"><p>{m.character_skills_empty()}</p></div>
	{:else}
		{#each groups as group (group.kind)}
			{@const groupSlots = slotsOfKind(group.kind)}
			{#if groupSlots.length}
				<section class="skill-group">
					<h3 class="group-title">{group.title()}</h3>
					<div class="slot-list">
						{#each groupSlots as slot (slot.kind + slot.position)}
							{@const primary = primaryVersion(slot)}
							{#if primary}
								<div class="slot">
									<SkillVersionCard
										version={primary}
										kind={slot.kind}
										badges={progressionBadges(slot)}
									/>
									{#each subVariants(slot) as sub (sub.version.id)}
										<SkillVersionCard
											version={sub.version}
											kind={slot.kind}
											relationLabel={sub.label}
											linked
										/>
									{/each}
								</div>
							{/if}
						{/each}
					</div>
				</section>
			{/if}
		{/each}
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.skills-tab {
		display: flex;
		flex-direction: column;
	}

	.empty {
		text-align: center;
		padding: spacing.$unit * 4;
		color: var(--text-secondary);

		p {
			margin: 0;
		}
	}

	.skill-group {
		padding: spacing.$unit-2x;
	}

	.group-title {
		font-size: typography.$font-small;
		font-weight: typography.$medium;
		color: var(--text-secondary);
		margin: 0 0 spacing.$unit 0;
	}

	.slot-list {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
	}

	.slot {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}
</style>
