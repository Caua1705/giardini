/**
 * Giardini Cafe - Admin Finance
 * Uses synchronized financial data served by FastAPI.
 */

import { requireAuth, initShell, adminFetch } from './admin-auth.js';

const currentUser = requireAuth();

const state = {
  period: 'today',
  range: null,
  revenue: null,
  expenses: null,
  monthRevenue: null,
  monthExpenses: null,
  revenueError: false,
  expensesError: false,
};

const PERIOD_LABELS = {
  today: 'Resumo do dia',
  week: 'Resumo da semana',
  month: 'Resumo do mês',
  custom: 'Resumo do período',
};

const DOM = {
  refresh: document.getElementById('adm-refresh'),
  periodLabel: document.getElementById('fin-period-label'),
  revenueCard: document.getElementById('fin-m-receita'),
  expensesCard: document.getElementById('fin-m-despesas'),
  resultCard: document.getElementById('fin-m-resultado'),
  marginCard: document.getElementById('fin-m-margem'),
  ticketCard: document.getElementById('fin-m-ticket'),
  monthRevenueCard: document.getElementById('fin-m-rec-mes'),
  monthExpensesCard: document.getElementById('fin-m-desp-mes'),
  monthResultCard: document.getElementById('fin-m-res-mes'),
  revenueDetails: document.getElementById('fin-revenue-details'),
  topProducts: document.getElementById('fin-top-products'),
  salesByHour: document.getElementById('fin-sales-hour'),
  salesByDay: document.getElementById('fin-sales-day'),
  salesByDaySection: document.getElementById('fin-sales-day-section'),
  expensesList: document.getElementById('fin-expenses-list'),
  categoriesList: document.getElementById('fin-categories-list'),
  reportsList: document.getElementById('fin-reports-list'),
  automationList: document.getElementById('fin-automation-list'),
  sourceInfo: document.getElementById('fin-source-info'),
};

if (currentUser) {
  document.addEventListener('DOMContentLoaded', () => {
    initShell();
    bindPeriod();
    bindRefresh();
    renderIntegrations();
    loadFinance('today');
  });
}

function getPeriodRange(period) {
  const today = startOfDay(new Date());

  if (period === 'week') {
    const start = new Date(today);
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
    return { start: toISODate(start), end: toISODate(today) };
  }

  if (period === 'month') {
    const start = new Date(today.getFullYear(), today.getMonth(), 1);
    return { start: toISODate(start), end: toISODate(today) };
  }

  return { start: toISODate(today), end: toISODate(today) };
}

async function loadFinance(period = state.period) {
  state.period = period === 'custom' ? state.period : period;
  state.range = getPeriodRange(state.period);
  DOM.periodLabel.textContent = PERIOD_LABELS[state.period] || PERIOD_LABELS.today;

  renderLoadingState('revenue');
  renderLoadingState('expenses');
  renderMainCards();

  const [revenueResult, expensesResult] = await Promise.allSettled([
    fetchRevenue(state.range.start, state.range.end),
    fetchExpenses(state.range.start, state.range.end),
  ]);

  state.revenueError = revenueResult.status === 'rejected';
  state.expensesError = expensesResult.status === 'rejected';
  state.revenue = state.revenueError ? null : normalizeRevenue(revenueResult.value);
  state.expenses = state.expensesError ? null : normalizeExpenses(expensesResult.value);

  renderMainCards();
  renderRevenueSummary();
  renderTopProducts();
  renderSalesByHour();
  renderSalesByDay();
  renderExpensesList();
  renderExpensesByCategory();
  updateSourceInfo();
  fetchMonthContext();
}

function fetchRevenue(start, end) {
  const params = new URLSearchParams({ start, end });
  return adminFetch(`/admin/finance/revenue?${params.toString()}`);
}

function fetchExpenses(start, end) {
  const params = new URLSearchParams({
    start_date: start,
    end_date: end,
    limit: '500',
    offset: '0',
  });
  return adminFetch(`/admin/finance/expenses?${params.toString()}`);
}

async function fetchMonthContext() {
  const monthRange = getPeriodRange('month');
  const isCurrentMonth = state.range?.start === monthRange.start && state.range?.end === monthRange.end;

  if (isCurrentMonth && state.revenue && state.expenses) {
    state.monthRevenue = state.revenue;
    state.monthExpenses = state.expenses;
    renderMonthContext();
    return;
  }

  setText(DOM.monthRevenueCard, '...');
  setText(DOM.monthExpensesCard, '...');
  setText(DOM.monthResultCard, '...');

  const [revenueResult, expensesResult] = await Promise.allSettled([
    fetchRevenue(monthRange.start, monthRange.end),
    fetchExpenses(monthRange.start, monthRange.end),
  ]);

  state.monthRevenue = revenueResult.status === 'fulfilled' ? normalizeRevenue(revenueResult.value) : null;
  state.monthExpenses = expensesResult.status === 'fulfilled' ? normalizeExpenses(expensesResult.value) : null;
  renderMonthContext();
}

