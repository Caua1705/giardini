/**
 * Giardini Cafe - Admin Finance
 * Uses synchronized financial data served by the admin backend.
 */

import { requireAuth, initShell, adminFetch } from './admin-auth.js';

const currentUser = requireAuth();

const state = {
  period: 'today',
  range: null,
  revenue: null,
  expenses: null,
  revenueError: false,
  expensesError: false,
  chartRange: 'daily',
  productsSort: 'quantity',
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
  execChart: document.getElementById('fin-exec-chart'),
  chartToggle: document.getElementById('fin-chart-toggle'),
  productsToggle: document.getElementById('fin-products-toggle'),
  exportButton: document.getElementById('fin-export'),
  pageRefresh: document.getElementById('fin-refresh'),
  topProducts: document.getElementById('fin-top-products'),
  salesByHour: document.getElementById('fin-sales-hour'),
  expensesList: document.getElementById('fin-expenses-list'),
  categoriesList: document.getElementById('fin-categories-list'),
  orgSyncTime: document.getElementById('fin-org-sync-time'),
  orgExpenses: document.getElementById('fin-org-expenses'),
  orgLogs: document.getElementById('fin-org-logs'),
  expenseModal: document.getElementById('fin-expense-modal'),
  expenseModalContent: document.getElementById('fin-expense-modal-content'),
};

