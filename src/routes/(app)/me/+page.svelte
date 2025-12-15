<script lang="ts">
	import type { AccountCookie } from '$lib/types/AccountCookie'
	import type { UserCookie } from '$lib/types/UserCookie'
	import PageMeta from '$lib/components/PageMeta.svelte'
	import * as m from '$lib/paraglide/messages'

	export let data: { account: AccountCookie; user: UserCookie }
</script>

<PageMeta title={m.page_title_settings()} description={m.page_desc_home()} />

<h1>Welcome, {data.account.username}!</h1>

<section>
	<h2>Account</h2>
	<ul>
		<li><strong>User ID:</strong> {data.account.userId}</li>
		<li><strong>Role:</strong> {data.account.role}</li>
	</ul>

	<section>
		<h2>Preferences</h2>
		<ul>
			<li><strong>Language:</strong> {data.user.language}</li>
			<li><strong>Theme:</strong> {data.user.theme}</li>
			<li><strong>Gender:</strong> {data.user.gender}</li>
			<li><strong>Element:</strong> {data.user.element}</li>
			<li><strong>Picture:</strong> {data.user.picture}</li>
		</ul>
	</section>

	<form method="post" action="/auth/logout">
		<button>Log out</button>
	</form>
</section>
