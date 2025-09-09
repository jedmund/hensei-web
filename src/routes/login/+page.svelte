<script lang="ts">
	export let form: { error: string; email: string } | undefined
</script>

<h1>Login</h1>

<form method="post">
	<label>
		Email address
		<input type="email" name="email" value={form?.email ?? ''} autocomplete="email" required />
	</label>

	<label>
		Password
		<input type="password" name="password" minlength="8" autocomplete="current-password" required />
	</label>

	{#if form?.error}
		<p class="error">{form.error}</p>
	{/if}

	<button type="submit">Sign in</button>
</form>
