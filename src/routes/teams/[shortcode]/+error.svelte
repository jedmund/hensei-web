<script lang="ts">
  export let error: Error & { status?: number, message?: string }
  export let status: number
</script>

<section>
  <h1>{status === 404 ? 'Team Not Found' : 'Something went wrong'}</h1>
  <p>
    {status === 404
      ? 'We could not find a team with that code.'
      : (error?.message || 'Please try again later.')}
  </p>
</section>

<style>
  section { padding: 1.5rem; }
  h1 { margin: 0 0 0.5rem 0; font-size: 1.25rem; }
  p { margin: 0; color: #555; }
  :global(main) { display: block; }
</style>

