<script lang="ts">
	import * as m from '$lib/paraglide/messages'
	import { browser } from '$app/environment'
	import { createQuery } from '@tanstack/svelte-query'
	import Button from '$lib/components/ui/Button.svelte'
	import Icon from '$lib/components/Icon.svelte'
	import MigratePartiesDialog from '$lib/components/dialogs/MigratePartiesDialog.svelte'
	import { hasEditKeys } from '$lib/utils/editKeys'
	import { userQueries } from '$lib/api/queries/user.queries'

	let showDialog = $state(false)
	let dismissed = $state(false)

	const hasLocalKeys = browser ? hasEditKeys() : false

	// Only query server if no local keys (to check for deposited keys)
	const meQuery = createQuery(() => ({
		...userQueries.me(),
		enabled: browser && !hasLocalKeys
	}))

	const visible = $derived(
		!dismissed && (hasLocalKeys || (meQuery.data?.hasStoredEditKeys ?? false))
	)
</script>

{#if visible}
	<div class="migrate-banner">
		<div class="banner-content">
			<Icon name="info" size={18} />
			<p>{m.migrate_banner_text()}</p>
		</div>
		<Button size="small" variant="primary" onclick={() => (showDialog = true)}>
			{m.migrate_banner_action()}
		</Button>
	</div>

	<MigratePartiesDialog bind:open={showDialog} onComplete={() => (dismissed = true)} />
{/if}

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/typography' as *;

	.migrate-banner {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: $unit-2x;
		padding: $unit-half $unit-2x;
		background: var(--toast-info-bg);
		border: 1px solid var(--border-subtle);
		border-radius: $unit;
		margin-bottom: $unit-2x;
	}

	.banner-content {
		display: flex;
		align-items: center;
		gap: $unit;
		color: var(--text-primary);

		p {
			margin: 0;
			font-size: $font-small;
			line-height: 1.4;
		}

		:global(svg) {
			flex-shrink: 0;
			color: var(--accent-blue);
		}
	}
</style>