function renderMainCards() {
  const revenueTotal = state.revenueError ? null : getRevenueTotal(state.revenue);
  const expensesTotal = state.expensesError ? null : getExpensesTotal(state.expenses);
  const result = calculateResult(revenueTotal, expensesTotal);
  const ticketAverage = getTicketAverage(state.revenue);
  const transactions = getTransactionsCount(state.revenue);

  setText(DOM.revenueCard, state.revenueError ? 'Erro' : formatCurrencyOrDash(revenueTotal));
  setText(DOM.expensesCard, state.expensesError ? 'Erro' : formatCurrencyOrDash(expensesTotal));
  setText(DOM.resultCard, formatCurrencyOrDash(result));
  setText(DOM.ticketCard, transactions > 0 ? formatCurrency(ticketAverage) : '');
  setText(DOM.marginCard, result != null && revenueTotal > 0 ? `Margem: ${formatPercent((result / revenueTotal) * 100)}` : '');

  DOM.resultCard?.classList.toggle('adm-metric-value--red', result != null && result < 0);
  DOM.resultCard?.classList.toggle('adm-metric-value--green', result != null && result >= 0);
}

function renderMonthContext() {
  const revenueTotal = getRevenueTotal(state.monthRevenue);
  const expensesTotal = getExpensesTotal(state.monthExpenses);
  const result = calculateResult(revenueTotal, expensesTotal);

  setText(DOM.monthRevenueCard, formatCurrencyOrDash(revenueTotal));
  setText(DOM.monthExpensesCard, formatCurrencyOrDash(expensesTotal));
  setText(DOM.monthResultCard, formatCurrencyOrDash(result));
  DOM.monthResultCard?.classList.toggle('adm-metric-value--red', result != null && result < 0);
  DOM.monthResultCard?.classList.toggle('adm-metric-value--green', result != null && result >= 0);
}

function renderRevenueSummary() {
  if (!DOM.revenueDetails) return;
  if (state.revenueError) {
    DOM.revenueDetails.innerHTML = stateHTML('error', 'Erro nas receitas', 'Não foi possível carregar as receitas do período.');
    return;
  }

  const revenue = state.revenue;
  DOM.revenueDetails.innerHTML = `
    <div class="adm-fin-summary-grid">
      ${summaryItem('Receita', formatCurrencyOrDash(getRevenueTotal(revenue)))}
      ${summaryItem('Transações', formatNumber(getTransactionsCount(revenue)))}
      ${summaryItem('Ticket médio', getTransactionsCount(revenue) > 0 ? formatCurrency(getTicketAverage(revenue)) : '')}
      ${summaryItem('Período', `${formatDate(state.range.start)} - ${formatDate(state.range.end)}`)}
    </div>
  `;
}

function renderTopProducts() {
  if (!DOM.topProducts) return;
  if (state.revenueError) {
    DOM.topProducts.innerHTML = stateHTML('error', 'Erro', 'Não foi possível carregar as receitas do período.');
    return;
  }

  const products = getTopProducts(state.revenue);
  if (!products.length) {
    DOM.topProducts.innerHTML = stateHTML('empty', 'Nenhum produto vendido', 'Nenhum produto vendido no período.');
    return;
  }

  DOM.topProducts.innerHTML = products.slice(0, 8).map((product, index) => `
    <div class="adm-list-row">
      <div class="adm-fin-rank">${index + 1}</div>
      <div class="adm-list-info">
        <div class="adm-list-label">${esc(product.name)}</div>
        <div class="adm-list-sub">${formatNumber(product.quantity)} un.</div>
      </div>
      <div class="adm-list-value adm-list-value--green">${formatCurrency(product.total)}</div>
    </div>
  `).join('');
}

function renderSalesByHour() {
  renderBarList({
    element: DOM.salesByHour,
    rows: getSalesByHour(state.revenue),
    error: state.revenueError,
    emptyTitle: 'Sem dados por horário',
    emptySub: 'Nenhuma receita por horário no período.',
    labelGetter: row => formatHour(row.hour),
    subGetter: row => row.transactions ? `${formatNumber(row.transactions)} trans.` : '',
  });
}

