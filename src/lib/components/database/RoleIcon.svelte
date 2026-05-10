<script lang="ts">
	import { getRoleIconUrl } from '$lib/utils/roles'

	interface Props {
		iconKey?: string | null | undefined
		/** Direct image URL override; takes precedence over iconKey (used for upload previews) */
		src?: string | null | undefined
		name?: string
		size?: number
	}

	let { iconKey, src, name = '', size = 32 }: Props = $props()

	const url = $derived(src ?? getRoleIconUrl(iconKey))
	const dim = $derived(`${size}px`)
</script>

<span class="role-icon" style="width: {dim}; height: {dim};" aria-hidden={!name}>
	{#if url}
		<img src={url} alt={name} />
	{/if}
</span>

<style lang="scss">
	@use '$src/themes/layout' as layout;

	.role-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: var(--surface-tertiary);
		border-radius: layout.$item-corner;
		overflow: hidden;
		flex-shrink: 0;

		img {
			width: 100%;
			height: 100%;
			object-fit: contain;
		}
	}
</style>
