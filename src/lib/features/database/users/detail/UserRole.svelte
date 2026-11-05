<script lang="ts">
	// The user's role, with a "…" menu in the section's header to change it
	// (user, curator or editor). Admins are made in the console, and nobody
	// changes their own role here. Each change asks first, then updates the
	// record in place. Draws its own container (the section's `container: false`).
	import { useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import { page } from '$app/state'
	import * as m from '$lib/paraglide/messages'
	import { adminAdapter } from '$lib/api/adapters/admin.adapter'
	import { adminKeys } from '$lib/api/queries/admin.queries'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import Button from '$lib/components/ui/Button.svelte'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import DetailItem from '$lib/components/ui/DetailItem.svelte'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import { isAdmin } from '$lib/auth/roles'
	import { ASSIGNABLE_ROLES, roleLabel } from '$lib/features/database/users/roles'
	import { asUserRecord, type UserRecord } from '$lib/features/database/users/resource'
	import { extractErrorMessage } from '$lib/utils/errors'

	let { record }: { record: UserRecord } = $props()

	const queryClient = useQueryClient()

	const viewerId = $derived(
		(page.data as { account?: { userId?: string } | null }).account?.userId ?? null
	)
	const isSelf = $derived(viewerId === record.id)
	const targetIsAdmin = $derived(isAdmin(record.role))

	const canChange = $derived(!isSelf && !targetIsAdmin)
	const choices = $derived(ASSIGNABLE_ROLES.filter((role) => role !== record.role))

	let pending = $state<number | null>(null)
	let confirming = $state(false)
	let saving = $state(false)

	function choose(role: number) {
		pending = role
		confirming = true
	}

	function cancel() {
		confirming = false
		pending = null
	}

	async function save() {
		if (pending === null || saving) return
		saving = true
		try {
			const updated = asUserRecord(await adminAdapter.updateUserRole(record.id, pending))
			queryClient.setQueryData(adminKeys.user(record.id), updated)
			await queryClient.invalidateQueries({ queryKey: adminKeys.lists('users') })
			toast.success(m.db_users_role_changed({ username: record.username }))
			confirming = false
			pending = null
		} catch (error) {
			toast.error(extractErrorMessage(error, m.db_users_role_failed()))
			cancel()
		} finally {
			saving = false
		}
	}
</script>

{#snippet menu()}
	<DropdownMenu align="end">
		{#snippet trigger({ props })}
			<Button
				variant="ghost"
				size="small"
				iconOnly
				icon="ellipsis"
				aria-label={m.db_users_role_menu()}
				disabled={saving}
				{...props}
			/>
		{/snippet}
		{#snippet menu()}
			{#each choices as role (role)}
				<DropdownMenuBase.Item class="dropdown-menu-item" onclick={() => choose(role)}>
					{m.db_users_role_make({ role: roleLabel(role) })}
				</DropdownMenuBase.Item>
			{/each}
		{/snippet}
	</DropdownMenu>
{/snippet}

<DetailsContainer title={m.db_users_section_role()} action={canChange ? menu : undefined}>
	<DetailItem label={m.db_users_field_role()} value={roleLabel(record.role)} />
	{#if targetIsAdmin}
		<p class="hint">{m.db_users_role_admin_hint()}</p>
	{:else if isSelf}
		<p class="hint">{m.db_users_role_self_hint()}</p>
	{/if}
</DetailsContainer>

<ConfirmDialog
	bind:open={confirming}
	title={m.db_users_role_confirm_title()}
	message={m.db_users_role_confirm_message({
		username: record.username,
		role: roleLabel(pending)
	})}
	confirmLabel={m.db_users_role_confirm()}
	confirmVariant="primary"
	loading={saving}
	onconfirm={save}
	oncancel={cancel}
/>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.hint {
		margin: 0;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}
</style>
