<script lang="ts">
	import { onMount } from 'svelte'
	import { replaceState } from '$app/navigation'
	import { page } from '$app/state'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import ContextMenuWrapper from '$lib/components/ui/menu/ContextMenuWrapper.svelte'
	import { toast } from 'svelte-sonner'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import Input from '$lib/components/ui/Input.svelte'
	import Select from '$lib/components/ui/Select.svelte'
	import { poolTakesSeason, SPARK_POOLS, SPARK_SEASONS } from '$lib/features/spark/pools'
	import DatePicker from '$lib/components/ui/DatePicker.svelte'
	import {
		fromSavedSpark,
		isSparkDate,
		savedSparkAdapter,
		todaySparkDate
	} from '$lib/api/adapters/savedSpark.adapter'
	import { AuthenticationError, ValidationError } from '$lib/api/adapters/errors'
	import SparkHistory from '$lib/components/spark/SparkHistory.svelte'
	import { savedSparkName } from '$lib/features/spark/labels'
	import SparkResultDialog from '$lib/components/spark/SparkResultDialog.svelte'
	import type { SavedSpark } from '$lib/types/api/savedSpark'
	import SparkBoard, { type SparkBoardTile } from '$lib/components/spark/SparkBoard.svelte'
	import SparkPickerPane from '$lib/components/spark/SparkPickerPane.svelte'
	import SparkTileMenuItems from '$lib/components/spark/SparkTileMenuItems.svelte'
	import { setDragDropContext } from '$lib/composables/drag-drop.svelte'
	import { createSparkDrag } from '$lib/features/spark/drag'
	import { collectionAdapter } from '$lib/api/adapters/collection.adapter'
	import { SPARK_IMAGE_HEIGHT, SPARK_IMAGE_WIDTH } from '$lib/components/spark/SparkImage.svelte'
	import { readJson } from '$lib/features/gacha/api'
	import {
		addItem,
		insertItem,
		MAX_DRAWS,
		moveItem,
		readSpark,
		removeItem,
		resolveSpark,
		sparkItemCount,
		toggleSparked,
		writeSpark,
		type Spark,
		type SparkMark
	} from '$lib/features/spark/spark'
	import { m } from '$lib/paraglide/messages'
	import { getLocale } from '$lib/paraglide/runtime'
	import { gachaItemName } from '$lib/utils/gacha'
	import { copySparkImage, copySparkLink, saveSparkImage } from '$lib/features/spark/share'
	import { sidebar } from '$lib/stores/sidebar.svelte'
	import type { CatalogueItem } from '$lib/types/gacha'

	let { data } = $props()

	const initial = readSpark(page.url.searchParams)
	let spark = $state<Spark>(initial)
	let items = $state<CatalogueItem[]>([])
	let loading = $state(true)
	let failure = $state('')
	let mounted = $state(false)
	// The tile whose menu is open, as `column:index`
	let openTile = $state<string | null>(null)
	// The pool and season the spark was on (part of the spark); the picker shows
	// only what they offer
	const poolOptions = [
		{ value: '', label: m.spark_pool_all() },
		...SPARK_POOLS.map((entry) => ({ value: entry.value, label: entry.label() }))
	]
	const seasonOptions = [
		{ value: '', label: m.spark_season_none() },
		...SPARK_SEASONS.map((entry) => ({ value: entry.value, label: entry.label() }))
	]
	const seasonAvailable = $derived(poolTakesSeason(spark.pool))

	function setPool(value: string) {
		const pool = value || null
		// Classic and Collab pools have no seasons
		spark = { ...spark, pool, season: poolTakesSeason(pool) ? spark.season : null }
	}

	function setSeason(value: string) {
		spark = { ...spark, season: value || null }
	}
	// The signed-in player's characters (granblue ids), so what they add goes
	// where the game would put it: characters they had become gold moons
	let owned = $state.raw<ReadonlySet<string>>(new Set())
	// The field's own text, so clearing it to type a new number doesn't snap back
	let drawsInput = $state<string | number>(initial.draws)
	// The day of the spark; saved with it, so no later than today
	let sparkDate = $state<string | null>(todaySparkDate())
	const today = todaySparkDate()

	// Saved sparks, for signed-in players: the one being edited, the list
	// under the board, and the one open in the dialog
	const signedIn = !!page.data.account?.userId
	let savedId = $state<string | null>(null)
	let saving = $state(false)
	let saved = $state<SavedSpark[]>([])
	let savedPage = $state(1)
	let savedPages = $state(1)
	let loadingSaved = $state(false)
	let viewing = $state<SavedSpark | null>(null)
	let viewingOpen = $state(false)

	// One drag-and-drop context for the board and the picker pane
	const drag = createSparkDrag({
		onMove: (from, to) => (spark = moveItem(spark, from, to)),
		onInsert: (item, to) => insert(item, to),
		itemLabel: (item) => gachaItemName(item, getLocale())
	})
	setDragDropContext(drag)

	const byId = $derived(new Map(items.map((item) => [item.granblue_id, item])))
	const resolved = $derived(resolveSpark(spark, byId).data)
	const query = $derived(writeSpark(spark))
	const hasItems = $derived(sparkItemCount(spark) > 0)

	onMount(() => {
		mounted = true
		openPicker()
		const userId = page.data.account?.userId
		if (userId) void loadSaved(1)
		if (userId) {
			collectionAdapter
				.getCollectedCharacterGranblueIds(userId)
				.then((ids) => (owned = new Set(ids)))
				.catch(() => {
					// Adding still works; characters just start out as new
				})
		}
		const controller = new AbortController()
		fetch('/api/gacha/catalogue?mode=all', { signal: controller.signal })
			.then(readJson)
			.then((body: { items: CatalogueItem[] }) => {
				items = body.items
				// Drop ids from the link that aren't in the catalogue, so what's
				// kept is what the image shows
				spark = resolveSpark(spark, byId).spark
			})
			.catch((error: unknown) => {
				if (error instanceof DOMException && error.name === 'AbortError') return
				failure = error instanceof Error ? error.message : m.gacha_error()
			})
			.finally(() => (loading = false))
		return () => controller.abort()
	})

	// The spark lives in the URL, so the address is always a link to it
	$effect(() => {
		if (mounted) syncUrl(query)
	})

	function syncUrl(wanted: string) {
		const search = wanted ? `?${wanted}` : ''
		if (search === window.location.search) return
		try {
			replaceState(`${window.location.pathname}${search}`, page.state)
		} catch {
			// Right after hydration the router may not accept history updates yet
			setTimeout(() => syncUrl(query), 50)
		}
	}

	function add(item: CatalogueItem) {
		const character = item.recruits?.granblue_id
		const next = addItem(spark, item.granblue_id, !!character && owned.has(character))
		if (next === spark) {
			toast.error(m.spark_column_full())
			return
		}
		spark = next
	}

	// The party editor's sidebar, with a pane of every character and summon
	function openPicker(initialTab: 'character' | 'summon' = 'character') {
		sidebar.openWithComponent(
			m.spark_picker_title(),
			SparkPickerPane,
			{
				items: () => items,
				loading: () => loading,
				onAdd: add,
				drag,
				initialTab,
				pool: () => ({ pool: spark.pool, season: spark.season })
			},
			{ scrollable: false }
		)
	}

	function insert(item: CatalogueItem, to: SparkMark) {
		const next = insertItem(spark, item.granblue_id, to)
		if (next === spark) toast.error(m.spark_column_full())
		else spark = next
	}

	/** A saved spark with its items resolved, for its thumbnails and image */
	const resolveSaved = (row: SavedSpark) => resolveSpark(fromSavedSpark(row).spark, byId).data

	// Newest spark date first, as the API lists them
	const bySparkDate = (a: SavedSpark, b: SavedSpark) =>
		b.sparkDate.localeCompare(a.sparkDate) || b.createdAt.localeCompare(a.createdAt)

	async function loadSaved(pageNumber: number) {
		loadingSaved = true
		try {
			const response = await savedSparkAdapter.list({ page: pageNumber })
			const known = new Set(saved.map((row) => row.id))
			saved = [...saved, ...response.results.filter((row) => !known.has(row.id))]
			savedPage = pageNumber
			savedPages = response.totalPages
		} catch {
			// The list is extra; the maker works without it
		} finally {
			loadingSaved = false
		}
	}

	/** Save the spark to the account: new the first time, then updates */
	async function saveSpark() {
		if (!sparkDate || !isSparkDate(sparkDate)) {
			toast.error(m.spark_date_invalid())
			return
		}
		saving = true
		try {
			const row = savedId
				? await savedSparkAdapter.update(savedId, spark, sparkDate)
				: await savedSparkAdapter.create(spark, sparkDate)
			savedId = row.id
			saved = [row, ...saved.filter((entry) => entry.id !== row.id)].sort(bySparkDate)
			toast.success(m.spark_saved())
		} catch (error) {
			// The API names the fields it rejected; only the date is the player's to fix
			const errors =
				error instanceof ValidationError
					? (error.details as { errors?: Record<string, string[]> } | undefined)?.errors
					: undefined
			if (error instanceof AuthenticationError) toast.error(m.spark_sign_in_again())
			else toast.error(errors?.spark_date ? m.spark_date_invalid() : m.spark_save_failed())
		} finally {
			saving = false
		}
	}

	/** Load a saved spark into the maker to change it */
	function editSaved(row: SavedSpark) {
		const loaded = fromSavedSpark(row)
		spark = loaded.spark
		drawsInput = loaded.spark.draws
		sparkDate = loaded.sparkDate
		savedId = row.id
		viewingOpen = false
		window.scrollTo({ top: 0, behavior: 'smooth' })
	}

	async function deleteSaved(row: SavedSpark) {
		try {
			await savedSparkAdapter.destroy(row.id)
			saved = saved.filter((entry) => entry.id !== row.id)
			if (savedId === row.id) savedId = null
			toast.success(m.spark_deleted())
		} catch {
			toast.error(m.spark_delete_failed())
			throw new Error('delete failed')
		}
	}

	/** Start over: an empty spark, dated today, not tied to a saved one */
	function clearSpark() {
		spark = { ...spark, characters: [], moons: [], summons: [], sparked: null }
		sparkDate = todaySparkDate()
		savedId = null
	}

	function setDraws(value: string | number) {
		const draws = Math.trunc(Number(value))
		if (Number.isFinite(draws) && draws > 0) spark = { ...spark, draws: Math.min(draws, MAX_DRAWS) }
	}
