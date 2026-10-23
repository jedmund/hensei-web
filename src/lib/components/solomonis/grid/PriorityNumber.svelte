<script lang="ts">
	/**
	 * PriorityNumber - an unseal priority as a plain purple number, in a
	 * drawn light purple circle over item art (easier to read than the
	 * circled-digit characters).
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
		color: var(--extra-purple-text);
		font-weight: typography.$bold;
		font-variant-numeric: tabular-nums;
		line-height: 1;

		&.small {
			width: 22px;
			height: 22px;
			font-size: typography.$font-small;
			// No circle in lists; the fixed width keeps the numbers centered
		}

		&.large {
			width: 32px;
			height: 32px;
			font-size: typography.$font-regular;
			// Over item art: a drawn circle with a deeper shadow for contrast
			background: var(--extra-purple-bg);
			box-shadow: var(--shadow-md);
			color: var(--extra-purple-text-dark);

			:global(html[data-theme='dark']) & {
				color: white;
			}
		}
	}
</style>
