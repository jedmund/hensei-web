<script lang="ts">
	/**
	 * A team as gbf.wiki TeamSpread markup, with a note on what the conversion
	 * can't carry. Exporting shows the markup read-only to copy; importing
	 * takes pasted markup and shows what it found under it.
	 */
	import type { Snippet } from 'svelte'
	import Dialog from '$lib/components/ui/Dialog.svelte'
	import ModalHeader from '$lib/components/ui/ModalHeader.svelte'
	import ModalBody from '$lib/components/ui/ModalBody.svelte'
	import ModalFooter from '$lib/components/ui/ModalFooter.svelte'
	import Notice from '$lib/components/ui/Notice.svelte'
	import * as m from '$lib/paraglide/messages'

	interface Props {
		open: boolean
		title: string
		description: string
		/** What the conversion loses or leaves to fill in */
		notice: string
		/** The full list behind the notice, shown under "Learn more" */
		details?: string[]
		/** The markup; editable unless readonly */
		value: string
		readonly?: boolean
		placeholder?: string
		primaryAction: { label: string; onclick: () => void; disabled?: boolean }
		/** Shown under the markup, e.g. what an import found */
		review?: Snippet
		/** Locks the markup and Cancel while a request is in flight */
		busy?: boolean
	}

	let {
		open = $bindable(false),
		title,
		description,
		notice,
		details = [],
		value = $bindable(''),
		readonly = false,
		placeholder,
		primaryAction,
		review,
		busy = false
	}: Props = $props()

	let expanded = $state(false)
</script>

<Dialog bind:open size="medium">
	<ModalHeader {title} descriptionText={description} />
	<ModalBody>
		<div class="content">
			<Notice variant="yellow">
				<p>
					{notice}
					{#if details.length > 0}
						<button
							type="button"
							class="toggle"
							aria-expanded={expanded}
							onclick={() => (expanded = !expanded)}
						>
							{expanded ? m.notice_show_less() : m.notice_learn_more()}
						</button>
					{/if}
				</p>
				{#if expanded}
					<ul class="details">
						{#each details as detail (detail)}
							<li>{detail}</li>
						{/each}
					</ul>
				{/if}
			</Notice>
			<textarea
				class="markup"
				bind:value
				readonly={readonly || busy}
				{placeholder}
				rows="14"
				spellcheck="false"
				aria-label={title}
				onfocus={(e) => readonly && e.currentTarget.select()}></textarea>
			{@render review?.()}
		</div>
	</ModalBody>
	<ModalFooter onCancel={() => (open = false)} cancelDisabled={busy} {primaryAction} />
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

	.toggle {
		padding: 0;
		border: none;
		background: none;
		font: inherit;
		color: inherit;
		font-weight: $medium;
		text-decoration: underline;
		cursor: pointer;
	}

	.details {
		margin: 0;
		padding-left: $unit-3x;
		list-style: disc;
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
