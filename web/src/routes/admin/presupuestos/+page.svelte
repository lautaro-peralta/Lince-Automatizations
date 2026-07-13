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
	import { t } from '$lib/i18n/index.svelte';
	import { BUDGET_STATUSES, type Budget, type ApiData } from '$lib/admin/types';
	import RowStatus from '$lib/components/admin/RowStatus.svelte';
	import Skeleton from '$lib/components/admin/Skeleton.svelte';
	import ErrorState from '$lib/components/admin/ErrorState.svelte';
	import Button from '$lib/components/Button.svelte';

	const statusLabels = $derived(
		Object.fromEntries(BUDGET_STATUSES.map((s) => [s, t(`admin.status.budget.${s}`)]))
	);

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
			error = loadErrorMessage(err as { status?: number }, t('admin.budgets.error'));
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
			feedback = { text: t('admin.budgets.added'), kind: 'ok' };
			await load();
		} catch (err) {
			feedback = { text: (err as ApiError).message || t('admin.budgets.saveError'), kind: 'err' };
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
			{ key: 'sent_at', label: t('admin.csv.sent') },
			{ key: 'customer_name', label: t('admin.csv.customer') },
			{ key: 'customer_contact', label: t('admin.csv.contact') },
			{ key: 'amount', label: t('admin.csv.amount') },
			{ key: 'description', label: t('admin.csv.description') },
			{ key: 'followup_count', label: t('admin.csv.followups') },
			{ key: 'status', label: t('admin.csv.status') }
		];
		downloadCsv(`presupuestos-${new Date().toISOString().slice(0, 10)}.csv`, columns, budgets);
	}

	onMount(load);

	const inputClass =
		'rounded-[8px] border border-line-strong bg-bg px-3.5 py-2 text-[14px] outline-none focus:border-rust focus:shadow-glow';
</script>

<h1 class="text-[26px]">{t('admin.budgets.title')}</h1>
<p class="mb-5 text-[15px] text-sage">{t('admin.budgets.subtitle')}</p>

<form class="mb-6 rounded-xl border border-line bg-surface p-5" onsubmit={onAdd}>
	<div class="grid gap-3 sm:grid-cols-2">
		<input
			class={inputClass}
			bind:value={customerName}
			placeholder={t('admin.budgets.customer')}
			required
			maxlength="120"
		/>
		<input
			class={inputClass}
			bind:value={customerContact}
			placeholder={t('admin.budgets.contact')}
			required
			maxlength="120"
		/>
		<input
			class={inputClass}
			bind:value={amount}
			type="number"
			min="0"
			step="0.01"
			placeholder={t('admin.budgets.amount')}
		/>
		<input
			class={inputClass}
			bind:value={description}
			placeholder={t('admin.budgets.description')}
			maxlength="1000"
		/>
	</div>
	<div class="mt-3 flex items-center gap-3">
		<Button type="submit" size="sm" disabled={saving}>
			{saving ? t('admin.budgets.adding') : t('admin.budgets.add')}
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
		{t('admin.budgets.exportCsv')}
	</Button>
</div>

{#if loading}
	<Skeleton rows={5} />
{:else if error}
	<ErrorState message={error} onRetry={load} />
{:else if budgets.length === 0}
	<p class="rounded-[10px] border border-line bg-surface p-6 text-center text-[15px] text-sage">
		{t('admin.budgets.empty')}
	</p>
{:else}
	<p class="mb-2 font-mono text-[12px] text-sage">
		{t('admin.budgets.count', { n: budgets.length })}
	</p>

	<!-- Móvil: tarjetas apiladas (la tabla de 7 columnas no entra en el teléfono). -->
	<ul class="space-y-3 sm:hidden">
		{#each budgets as b (b.id)}
			<li class="rounded-[10px] border border-line bg-surface p-4">
				<div class="mb-1 flex items-baseline justify-between gap-3">
					<span class="text-[15px] font-semibold">{b.customer_name}</span>
					<span class="font-mono text-[11px] whitespace-nowrap text-sage"
						>{fmtDate(b.sent_at || b.created_at)}</span
					>
				</div>
				<p class="text-[14px]">{b.customer_contact}</p>
				<p class="mt-1 text-[15px] font-semibold">{fmtMoney(b.amount)}</p>
				{#if b.description}
					<p class="mt-2 border-t border-line pt-2 text-[13px] text-sage">{b.description}</p>
				{/if}
				<div class="mt-3 flex items-center justify-between gap-3">
					<span class="font-mono text-[11px] tracking-wide text-sage uppercase"
						>{t('admin.budgets.colFollowups')}: {b.followup_count || 0}</span
					>
					<RowStatus
						value={b.status || 'enviado'}
						options={BUDGET_STATUSES}
						labels={statusLabels}
						save={(v) => patchBudget(b.id, v)}
					/>
				</div>
			</li>
		{/each}
	</ul>

	<div class="hidden overflow-x-auto rounded-[10px] border border-line sm:block">
		<table class="w-full border-collapse text-[14px]">
			<thead>
				<tr class="bg-surface text-left font-mono text-[11px] tracking-wide text-sage uppercase">
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colSent')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colCustomer')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colContact')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colAmount')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colDescription')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colFollowups')}</th>
					<th class="px-3 py-2.5 font-medium">{t('admin.budgets.colStatus')}</th>
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
								labels={statusLabels}
								save={(v) => patchBudget(b.id, v)}
							/>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
{/if}
