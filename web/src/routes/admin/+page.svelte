<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { token } from '$lib/admin/auth.svelte';
	import { loadErrorMessage } from '$lib/utils/format';
	import type { ApiData, Stats } from '$lib/admin/types';
	import Skeleton from '$lib/components/admin/Skeleton.svelte';
	import ErrorState from '$lib/components/admin/ErrorState.svelte';

	let loading = $state(true);
	let error = $state('');
	let stats = $state<Stats | null>(null);

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await apiFetch<ApiData<Stats>>('/api/stats', { token: token() });
			stats = res.data;
		} catch (err) {
			error = loadErrorMessage(err as { status?: number }, 'No pudimos cargar las métricas.');
		} finally {
			loading = false;
		}
	}

	onMount(load);

	const cards = $derived(
		stats
			? [
					{
						title: 'Leads',
						total: stats.leads.total ?? 0,
						lines: [
							['Nuevos', stats.leads.nuevo],
							['En conversación', stats.leads.en_conversacion],
							['Ganados', stats.leads.ganado]
						] as [string, number | undefined][]
					},
					{
						title: 'Presupuestos',
						total: stats.budgets.total ?? 0,
						lines: [
							['Enviados', stats.budgets.enviado],
							['Sin respuesta', stats.budgets.sin_respuesta],
							['Ganados', stats.budgets.ganado]
						] as [string, number | undefined][]
					},
					{
						title: 'Reseñas',
						total: stats.reviews.total ?? 0,
						lines: [
							['Nuevas', stats.reviews.nueva],
							['Analizando', stats.reviews.analizando],
							['Respondidas', stats.reviews.respondida]
						] as [string, number | undefined][]
					}
				]
			: []
	);
</script>

<h1 class="text-[26px]">Resumen</h1>
<p class="mb-6 text-[15px] text-sage">Una mirada rápida del estado del negocio.</p>

{#if loading}
	<Skeleton rows={3} />
{:else if error}
	<ErrorState message={error} onRetry={load} />
{:else}
	<div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
		{#each cards as card (card.title)}
			<div class="rounded-xl border border-line bg-surface p-6">
				<div class="font-mono text-[12px] tracking-wide text-sage uppercase">{card.title}</div>
				<div class="my-2 font-display text-[44px] leading-none text-moss">{card.total}</div>
				<div class="flex flex-col gap-1.5 border-t border-line pt-3">
					{#each card.lines as [label, n] (label)}
						<div class="flex justify-between text-[14px]">
							<span class="text-sage">{label}</span><span class="font-medium">{n ?? 0}</span>
						</div>
					{/each}
				</div>
			</div>
		{/each}
	</div>
{/if}
