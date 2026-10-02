<script lang="ts">
	import AuthCard from '$lib/components/auth/AuthCard.svelte'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'
</script>

<PageMeta title={m.auth_extension_invalid_title()} description={m.page_desc_home()} />

<AuthCard title={m.auth_extension_invalid_title()}>
	<p class="intro">{m.auth_extension_invalid_body()}</p>
</AuthCard>

<style lang="scss">
	@use '$src/themes/typography' as *;

	.intro {
		color: var(--text-secondary);
		font-size: $font-regular;
		text-align: center;
		margin: 0;
	}
</style>
