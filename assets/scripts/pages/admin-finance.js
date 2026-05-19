/**
 * admin-finance.js
 * ─────────────────────────────────────────────────────────────────
 * Giardini Café — Admin Finance (/admin/finance.html)
 *
 * Currently renders mock/placeholder data.
 * Ready to connect to:
 *   GET /admin/finance/summary
 *   GET /admin/finance/expenses
 *   GET /admin/finance/reports
 * ─────────────────────────────────────────────────────────────────
 */

import { requireAuth, initShell } from './admin-auth.js';

/* ── Auth guard ──────────────────────────────────────────────────── */
requireAuth();

/* ── Mock data ───────────────────────────────────────────────────── */
// Replace these with real API calls when backend is ready.

const MOCK_SUMMARY = {
  receita_dia:   null,  // null = show "—" (not yet connected)
  despesas_dia:  null,
  resultado_dia: null,
  despesas_mes:  null,
  meta_mes:      null,
  last_report:   null,
};

const MOCK_EXPENSES = [
  { label: 'Insumos — café e leite',    category: 'Estoque',     value: null, date: 'Hoje',         source: 'n8n'    },
  { label: 'Energia elétrica',           category: 'Utilidades',  value: null, date: 'Hoje',         source: 'manual' },
  { label: 'Fornecedor — croissants',    category: 'Fornecedor',  value: null, date: 'Ontem',        source: 'n8n'    },
  { label: 'Material de limpeza',        category: 'Operacional', value: null, date: 'Ontem',        source: 'ia'     },
  { label: 'Marketing — redes sociais',  category: 'Marketing',   value: null, date: '3 dias atrás', source: 'manual' },
];

const MOCK_CATEGORIES = [
  { label: 'Estoque',     value: null, pct: null },
  { label: 'Fornecedor',  value: null, pct: null },
  { label: 'Operacional', value: null, pct: null },
  { label: 'Utilidades',  value: null, pct: null },
  { label: 'Marketing',   value: null, pct: null },
];

const MOCK_REPORTS = [
  { label: 'Relatório diário — 19/05/2026',   date: 'Hoje, 07:00',      status: 'active' },
  { label: 'Relatório diário — 18/05/2026',   date: 'Ontem, 07:00',     status: 'active' },
  { label: 'Relatório semanal — sem. 20',     date: '12/05, 08:00',     status: 'active' },
  { label: 'Relatório diário — 17/05/2026',   date: '17/05, 07:00',     status: 'active' },
];

const MOCK_AUTOMATIONS = [
  {
    name: 'Relatório diário',
    desc: 'Envia resumo financeiro todo dia às 07h',
    status: 'idle',
    last: 'Hoje, 07:00',
  },
  {
    name: 'Alertas de despesa',
    desc: 'Notifica quando despesa excede o limite',
    status: 'active',
    last: 'Hoje, 09:32',
  },
  {
    name: 'Relatório semanal',
    desc: 'Consolida dados da semana toda segunda',
    status: 'idle',
    last: '12/05, 08:00',
  },
  {
    name: 'Importação automática',
    desc: 'Sincroniza lançamentos da planilha',
    status: 'offline',
    last: 'Nunca executado',
  },
];

/* ── Bootstrap ───────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  initShell();
  bindRefresh();
  bindPeriod();
  loadFinance();
});

/* ── Load ────────────────────────────────────────────────────────── */
async function loadFinance() {
  // TODO: replace with real API calls
  // const summary = await apiFetch('/admin/finance/summary');
  // const expenses = await apiFetch('/admin/finance/expenses');
  // const reports  = await apiFetch('/admin/finance/reports');

  renderSummary(MOCK_SUMMARY);
  renderExpenses(MOCK_EXPENSES);
  renderCategories(MOCK_CATEGORIES);
  renderReports(MOCK_REPORTS);
  renderAutomations(MOCK_AUTOMATIONS);
}

/* ── Render: summary metrics ─────────────────────────────────────── */
function renderSummary(s) {
  setText('fin-m-receita',    fmt(s.receita_dia));
  setText('fin-m-despesas',   fmt(s.despesas_dia));
  setText('fin-m-resultado',  fmt(s.resultado_dia));
  setText('fin-m-desp-mes',   fmt(s.despesas_mes));
  setText('fin-m-meta',       fmt(s.meta_mes));
  setText('fin-m-last-report', s.last_report ?? '—');
}

