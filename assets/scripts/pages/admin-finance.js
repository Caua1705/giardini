/**
 * admin-finance.js
 * Giardini Café — Admin Finance (/admin/finance.html)
 * Consumes real backend routes:
 *   GET /admin/finance/revenue
 *   GET /admin/finance/expenses
 */

import { requireAuth, initShell, adminFetch } from './admin-auth.js';

const currentUser = requireAuth();

let currentPeriod = 'today';

if (currentUser) {
  document.addEventListener('DOMContentLoaded', () => {
    initShell();
    bindRefresh();
    bindPeriod();
    loadFinance('today');
    loadMonthContext();
    renderIntegrations();
  });
}

/* ── Period helpers ──────────────────────────────────────────────── */
function getPeriodRange(period) {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

  if (period === 'week') {
    const dow = now.getDay();
    const monday = new Date(now);
    monday.setDate(now.getDate() - (dow === 0 ? 6 : dow - 1));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return {
      startDateTime: `${dateStr(monday)}T00:00:00`,
      endDateTime:   `${dateStr(sunday)}T23:59:59`,
      startDate:     dateStr(monday),
      endDate:       dateStr(sunday),
    };
  }

  if (period === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return {
      startDateTime: `${dateStr(first)}T00:00:00`,
      endDateTime:   `${dateStr(last)}T23:59:59`,
      startDate:     dateStr(first),
      endDate:       dateStr(last),
    };
  }

  // today (also used as fallback for 'custom')
  const today = dateStr(now);
  return {
    startDateTime: `${today}T00:00:00`,
    endDateTime:   `${today}T23:59:59`,
    startDate:     today,
    endDate:       today,
  };
}

const PERIOD_LABELS = {
  today:  'Resumo do dia',
  week:   'Resumo da semana',
  month:  'Resumo do mês',
  custom: 'Resumo do período',
};

/* ── Load: period data ───────────────────────────────────────────── */
async function loadFinance(period) {
  currentPeriod = period;
  const range = getPeriodRange(period);

  setText('fin-period-label', PERIOD_LABELS[period] || 'Resumo do período');
  setCardsLoading(['fin-m-receita', 'fin-m-despesas', 'fin-m-resultado']);
  setText('fin-m-margem', '');

  const detailsEl = document.getElementById('fin-revenue-details');
  const expEl     = document.getElementById('fin-expenses-list');
  const catEl     = document.getElementById('fin-categories-list');
  if (detailsEl) detailsEl.innerHTML = loadingHTML();
  if (expEl)     expEl.innerHTML     = loadingHTML();
  if (catEl)     catEl.innerHTML     = loadingHTML();

  const revenueParams  = new URLSearchParams({ start: range.startDateTime, end: range.endDateTime });
  const expensesParams = new URLSearchParams({ start_date: range.startDate, end_date: range.endDate, limit: '100', offset: '0' });

  const [revResult, expResult] = await Promise.allSettled([
    adminFetch(`/admin/finance/revenue?${revenueParams}`),
    adminFetch(`/admin/finance/expenses?${expensesParams}`),
  ]);

  const revenue      = revResult.status === 'fulfilled' ? revResult.value : null;
  const expenses     = expResult.status === 'fulfilled' ? expResult.value : null;
  const revenueError = revResult.status === 'rejected';
  const expensesError = expResult.status === 'rejected';

  renderPeriodSummary(revenue, expenses, revenueError, expensesError);
  renderRevenueDetails(revenue, revenueError);
  renderExpenses(expenses, expensesError);
  renderCategories(expenses, expensesError);
  updateSourceInfo(revenue);
}

