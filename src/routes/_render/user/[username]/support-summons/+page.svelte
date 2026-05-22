<script lang="ts">
	import SupportSummonShareCard from '$lib/components/share/SupportSummonShareCard.svelte'

	let { data } = $props()
</script>

<!--
	The page wraps the screenshot target in a fixed-size, full-bleed backdrop.
	Playwright crops to [data-share-card] (the card itself), so the surrounding
	backdrop only matters when a developer opens the URL directly.
-->
<div class="backdrop">
	<SupportSummonShareCard
		username={data.user.username}
		displayName={data.user.displayName ?? null}
		summons={data.summons}
		gbfName={data.gbfName}
		gbfId={data.gbfId}
		teamUrl={data.teamUrl}
	/>
</div>

<style>
	.backdrop {
		width: 1280px;
		height: 1100px;
		display: flex;
		align-items: center;
		justify-content: center;
		background-image: url('/share-bg/granblue-sky.png');
		background-size: cover;
		background-position: center;
	}
</style>