/* ── Render: expenses list ───────────────────────────────────────── */
function renderExpenses(list) {
  const el = document.getElementById('fin-expenses-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = stateHTML('empty', 'Nenhuma despesa', 'Sem registros no período.');
    return;
  }
  el.innerHTML = list.map(exp => `
    <div class="adm-list-row">
      <div class="adm-list-info">
        <div class="adm-list-label">
          ${esc(exp.label)}
          ${exp.source ? `<span class="adm-source-pill adm-source-pill--${exp.source}">${sourceName(exp.source)}</span>` : ''}
        </div>
        <div class="adm-list-sub">${esc(exp.category)} · ${esc(exp.date)}</div>
      </div>
      <div class="adm-list-value adm-list-value--${exp.value !== null ? 'red' : 'dim'}">
        ${exp.value !== null ? fmtCurrency(exp.value) : '—'}
      </div>
    </div>
  `).join('');
}

/* ── Render: categories ──────────────────────────────────────────── */
function renderCategories(list) {
  const el = document.getElementById('fin-categories-list');
  if (!el) return;
  el.innerHTML = list.map(cat => `
    <div class="adm-list-row" style="align-items:flex-start">
      <div class="adm-list-info">
        <div class="adm-list-label">${esc(cat.label)}</div>
        <div class="adm-cat-bar-wrap">
          <div class="adm-cat-bar" style="width:${cat.pct ?? 0}%"></div>
        </div>
      </div>
      <div style="text-align:right;flex-shrink:0">
        <div class="adm-list-value adm-list-value--${cat.value !== null ? 'red' : 'dim'}">
          ${cat.value !== null ? fmtCurrency(cat.value) : '—'}
        </div>
        ${cat.pct !== null ? `<div class="adm-list-sub">${cat.pct}%</div>` : ''}
      </div>
    </div>
  `).join('');
}

/* ── Render: reports ─────────────────────────────────────────────── */
function renderReports(list) {
  const el = document.getElementById('fin-reports-list');
  if (!el) return;
  if (!list.length) {
    el.innerHTML = stateHTML('empty', 'Nenhum relatório', 'Sem relatórios gerados.');
    return;
  }
  el.innerHTML = list.map(r => `
    <div class="adm-list-row">
      <div class="adm-list-info">
        <div class="adm-list-label">${esc(r.label)}</div>
        <div class="adm-list-sub">${esc(r.date)}</div>
      </div>
      <span class="adm-badge adm-badge--${r.status}">
        <span class="adm-badge-dot"></span>
        ${r.status === 'active' ? 'Enviado' : 'Pendente'}
      </span>
    </div>
  `).join('');
}

/* ── Render: automations ─────────────────────────────────────────── */
function renderAutomations(list) {
  const el = document.getElementById('fin-automation-list');
  if (!el) return;

  const statusIcon = s => {
    if (s === 'active')  return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><polyline points="20 6 9 17 4 12"/></svg>`;
    if (s === 'idle')    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>`;
    return `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>`;
  };

  el.innerHTML = list.map(a => `
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
        <span class="adm-badge adm-badge--${a.status}">
          <span class="adm-badge-dot"></span>
          ${statusLabel(a.status)}
        </span>
        <span class="adm-automation-last">${esc(a.last)}</span>
      </div>
    </div>
  `).join('');
}

/* ── Period selector ─────────────────────────────────────────────── */
function bindPeriod() {
  const btns = document.querySelectorAll('.adm-fin-period-btn');
  btns.forEach(btn => {
    btn.addEventListener('click', () => {
      btns.forEach(b => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      // TODO: reload data for selected period when API is connected
    });
  });
}

/* ── Refresh ─────────────────────────────────────────────────────── */
function bindRefresh() {
  const btn = document.getElementById('adm-refresh');
  btn?.addEventListener('click', async () => {
    btn.classList.add('is-loading');
    await loadFinance();
    setTimeout(() => btn.classList.remove('is-loading'), 400);
  });
}

/* ── Helpers ─────────────────────────────────────────────────────── */
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

function statusLabel(s) {
  if (s === 'active')  return 'Ativo';
  if (s === 'idle')    return 'Aguardando';
  return 'Offline';
}

function sourceName(s) {
  if (s === 'n8n')    return 'n8n';
  if (s === 'ia')     return 'IA';
  if (s === 'manual') return 'Manual';
  return String(s ?? '');
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
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
