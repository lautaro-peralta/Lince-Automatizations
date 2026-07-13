<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch } from '$lib/api';
	import { token } from '$lib/admin/auth.svelte';
	import { fmtDate, downloadCsv, loadErrorMessage, type CsvColumn } from '$lib/utils/format';
	import { t } from '$lib/i18n/index.svelte';
	import { LEAD_STATUSES, type Lead, type ApiData } from '$lib/admin/types';
	import RowStatus from '$lib/components/admin/RowStatus.svelte';
	import NotesInput from '$lib/components/admin/NotesInput.svelte';
	import Skeleton from '$lib/components/admin/Skeleton.svelte';
	import ErrorState from '$lib/components/admin/ErrorState.svelte';
	import Button from '$lib/components/Button.svelte';

	// Etiquetas traducidas de los estados (el valor guardado sigue siendo el enum).
	const statusLabels = $derived(
		Object.fromEntries(LEAD_STATUSES.map((s) => [s, t(`admin.status.lead.${s}`)]))
	);

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
			error = loadErrorMessage(err as { status?: number }, t('admin.leads.error'));
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
			{ key: 'created_at', label: t('admin.csv.date') },
			{ key: 'name', label: t('admin.csv.name') },
			{ key: 'business', label: t('admin.csv.business') },
			{ key: 'contact', label: t('admin.csv.contact') },
			{ key: 'message', label: t('admin.csv.message') },
			{ key: 'status', label: t('admin.csv.status') },
			{ key: 'notes', label: t('admin.csv.notes') }
		];
		downloadCsv(`leads-${new Date().toISOString().slice(0, 10)}.csv`, columns, leads);
	}

	onMount(load);
</script>

<h1 class="text-[26px]">{t('admin.leads.title')}</h1>
<p class="mb-5 text-[15px] text-sage">{t('admin.leads.subtitle')}</p>

<div class="mb-4 flex flex-wrap items-center gap-2.5">
	<input
		class="min-w-[220px] flex-1 rounded-[8px] border border-line-strong bg-bg px-3.5 py-2 text-[14px] outline-none focus:border-rust focus:shadow-glow"
		type="search"
		placeholder={t('admin.leads.searchPh')}
		bind:value={q}
		oninput={onSearch}
	/>
	<select
		class="rounded-[8px] border border-line-strong bg-bg px-3 py-2 text-[14px] outline-none focus:border-rust"
		bind:value={filter}
		onchange={load}
	>
		<option value="">{t('admin.leads.allStatuses')}</option>
		{#each LEAD_STATUSES as s (s)}
			<option value={s}>{statusLabels[s]}</option>
		{/each}
	</select>
	<Button size="sm" variant="subtle" onclick={exportCsv} disabled={leads.length === 0}>
		{t('admin.leads.exportCsv')}
	</Button>
</div>

{#if loading}
	<Skeleton rows={5} />
{:else if error}
	<ErrorState message={error} onRetry={load} />
{:else if leads.length === 0}
	<p class="rounded-[10px] border border-line bg-surface p-6 text-center text-[15px] text-sage">
		{t('admin.leads.empty')}
	</p>
{:else}
	<p class="mb-2 font-mono text-[12px] text-sage">{t('admin.leads.count', { n: leads.length })}</p>

	<!-- Móvil: tarjetas apiladas (la tabla de 7 columnas no entra en el teléfono). -->
	<ul class="space-y-3 sm:hidden">
		{#each leads as lead (lead.id)}
			<li class="rounded-[10px] border border-line bg-surface p-4">
				<div class="mb-1 flex items-baseline justify-between gap-3">
					<span class="text-[15px] font-semibold">{lead.name}</span>
					<span class="font-mono text-[11px] whitespace-nowrap text-sage"
						>{fmtDate(lead.created_at)}</span
					>
				</div>
				{#if lead.business}
					<p class="text-[13px] text-sage">{lead.business}</p>
				{/if}
				<p class="mt-1 text-[14px]">{lead.contact}</p>
				{#if lead.message}
					<p class="mt-2 border-t border-line pt-2 text-[13px] text-sage">{lead.message}</p>
				{/if}
				<div class="mt-3 flex flex-col gap-2">
					<div class="flex items-center justify-between gap-3">
						<span class="font-mono text-[11px] tracking-wide text-sage uppercase"
							>{t('admin.leads.colStatus')}</span
						>
						<RowStatus
							value={lead.status || 'nuevo'}
							options={LEAD_STATUSES}
							labels={statusLabels}
							save={(v) => patchLead(lead.id, { status: v as Lead['status'] })}
						/>
					</div>
					<div>
						<span class="font-mono text-[11px] tracking-wide text-sage uppercase"
							>{t('admin.leads.colNotes')}</span
						>
						<div class="mt-1">
							<NotesInput value={lead.notes || ''} save={(v) => patchLead(lead.id, { notes: v })} />
						</div>
					</div>
				</div>
			</li>
		{/each}
	</ul>

	<div class="hidden overflow-x-auto rounded-[10px] border border-line sm:block">
		<table class="w-full border-collapse text-[14px]">
			<thead>
				<tr class="bg-surface text-left font-mono text-[11px] tracking-wide text-sage uppercase">
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colDate')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colName')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colBusiness')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colContact')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colMessage')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colStatus')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.leads.colNotes')}</th>
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
								labels={statusLabels}
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
