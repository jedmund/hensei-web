<svelte:options runes={true} />

<script lang="ts">
	import type { ComponentProps } from 'svelte'
	import type { Cell } from 'wx-svelte-grid'

	type Props = ComponentProps<Cell> & {
		row: any
	}

	const { row }: Props = $props()

	// Get the most recent date from various date fields
	const getLastUpdated = (item: any): Date | null => {
		if (!item) return null

		const dates: Date[] = []

		// Check for date fields in the API response
		if (item.release_date) {
			const date = new Date(item.release_date)
			if (!isNaN(date.getTime())) dates.push(date)
		}
		if (item.flb_date) {
			const date = new Date(item.flb_date)
			if (!isNaN(date.getTime())) dates.push(date)
		}
		if (item.ulb_date) {
			const date = new Date(item.ulb_date)
			if (!isNaN(date.getTime())) dates.push(date)
		}
		if (item.transcendence_date) {
			const date = new Date(item.transcendence_date)
			if (!isNaN(date.getTime())) dates.push(date)
		}

		// Return the most recent date
		if (dates.length === 0) return null
		return dates.reduce((latest, current) => (current > latest ? current : latest))
	}

	const formatDate = (date: Date | null): string => {
		if (!date) return '—'

		// Format as YYYY-MM-DD
		const year = date.getFullYear()
		const month = String(date.getMonth() + 1).padStart(2, '0')
		const day = String(date.getDate()).padStart(2, '0')

		return `${year}-${month}-${day}`
	}

	const lastUpdated = $derived(getLastUpdated(row))
	const formattedDate = $derived(formatDate(lastUpdated))

	// Determine what type of update this was
	const getUpdateType = (item: any): string => {
		const lastDate = getLastUpdated(item)
		if (!lastDate) return ''

		const lastTime = lastDate.getTime()

		// Compare timestamps to determine which date field matches
		if (item.transcendence_date) {
			const transcendDate = new Date(item.transcendence_date)
			if (!isNaN(transcendDate.getTime()) && transcendDate.getTime() === lastTime) {
				return 'Transcendence'
			}
		}
		if (item.ulb_date) {
			const ulbDate = new Date(item.ulb_date)
			if (!isNaN(ulbDate.getTime()) && ulbDate.getTime() === lastTime) {
				// Characters with transcendence have their "ULB" date but it's actually transcendence
				// Check if this is a character by looking for character-specific fields
				// Characters have 'race' and 'proficiency' arrays, weapons/summons don't have 'race'
				const isCharacter = Array.isArray(item.race) && Array.isArray(item.proficiency)
				return isCharacter ? 'Transcendence' : 'ULB'
			}
		}
		if (item.flb_date) {
			const flbDate = new Date(item.flb_date)
			if (!isNaN(flbDate.getTime()) && flbDate.getTime() === lastTime) {
				return 'FLB'
			}
		}
		if (item.release_date) {
			const releaseDate = new Date(item.release_date)
			if (!isNaN(releaseDate.getTime()) && releaseDate.getTime() === lastTime) {
				return 'Release'
			}
		}
		return ''
	}

	const updateType = $derived(getUpdateType(row))
</script>

<div class="last-updated-cell">
	<span class="date">{formattedDate}</span>
	{#if updateType}
		<span class="type" data-type={updateType.toLowerCase()}>{updateType}</span>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.last-updated-cell {
		display: flex;
		flex-direction: column;
		gap: spacing.$unit * 0.25;
		padding: spacing.$unit * 0.5 0;

		.date {
			font-size: typography.$font-small;
			color: var(--text-primary);
		}

		.type {
			font-size: typography.$font-tiny;
			font-weight: typography.$medium;
			color: var(--text-secondary);
			text-transform: uppercase;
			letter-spacing: 0.5px;

			&[data-type='transcendence'] {
				color: #9b59b6;
			}

			&[data-type='ulb'] {
				color: #3498db;
			}

			&[data-type='flb'] {
				color: #f39c12;
			}

			&[data-type='release'] {
				color: #95a5a6;
			}
		}
	}
</style>