/* ── Load: monthly context (always current month) ────────────────── */
async function loadMonthContext() {
  setCardsLoading(['fin-m-rec-mes', 'fin-m-desp-mes', 'fin-m-res-mes']);
  setText('fin-m-meta', '—');

  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  const dateStr = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const first = new Date(now.getFullYear(), now.getMonth(), 1);
  const last  = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const revenueParams  = new URLSearchParams({ start: `${dateStr(first)}T00:00:00`, end: `${dateStr(last)}T23:59:59` });
  const expensesParams = new URLSearchParams({ start_date: dateStr(first), end_date: dateStr(last), limit: '500', offset: '0' });

  const [revResult, expResult] = await Promise.allSettled([
    adminFetch(`/admin/finance/revenue?${revenueParams}`),
    adminFetch(`/admin/finance/expenses?${expensesParams}`),
  ]);

  const rev = revResult.status === 'fulfilled' ? revResult.value : null;
  const exp = expResult.status === 'fulfilled' ? expResult.value : null;

  const recMes  = rev?.receita_total ?? null;
  const despMes = exp?.summary?.total_expenses ?? null;
  const resMes  = recMes !== null && despMes !== null ? recMes - despMes : null;

  setText('fin-m-rec-mes',  fmt(recMes));
  setText('fin-m-desp-mes', fmt(despMes));
  setText('fin-m-res-mes',  fmt(resMes));
}

/* ── Render: period summary cards ────────────────────────────────── */
function renderPeriodSummary(revenue, expenses, revenueError, expensesError) {
  const revenueTotal  = revenue?.receita_total ?? null;
  const expensesTotal = expenses?.summary?.total_expenses ?? null;

  const recEl = document.getElementById('fin-m-receita');
  if (recEl) {
    recEl.textContent = revenueError ? 'Erro' : fmt(revenueTotal);
    recEl.title = revenueError ? 'Não foi possível carregar as receitas.' : '';
  }

  const despEl = document.getElementById('fin-m-despesas');
  if (despEl) {
    despEl.textContent = expensesError ? 'Erro' : fmt(expensesTotal);
    despEl.title = expensesError ? 'Não foi possível carregar as despesas.' : '';
  }

  let netResult = null;
  let margin    = null;
  if (revenueTotal !== null && expensesTotal !== null) {
    netResult = revenueTotal - expensesTotal;
    margin    = revenueTotal > 0 ? (netResult / revenueTotal) * 100 : 0;
  }

  setText('fin-m-resultado', fmt(netResult));

  const margEl = document.getElementById('fin-m-margem');
  if (margEl) margEl.textContent = margin !== null ? `Margem: ${fmtPct(margin)}` : '';
}

/* ── Render: revenue details panel ───────────────────────────────── */
function renderRevenueDetails(revenue, hasError) {
  const el = document.getElementById('fin-revenue-details');
  if (!el) return;

  if (hasError) {
    el.innerHTML = `<p style="font-size:0.82rem;color:#e07070;margin:0">Não foi possível carregar as receitas.</p>`;
    return;
  }

  if (!revenue) {
    el.innerHTML = `<p style="font-size:0.82rem;color:rgba(255,255,255,0.38);margin:0">—</p>`;
    return;
  }

  const tipos = revenue.pagamentos_por_tipo ?? [];
  const tiposHTML = tipos.length
    ? `<div style="margin-top:1rem">
        <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.38);margin-bottom:0.5rem">Pagamentos por tipo</div>
        ${tipos.map(t => `
          <div style="display:flex;justify-content:space-between;align-items:center;padding:0.35rem 0;border-bottom:1px solid rgba(255,255,255,0.06)">
            <span style="color:rgba(255,255,255,0.72);font-size:0.84rem">${esc(t.tipo)}</span>
            <span style="color:rgba(255,255,255,0.88);font-weight:500;font-size:0.84rem">${fmtCurrency(t.total)}</span>
            <span style="color:rgba(255,255,255,0.38);font-size:0.75rem">${t.quantidade} pag.</span>
          </div>
        `).join('')}
       </div>`
    : '';

  el.innerHTML = `
    <div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(130px,1fr));gap:0.75rem">
      ${revItem('Transações',   revenue.quantidade_transacoes ?? '—')}
      ${revItem('Pagamentos',   revenue.quantidade_pagamentos ?? '—')}
      ${revItem('Ticket médio', revenue.ticket_medio != null ? fmtCurrency(revenue.ticket_medio) : '—')}
      ${revItem('Fonte',        esc(revenue.source ?? 'Eye PDV'))}
    </div>
    ${tiposHTML}
  `;
}