function renderSalesByDay() {
  if (!DOM.salesByDaySection || !DOM.salesByDay) return;
  const shouldShow = state.period === 'week' || state.period === 'month';
  DOM.salesByDaySection.hidden = !shouldShow;
  if (!shouldShow) return;

  renderBarList({
    element: DOM.salesByDay,
    rows: getSalesByDay(state.revenue),
    error: state.revenueError,
    emptyTitle: 'Sem dados por dia',
    emptySub: 'Nenhuma receita por dia no período.',
    labelGetter: row => formatDate(row.date),
    subGetter: row => row.transactions ? `${formatNumber(row.transactions)} trans.` : '',
  });
}

function renderExpensesList() {
  if (!DOM.expensesList) return;
  if (state.expensesError) {
    DOM.expensesList.innerHTML = stateHTML('error', 'Erro nas despesas', 'Não foi possível carregar as despesas do período.');
    return;
  }

  const items = state.expenses?.items ?? [];
  if (!items.length) {
    DOM.expensesList.innerHTML = stateHTML('empty', 'Nenhuma despesa', 'Sem registros no período.');
    return;
  }

  DOM.expensesList.innerHTML = items.slice(0, 10).map(expense => `
    <div class="adm-list-row">
      <div class="adm-list-info">
        <div class="adm-list-label">${esc(expense.description)}</div>
        <div class="adm-list-sub">${esc(expense.category)} · ${formatDate(expense.date)}</div>
      </div>
      <div class="adm-list-value adm-list-value--red">${formatCurrency(expense.value)}</div>
    </div>
  `).join('');
}

function renderExpensesByCategory() {
  if (!DOM.categoriesList) return;
  if (state.expensesError) {
    DOM.categoriesList.innerHTML = stateHTML('error', 'Erro nas despesas', 'Não foi possível carregar as despesas do período.');
    return;
  }

  const categories = state.expenses?.byCategory ?? [];
  const total = getExpensesTotal(state.expenses) || 0;
  if (!categories.length) {
    DOM.categoriesList.innerHTML = stateHTML('empty', 'Nenhuma categoria', 'Sem despesas categorizadas no período.');
    return;
  }

  DOM.categoriesList.innerHTML = categories.map(category => {
    const percent = total > 0 ? Math.round((category.total / total) * 100) : 0;
    return `
      <div class="adm-list-row" style="align-items:flex-start">
        <div class="adm-list-info">
          <div class="adm-list-label">${esc(category.name)}</div>
          <div class="adm-cat-bar-wrap"><div class="adm-cat-bar" style="width:${percent}%"></div></div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="adm-list-value adm-list-value--red">${formatCurrency(category.total)}</div>
          <div class="adm-list-sub">${percent}% · ${formatNumber(category.count)} lanç.</div>
        </div>
      </div>
    `;
  }).join('');
}

function renderBarList({ element, rows, error, emptyTitle, emptySub, labelGetter, subGetter }) {
  if (!element) return;
  if (error) {
    element.innerHTML = stateHTML('error', 'Erro nas receitas', 'Não foi possível carregar as receitas do período.');
    return;
  }
  if (!rows.length) {
    element.innerHTML = stateHTML('empty', emptyTitle, emptySub);
    return;
  }

  const max = Math.max(...rows.map(row => row.total), 1);
  element.innerHTML = rows.map(row => {
    const percent = Math.max(4, Math.round((row.total / max) * 100));
    const sub = subGetter(row);
    return `
      <div class="adm-list-row adm-fin-bar-row">
        <div class="adm-fin-bar-meta">
          <div class="adm-list-label">${esc(labelGetter(row))}</div>
          ${sub ? `<div class="adm-list-sub">${esc(sub)}</div>` : ''}
        </div>
        <div class="adm-fin-bar-track"><span style="width:${percent}%"></span></div>
        <div class="adm-list-value adm-list-value--green">${formatCurrency(row.total)}</div>
      </div>
    `;
  }).join('');
}

function renderLoadingState(scope) {
  if (scope === 'revenue') {
    setText(DOM.revenueCard, '...');
    setText(DOM.resultCard, '...');
    setText(DOM.ticketCard, '...');
    if (DOM.revenueDetails) DOM.revenueDetails.innerHTML = loadingHTML();
    if (DOM.topProducts) DOM.topProducts.innerHTML = loadingHTML();
    if (DOM.salesByHour) DOM.salesByHour.innerHTML = loadingHTML();
    if (DOM.salesByDay) DOM.salesByDay.innerHTML = loadingHTML();
  }

  if (scope === 'expenses') {
    setText(DOM.expensesCard, '...');
    setText(DOM.resultCard, '...');
    if (DOM.expensesList) DOM.expensesList.innerHTML = loadingHTML();
    if (DOM.categoriesList) DOM.categoriesList.innerHTML = loadingHTML();
  }
}

