<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { token } from '$lib/admin/auth.svelte';
	import { fmtDate, loadErrorMessage } from '$lib/utils/format';
	import { REVIEW_STATUSES, type Review, type ApiData } from '$lib/admin/types';
	import RowStatus from '$lib/components/admin/RowStatus.svelte';
	import Skeleton from '$lib/components/admin/Skeleton.svelte';
	import ErrorState from '$lib/components/admin/ErrorState.svelte';
	import Badge from '$lib/components/Badge.svelte';
	import Button from '$lib/components/Button.svelte';
	import IconSparkles from '~icons/lucide/sparkles';

	let reviews = $state<Review[]>([]);
	let loading = $state(true);
	let error = $state('');
	let suggesting = $state<Record<string, boolean>>({});

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await apiFetch<ApiData<Review[]>>('/api/reviews', { token: token() });
			reviews = res.data ?? [];
		} catch (err) {
			reviews = [];
			error = loadErrorMessage(err as { status?: number }, 'No pudimos cargar las reseñas.');
		} finally {
			loading = false;
		}
	}

	async function patchReview(id: string, status: string) {
		await apiFetch(`/api/reviews/${id}`, { method: 'PATCH', body: { status }, token: token() });
	}

	async function suggest(review: Review) {
		suggesting[review.id] = true;
		try {
			const res = await apiFetch<ApiData<{ suggested_response?: string }>>(
				`/api/reviews/${review.id}/suggest`,
				{ method: 'POST', token: token() }
			);
			review.suggested_response = res.data?.suggested_response || review.suggested_response;
		} catch {
			// El RowStatus/ErrorState cubren errores de carga; acá fallamos silenciosamente.
		} finally {
			suggesting[review.id] = false;
		}
	}

	function stars(rating?: number | null): string {
		const r = rating || 0;
		return '★'.repeat(r) + '☆'.repeat(Math.max(0, 5 - r));
	}

	const priorityTone = (p: Review['priority']) =>
		p === 'urgente' ? 'danger' : p === 'media' ? 'warning' : 'neutral';

	onMount(load);
</script>

<h1 class="text-[26px]">Reseñas</h1>
<p class="mb-5 text-[15px] text-sage">Reseñas detectadas para gestionar y responder.</p>

{#if loading}
	<Skeleton rows={3} />
{:else if error}
	<ErrorState message={error} onRetry={load} />
{:else if reviews.length === 0}
	<p class="rounded-[10px] border border-line bg-surface p-6 text-center text-[15px] text-sage">
		No hay reseñas cargadas.
	</p>
{:else}
	<p class="mb-3 font-mono text-[12px] text-sage">{reviews.length} reseña(s).</p>
	<div class="flex flex-col gap-4">
		{#each reviews as r (r.id)}
			<article class="rounded-xl border border-line bg-surface p-5">
				<div class="mb-2 flex flex-wrap items-center gap-3">
					<span class="text-[16px] tracking-[2px] text-rust" aria-label="{r.rating || 0} de 5">
						{stars(r.rating)}
					</span>
					<span class="font-mono text-[12px] text-sage">
						{r.source || ''} · {r.author || 'Anónimo'} · {fmtDate(r.detected_at)}
					</span>
					{#if r.priority}
						<Badge tone={priorityTone(r.priority)}>{r.priority}</Badge>
					{/if}
				</div>

				<p class="mb-3 text-[15px] text-ink">{r.text || ''}</p>

				{#if r.suggested_response}
					<p class="mb-3 rounded-[8px] border border-line bg-bg p-3 text-[14px] text-ink">
						<span class="font-mono text-[11px] tracking-wide text-moss uppercase">Sugerida:</span>
						{r.suggested_response}
					</p>
				{/if}

				<div class="flex flex-wrap items-center gap-3">
					<RowStatus
						value={r.status || 'nueva'}
						options={REVIEW_STATUSES}
						save={(v) => patchReview(r.id, v)}
					/>
					<Button size="sm" variant="subtle" onclick={() => suggest(r)} disabled={suggesting[r.id]}>
						<IconSparkles class="text-[14px]" />
						{suggesting[r.id] ? 'Generando…' : 'Sugerir respuesta'}
					</Button>
				</div>
			</article>
		{/each}
	</div>
{/if}