function revItem(label, value) {
  return `
    <div style="background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.07);border-radius:8px;padding:0.8rem 1rem">
      <div style="font-size:0.68rem;text-transform:uppercase;letter-spacing:0.06em;color:rgba(255,255,255,0.38);margin-bottom:0.3rem">${label}</div>
      <div style="font-size:1rem;font-weight:600;color:rgba(255,255,255,0.88)">${value}</div>
    </div>`;
}

/* ── Render: expenses list ───────────────────────────────────────── */
function renderExpenses(expenses, hasError) {
  const el = document.getElementById('fin-expenses-list');
  if (!el) return;

  if (hasError) {
    el.innerHTML = stateHTML('error', 'Erro', 'Não foi possível carregar as despesas.');
    return;
  }

  const items = expenses?.items ?? [];
  if (!items.length) {
    el.innerHTML = stateHTML('empty', 'Nenhuma despesa', 'Sem registros no período.');
    return;
  }

  el.innerHTML = items.map(exp => {
    const comprovante = exp.comprovante_url
      ? ` · <a href="${esc(exp.comprovante_url)}" target="_blank" rel="noopener noreferrer" style="color:var(--adm-gold);text-decoration:none;font-size:0.75rem">Ver comprovante</a>`
      : '';
    return `
      <div class="adm-list-row">
        <div class="adm-list-info">
          <div class="adm-list-label">${esc(exp.descricao)}</div>
          <div class="adm-list-sub">${esc(exp.categoria)} · ${fmtDate(exp.data)}${comprovante}</div>
        </div>
        <div class="adm-list-value adm-list-value--red">${fmtCurrency(exp.valor)}</div>
      </div>
    `;
  }).join('');
}

/* ── Render: categories ──────────────────────────────────────────── */
function renderCategories(expenses, hasError) {
  const el = document.getElementById('fin-categories-list');
  if (!el) return;

  if (hasError) {
    el.innerHTML = stateHTML('error', 'Erro', 'Não foi possível carregar as despesas.');
    return;
  }

  const cats  = expenses?.by_category ?? [];
  const total = expenses?.summary?.total_expenses || 0;

  if (!cats.length) {
    el.innerHTML = stateHTML('empty', 'Nenhuma despesa no período', 'Sem registros de categoria.');
    return;
  }

  el.innerHTML = cats.map(cat => {
    const pct = total > 0 ? Math.round((cat.total / total) * 100) : 0;
    return `
      <div class="adm-list-row" style="align-items:flex-start">
        <div class="adm-list-info">
          <div class="adm-list-label">${esc(cat.category)}</div>
          <div class="adm-cat-bar-wrap">
            <div class="adm-cat-bar" style="width:${pct}%"></div>
          </div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="adm-list-value adm-list-value--red">${fmtCurrency(cat.total)}</div>
          <div class="adm-list-sub">${pct}% · ${cat.count} lanç.</div>
        </div>
      </div>
    `;
  }).join('');
}

