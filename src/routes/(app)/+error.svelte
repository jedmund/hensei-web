<script lang="ts">
	import { page } from '$app/stores'
</script>

<div class="error-container">
	<h1>{$page.status === 404 ? 'Page not found' : 'Something went wrong'}</h1>
	<p>{$page.error?.message}</p>
	<a href="/teams/explore">Browse teams</a>
</div>

<style lang="scss">
	.error-container {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 60vh;
		text-align: center;
		padding: 2rem;
		color: var(--text-primary, #111);

		h1 {
			font-size: 2rem;
			font-weight: 700;
			margin: 0 0 0.5rem;
		}

		p {
			font-size: 1rem;
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
