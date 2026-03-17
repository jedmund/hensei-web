<script lang="ts">
	import { createQuery } from '@tanstack/svelte-query'
	import { page } from '$app/stores'
	import type { Job, JobAccessory } from '$lib/types/api/entities'
	import type { UserCookie } from '$lib/types/UserCookie'
	import { jobQueries } from '$lib/api/queries/job.queries'
	import { getAccessoryImage } from '$lib/utils/images'
	import { localizedName } from '$lib/utils/locale'
	import SelectionSidebarLayout from './SelectionSidebarLayout.svelte'
	import Icon from '../Icon.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		job?: Job
		currentAccessory?: JobAccessory
		onSelectAccessory?: (accessory: JobAccessory) => void
		onRemoveAccessory?: () => void
	}

	let { job, currentAccessory, onSelectAccessory, onRemoveAccessory }: Props = $props()

	const currentUser = $derived($page.data?.currentUser as UserCookie | null)
	const accentColor = $derived(
		currentUser?.element ? `var(--${currentUser.element}-button-bg)` : 'var(--text-primary)'
	)

	const accessoriesQuery = createQuery(() => ({
		...jobQueries.accessoriesForJob(job?.id ?? ''),
		enabled: !!job?.id
	}))

	const accessories = $derived(accessoriesQuery.data ?? [])
	const isEmpty = $derived(accessories.length === 0 && !accessoriesQuery.isLoading && !accessoriesQuery.isError)

	function handleClick(accessory: JobAccessory) {
		if (isSelected(accessory)) {
			onRemoveAccessory?.()
		} else {
			onSelectAccessory?.(accessory)
		}
	}

	function isSelected(accessory: JobAccessory): boolean {
		return accessory.id === currentAccessory?.id
	}
</script>

<div class="accessory-selection-content">
	<SelectionSidebarLayout
		isLoading={accessoriesQuery.isLoading}
		isError={accessoriesQuery.isError}
		{isEmpty}
		error={accessoriesQuery.error?.message}
		onRetry={() => accessoriesQuery.refetch()}
		loadingMessage={m.sidebar_loading_accessories()}
		emptyMessage={m.sidebar_no_accessories()}
		errorMessage={m.sidebar_accessories_error()}
	>
		{#snippet results()}
			<div class="accessories-list">
				{#each accessories as accessory (accessory.id)}
					{@const selected = isSelected(accessory)}
					<button
						class="accessory-item"
						class:selected
						style:--accent-color={accentColor}
						onclick={() => handleClick(accessory)}
						aria-label={localizedName(accessory.name)}
					>
						<img
							src={getAccessoryImage(accessory.granblueId)}
							alt={localizedName(accessory.name)}
							class="accessory-icon"
							loading="lazy"
						/>
						<div class="accessory-info">
							<span class="accessory-name">{localizedName(accessory.name)}</span>
						</div>
						<div class="check-space">
							{#if selected}
								<Icon name="check" size={16} />
							{/if}
						</div>
					</button>
				{/each}
			</div>
		{/snippet}
	</SelectionSidebarLayout>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.accessory-selection-content {
		display: flex;
		flex-direction: column;
		height: calc(100vh - 60px);
		overflow: hidden;
	}

	.accessories-list {
		display: flex;
		flex-direction: column;
		padding-top: $unit;
	}

	.accessory-item {
		display: flex;
		align-items: center;
		gap: $unit;
		padding: $unit;
		background: var(--card-bg);
		border: none;
		border-radius: $card-corner;
		cursor: pointer;
		transition: all 0.2s ease;
		text-align: left;
		width: 100%;

		&:hover:not(:disabled) {
			background: var(--button-contained-bg-hover);
		}

		&.selected {
			background: color-mix(in srgb, var(--accent-color) 10%, transparent);

			&:hover:not(:disabled) {
				background: color-mix(in srgb, var(--accent-color) 18%, transparent);
			}

			.check-space :global(svg) {
				color: var(--accent-color);
			}

			.accessory-info .accessory-name {
				color: var(--accent-color);
			}
		}

		.check-space {
			width: 16px;
			height: 16px;
			flex-shrink: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.accessory-icon {
			width: 40px;
			height: 40px;
			border-radius: $item-corner-small;
			flex-shrink: 0;
			object-fit: cover;
		}

		.accessory-info {
			flex: 1;
			min-width: 0;

			.accessory-name {
				font-size: $font-regular;
				font-weight: $medium;
				color: var(--text-primary);
				overflow: hidden;
				text-overflow: ellipsis;
				white-space: nowrap;
			}
		}
	}
</style>