/* ── Render: integrations (static architecture info) ─────────────── */
function renderIntegrations() {
  const reportsEl = document.getElementById('fin-reports-list');
  if (reportsEl) {
    reportsEl.innerHTML = [
      { label: 'Relatório diário',   desc: 'Enviado automaticamente todo dia às 07h via n8n' },
      { label: 'Relatório semanal',  desc: 'Consolidado toda segunda-feira via n8n + IA' },
    ].map(r => `
      <div class="adm-list-row">
        <div class="adm-list-info">
          <div class="adm-list-label">${esc(r.label)}</div>
          <div class="adm-list-sub">${esc(r.desc)}</div>
        </div>
        <span class="adm-badge adm-badge--active">
          <span class="adm-badge-dot"></span>
          Ativo
        </span>
      </div>
    `).join('');
  }

  const automationEl = document.getElementById('fin-automation-list');
  if (automationEl) {
    automationEl.innerHTML = [
      { name: 'Eye PDV → Receitas',    desc: 'Receitas capturadas via Eye PDV e expostas pela FastAPI', status: 'active' },
      { name: 'n8n + IA → Despesas',   desc: 'Despesas registradas e categorizadas automaticamente',   status: 'active' },
      { name: 'FastAPI → Frontend',    desc: 'Dados financeiros servidos via backend Giardini',         status: 'active' },
    ].map(a => `
      <div class="adm-automation-row">
        <div class="adm-automation-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="adm-automation-info">
          <div class="adm-automation-name">${esc(a.name)}</div>
          <div class="adm-automation-desc">${esc(a.desc)}</div>
        </div>
        <div class="adm-automation-meta">
          <span class="adm-badge adm-badge--active">
            <span class="adm-badge-dot"></span>
            Ativo
          </span>
        </div>
      </div>
    `).join('');
  }
}

/* ── Source info ─────────────────────────────────────────────────── */
function updateSourceInfo(revenue) {
  const el = document.getElementById('fin-source-info');
  if (!el) return;
  if (!revenue) {
    el.textContent = 'Receitas via Eye PDV · Despesas via n8n + IA · Dados via FastAPI';
    return;
  }
  const source = revenue.source ?? 'Eye PDV';
  const start  = revenue.start ? fmtDateTime(revenue.start) : '—';
  const end    = revenue.end   ? fmtDateTime(revenue.end)   : '—';
  el.textContent = `Fonte: ${source} · Período: ${start} → ${end}`;
}

/* ── Period selector ─────────────────────────────────────────────── */
function bindPeriod() {
  const btns = document.querySelectorAll('.adm-fin-period-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      const period = btn.dataset.period;
      if (period === 'custom') return; // prepared for later
      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      loadFinance(period);
    });
  });
}

/* ── Refresh ─────────────────────────────────────────────────────── */
function bindRefresh() {
  const btn = document.getElementById('adm-refresh');
  btn?.addEventListener('click', async () => {
    btn.classList.add('is-loading');
    await Promise.all([loadFinance(currentPeriod), loadMonthContext()]);
    setTimeout(() => btn.classList.remove('is-loading'), 400);
  });
}

/* ── Helpers ─────────────────────────────────────────────────────── */
function setCardsLoading(ids) {
  ids.forEach(id => setText(id, '…'));
}

function setText(id, v) {
  const el = document.getElementById(id);
  if (el) el.textContent = v;
}

function fmt(v) {
  return v !== null && v !== undefined ? fmtCurrency(v) : '—';
}

function fmtCurrency(v) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(v);
}

function fmtPct(v) {
  return new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(v) + '%';
}

function fmtDate(s) {
  if (!s) return '—';
  const [y, m, d] = s.split('-');
  return `${d}/${m}/${y}`;
}

function fmtDateTime(s) {
  if (!s) return '—';
  const d = new Date(s);
  if (isNaN(d)) return s;
  return d.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

function loadingHTML() {
  return `
    <div class="adm-state" style="padding:2rem">
      <div class="adm-state-sub">Carregando…</div>
    </div>`;
}

function stateHTML(type, title, sub) {
  return `
    <div class="adm-state" style="padding:2.5rem 2rem">
      <div class="adm-state-icon adm-state-icon--${type}">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
          <circle cx="12" cy="12" r="10"/>
        </svg>
      </div>
      <div class="adm-state-title">${title}</div>
      <div class="adm-state-sub">${sub}</div>
    </div>`;
}

function esc(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;')
    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}
