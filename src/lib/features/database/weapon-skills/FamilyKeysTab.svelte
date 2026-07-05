<script lang="ts">
	import { entityAdapter } from '$lib/api/adapters/entity.adapter'
	import Button from '$lib/components/ui/Button.svelte'
	import type { FamilyKey, WeaponSkillFamily } from '$lib/types/api/weaponSkillFamily'

	interface Props {
		family: WeaponSkillFamily
		canEdit: boolean
		onMutated: () => Promise<void>
	}

	let { family, canEdit, onMutated }: Props = $props()

	let savingId = $state<string | null>(null)
	let error = $state<string | null>(null)
	let edits = $state<Record<string, { nameEn: string; nameJp: string }>>({})

	function keyName(key: FamilyKey): { en: string; ja: string } {
		return {
			en: key.name?.en ?? key.nameEn ?? '',
			ja: key.name?.ja ?? key.nameJp ?? ''
		}
	}

	function buffer(key: FamilyKey) {
		if (!edits[key.id]) {
			const name = keyName(key)
			edits[key.id] = { nameEn: name.en, nameJp: name.ja }
		}
		return edits[key.id]!
	}

	function effectsForKey(slug: string) {
		return family.effects.filter((e) => e.keySlug === slug)
	}

	async function saveKey(key: FamilyKey) {
		const buf = edits[key.id]
		if (!buf) return
		savingId = key.id
		error = null
		try {
			await entityAdapter.updateWeaponKey(key.id, { name_en: buf.nameEn, name_jp: buf.nameJp })
			delete edits[key.id]
			await onMutated()
		} catch (err) {
			error = err instanceof Error ? err.message : 'Failed to save'
		} finally {
			savingId = null
		}
	}
</script>

<div class="keys-tab">
	{#if error}
		<p class="error">{error}</p>
	{/if}

	{#if family.keys.length === 0}
		<p class="empty">No weapon keys reference this family.</p>
	{:else}
		<div class="cards">
			{#each family.keys as key (key.id)}
				{@const buf = buffer(key)}
				<div class="card">
					<div class="card-header">
						<span class="slug">{key.slug}</span>
					</div>
					<div class="fields">
						{#if canEdit}
							<input type="text" bind:value={buf.nameEn} placeholder="Name (en)" />
							<input type="text" bind:value={buf.nameJp} placeholder="Name (ja)" />
						{:else}
							<span>{keyName(key).en || '—'}</span>
							<span class="jp">{keyName(key).ja || ''}</span>
						{/if}
					</div>
					{#if effectsForKey(key.slug).length > 0}
						<ul class="key-effects">
							{#each effectsForKey(key.slug) as effect (effect.id)}
								<li>
									{effect.boostType} · {effect.scalingKind}
									{#if effect.value != null}
										· {effect.value}{effect.valueUnit === 'percent' ? '%' : ''}
									{/if}
								</li>
							{/each}
						</ul>
					{/if}
					{#if canEdit}
						<div class="actions">
							<Button
								variant="secondary"
								size="small"
								onclick={() => saveKey(key)}
								disabled={savingId === key.id}
							>
								{savingId === key.id ? 'Saving…' : 'Save'}
							</Button>
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.keys-tab {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.error {
		color: var(--red);
		font-size: typography.$font-small;
		margin: 0;
	}

	.empty {
		color: var(--text-tertiary);
		text-align: center;
		padding: spacing.$unit-4x 0;
	}

	.cards {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: spacing.$unit;
	}

	.card {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		padding: spacing.$unit;
		border: 1px solid var(--table-border);
		border-radius: layout.$item-corner;
	}

	.card-header .slug {
		font-family: monospace;
		font-size: typography.$font-tiny;
		color: var(--text-tertiary);
	}

	.fields {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
		font-size: typography.$font-small;

		input {
			padding: 2px spacing.$unit-half;
			background: var(--input-bound-bg);
			border: none;
			border-radius: layout.$item-corner-small;
			font-size: typography.$font-small;
			color: var(--text-primary);
		}

		.jp {
			color: var(--text-tertiary);
		}
	}

	.key-effects {
		list-style: none;
		margin: 0;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
		font-size: typography.$font-tiny;
		color: var(--text-secondary);
	}

	.actions {
		display: flex;
		gap: spacing.$unit-half;
	}
</style>
