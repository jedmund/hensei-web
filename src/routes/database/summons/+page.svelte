<svelte:options runes={true} />

<script lang="ts">
	import type { PageData } from './$types'
	import DatabaseGrid from '$lib/components/database/DatabaseGrid.svelte'
	import { goto } from '$app/navigation'
	import { page as pageStore } from '$app/state'
	import type { IColumn } from 'wx-svelte-grid'
	import SummonImageCell from '$lib/components/database/cells/SummonImageCell.svelte'
	import {
		elementLabel,
		elementClass
	} from '$lib/utils/database'

	const { data }: { data: PageData } = $props()

	console.log('[Summons Page] Received data:', data)
	console.log('[Summons Page] Items count:', data.items?.length || 0)

	// Convert data to SVAR Grid format - column id must match data property
	const columns: IColumn[] = [
		{
			id: 'granblue_id',
			header: 'Image',
			width: 60,
			cell: SummonImageCell
		},
		{
			id: 'name',
			header: 'Name',
			flexgrow: 1,
			sort: true,
			template: (nameObj) => {
				// nameObj is the name property itself, not the full item
				if (!nameObj) return '—'
				if (typeof nameObj === 'string') return nameObj
				// Handle {en: "...", ja: "..."} structure
				return nameObj.en || nameObj.ja || '—'
			}
		},
		{
			id: 'rarity',
			header: 'Rarity',
			width: 80,
			sort: true
		},
		{
			id: 'element',
			header: 'Element',
			width: 100,
			sort: true,
			htmlEnable: true,
			template: (element) => {
				const label = elementLabel(element)
				const className = elementClass(element)
				return className
					? `<span class="${className}">${label}</span>`
					: label
			}
		},
		{
			id: 'max_level',
			header: 'Max Level',
			width: 80,
			sort: true
		}
	]

	// Handle pagination
	const handlePageChange = (newPage: number) => {
		const url = new URL(pageStore.url)
		url.searchParams.set('page', newPage.toString())
		goto(url.toString())
	}

	const handlePageSizeChange = (newPageSize: number) => {
		const url = new URL(pageStore.url)
		url.searchParams.set('page', '1')
		url.searchParams.set('per_page', newPageSize.toString())
		goto(url.toString())
	}
</script>

<div class="database-page">
	<div class="page-header">
		<h1>Summons Database</h1>
		<p class="subtitle">Browse and search all available summons</p>
	</div>

	<DatabaseGrid
		data={data.items}
		{columns}
		page={data.page}
		totalPages={data.totalPages}
		pageSize={data.pageSize}
		total={data.total}
		onPageChange={handlePageChange}
		onPageSizeChange={handlePageSizeChange}
		loading={false}
	/>
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.database-page {
		padding: spacing.$unit * 2;
		max-width: 1400px;
		margin: 0 auto;
	}

	.page-header {
		margin-bottom: spacing.$unit * 2;

		h1 {
			font-size: typography.$font-xxlarge;
			font-weight: typography.$bold;
			margin-bottom: spacing.$unit * 0.5;
		}

		.subtitle {
			font-size: typography.$font-regular;
			color: #6c757d;
		}
	}
</style>