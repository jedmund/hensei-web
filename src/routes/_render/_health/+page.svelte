<!--
	Smoke-test target for the render service. Screenshotting this route
	exercises Playwright, the network allowlist, and the X-Render-Secret
	guard without depending on any card component being shipped yet.
-->
<div class="health-card">
	<span class="dot" aria-hidden="true"></span>
	<span class="label">render-service ok</span>
</div>

<style>
	.health-card {
		width: 320px;
		height: 200px;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			sans-serif;
		font-size: 14px;
		font-weight: 600;
		color: #1a1a1a;
		background: #f6f6f6;
		border-radius: 12px;
	}

	.dot {
		width: 10px;
		height: 10px;
		border-radius: 50%;
		background: #16a34a;
		box-shadow: 0 0 0 4px rgba(22, 163, 74, 0.18);
	}
</style>
