<script lang="ts">
	import { onMount } from 'svelte';
	import { apiFetch, type ApiError } from '$lib/api';
	import { token } from '$lib/admin/auth.svelte';
	import {
		fmtDate,
		fmtMoney,
		downloadCsv,
		loadErrorMessage,
		type CsvColumn
	} from '$lib/utils/format';
	import { BUDGET_STATUSES, type Budget, type ApiData } from '$lib/admin/types';
	import RowStatus from '$lib/components/admin/RowStatus.svelte';
	import Skeleton from '$lib/components/admin/Skeleton.svelte';
	import ErrorState from '$lib/components/admin/ErrorState.svelte';
	import Button from '$lib/components/Button.svelte';

	let budgets = $state<Budget[]>([]);
	let loading = $state(true);
	let error = $state('');

	// Formulario de alta
	let customerName = $state('');
	let customerContact = $state('');
	let amount = $state('');
	let description = $state('');
	let saving = $state(false);
	let feedback = $state<{ text: string; kind: 'ok' | 'err' | '' }>({ text: '', kind: '' });

	async function load() {
		loading = true;
		error = '';
		try {
			const res = await apiFetch<ApiData<Budget[]>>('/api/budgets', { token: token() });
			budgets = res.data ?? [];
		} catch (err) {
			budgets = [];
			error = loadErrorMessage(err as { status?: number }, 'No pudimos cargar los presupuestos.');
		} finally {
			loading = false;
		}
	}

	async function onAdd(event: SubmitEvent) {
		event.preventDefault();
		feedback = { text: '', kind: '' };
		saving = true;
		const body: Record<string, unknown> = {
			customer_name: customerName.trim(),
			customer_contact: customerContact.trim(),
			description: description.trim() || undefined
		};
		if (amount.trim()) body.amount = Number(amount);
		try {
			await apiFetch('/api/budgets', { method: 'POST', body, token: token() });
			customerName = customerContact = amount = description = '';
			feedback = { text: 'Agregado ✓', kind: 'ok' };
			await load();
		} catch (err) {
			feedback = { text: (err as ApiError).message || 'No se pudo guardar.', kind: 'err' };
		} finally {
			saving = false;
		}
	}

	async function patchBudget(id: string, status: string) {
		await apiFetch(`/api/budgets/${id}`, { method: 'PATCH', body: { status }, token: token() });
	}

	function exportCsv() {
		if (budgets.length === 0) return;
		const columns: CsvColumn[] = [
			{ key: 'sent_at', label: 'Enviado' },
			{ key: 'customer_name', label: 'Cliente' },
			{ key: 'customer_contact', label: 'Contacto' },
			{ key: 'amount', label: 'Monto' },
			{ key: 'description', label: 'Descripción' },
			{ key: 'followup_count', label: 'Recordatorios' },
			{ key: 'status', label: 'Estado' }
		];
		downloadCsv(`presupuestos-${new Date().toISOString().slice(0, 10)}.csv`, columns, budgets);
	}

	onMount(load);

	const inputClass =
		'rounded-[8px] border border-line-strong bg-bg px-3.5 py-2 text-[14px] outline-none focus:border-rust focus:shadow-glow';
</script>

<h1 class="text-[26px]">Presupuestos</h1>
<p class="mb-5 text-[15px] text-sage">Cotizaciones enviadas y su seguimiento.</p>

<form class="mb-6 rounded-xl border border-line bg-surface p-5" onsubmit={onAdd}>
	<div class="grid gap-3 sm:grid-cols-2">
		<input
			class={inputClass}
			bind:value={customerName}
			placeholder="Cliente"
			required
			maxlength="120"
		/>
		<input
			class={inputClass}
			bind:value={customerContact}
			placeholder="Email o WhatsApp"
			required
			maxlength="120"
		/>
		<input
			class={inputClass}
			bind:value={amount}
			type="number"
			min="0"
			step="0.01"
			placeholder="Monto"
		/>
		<input class={inputClass} bind:value={description} placeholder="Descripción" maxlength="1000" />
	</div>
	<div class="mt-3 flex items-center gap-3">
		<Button type="submit" size="sm" disabled={saving}>
			{saving ? 'Agregando…' : 'Agregar presupuesto'}
		</Button>
		{#if feedback.text}
			<span
				class="text-[13px]"
				class:text-moss={feedback.kind === 'ok'}
				class:text-danger={feedback.kind === 'err'}>{feedback.text}</span
			>
		{/if}
	</div>
</form>

<div class="mb-4 flex justify-end">
	<Button size="sm" variant="subtle" onclick={exportCsv} disabled={budgets.length === 0}>
		Exportar CSV
	</Button>
</div>

{#if loading}
	<Skeleton rows={5} />
{:else if error}
	<ErrorState message={error} onRetry={load} />
{:else if budgets.length === 0}
	<p class="rounded-[10px] border border-line bg-surface p-6 text-center text-[15px] text-sage">
		Todavía no hay presupuestos.
	</p>
{:else}
	<p class="mb-2 font-mono text-[12px] text-sage">{budgets.length} presupuesto(s).</p>
	<div class="overflow-x-auto rounded-[10px] border border-line">
		<table class="w-full border-collapse text-[14px]">
			<thead>
				<tr class="bg-surface text-left font-mono text-[11px] tracking-wide text-sage uppercase">
					<th class="px-3 py-2.5 font-medium">Enviado</th>
					<th class="px-3 py-2.5 font-medium">Cliente</th>
					<th class="px-3 py-2.5 font-medium">Contacto</th>
					<th class="px-3 py-2.5 font-medium">Monto</th>
					<th class="px-3 py-2.5 font-medium">Descripción</th>
					<th class="px-3 py-2.5 font-medium">Recordatorios</th>
					<th class="px-3 py-2.5 font-medium">Estado</th>
				</tr>
			</thead>
			<tbody>
				{#each budgets as b (b.id)}
					<tr class="border-t border-line align-top">
						<td class="px-3 py-2.5 whitespace-nowrap text-sage"
							>{fmtDate(b.sent_at || b.created_at)}</td
						>
						<td class="px-3 py-2.5 font-medium">{b.customer_name}</td>
						<td class="px-3 py-2.5">{b.customer_contact}</td>
						<td class="px-3 py-2.5 whitespace-nowrap">{fmtMoney(b.amount)}</td>
						<td class="max-w-[260px] px-3 py-2.5 text-sage">{b.description || '—'}</td>
						<td class="px-3 py-2.5 text-center">{b.followup_count || 0}</td>
						<td class="px-3 py-2.5">
							<RowStatus
								value={b.status || 'enviado'}
								options={BUDGET_STATUSES}
								save={(v) => patchBudget(b.id, v)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
