<script lang="ts">
	// Every change made to the user's access, newest first: who changed what,
	// and when. Draws its own container (the section's `container: false`) so
	// a user with no changes has no empty History box.
	import * as m from '$lib/paraglide/messages'
	import DetailsContainer from '$lib/components/ui/DetailsContainer.svelte'
	import { roleLabel } from '$lib/features/database/users/roles'
	import type { UserRecord } from '$lib/features/database/users/resource'
	import type { AdminUserAccessChange } from '$lib/types/api/admin'
	import { formatDateTime } from '$lib/utils/date'

	let { record }: { record: UserRecord } = $props()

	const changes = $derived(record.history ?? [])

	function describe(change: AdminUserAccessChange): string {
		return m.db_users_history_role({
			actor: change.actor?.username ?? m.db_users_history_deleted_actor(),
			from: roleLabel(change.fromRole),
			to: roleLabel(change.toRole)
		})
	}
</script>

{#if changes.length}
	<DetailsContainer title={m.db_users_section_history()}>
		<ol class="changes">
			{#each changes as change (change.id)}
				<li class="change">
					<span class="what">{describe(change)}</span>
					<time class="when" datetime={change.createdAt}>{formatDateTime(change.createdAt)}</time>
				</li>
			{/each}
		</ol>
	</DetailsContainer>
{/if}

<style lang="scss">
	@use '$src/themes/layout' as layout;
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.changes {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit;
		width: 100%;
		margin: 0;
		padding: 0;
		list-style: none;
	}

	.change {
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: spacing.$unit-2x;
		padding: spacing.$unit spacing.$unit-2x;
		background: var(--table-header-bg);
		border: 1px solid var(--table-border);
		border-radius: layout.$item-corner;
	}

	.when {
		flex-shrink: 0;
		color: var(--text-secondary);
		font-size: typography.$font-small;
	}
</style>
