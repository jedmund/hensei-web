<script lang="ts">
	import Icon from '../Icon.svelte'

	interface Props {
		itemName: string
		message: string
		imageUrl?: string
		imageClass?: 'square' | 'circle'
		icon?: string
	}

	const { itemName, message, imageUrl, imageClass = 'square', icon = 'check' }: Props = $props()

	const nameIndex = $derived(message.indexOf(itemName))
	const beforeName = $derived(nameIndex >= 0 ? message.slice(0, nameIndex) : '')
	const afterName = $derived(nameIndex >= 0 ? message.slice(nameIndex + itemName.length) : message)
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
			{#if nameIndex >= 0}{beforeName}<span class="item-name">{itemName}</span
				>{afterName}{:else}{message}{/if}
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
		padding: calc($unit * 1.5) $unit-2x;
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
