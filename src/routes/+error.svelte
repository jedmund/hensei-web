<script lang="ts">
	import { page } from '$app/stores'
</script>

<div class="error-page">
	<h1>{$page.status}</h1>
	<p>{$page.error?.message ?? 'Something went wrong'}</p>
	<a href="/teams/explore">Back to teams</a>
</div>

<style lang="scss">
	.error-page {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 100vh;
		text-align: center;
		padding: 2rem;
		color: var(--text-primary, #111);

		h1 {
			font-size: 4rem;
			font-weight: 700;
			margin: 0 0 0.5rem;
		}

		p {
			font-size: 1.125rem;
			color: var(--text-secondary, #666);
			margin: 0 0 2rem;
		}

		a {
			color: var(--link, #0066cc);
			text-decoration: none;
			font-weight: 500;

			&:hover {
				text-decoration: underline;
			}
		}
	}
</style>
