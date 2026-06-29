<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { token } from '$lib/admin/auth.svelte';
	import { fmtDate, downloadCsv, loadErrorMessage, type CsvColumn } from '$lib/utils/format';
	import { LEAD_STATUSES, type Lead, type ApiData } from '$lib/admin/types';
	import RowStatus from '$lib/components/admin/RowStatus.svelte';
	import NotesInput from '$lib/components/admin/NotesInput.svelte';
	import Skeleton from '$lib/components/admin/Skeleton.svelte';
	import ErrorState from '$lib/components/admin/ErrorState.svelte';
	import Button from '$lib/components/Button.svelte';

	let q = $state('');
	let filter = $state('');
	let leads = $state<Lead[]>([]);
	let loading = $state(true);
	let error = $state('');

	let debounce: ReturnType<typeof setTimeout>;

	async function load() {
		loading = true;
		error = '';
		// Query string a mano (uso no-reactivo, throwaway).
		const parts: string[] = [];
		if (filter) parts.push(`status=${encodeURIComponent(filter)}`);
		if (q.trim()) parts.push(`q=${encodeURIComponent(q.trim())}`);
		const qs = parts.length ? `?${parts.join('&')}` : '';
		try {
			const res = await apiFetch<ApiData<Lead[]>>(`/api/leads${qs}`, { token: token() });
			leads = res.data ?? [];
		} catch (err) {
			leads = [];
			error = loadErrorMessage(err as { status?: number }, 'No pudimos cargar los leads.');
		} finally {
			loading = false;
		}
	}

	function onSearch() {
		clearTimeout(debounce);
		debounce = setTimeout(load, 300);
	}

	async function patchLead(id: string, patch: Partial<Lead>) {
		await apiFetch(`/api/leads/${id}`, { method: 'PATCH', body: patch, token: token() });
	}

	function exportCsv() {
		if (leads.length === 0) return;
		const columns: CsvColumn[] = [
			{ key: 'created_at', label: 'Fecha' },
			{ key: 'name', label: 'Nombre' },
			{ key: 'business', label: 'Negocio' },
			{ key: 'contact', label: 'Contacto' },
			{ key: 'message', label: 'Mensaje' },
			{ key: 'status', label: 'Estado' },
			{ key: 'notes', label: 'Notas' }
		];
		downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, columns, leads);
	}

	onMount(load);
</script>

<h1 class="text-[26px]">Leads recibidos</h1>
<p class="mb-5 text-[15px] text-sage">Contactos que llegaron desde el formulario de la landing.</p>

<div class="mb-4 flex flex-wrap items-center gap-2.5">
	<input
		class="min-w-[220px] flex-1 rounded-[8px] border border-line-strong bg-bg px-3.5 py-2 text-[14px] outline-none focus:border-rust focus:shadow-glow"
		type="search"
		placeholder="Buscar nombre, negocio, contacto…"
		bind:value={q}
		oninput={onSearch}
	/>
	<select
		class="rounded-[8px] border border-line-strong bg-bg px-3 py-2 text-[14px] outline-none focus:border-rust"
		bind:value={filter}
		onchange={load}
	>
		<option value="">Todos los estados</option>
		{#each LEAD_STATUSES as s (s)}
			<option value={s}>{s.replace(/_/g, ' ')}</option>
		{/each}
	</select>
	<Button size="sm" variant="subtle" onclick={exportCsv} disabled={leads.length === 0}>
		Exportar CSV
	</Button>
</div>

{#if loading}
	<Skeleton rows={5} />
{:else if error}
	<ErrorState message={error} onRetry={load} />
{:else if leads.length === 0}
	<p class="rounded-[10px] border border-line bg-surface p-6 text-center text-[15px] text-sage">
		No hay leads para este filtro.
	</p>
{:else}
	<p class="mb-2 font-mono text-[12px] text-sage">{leads.length} lead(s).</p>
	<div class="overflow-x-auto rounded-[10px] border border-line">
		<table class="w-full border-collapse text-[14px]">
			<thead>
				<tr class="bg-surface text-left font-mono text-[11px] tracking-wide text-sage uppercase">
					<th class="px-3 py-2.5 font-medium">Fecha</th>
					<th class="px-3 py-2.5 font-medium">Nombre</th>
					<th class="px-3 py-2.5 font-medium">Negocio</th>
					<th class="px-3 py-2.5 font-medium">Contacto</th>
					<th class="px-3 py-2.5 font-medium">Mensaje</th>
					<th class="px-3 py-2.5 font-medium">Estado</th>
					<th class="px-3 py-2.5 font-medium">Notas</th>
				</tr>
			</thead>
			<tbody>
				{#each leads as lead (lead.id)}
					<tr class="border-t border-line align-top">
						<td class="px-3 py-2.5 whitespace-nowrap text-sage">{fmtDate(lead.created_at)}</td>
						<td class="px-3 py-2.5 font-medium">{lead.name}</td>
						<td class="px-3 py-2.5">{lead.business || '—'}</td>
						<td class="px-3 py-2.5">{lead.contact}</td>
						<td class="max-w-[280px] px-3 py-2.5 text-sage">{lead.message}</td>
						<td class="px-3 py-2.5">
							<RowStatus
								value={lead.status || 'nuevo'}
								options={LEAD_STATUSES}
								save={(v) => patchLead(lead.id, { status: v as Lead['status'] })}
							/>
						</td>
						<td class="px-3 py-2.5">
							<NotesInput value={lead.notes || ''} save={(v) => patchLead(lead.id, { notes: v })} />
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
