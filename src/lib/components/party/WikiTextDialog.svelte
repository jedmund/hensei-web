<script lang="ts">
	/**
	 * A team as gbf.wiki TeamSpread markup, with a note on what the conversion
	 * can't carry. Exporting shows the markup read-only to copy; importing
	 * takes pasted markup.
	 */
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'

	interface Props {
		open: boolean
		title: string
		description: string
		/** What the conversion loses or leaves to fill in */
		notice: string
		/** The markup; editable unless readonly */
		value: string
		readonly?: boolean
		placeholder?: string
		primaryAction: { label: string; onclick: () => void; disabled?: boolean }
	}

	let {
		open = $bindable(false),
		title,
		description,
		notice,
		value = $bindable(''),
		readonly = false,
		placeholder,
		primaryAction
	}: Props = $props()
</script>

<Dialog bind:open size="medium">
	<ModalHeader {title} descriptionText={description} />
	<ModalBody>
		<div class="content">
			<Notice variant="yellow">{notice}</Notice>
			<textarea
				class="markup"
				bind:value
				{readonly}
				{placeholder}
				rows="14"
				spellcheck="false"
				aria-label={title}
				onfocus={(e) => readonly && e.currentTarget.select()}
			></textarea>
		</div>
	</ModalBody>
	<ModalFooter onCancel={() => (open = false)} {primaryAction} />
</Dialog>

<style lang="scss">
	@use '$src/themes/spacing' as *;
	@use '$src/themes/layout' as *;
	@use '$src/themes/typography' as *;

	.content {
		display: flex;
		flex-direction: column;
		gap: $unit-2x;
	}

	.markup {
		width: 100%;
		padding: $unit calc($unit * 1.5);
		border: none;
		border-radius: $input-corner;
		font-family: monospace;
		font-size: $font-small;
		line-height: 1.5;
		background: var(--input-bound-bg);
		color: var(--text-primary);
		resize: vertical;
		box-sizing: border-box;
		white-space: pre;
		overflow-x: auto;
	}
</style>
