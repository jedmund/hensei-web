<script lang="ts">
	/**
	 * PriorityNumber - an unseal priority drawn as a plain number in a light
	 * purple circle (easier to read than the circled-digit characters).
	 */
	import type { HTMLAttributes } from 'svelte/elements'

	interface Props extends HTMLAttributes<HTMLSpanElement> {
		value: number
		/** small: list rows; large: the badge over a grid item */
		size?: 'small' | 'large'
	}

	let { value, size = 'small', class: className = '', ...rest }: Props = $props()
</script>

<span class="priority-number {size} {className}" {...rest}>{value}</span>

<style lang="scss">
	@use '$src/themes/typography' as typography;

	.priority-number {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		flex: 0 0 auto;
		border-radius: 50%;
		background: var(--extra-purple-bg);
		color: var(--extra-purple-text);
		font-weight: typography.$bold;
		font-variant-numeric: tabular-nums;
		line-height: 1;

		&.small {
			width: 22px;
			height: 22px;
			font-size: typography.$font-small;
		}

		&.large {
			width: 32px;
			height: 32px;
			font-size: typography.$font-regular;
			// Over item art: darker text and a deeper shadow for contrast
			color: var(--extra-purple-text-dark);
			box-shadow: var(--shadow-md);
		}
	}
</style>