function renderErrorState(scope) {
  if (scope === 'revenue') {
    state.revenueError = true;
    renderRevenueSummary();
    renderTopProducts();
    renderSalesByHour();
    renderSalesByDay();
  }
  if (scope === 'expenses') {
    state.expensesError = true;
    renderExpensesList();
    renderExpensesByCategory();
  }
}

function normalizeRevenue(raw = {}) {
  const summary = raw.summary ?? raw.resumo ?? raw;
  const revenueTotal = toNumber(
    summary.revenue_total ??
    summary.total_revenue ??
    summary.receita_total ??
    raw.revenue_total ??
    raw.receita_total ??
    raw.total
  );
  const transactions = toNumber(
    summary.transactions ??
    summary.transaction_count ??
    summary.quantidade_transacoes ??
    raw.transactions ??
    raw.quantidade_transacoes
  );
  const ticketAverage = toNumber(
    summary.ticket_average ??
    summary.average_ticket ??
    summary.ticket_medio ??
    raw.ticket_average ??
    raw.ticket_medio
  );

  return {
    raw,
    summary: {
      revenueTotal,
      transactions,
      ticketAverage: ticketAverage || (transactions > 0 ? revenueTotal / transactions : 0),
    },
    topProducts: normalizeProducts(raw.top_products ?? raw.products ?? raw.produtos_mais_vendidos ?? raw.itens ?? []),
    salesByHour: normalizeSalesRows(raw.sales_by_hour ?? raw.by_hour ?? raw.vendas_por_hora ?? [], 'hour'),
    salesByDay: normalizeSalesRows(raw.sales_by_day ?? raw.by_day ?? raw.vendas_por_dia ?? [], 'date'),
  };
}

function normalizeExpenses(raw = {}) {
  const summary = raw.summary ?? raw.resumo ?? {};
  return {
    raw,
    summary: {
      totalExpenses: toNumber(summary.total_expenses ?? summary.total ?? raw.total_expenses ?? raw.total),
      expensesCount: toNumber(summary.expenses_count ?? summary.count ?? raw.expenses_count ?? raw.count),
    },
    byCategory: (raw.by_category ?? raw.categories ?? raw.por_categoria ?? []).map(category => ({
      name: category.category ?? category.name ?? category.categoria ?? 'Sem categoria',
      total: toNumber(category.total ?? category.value ?? category.valor),
      count: toNumber(category.count ?? category.quantidade),
    })),
    items: (raw.items ?? raw.expenses ?? raw.data ?? []).map(item => ({
      description: item.descricao ?? item.description ?? item.name ?? 'Despesa',
      category: item.categoria ?? item.category ?? 'Sem categoria',
      value: toNumber(item.valor ?? item.value ?? item.amount),
      date: item.data ?? item.date ?? item.created_at ?? '',
    })),
  };
}

function normalizeProducts(products) {
  return products.map(product => ({
    name: product.name ?? product.product_name ?? product.nome ?? product.produto ?? 'Produto',
    quantity: toNumber(product.quantity ?? product.qty ?? product.quantidade ?? product.total_quantity),
    total: toNumber(product.revenue ?? product.total_revenue ?? product.total ?? product.valor_total ?? product.amount),
  })).filter(product => product.quantity > 0 || product.total > 0);
}

function normalizeSalesRows(rows, keyName) {
  return rows.map(row => ({
    [keyName]: row[keyName] ?? row.label ?? row.period ?? row.data ?? row.date ?? row.hora ?? row.hour ?? '',
    total: toNumber(row.revenue ?? row.total_revenue ?? row.total ?? row.valor ?? row.amount),
    transactions: toNumber(row.transactions ?? row.transaction_count ?? row.count ?? row.quantidade),
  })).filter(row => row.total > 0 || row.transactions > 0);
}

