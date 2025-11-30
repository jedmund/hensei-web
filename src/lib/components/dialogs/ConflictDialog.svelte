<!--
  ConflictDialog Component

  A unified dialog for handling character and weapon conflicts when adding
  units to a party that would violate uniqueness constraints.

  Usage:
  ```svelte
  <ConflictDialog
    bind:open={conflictDialogOpen}
    conflict={conflictData}
    partyId={party.id}
    partyShortcode={party.shortcode}
    onResolve={() => { conflictData = null }}
    onCancel={() => { conflictData = null }}
  />
  ```
-->
<script lang="ts">
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import type { ConflictData } from '$lib/types/api/conflict'
	import type { GridCharacter, GridWeapon } from '$lib/types/api/party'
	import type { Character, Weapon } from '$lib/types/api/entities'
	import { useResolveCharacterConflict, useResolveWeaponConflict } from '$lib/api/mutations/grid.mutations'
	import { getCharacterImageWithPose, getWeaponImage } from '$lib/utils/images'
	import { getWeaponSeriesSlug, isOpusDraconicSeries } from '$lib/utils/weaponSeries'
	import { getLocale } from '$lib/paraglide/runtime.js'
	import * as m from '$lib/paraglide/messages'

	import styles from './ConflictDialog.module.scss'

	interface Props {
		/** Controls dialog visibility */
		open: boolean
		/** Conflict data from API response */
		conflict: ConflictData | null
		/** Party ID for resolve request */
		partyId: string
		/** Party shortcode for cache invalidation */
		partyShortcode: string
		/** Callback when conflict is resolved */
		onResolve?: () => void
		/** Callback when dialog is cancelled */
		onCancel?: () => void
	}

	let {
		open = $bindable(false),
		conflict,
		partyId,
		partyShortcode,
		onResolve,
		onCancel
	}: Props = $props()

	// Mutations for resolving conflicts
	const resolveCharacterMutation = useResolveCharacterConflict()
	const resolveWeaponMutation = useResolveWeaponConflict()

	// Get current locale for name display
	const locale = $derived(getLocale() as 'en' | 'ja')

	// Loading state - use mutation.current in Svelte 5
	let isLoading = $state(false)

	// Generate conflict message based on type
	const conflictMessage = $derived.by(() => {
		if (!conflict) return ''

		if (conflict.type === 'character') {
			return m.conflict_character_message()
		}

		// Weapon conflict - check if it's Opus/Draconic
		const weapon = conflict.incoming
		if (isOpusDraconicSeries(weapon.series)) {
			return m.conflict_weapon_opus_draconic()
		}

		// Get series name for message
		const seriesSlug = getWeaponSeriesSlug(weapon.series)

		// Use the series slug directly for now - proper i18n can be added later
		const seriesName = seriesSlug?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown'

		return m.conflict_weapon_series({ series: seriesName })
	})

	/**
	 * Handle confirm button click - resolve the conflict
	 */
	async function handleResolve() {
		if (!conflict) return

		const resolveParams = {
			partyId,
			partyShortcode,
			incomingId: conflict.incoming.id,
			position: conflict.position,
			conflictingIds: conflict.conflicts.map((c) => c.id)
		}

		isLoading = true
		try {
			if (conflict.type === 'character') {
				await resolveCharacterMutation.mutateAsync(resolveParams)
			} else {
				await resolveWeaponMutation.mutateAsync(resolveParams)
			}

			open = false
			onResolve?.()
		} catch (error) {
			console.error('[ConflictDialog] Failed to resolve conflict:', error)
			// Error will be handled by mutation's error state
		} finally {
			isLoading = false
		}
	}

	/**
	 * Handle cancel button click
	 */
	function handleCancel() {
		open = false
		onCancel?.()
	}

	/**
	 * Handle dialog open change (e.g., clicking overlay or X button)
	 */
	function handleOpenChange(newOpen: boolean) {
		if (!newOpen) {
			handleCancel()
		}
	}

	/**
	 * Get character image URL with proper pose
	 */
	function getCharacterUrl(gridChar: GridCharacter): string {
		return getCharacterImageWithPose(
			gridChar.character.granblueId,
			'square',
			gridChar.uncapLevel,
			gridChar.transcendenceStep
		)
	}

	/**
	 * Get incoming character image URL (default pose)
	 */
	function getIncomingCharacterUrl(character: Character): string {
		return getCharacterImageWithPose(character.granblueId, 'square', 0, 0)
	}

	/**
	 * Get weapon image URL
	 */
	function getWeaponUrl(gridWeapon: GridWeapon): string {
		return getWeaponImage(gridWeapon.weapon.granblueId, 'square')
	}

	/**
	 * Get incoming weapon image URL
	 */
	function getIncomingWeaponUrl(weapon: Weapon): string {
		return getWeaponImage(weapon.granblueId, 'square')
	}
</script>

<Dialog bind:open onOpenChange={handleOpenChange} title={m.conflict_title()}>
	{#if conflict}
		<div class={styles.content}>
			<p class={styles.message}>{conflictMessage}</p>

			<div class={styles.diagram}>
				<!-- Conflicting items (left side) -->
				<ul class={styles.conflicts}>
					{#if conflict.type === 'character'}
						{#each conflict.conflicts as gridChar (gridChar.id)}
							<li class={styles.item}>
								<img
									src={getCharacterUrl(gridChar)}
									alt={gridChar.character.name[locale]}
								/>
								<span>{gridChar.character.name[locale]}</span>
							</li>
						{/each}
					{:else}
						{#each conflict.conflicts as gridWeapon (gridWeapon.id)}
							<li class={styles.item}>
								<img
									src={getWeaponUrl(gridWeapon)}
									alt={gridWeapon.weapon.name[locale]}
								/>
								<span>{gridWeapon.weapon.name[locale]}</span>
							</li>
						{/each}
					{/if}
				</ul>

				<!-- Arrow -->
				<span class={styles.arrow}>&rarr;</span>

				<!-- Incoming item (right side) -->
				<div class={styles.incoming}>
					{#if conflict.type === 'character'}
						<div class={styles.item}>
							<img
								src={getIncomingCharacterUrl(conflict.incoming)}
								alt={conflict.incoming.name[locale]}
							/>
							<span>{conflict.incoming.name[locale]}</span>
						</div>
					{:else}
						<div class={styles.item}>
							<img
								src={getIncomingWeaponUrl(conflict.incoming)}
								alt={conflict.incoming.name[locale]}
							/>
							<span>{conflict.incoming.name[locale]}</span>
						</div>
					{/if}
				</div>
			</div>
		</div>
	{/if}

	{#snippet footer()}
		<Button variant="ghost" onclick={handleCancel} disabled={isLoading}>
			{m.conflict_cancel()}
		</Button>
		<Button variant="primary" onclick={handleResolve} disabled={isLoading}>
			{m.conflict_confirm()}
		</Button>
	{/snippet}
</Dialog>
