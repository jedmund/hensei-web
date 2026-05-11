<script lang="ts">
	import type { Role } from '$lib/types/api/party'
	import { createQuery } from '@tanstack/svelte-query'
	import { roleQueries } from '$lib/api/queries/role.queries'
	import { buildEntityIconUrl } from '$lib/utils/entityIcon'
	import { localizedName } from '$lib/utils/locale'
	import MultiSelect from '$lib/components/ui/MultiSelect.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		roles: Role[]
		cap: number
		onChange: (next: string[]) => void
	}

	let { roles, cap, onChange }: Props = $props()

	const rolesQuery = createQuery(() => ({ ...roleQueries.all() }))

	let selectedRoleIds = $derived(roles.map((r) => r.id))

	// Render chips above the picker using full Role records so we have name/icon
	// even before the catalog query resolves (the grid item itself ships them).
	const selectedRoles = $derived.by((): Role[] =>
		[...roles].sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
	)

	const roleOptions = $derived.by(() => {
		const all = (rolesQuery.data ?? []) as Role[]
		const selected = new Set(selectedRoleIds)
		return all.map((r) => ({
			value: r.id,
			label: localizedName({ en: r.nameEn, ja: r.nameJp }) ?? r.nameEn,
			image: buildEntityIconUrl(r.iconKey) ?? undefined,
			imageBackground: 'var(--placeholder-bg)',
			// Disable un-selected options once we hit the cap so the user can't
			// add a fourth role; selected options stay enabled so they can be
			// removed.
			disabled: selectedRoleIds.length >= cap && !selected.has(r.id)
		}))
	})

	let pickerOpen = $state(false)

	function handleChange(next: string[]) {
		onChange(next)
		// Close the picker as soon as we hit the cap — no further selections
		// are possible, and the trigger will disable on the next render.
		if (next.length >= cap) pickerOpen = false
	}

	function removeRole(id: string) {
		handleChange(selectedRoleIds.filter((selectedId) => selectedId !== id))
	}
</script>

<div class="roles-field">
	{#if selectedRoles.length > 0}
		<ul class="role-chips">
			{#each selectedRoles as role (role.id)}
				{@const iconUrl = buildEntityIconUrl(role.iconKey)}
				<li class="role-chip">
					<span class="chip-icon">
						{#if iconUrl}
							<img src={iconUrl} alt="" />
						{/if}
					</span>
					<span class="chip-label"
						>{localizedName({ en: role.nameEn, ja: role.nameJp }) ?? role.nameEn}</span
					>
					<button
						type="button"
						class="chip-remove"
						onclick={() => removeRole(role.id)}
						title={m.substitution_remove()}
					>
						<Icon name="close" size={12} />
					</button>
				</li>
			{/each}
		</ul>
	{/if}
	<MultiSelect
		options={roleOptions}
		value={selectedRoleIds}
		onValueChange={handleChange}
		bind:open={pickerOpen}
		placeholder={m.notes_roles_placeholder()}
		displayText={m.notes_roles_placeholder()}
		disabled={selectedRoleIds.length >= cap}
		size="medium"
		contained
		fullWidth
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.roles-field {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
	}

	.role-chips {
		list-style: none;
		padding: 0;
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

		.chip-remove {
			display: inline-flex;
			align-items: center;
			justify-content: center;
			width: 16px;
			height: 16px;
			padding: 0;
			border: none;
			background: transparent;
			color: var(--text-tertiary);
			cursor: pointer;
			border-radius: 50%;
			margin-left: spacing.$unit-half;
			transition:
				color 0.15s ease,
				background 0.15s ease;

			&:hover {
				color: var(--text-primary);
				background: var(--input-bound-bg-hover);
			}
		}
	}
</style>
