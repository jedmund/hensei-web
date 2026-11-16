<!-- Database > Refresh: curators show changes on Home and in the gacha rate-ups without waiting for caches (GBF-279) -->

<script lang="ts">
	import { createMutation, createQuery, useQueryClient } from '@tanstack/svelte-query'
	import { toast } from 'svelte-sonner'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import DatabasePageHeader from '$lib/components/database/DatabasePageHeader.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import SettingsRow from '$lib/components/ui/SettingsRow.svelte'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { refreshAdapter, type RefreshStatus } from '$lib/api/adapters/refresh.adapter'
	import { refreshKeys, refreshQueries } from '$lib/api/queries/admin.queries'
	import { homeKeys } from '$lib/api/queries/home.queries'
	import { extractErrorMessage } from '$lib/utils/errors'
	import { formatRelativeTime } from '$lib/utils/date'

	const queryClient = useQueryClient()
	const statusQuery = createQuery(() => refreshQueries.status())
	const status = $derived(statusQuery.data)

	function onRefreshed(next: RefreshStatus, message: string) {
		queryClient.setQueryData(refreshKeys.status(), next)
		toast.success(message)
	}

	const onError = (err: unknown) => toast.error(extractErrorMessage(err, m.db_refresh_error()))

	const homeMut = createMutation(() => ({
		mutationFn: () => refreshAdapter.refreshHome(),
		onSuccess: (next: RefreshStatus) => {
			// This tab's copy of Home too, so going there shows the rebuilt feed
			queryClient.invalidateQueries({ queryKey: homeKeys.all })
			onRefreshed(next, m.db_refresh_home_done())
		},
		onError
	}))

	const gachaMut = createMutation(() => ({
		mutationFn: () => refreshAdapter.refreshGacha(),
		onSuccess: (next: RefreshStatus) => onRefreshed(next, m.db_refresh_gacha_done()),
		onError
	}))

	const relative = (time: string) => formatRelativeTime(time, getLocale())

	const minutes = $derived(Math.round((status?.home.cacheSeconds ?? 300) / 60))

	const bannerLine = $derived.by(() => {
		const banner = status?.gacha.banner
		if (!banner) return m.db_refresh_no_banner()
		return m.db_refresh_banner({
			name: banner.name ?? m.db_refresh_banner_unnamed({ id: banner.gameId }),
			fetched: relative(banner.fetchedAt)
		})
	})

	const pending = $derived(status?.gacha.refetchRequestedAt ?? null)
</script>

<PageMeta title={`${m.db_refresh_title()} — Database`} description={m.db_refresh_description()} />

<div class="page">
	<DatabasePageHeader title={m.db_refresh_title()} />

	<div class="content">
		<p class="description">{m.db_refresh_description()}</p>

		<SettingsRow
			title={m.db_refresh_home_title()}
			subtitle={m.db_refresh_home_subtitle({ minutes })}
			compact
		>
			{#snippet control()}
				<Button
					variant="secondary"
					size="small"
					disabled={homeMut.isPending}
					onclick={() => homeMut.mutate()}
				>
					{m.db_refresh_home_button()}
				</Button>
			{/snippet}
		</SettingsRow>

		<hr class="separator" />

		<SettingsRow
			title={m.db_refresh_gacha_title()}
			subtitle={m.db_refresh_gacha_subtitle()}
			compact
		>
			{#snippet control()}
				<Button
					variant="secondary"
					size="small"
					disabled={gachaMut.isPending}
					onclick={() => gachaMut.mutate()}
				>
					{m.db_refresh_gacha_button()}
				</Button>
			{/snippet}
		</SettingsRow>

		<div class="status" aria-live="polite">
			{#if statusQuery.isError}
				<p class="error">{m.db_refresh_load_error()}</p>
			{:else if status}
				<p>{bannerLine}</p>
				{#if pending}
					<p>{m.db_refresh_pending({ requested: relative(pending) })}</p>
				{/if}
			{/if}
		</div>
	</div>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;
	@use '$src/themes/layout' as layout;

	.page {
		background: var(--card-bg);
		border-radius: layout.$page-corner;
		box-shadow: var(--shadow-sm);
	}

	.content {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-2x;
		padding: 0 spacing.$unit-2x spacing.$unit-2x;
	}

	.description,
	.status p {
		margin: 0;
		font-size: typography.$font-small;
		color: var(--text-secondary);
	}

	.status {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit-half;
	}

	.error {
		color: var(--danger);
	}

	.separator {
		border: none;
		border-top: 1px solid var(--separator-bg);
		margin: 0;
	}
</style>
