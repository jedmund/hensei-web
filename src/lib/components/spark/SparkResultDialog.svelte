<!-- SparkResultDialog - A saved spark's result: the image it exports, with ways to share, edit or delete it -->

<script lang="ts">
	import { onMount } from 'svelte'
	import { DropdownMenu as DropdownMenuBase } from 'bits-ui'
	import Button from '$lib/components/ui/Button.svelte'
	import DropdownMenu from '$lib/components/ui/DropdownMenu.svelte'
	import {
		canShareSheet,
		copySparkImage,
		copySparkLink,
		saveSparkImage,
		shareSpark
	} from '$lib/features/spark/share'
	import ConfirmDialog from '$lib/components/ui/ConfirmDialog.svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import SparkImage, {
		SPARK_IMAGE_HEIGHT,
		SPARK_IMAGE_WIDTH
	} from '$lib/components/spark/SparkImage.svelte'
	import { m } from '$lib/paraglide/messages'
	import type { SparkRenderData } from '$lib/types/spark'

	interface Props {
		open: boolean
		/** The heading, e.g. the spark's date */
		title: string
		data: SparkRenderData | null
		onEdit: () => void
		onDelete: () => Promise<void>
		/** The spark's query string, for its link and image */
		query: string
		/** The viewer's element, which colors Edit */
		userElement?: 'wind' | 'fire' | 'water' | 'earth' | 'dark' | 'light' | undefined
	}

	let { open = $bindable(), title, data, onEdit, onDelete, query, userElement }: Props = $props()

	let canShare = $state(false)
	onMount(() => (canShare = canShareSheet()))

	let width = $state(0)
	let confirmingDelete = $state(false)
	let deleting = $state(false)
	// The image at its real size, scaled to fit the dialog
	const scale = $derived(width > 0 ? Math.min(1, width / SPARK_IMAGE_WIDTH) : 1)

	async function remove() {
		deleting = true
		try {
			await onDelete()
			confirmingDelete = false
			open = false
		} finally {
			deleting = false
		}
	}
</script>

<Dialog bind:open size="large" class="spark-result-dialog">
	<ModalHeader {title} />
	<ModalBody>
		<div class="frame" bind:clientWidth={width} style:height="{SPARK_IMAGE_HEIGHT * scale}px">
			{#if data}
				<div class="scaled" style:transform="scale({scale})">
					<SparkImage {data} theme="site" />
				</div>
			{/if}
		</div>
	</ModalBody>
	<!-- Every action in the footer: Delete on its own at the left; sharing, then
	     Edit last, at the right. The header's close button stands in for cancel. -->
	<ModalFooter
		onCancel={() => (open = false)}
		hideCancel
		primaryAction={{ label: m.spark_edit(), onclick: onEdit }}
		{userElement}
	>
		{#snippet left()}
			<Button variant="destructive-ghost" size="small" onclick={() => (confirmingDelete = true)}>
				{m.spark_delete()}
			</Button>
		{/snippet}
		{#snippet extra()}
			{#if canShare}
				<Button variant="ghost" size="small" onclick={() => shareSpark(query, title)}>
					{m.gacha_share()}
				</Button>
			{/if}
			<DropdownMenu align="end">
				{#snippet trigger({ props })}
					<Button {...props} variant="ghost" size="small" rightIcon="chevron-down-small">
						{m.gacha_copy()}
					</Button>
				{/snippet}
				{#snippet menu()}
					<DropdownMenuBase.Item class="dropdown-menu-item" onSelect={() => copySparkLink(query)}>
						{m.spark_copy_link()}
					</DropdownMenuBase.Item>
					<DropdownMenuBase.Item class="dropdown-menu-item" onSelect={() => copySparkImage(query)}>
						{m.spark_copy_image()}
					</DropdownMenuBase.Item>
				{/snippet}
			</DropdownMenu>
			<Button variant="ghost" size="small" onclick={() => saveSparkImage(query)}>
				{m.spark_save_image()}
			</Button>
		{/snippet}
	</ModalFooter>
</Dialog>

<ConfirmDialog
	bind:open={confirmingDelete}
	title={m.spark_delete_title()}
	message={m.spark_delete_message()}
	confirmLabel={m.spark_delete()}
	confirmVariant="destructive"
	loading={deleting}
	onconfirm={remove}
/>

<style lang="scss">
	@use '$src/themes/layout' as *;
	@use '$src/themes/spacing' as *;

	// As tall as the image, and no wider than it at full size
	// The image's width plus the body's padding, so the image lines up with the
	// title and footer
	:global(.spark-result-dialog.dialog-content-large) {
		height: auto;
		max-width: 1232px;
	}

	// More room around the title than the default header
	:global(.spark-result-dialog .modal-header) {
		padding-top: $unit-3x;
		padding-bottom: $unit-2x;
	}

	// Never wider than the image, so its corners stay rounded
	.frame {
		position: relative;
		max-width: 1200px;
		margin: 0 auto;
		overflow: hidden;
		border-radius: $card-corner;
	}

	.scaled {
		position: absolute;
		top: 0;
		left: 0;
		transform-origin: top left;
	}
</style>
