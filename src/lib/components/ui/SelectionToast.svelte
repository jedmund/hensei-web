<script lang="ts">
	import Icon from '../Icon.svelte'

	interface Props {
		itemName: string
		message: string
		imageUrl?: string
		imageClass?: 'square' | 'circle'
		icon?: string
		/** Additional names to bold in the message (e.g. original item name in replacements) */
		boldNames?: string[]
	}

	const {
		itemName,
		message,
		imageUrl,
		imageClass = 'square',
		icon = 'check',
		boldNames = []
	}: Props = $props()

	// Build list of all names to bold: itemName + any extras
	const allBoldNames = $derived([itemName, ...boldNames])

	// Split message into segments, marking which are bold
	const segments = $derived.by(() => {
		const result: { text: string; bold: boolean }[] = []
		let remaining = message

		while (remaining.length > 0) {
			let earliestIndex = -1
			let earliestName = ''

			for (const name of allBoldNames) {
				const idx = remaining.indexOf(name)
				if (idx >= 0 && (earliestIndex === -1 || idx < earliestIndex)) {
					earliestIndex = idx
					earliestName = name
				}
			}

			if (earliestIndex === -1) {
				result.push({ text: remaining, bold: false })
				break
			}

			if (earliestIndex > 0) {
				result.push({ text: remaining.slice(0, earliestIndex), bold: false })
			}
			result.push({ text: earliestName, bold: true })
			remaining = remaining.slice(earliestIndex + earliestName.length)
		}

		return result
	})
</script>

<div class="selection-toast">
	<div class="content">
		{#if imageUrl}
			<img class="toast-image {imageClass}" src={imageUrl} alt="" />
		{:else}
			<span class="toast-icon">
				<Icon name={icon} size={18} />
			</span>
		{/if}
		<p class="message">
			{#each segments as segment, i (i)}{#if segment.bold}<span class="item-name"
						>{segment.text}</span
					>{:else}{segment.text}{/if}{/each}
		</p>
	</div>
</div>

<style lang="scss">
	@use 'themes/spacing' as *;
	@use 'themes/typography' as *;
	@use 'themes/layout' as *;

	.selection-toast {
		display: flex;
		flex-direction: column;
		gap: $unit;
		padding: $unit;
		background: var(--toast-bg);
		color: var(--toast-text);
		border: 1px solid var(--toast-border);
		border-radius: $card-corner;
		box-shadow: var(--shadow-lg);
		font-family: var(--font-family);
	}

	.content {
		display: flex;
		flex-direction: row;
		align-items: center;
		gap: $unit;
	}

	.toast-icon {
		display: flex;
		align-items: center;
		flex-shrink: 0;
		color: var(--text-secondary);
	}

	.toast-image {
		width: 32px;
		height: 32px;
		object-fit: cover;
		flex-shrink: 0;

		&.square {
			border-radius: $item-corner-small;
		}

		&.circle {
			border-radius: 50%;
		}
	}

	.message {
		margin: 0;
		font-size: $font-body;
		line-height: 1.4;
	}

	.item-name {
		font-weight: $medium;
	}
</style>