</script>

<PageMeta
	title={m.page_title_spark()}
	description={m.page_desc_spark()}
	image={data.ogImage ?? undefined}
	imageWidth={SPARK_IMAGE_WIDTH}
	imageHeight={SPARK_IMAGE_HEIGHT}
/>

{#snippet tile({ column, index, item, sparked, art }: SparkBoardTile)}
	{@const key = `${column}:${index}`}
	{@const toggle = () => (spark = toggleSparked(spark, column, index))}
	{@const remove = () => (spark = removeItem(spark, column, index))}
	<ContextMenuWrapper>
		{#snippet trigger()}
			<DropdownMenu bind:open={() => openTile === key, (open) => (openTile = open ? key : null)}>
				{#snippet trigger({ props })}
					<!-- Opens on click, not on press, so pressing a tile can start a drag -->
					<button
						{...props}
						onpointerdown={() => {}}
						onclick={() => (openTile = key)}
						type="button"
						class="tile-button"
						aria-label={m.spark_item_actions({ name: gachaItemName(item, getLocale()) })}
					>
						{@render art()}
					</button>
				{/snippet}
				{#snippet menu()}
					<SparkTileMenuItems
						variant="dropdown"
						{sparked}
						onToggleSparked={toggle}
						onRemove={remove}
					/>
				{/snippet}
			</DropdownMenu>
		{/snippet}
		{#snippet menu()}
			<SparkTileMenuItems variant="context" {sparked} onToggleSparked={toggle} onRemove={remove} />
		{/snippet}
	</ContextMenuWrapper>
{/snippet}

{#snippet configure()}
	<!-- The spark's settings and actions, along the bottom of the card -->
	<div class="configure">
		<div class="settings">
			<div class="date">
				<DatePicker
					label={m.spark_date()}
					bind:value={sparkDate}
					maxValue={today}
					locale={getLocale()}
					contained
				/>
			</div>
			<div class="pool">
				<Select
					contained
					label={m.spark_pool()}
					options={poolOptions}
					value={spark.pool ?? ''}
					onValueChange={(value) => setPool(value ?? '')}
					fullWidth
				/>
			</div>
			<div class="season">
				<Select
					contained
					label={m.spark_season()}
					options={seasonOptions}
					value={spark.season ?? ''}
					onValueChange={(value) => setSeason(value ?? '')}
					disabled={!seasonAvailable}
					fullWidth
				/>
			</div>
			<div class="draws">
				<Input
					contained
					label={m.spark_draws()}
					type="number"
					min="1"
					max={String(MAX_DRAWS)}
					bind:value={drawsInput}
					handleInput={() => setDraws(drawsInput)}
					fullWidth
				/>
			</div>
		</div>
		<div class="actions">
			<Button variant="ghost" size="small" disabled={!hasItems} onclick={clearSpark}>
				{m.spark_clear()}
			</Button>
			<div class="buttons">
				<DropdownMenu align="end">
					{#snippet trigger({ props })}
						<Button
							{...props}
							variant="ghost"
							size="small"
							rightIcon="chevron-down-small"
							disabled={!hasItems}
						>
							{m.gacha_copy()}
						</Button>
					{/snippet}
					{#snippet menu()}
						<DropdownMenuBase.Item class="dropdown-menu-item" onSelect={() => copySparkLink(query)}>
							{m.spark_copy_link()}
						</DropdownMenuBase.Item>
						<DropdownMenuBase.Item
							class="dropdown-menu-item"
							onSelect={() => copySparkImage(query)}
						>
							{m.spark_copy_image()}
						</DropdownMenuBase.Item>
					{/snippet}
				</DropdownMenu>
				<Button
					variant={signedIn ? 'ghost' : 'primary'}
					size="small"
					disabled={!hasItems}
					onclick={() => saveSparkImage(query)}
				>
					{m.spark_save_image()}
				</Button>
				{#if signedIn}
					<Button variant="primary" size="small" disabled={!hasItems || saving} onclick={saveSpark}>
						{savedId ? m.spark_save_changes() : m.spark_save()}
					</Button>
				{/if}
			</div>
		</div>
		{#if failure}
			<p class="failure" role="alert">{failure}</p>
		{/if}
	</div>
{/snippet}

<div class="spark-page">
	<SparkBoard
		footer={configure}
		data={resolved}
		{tile}
		onSlotClick={(column) => openPicker(column === 'summons' ? 'summon' : 'character')}
	/>

	{#if saved.length > 0}
		<SparkHistory
			sparks={saved}
			resolve={resolveSaved}
			onOpen={(row) => {
				viewing = row
				viewingOpen = true
			}}
			hasMore={savedPage < savedPages}
			loadingMore={loadingSaved}
			onLoadMore={() => loadSaved(savedPage + 1)}
		/>
	{/if}
</div>

<SparkResultDialog
	bind:open={viewingOpen}
	title={viewing
		? savedSparkName(viewing.sparkDate, viewing.pool, viewing.season, getLocale())
		: ''}
	data={viewing ? resolveSaved(viewing) : null}
	onEdit={() => viewing && editSaved(viewing)}
	onDelete={() => (viewing ? deleteSaved(viewing) : Promise.resolve())}
	query={viewing ? writeSpark(fromSavedSpark(viewing).spark) : ''}
/>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/colors' as *;
	@use '$src/themes/typography' as *;
	@use '$src/themes/layout' as *;

	.spark-page {
		max-width: var(--main-max-width);
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	// Set apart from the slots above it
	.configure {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
		margin-top: $unit-2x;
	}

	// Date, pool, season and draws in equal columns, labels lined up across the top;
	// stacked on phones
	.settings {
		display: grid;
		grid-template-columns: repeat(4, minmax(0, 1fr));
		align-items: start;
		gap: $unit-2x;

		@media (max-width: 640px) {
			grid-template-columns: minmax(0, 1fr);
		}

		// The date picker sizes itself; make it fill its column
		:global(.date > *) {
			width: 100%;
		}

		// As tall as the date picker, which is the tallest of the four
		.pool :global([data-select-trigger]),
		.season :global([data-select-trigger]),
		.draws :global(input) {
			box-sizing: border-box;
			min-height: calc($unit * 5.5);
		}
	}

	.failure {
		margin: 0;
		color: $error;
		font-size: $font-small;
	}

	.actions {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		justify-content: space-between;
		gap: $unit;
	}

	// Clear on its own at the left; sharing and saving on the right
	.buttons {
		display: flex;
		align-items: center;
		gap: $unit;
		margin-left: auto;
	}

	.tile-button {
		all: unset;
		display: block;
		width: 100%;
		border-radius: $item-corner-small;
		cursor: pointer;

		&:focus-visible {
			outline: 3px solid var(--accent-blue);
			outline-offset: -3px;
		}
	}
</style>