function renderIntegrations() {
  if (DOM.reportsList) {
    DOM.reportsList.innerHTML = [
      { label: 'Relatório diário', desc: 'Consolidado operacional gerado via n8n + IA' },
      { label: 'Relatório semanal', desc: 'Resumo financeiro enviado toda segunda-feira' },
    ].map(report => `
      <div class="adm-list-row">
        <div class="adm-list-info">
          <div class="adm-list-label">${esc(report.label)}</div>
          <div class="adm-list-sub">${esc(report.desc)}</div>
        </div>
        <span class="adm-badge adm-badge--active"><span class="adm-badge-dot"></span>Ativo</span>
      </div>
    `).join('');
  }

  if (DOM.automationList) {
    DOM.automationList.innerHTML = [
      { name: 'n8n + EyePDV → Banco de dados', desc: 'Receitas sincronizadas via n8n a partir da EyePDV.' },
      { name: 'n8n + IA → Despesas', desc: 'Despesas registradas e categorizadas automaticamente.' },
      { name: 'FastAPI → Admin dashboard', desc: 'Dados exibidos pelo backend a partir do banco de dados.' },
    ].map(item => `
      <div class="adm-automation-row">
        <div class="adm-automation-icon">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        </div>
        <div class="adm-automation-info">
          <div class="adm-automation-name">${esc(item.name)}</div>
          <div class="adm-automation-desc">${esc(item.desc)}</div>
        </div>
        <span class="adm-badge adm-badge--active"><span class="adm-badge-dot"></span>Ativo</span>
      </div>
    `).join('');
  }
}

function updateSourceInfo() {
  if (!DOM.sourceInfo) return;
  DOM.sourceInfo.textContent = 'Receitas sincronizadas via n8n a partir da EyePDV e exibidas pelo backend a partir do banco de dados.';
}

function bindPeriod() {
  document.querySelectorAll('.adm-fin-period-btn').forEach(button => {
    button.addEventListener('click', () => {
      const period = button.dataset.period;
      if (period === 'custom') return;
      document.querySelectorAll('.adm-fin-period-btn').forEach(item => item.classList.toggle('is-active', item === button));
      loadFinance(period);
    });
  });
}

function bindRefresh() {
  DOM.refresh?.addEventListener('click', async () => {
    DOM.refresh.classList.add('is-loading');
    await loadFinance(state.period);
    window.setTimeout(() => DOM.refresh?.classList.remove('is-loading'), 350);
  });
}

function getRevenueTotal(revenue) {
  return revenue?.summary?.revenueTotal ?? null;
}

function getTransactionsCount(revenue) {
  return revenue?.summary?.transactions ?? 0;
}

function getTicketAverage(revenue) {
  return revenue?.summary?.ticketAverage ?? 0;
}

function getExpensesTotal(expenses) {
  return expenses?.summary?.totalExpenses ?? null;
}

function getTopProducts(revenue) {
  return revenue?.topProducts ?? [];
}

function getSalesByHour(revenue) {
  return revenue?.salesByHour ?? [];
}

function getSalesByDay(revenue) {
  return revenue?.salesByDay ?? [];
}

function calculateResult(revenueTotal, expensesTotal) {
  if (revenueTotal == null || expensesTotal == null) return null;
  return revenueTotal - expensesTotal;
}

function summaryItem(label, value) {
  return `
    <div class="adm-fin-summary-item">
      <span>${label}</span>
      <strong>${value}</strong>
    </div>`;
}

function loadingHTML() {
  return '<div class="adm-fin-inline-state">Carregando...</div>';
}

function stateHTML(type, title, sub) {
  return `
    <div class="adm-state adm-fin-state">
      <div class="adm-state-title">${esc(title)}</div>
      <div class="adm-state-sub">${esc(sub)}</div>
    </div>`;
}

function startOfDay(date) {
  const copy = new Date(date);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function toISODate(date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(toNumber(value));
}

function formatCurrencyOrDash(value) {
  return value == null ? '—' : formatCurrency(value);
}

function formatPercent(value) {
  return `${new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value)}%`;
}

function formatNumber(value) {
  return new Intl.NumberFormat('pt-BR').format(toNumber(value));
}

function formatDate(value) {
  if (!value) return '—';
  const datePart = String(value).slice(0, 10);
  const [year, month, day] = datePart.split('-');
  if (!year || !month || !day) return value;
  return `${day}/${month}/${year}`;
}

function formatHour(value) {
  if (value == null || value === '') return '—';
  const text = String(value);
  if (/^\d{1,2}$/.test(text)) return `${text.padStart(2, '0')}h`;
  if (/^\d{1,2}:\d{2}/.test(text)) return `${text.slice(0, 2)}h`;
  return text;
}

function setText(element, value) {
  if (element) element.textContent = value;
}

function toNumber(value) {
  const number = Number(value ?? 0);
  return Number.isFinite(number) ? number : 0;
}

function esc(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
