<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte'

	interface Props {
		title?: string
		message?: string
		backHref?: string
		backLabel?: string
	}

	let {
		title = 'Not Found',
		message = "The item you're looking for could not be found.",
		backHref,
		backLabel = 'Go Back'
	}: Props = $props()
</script>

<div class="not-found">
	<h2>{title}</h2>
	<p>{message}</p>
	{#if backHref}
		<Button variant="secondary" size="small" href={backHref}>
			{backLabel}
		</Button>
	{/if}
</div>

<style lang="scss">
	@use '$src/themes/spacing' as spacing;
	@use '$src/themes/typography' as typography;

	.not-found {
		text-align: center;
		padding: spacing.$unit * 4;

		h2 {
			margin-bottom: spacing.$unit;
		}

		p {
			color: var(--text-secondary);
			margin-bottom: spacing.$unit-2x;
		}
	}
</style>
