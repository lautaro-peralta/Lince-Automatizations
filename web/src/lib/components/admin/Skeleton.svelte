<script lang="ts">
	let { rows = 4, class: klass = '' }: { rows?: number; class?: string } = $props();
</script>

<div class={'flex flex-col gap-2 ' + klass} aria-hidden="true">
	{#each Array(rows) as _, i (i)}
		<div class="skeleton h-11 rounded-[8px]"></div>
	{/each}
</div>

<style>
	.skeleton {
		background: linear-gradient(
			90deg,
			var(--color-surface) 25%,
			var(--color-surface-2) 37%,
			var(--color-surface) 63%
		);
		background-size: 400% 100%;
		animation: shimmer 1.4s ease infinite;
	}
	@keyframes shimmer {
		0% {
			background-position: 100% 0;
		}
		100% {
			background-position: 0 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.skeleton {
			animation: none;
		}
	}
</style>
