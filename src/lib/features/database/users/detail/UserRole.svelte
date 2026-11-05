<script lang="ts">
	// The user's role, and the control admins change it with (user, curator or
	// editor). Admins are made in the console, and nobody changes their own
	// role here. Each change asks first, then updates the record in place.
	import { useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import { page } from '$app/state'
	import * as m from '$lib/paraglide/messages'
	import { adminAdapter } from '$lib/api/adapters/admin.adapter'
	import { adminKeys } from '$lib/api/queries/admin.queries'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import SegmentedControl from '$lib/components/ui/segmented-control/SegmentedControl.svelte'
	import Segment from '$lib/components/ui/segmented-control/Segment.svelte'
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

	// What the control shows: the saved role, or the one being confirmed
	let shown = $derived(String(record.role))

	let pending = $state<number | null>(null)
	let confirming = $state(false)
	let saving = $state(false)

	function choose(value: string) {
		const role = Number(value)
		if (role === record.role) return
		pending = role
		confirming = true
	}

	function cancel() {
		confirming = false
		pending = null
		shown = String(record.role)
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

<div class="role">
	{#if targetIsAdmin}
		<p class="current">{roleLabel(record.role)}</p>
		<p class="hint">{m.db_users_role_admin_hint()}</p>
	{:else}
		<SegmentedControl bind:value={shown} onValueChange={choose} size="small">
			{#each ASSIGNABLE_ROLES as role (role)}
				<Segment value={String(role)} disabled={isSelf || saving}>{roleLabel(role)}</Segment>
			{/each}
		</SegmentedControl>
		{#if isSelf}
			<p class="hint">{m.db_users_role_self_hint()}</p>
		{/if}
	{/if}
</div>

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
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.role {
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: spacing.$unit;
		width: 100%;
	}

	.current {
		margin: 0;
		font-weight: typography.$bold;
	}

	.hint {
		margin: 0;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}
</style>