if (currentUser) {
  document.addEventListener('DOMContentLoaded', () => {
    initShell();
    bindPeriod();
    bindChartToggle();
    bindProductsToggle();
    bindRefresh();
    bindExport();
    bindExpenseModal();
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
  renderExecutiveChart();
  renderTopProducts();
  renderSalesByHour();
  renderExpensesList();
  renderExpensesByCategory();
  renderOrganization();
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
  DOM.resultCard?.closest('.adm-metric-card')?.classList.toggle('adm-metric-card--negative', result != null && result < 0);
  DOM.resultCard?.closest('.adm-metric-card')?.classList.toggle('adm-metric-card--positive', result != null && result >= 0);
}

function renderTopProducts() {
  if (!DOM.topProducts) return;
  if (state.revenueError) {
    DOM.topProducts.innerHTML = stateHTML('error', 'Erro', 'Não foi possível carregar as receitas do período.');
    return;
  }

  const products = [...getTopProducts(state.revenue)].sort((a, b) => {
    const key = state.productsSort === 'revenue' ? 'total' : 'quantity';
    return toNumber(b[key]) - toNumber(a[key]);
  });
  if (!products.length) {
    DOM.topProducts.innerHTML = stateHTML('empty', 'Nenhum produto vendido', 'Nenhum produto vendido no período.');
    return;
  }

  const max = Math.max(...products.map(product => state.productsSort === 'revenue' ? product.total : product.quantity), 1);
  DOM.topProducts.innerHTML = products.slice(0, 8).map((product, index) => `
    <div class="adm-list-row adm-fin-product-row">
      <div class="adm-fin-rank">${index + 1}</div>
      <div class="adm-list-info">
        <div class="adm-list-label">${esc(product.name)}</div>
        <div class="adm-list-sub">${formatNumber(product.quantity)} un. · ${formatCurrency(product.total)}</div>
        <div class="adm-fin-product-track"><span style="width:${Math.max(6, Math.round(((state.productsSort === 'revenue' ? product.total : product.quantity) / max) * 100))}%"></span></div>
      </div>
      <div class="adm-list-value adm-list-value--green">${state.productsSort === 'revenue' ? formatCurrency(product.total) : formatNumber(product.quantity)}</div>
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

  DOM.expensesList.innerHTML = items.slice(0, 10).map((expense, index) => `
    <button class="adm-list-row adm-fin-expense-row" type="button" data-expense-index="${index}">
      <span class="adm-expense-badge">${esc(expense.category)}</span>
      <div class="adm-list-info">
        <div class="adm-list-label">${esc(expense.description)}</div>
        <div class="adm-list-sub">${formatDate(expense.date)}</div>
      </div>
      <div class="adm-list-value adm-list-value--red">${formatCurrency(expense.value)}</div>
    </button>
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

  const gradient = categories.map((category, index) => {
    const start = categories.slice(0, index).reduce((sum, item) => sum + (total > 0 ? (item.total / total) * 100 : 0), 0);
    const end = start + (total > 0 ? (category.total / total) * 100 : 0);
    return `${categoryColor(index)} ${start}% ${end}%`;
  }).join(', ');

  DOM.categoriesList.innerHTML = `
    <div class="adm-fin-donut-wrap">
      <div class="adm-fin-donut" style="background:conic-gradient(${gradient})">
        <div>
          <strong>${formatCurrency(total)}</strong>
          <span>Total</span>
        </div>
      </div>
    </div>
    <div class="adm-fin-category-list">
      ${categories.map((category, index) => {
    const percent = total > 0 ? Math.round((category.total / total) * 100) : 0;
    return `
      <div class="adm-fin-category-row">
        <span class="adm-fin-category-dot" style="background:${categoryColor(index)}"></span>
        <div class="adm-list-info">
          <div class="adm-list-label">${esc(category.name)}</div>
          <div class="adm-list-sub">${formatCurrency(category.total)} · ${formatNumber(category.count)} lanç.</div>
        </div>
        <div class="adm-fin-category-percent">${percent}%</div>
      </div>
    `;
  }).join('')}
    </div>
  `;
}

function renderExecutiveChart() {
  if (!DOM.execChart) return;
  if (state.revenueError || state.expensesError) {
    DOM.execChart.innerHTML = stateHTML('error', 'Erro no gráfico', 'Não foi possível carregar receitas e despesas do período.');
    return;
  }

  const rows = buildChartRows();
  if (!rows.length) {
    DOM.execChart.innerHTML = stateHTML('empty', 'Sem dados para o gráfico', 'Não há receitas ou despesas no período selecionado.');
    return;
  }

  const width = 920;
  const height = 320;
  const pad = { top: 24, right: 24, bottom: 42, left: 56 };
  const innerW = width - pad.left - pad.right;
  const innerH = height - pad.top - pad.bottom;
  const max = Math.max(...rows.flatMap(row => [row.revenue, row.expenses]), 1);
  const points = rows.map((row, index) => {
    const x = pad.left + (rows.length === 1 ? innerW / 2 : (index / (rows.length - 1)) * innerW);
    return {
      label: row.label,
      revenue: row.revenue,
      expenses: row.expenses,
      x,
      revenueY: pad.top + innerH - (row.revenue / max) * innerH,
      expensesY: pad.top + innerH - (row.expenses / max) * innerH,
    };
  });

  DOM.execChart.innerHTML = `
    <div class="adm-fin-chart-legend">
      <span><i class="adm-fin-dot adm-fin-dot--revenue"></i>Receita</span>
      <span><i class="adm-fin-dot adm-fin-dot--expense"></i>Despesas</span>
    </div>
    <svg class="adm-fin-chart" viewBox="0 0 ${width} ${height}" role="img" aria-label="Receita vs Despesas">
      ${[0, 1, 2, 3].map(step => {
        const y = pad.top + (innerH / 3) * step;
        return `<line class="adm-fin-grid-line" x1="${pad.left}" y1="${y}" x2="${width - pad.right}" y2="${y}"></line>`;
      }).join('')}
      <path class="adm-fin-line adm-fin-line--revenue" d="${smoothPath(points.map(point => [point.x, point.revenueY]))}"></path>
      <path class="adm-fin-line adm-fin-line--expense" d="${smoothPath(points.map(point => [point.x, point.expensesY]))}"></path>
      ${points.map(point => `
        <circle class="adm-fin-chart-point adm-fin-chart-point--revenue" cx="${point.x}" cy="${point.revenueY}" r="4"></circle>
        <circle class="adm-fin-chart-point adm-fin-chart-point--expense" cx="${point.x}" cy="${point.expensesY}" r="4"></circle>
      `).join('')}
      ${points.map((point, index) => index % Math.ceil(points.length / 6) === 0 || index === points.length - 1 ? `
        <text class="adm-fin-axis-label" x="${point.x}" y="${height - 14}" text-anchor="middle">${esc(point.label)}</text>
      ` : '').join('')}
    </svg>
    <div class="adm-fin-chart-summary">
      <span>Receita: <strong>${formatCurrency(rows.reduce((sum, row) => sum + row.revenue, 0))}</strong></span>
      <span>Despesas: <strong>${formatCurrency(rows.reduce((sum, row) => sum + row.expenses, 0))}</strong></span>
    </div>
  `;
}

function renderOrganization() {
  const now = new Date();
  setText(DOM.orgSyncTime, now.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }));
  setText(DOM.orgExpenses, `${formatNumber(state.expenses?.items?.length ?? 0)} comprovantes`);
  const logCount = (state.revenueError ? 1 : 0) + (state.expensesError ? 1 : 0);
  setText(DOM.orgLogs, logCount ? `${logCount} alerta${logCount > 1 ? 's' : ''}` : 'Sem alertas');
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
    if (DOM.execChart) DOM.execChart.innerHTML = loadingHTML();
    if (DOM.topProducts) DOM.topProducts.innerHTML = loadingHTML();
    if (DOM.salesByHour) DOM.salesByHour.innerHTML = loadingHTML();
  }

  if (scope === 'expenses') {
    setText(DOM.expensesCard, '...');
    setText(DOM.resultCard, '...');
    if (DOM.execChart) DOM.execChart.innerHTML = loadingHTML();
    if (DOM.expensesList) DOM.expensesList.innerHTML = loadingHTML();
    if (DOM.categoriesList) DOM.categoriesList.innerHTML = loadingHTML();
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
      id: item.id ?? item.expense_id ?? item.uuid ?? '',
      description: item.descricao ?? item.description ?? item.name ?? 'Despesa',
      category: item.categoria ?? item.category ?? 'Sem categoria',
      value: toNumber(item.valor ?? item.value ?? item.amount),
      date: item.data ?? item.date ?? item.created_at ?? '',
      receiptUrl: item.receipt_url ?? item.comprovante_url ?? item.file_url ?? item.receipt ?? item.comprovante ?? '',
      createdAt: item.created_at ?? item.createdAt ?? item.criado_em ?? '',
      raw: item,
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

function bindPeriod() {
  document.querySelectorAll('#fin-period .adm-fin-period-btn').forEach(button => {
    button.addEventListener('click', () => {
      const period = button.dataset.period;
      if (period === 'custom') return;
      document.querySelectorAll('#fin-period .adm-fin-period-btn').forEach(item => item.classList.toggle('is-active', item === button));
      loadFinance(period);
    });
  });
}

function bindChartToggle() {
  DOM.chartToggle?.querySelectorAll('[data-chart-range]').forEach(button => {
    button.addEventListener('click', () => {
      state.chartRange = button.dataset.chartRange || 'daily';
      DOM.chartToggle.querySelectorAll('[data-chart-range]').forEach(item => item.classList.toggle('is-active', item === button));
      renderExecutiveChart();
    });
  });
}

function bindProductsToggle() {
  DOM.productsToggle?.querySelectorAll('[data-products-sort]').forEach(button => {
    button.addEventListener('click', () => {
      state.productsSort = button.dataset.productsSort || 'quantity';
      DOM.productsToggle.querySelectorAll('[data-products-sort]').forEach(item => item.classList.toggle('is-active', item === button));
      renderTopProducts();
    });
  });
}

function bindRefresh() {
  const refresh = async button => {
    button?.classList.add('is-loading');
    await loadFinance(state.period);
    window.setTimeout(() => button?.classList.remove('is-loading'), 350);
  };

  DOM.refresh?.addEventListener('click', () => refresh(DOM.refresh));
  DOM.pageRefresh?.addEventListener('click', () => refresh(DOM.pageRefresh));
}

function bindExport() {
  DOM.exportButton?.addEventListener('click', () => {
    const rows = [
      ['tipo', 'descricao', 'categoria', 'data', 'valor'],
      ['receita', 'Receita total', '', state.range?.end ?? '', getRevenueTotal(state.revenue) ?? 0],
      ...(state.expenses?.items ?? []).map(item => ['despesa', item.description, item.category, item.date, item.value]),
    ];
    const csv = rows.map(row => row.map(value => `"${String(value ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `giardini-financeiro-${state.range?.start ?? 'periodo'}-${state.range?.end ?? 'atual'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  });
}

function bindExpenseModal() {
  DOM.expensesList?.addEventListener('click', event => {
    const row = event.target.closest('[data-expense-index]');
    if (!row) return;
    const expense = state.expenses?.items?.[Number(row.dataset.expenseIndex)];
    if (expense) openExpenseModal(expense);
  });

  DOM.expenseModal?.addEventListener('click', event => {
    if (event.target.closest('[data-modal-close]')) closeExpenseModal();
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape') closeExpenseModal();
  });
}

function openExpenseModal(expense) {
  if (!DOM.expenseModal || !DOM.expenseModalContent) return;
  const receipt = renderReceiptPreview(expense.receiptUrl);
  DOM.expenseModalContent.innerHTML = `
    <div class="adm-fin-modal-head">
      <span class="adm-expense-badge">${esc(expense.category)}</span>
      <h2 id="fin-modal-title">${esc(expense.description)}</h2>
      <div class="adm-fin-modal-amount">${formatCurrency(expense.value)}</div>
    </div>
    <div class="adm-fin-modal-grid">
      ${modalField('Data', formatDate(expense.date))}
      ${modalField('Categoria', expense.category)}
      ${modalField('Criado em', expense.createdAt ? formatDateTime(expense.createdAt) : '—')}
      ${modalField('ID', expense.id || '—')}
    </div>
    <div class="adm-fin-receipt">
      <div class="adm-fin-receipt-title">Comprovante</div>
      ${receipt}
    </div>
  `;
  DOM.expenseModal.classList.add('is-open');
  DOM.expenseModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function closeExpenseModal() {
  if (!DOM.expenseModal) return;
  DOM.expenseModal.classList.remove('is-open');
  DOM.expenseModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
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

function buildChartRows() {
  const revenueRows = state.chartRange === 'daily' && state.period === 'today'
    ? getSalesByHour(state.revenue).map(row => ({ key: formatHour(row.hour), label: formatHour(row.hour), total: row.total }))
    : groupChartRows(getSalesByDay(state.revenue).map(row => {
      const key = getDateChartKey(row.date);
      return { key: key.key, label: key.label, total: row.total };
    }));

  const revenueMap = new Map(revenueRows.map(row => [row.key, row]));
  const expenseMap = new Map();

  (state.expenses?.items ?? []).forEach(expense => {
    const key = getExpenseChartKey(expense);
    expenseMap.set(key.key, {
      key: key.key,
      label: key.label,
      total: (expenseMap.get(key.key)?.total ?? 0) + expense.value,
    });
  });

  const keys = Array.from(new Set([...revenueMap.keys(), ...expenseMap.keys()]));
  return keys.map(key => ({
    label: revenueMap.get(key)?.label ?? expenseMap.get(key)?.label ?? key,
    revenue: revenueMap.get(key)?.total ?? 0,
    expenses: expenseMap.get(key)?.total ?? 0,
  })).filter(row => row.revenue > 0 || row.expenses > 0);
}

function getExpenseChartKey(expense) {
  return getDateChartKey(expense.date);
}

function getDateChartKey(value) {
  const date = parseLocalDate(value);
  if (!date) return { key: 'Sem data', label: 'Sem data' };

  if (state.chartRange === 'weekly') {
    const start = startOfDay(date);
    const dow = start.getDay();
    start.setDate(start.getDate() - (dow === 0 ? 6 : dow - 1));
    return { key: toISODate(start), label: `Sem. ${formatDate(toISODate(start))}` };
  }

  if (state.chartRange === 'monthly') {
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    return { key, label: `${String(date.getMonth() + 1).padStart(2, '0')}/${date.getFullYear()}` };
  }

  if (state.period === 'today' && /\d{1,2}:\d{2}/.test(String(value))) {
    const hour = String(value).match(/(\d{1,2}):\d{2}/)?.[1] ?? '';
    return { key: `${hour.padStart(2, '0')}h`, label: `${hour.padStart(2, '0')}h` };
  }

  const key = toISODate(date);
  return { key, label: formatDate(key) };
}

function groupChartRows(rows) {
  const map = new Map();
  rows.forEach(row => {
    map.set(row.key, {
      key: row.key,
      label: row.label,
      total: (map.get(row.key)?.total ?? 0) + row.total,
    });
  });
  return [...map.values()];
}

function calculateResult(revenueTotal, expensesTotal) {
  if (revenueTotal == null || expensesTotal == null) return null;
  return revenueTotal - expensesTotal;
}

function modalField(label, value) {
  return `
    <div class="adm-fin-modal-field">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
    </div>`;
}

function renderReceiptPreview(url) {
  if (!url) {
    return '<div class="adm-fin-receipt-empty">Nenhum comprovante anexado.</div>';
  }

  const safeUrl = esc(url);
  if (/\.pdf($|\?)/i.test(url)) {
    return `<a class="adm-fin-receipt-link" href="${safeUrl}" target="_blank" rel="noopener">Abrir PDF anexado</a>`;
  }

  return `<img class="adm-fin-receipt-img" src="${safeUrl}" alt="Comprovante da despesa" loading="lazy" />`;
}

function smoothPath(points) {
  if (!points.length) return '';
  if (points.length === 1) return `M ${points[0][0]} ${points[0][1]}`;
  return points.reduce((path, point, index) => {
    if (index === 0) return `M ${point[0]} ${point[1]}`;
    const previous = points[index - 1];
    const midX = (previous[0] + point[0]) / 2;
    return `${path} C ${midX} ${previous[1]}, ${midX} ${point[1]}, ${point[0]} ${point[1]}`;
  }, '');
}

function categoryColor(index) {
  return ['#b79358', '#e07070', '#6dbf8a', '#c98252', '#8a7250', '#d0b071'][index % 6];
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

function parseLocalDate(value) {
  if (!value) return null;
  const text = String(value);
  const datePart = text.slice(0, 10);
  const [year, month, day] = datePart.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
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

function formatDateTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return formatDate(value);
  return date.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
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
