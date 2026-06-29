<script lang="ts">
	// Ticket de seguimiento de presupuestos (demo, datos simulados).
</script>

<div class="receipt">
	<div class="receipt-inner">
		<div class="receipt-title">Seguimiento de presupuestos</div>
		<div class="receipt-sub">Taller Ríos · últimos 30 días</div>
		<div class="receipt-divider"></div>
		<div class="receipt-row"><span>Presupuestos enviados</span><span>22</span></div>
		<div class="receipt-row"><span>Sin respuesta a las 48 hs</span><span>9</span></div>
		<div class="receipt-row">
			<span>Recuperados con recordatorio</span><span><span class="receipt-badge">4</span></span>
		</div>
		<div class="receipt-divider"></div>
		<div class="receipt-row total"><span>Ingreso recuperado</span><span>≈ $310.000</span></div>
	</div>
</div>

<style>
	.receipt {
		background: var(--color-bg);
		width: 100%;
		max-width: 320px;
		border-radius: 4px;
		box-shadow:
			0 1px 0 var(--color-line-strong),
			0 14px 32px -18px rgba(27, 43, 35, 0.35);
		position: relative;
	}
	.receipt::before,
	.receipt::after {
		content: '';
		position: absolute;
		left: 0;
		right: 0;
		height: 10px;
		background:
			linear-gradient(135deg, var(--color-surface) 50%, transparent 50%) 0 0 / 10px 10px repeat-x,
			linear-gradient(-135deg, var(--color-surface) 50%, transparent 50%) 0 0 / 10px 10px repeat-x;
	}
	.receipt::before {
		top: -9px;
	}
	.receipt::after {
		bottom: -9px;
		transform: rotate(180deg);
	}
	.receipt-inner {
		padding: 26px 22px;
		font-family: var(--font-mono);
		font-size: 12.5px;
		color: var(--color-ink);
	}
	.receipt-title {
		text-align: center;
		font-size: 13px;
		font-weight: 600;
		letter-spacing: 0.06em;
		text-transform: uppercase;
		margin-bottom: 4px;
	}
	.receipt-sub {
		text-align: center;
		color: var(--color-sage);
		font-size: 11px;
		margin-bottom: 16px;
	}
	.receipt-divider {
		border-top: 1px dashed var(--color-line-strong);
		margin: 14px 0;
	}
	.receipt-row {
		display: flex;
		justify-content: space-between;
		margin-bottom: 7px;
		gap: 12px;
	}
	.receipt-row span:first-child {
		color: var(--color-sage);
	}
	.receipt-row span:last-child {
		text-align: right;
	}
	.receipt-row.total {
		font-weight: 600;
		font-size: 13.5px;
		margin-top: 4px;
	}
	.receipt-row.total span:last-child {
		color: var(--color-rust);
	}
	.receipt-badge {
		display: inline-block;
		font-size: 10.5px;
		padding: 2px 7px;
		border-radius: 4px;
		background: rgba(61, 90, 69, 0.12);
		color: var(--color-moss);
	}
</style>
