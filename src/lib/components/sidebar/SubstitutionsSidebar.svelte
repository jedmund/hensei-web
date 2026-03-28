<script lang="ts">
	import type { GridCharacter, GridWeapon, GridSummon, Role, Substitution } from '$lib/types/api/party'
	import { localizedName } from '$lib/utils/locale'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		type: 'character' | 'weapon' | 'summon'
		item: GridCharacter | GridWeapon | GridSummon
	}

	let { type, item }: Props = $props()

	let role = $derived((item as GridWeapon).role as Role | undefined)
	let note = $derived((item as GridWeapon).substitutionNote as string | undefined)
	let substitutions = $derived(
		((item as GridWeapon).substitutions ?? []) as Substitution[]
	)

	function getSubstituteName(sub: Substitution): string {
		if (sub.gridCharacter) return localizedName(sub.gridCharacter.character?.name) ?? '—'
		if (sub.gridWeapon) return localizedName(sub.gridWeapon.weapon?.name) ?? '—'
		if (sub.gridSummon) return localizedName(sub.gridSummon.summon?.name) ?? '—'
		return '—'
	}
</script>

<div class="substitutions-sidebar">
	{#if role}
		<section class="section">
			<h3 class="section-title">{m.substitution_role()}</h3>
			<p class="role-name">{localizedName({ en: role.nameEn, ja: role.nameJp })}</p>
		</section>
	{/if}

	{#if note}
		<section class="section">
			<h3 class="section-title">{m.substitution_note()}</h3>
			<p class="note">{note}</p>
		</section>
	{/if}

	<section class="section">
		<h3 class="section-title">{m.substitution_substitutes()}</h3>
		{#if substitutions.length === 0}
			<p class="empty">{m.substitution_empty()}</p>
		{:else}
			<ol class="substitution-list">
				{#each substitutions.sort((a, b) => a.position - b.position) as sub (sub.id)}
					<li class="substitution-item">
						<span class="position">{sub.position + 1}.</span>
						<span class="name">{getSubstituteName(sub)}</span>
					</li>
				{/each}
			</ol>
		{/if}
	</section>
</div>

<style lang="scss">
	.substitutions-sidebar {
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.section-title {
		font-size: 11px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.role-name {
		font-size: 14px;
		font-weight: 500;
		margin: 0;
	}

	.note {
		font-size: 13px;
		line-height: 1.5;
		margin: 0;
		white-space: pre-wrap;
	}

	.empty {
		font-size: 13px;
		color: var(--text-tertiary);
		margin: 0;
	}

	.substitution-list {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.substitution-item {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 14px;
	}

	.position {
		color: var(--text-secondary);
		min-width: 20px;
	}
</style>
