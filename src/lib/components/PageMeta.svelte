<script lang="ts">
	interface Props {
		title: string
		description: string
		image?: string
		/** Pixel size of `image`, so link previews can lay out the large card */
		imageWidth?: number
		imageHeight?: number
		url?: string
		type?: 'website' | 'article'
	}

	let {
		title,
		description,
		image,
		imageWidth,
		imageHeight,
		url,
		type = 'website'
	}: Props = $props()
</script>

<svelte:head>
	<title>{title}</title>
	<meta name="description" content={description} />

	<!-- Open Graph -->
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content="granblue.team" />
	{#if url}
		<meta property="og:url" content={url} />
	{/if}
	{#if image}
		<meta property="og:image" content={image} />
		{#if imageWidth && imageHeight}
			<meta property="og:image:width" content={String(imageWidth)} />
			<meta property="og:image:height" content={String(imageHeight)} />
		{/if}
	{/if}

	<!-- Twitter Card -->
	{#if image}
		<meta name="twitter:card" content="summary_large_image" />
		<meta name="twitter:image" content={image} />
	{:else}
		<meta name="twitter:card" content="summary" />
	{/if}
	<meta name="twitter:title" content={title} />
	<meta name="twitter:description" content={description} />
</svelte:head>
