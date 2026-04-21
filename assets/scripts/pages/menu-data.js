/**
 * menu-data.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsável por:
 *   1. Buscar os dados do cardápio na API do backend (fetchAndRenderMenu)
 *   2. Agrupar os itens por subcategory → product_slug  (groupMenuItems)
 *   3. Renderizar os cards dinamicamente nos .menu-grid  (renderMenuIntoDOM)
 *   4. Dispatchar o evento customizado 'menuRendered' ao terminar
 *      — menu-tabs.js ouve esse evento para re-inicializar reveal e modal
 *
 * NÃO mexe em:
 *   - Lógica de hero, canvas, GSAP, scroll, navegação de categorias
 *   - Backend, endpoints, services, models, banco de dados
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { apiFetch, API_ROUTES } from '../config/api.js';

/* ── Mapeamento: subcategory slug (API) → section ID no HTML ────────────── */
const SUBCATEGORY_TO_SECTION_ID = {
  'massa-folhada':      'croissants',
  'paes-e-chapa':       'paes',
  'big-combos':         'combos',
  'bruschettas':        'bruschettas',
  'tapioca-e-cuscuz':   'tapioca',
  'salgados-de-forno':  'salgados',
  'sanduiches-gourmet': 'sanduiches',
  'barista':            'barista',
  'drinks':             'drinks',
  'soft-drinks':        'softdrinks',
  'sucos':              'sucos',
  'mundo-fit':          'fit',
  'confeitaria':        'confeitaria',
  'adicionais':         'adicionais',
};

/* ════════════════════════════════════════════════════════════════════════════
   AGRUPAMENTO
   Transforma o array flat da API em:
   Map<subcategory, Map<product_slug, { meta, variants[] }>>
════════════════════════════════════════════════════════════════════════════ */
function groupMenuItems(items) {
  const grouped = new Map();

  for (const row of items) {
    const sub = row.subcategory;
    if (!grouped.has(sub)) grouped.set(sub, new Map());

    const subMap = grouped.get(sub);
    const slug   = row.product_slug;

    if (!subMap.has(slug)) {
      subMap.set(slug, {
        name:         row.product_name,
        slug,
        description:  row.description  ?? null,
        badge:        row.badge        ?? null,
        image_url:    row.image_url    ?? null,
        has_variants: !!row.has_variants,
        price:        row.price        ?? null,
        variants:     [],
      });
    }

    // Acumula variantes (uma row por variante quando has_variants=true)
    if (row.has_variants && row.variant_name) {
      subMap.get(slug).variants.push({
        name:  row.variant_name,
        price: row.variant_price ?? null,
      });
    }
  }

  return grouped;
}

/* ════════════════════════════════════════════════════════════════════════════
   RENDERIZAÇÃO
════════════════════════════════════════════════════════════════════════════ */

/** Gera o bloco de preço de um produto. */
function renderPriceHtml(product) {
  // Produto simples (sem variantes)
  if (!product.has_variants || product.variants.length === 0) {
    return `<p class="item-price">${product.price ?? ''}</p>`;
  }

  // Produto com variantes: lista cada variante inline
  const lines = product.variants
    .map(v => `<span class="variant-line"><span class="variant-label">${v.name}</span><span class="variant-price">${v.price ?? ''}</span></span>`)
    .join('');
  return `<p class="item-price item-price--variants">${lines}</p>`;
}

/** Gera o HTML completo de um card .menu-item. */
function renderMenuItemHtml(product) {
  // Thumb — oculto se não houver imagem
  const imgHtml = product.image_url
    ? `<div class="item-thumb"><img src="${product.image_url}" alt="${product.name}" loading="lazy"></div>`
    : `<div class="item-thumb item-thumb--no-image"></div>`;

  // Descrição (nullable)
  const descHtml = product.description
    ? `<p class="item-desc">${product.description}</p>`
    : '';

  // Badge (nullable)
  const badgeHtml = product.badge
    ? `<div class="item-badges"><span class="badge">${product.badge}</span></div>`
    : '';

  const priceHtml = renderPriceHtml(product);

  // data-attributes consumidos pelo modal em menu-tabs.js
  const safeDesc  = product.description ? product.description.replace(/"/g, '&quot;') : '';
  const safeImg   = product.image_url ?? '';
  const safePrice = product.has_variants && product.variants.length > 0
    ? product.variants.map(v => `${v.name}: ${v.price ?? ''}`).join(' / ')
    : (product.price ?? '');

  return `<div class="menu-item reveal"
     data-item-name="${product.name}"
     data-item-desc="${safeDesc}"
     data-item-price="${safePrice}"
     data-item-image="${safeImg}">
  ${imgHtml}
  <div class="item-body">
    <h3 class="item-name">${product.name}</h3>
    ${descHtml}
    ${badgeHtml}
  </div>
  <div>${priceHtml}</div>
</div>`.trim();
}

/**
 * Injeta os cards no DOM, localizando cada .menu-grid pela section correspondente.
 * Também atualiza o contador de itens visível no section-header.
 */
function renderMenuIntoDOM(grouped) {
  for (const [subcategory, subMap] of grouped) {
    const sectionId = SUBCATEGORY_TO_SECTION_ID[subcategory];
    if (!sectionId) continue;

    const section = document.getElementById(sectionId);
    if (!section) continue;

    // Render cards
    const grid = section.querySelector('.menu-grid');
    if (grid) {
      const cards = [];
      for (const [, product] of subMap) {
        cards.push(renderMenuItemHtml(product));
      }
      grid.innerHTML = cards.join('\n');
    }

    // Atualiza section-count com o número real de produtos (não variantes)
    const countEl = section.querySelector('.section-count');
    if (countEl) {
      const n = subMap.size;
      countEl.textContent = `${String(n).padStart(2, '0')} ${n === 1 ? 'item' : 'itens'}`;
    }
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   FETCH PRINCIPAL
════════════════════════════════════════════════════════════════════════════ */

/**
 * Busca os dados da API, agrupa, renderiza e dispara o evento 'menuRendered'.
 * Em caso de erro de rede, os grids ficam vazios sem quebrar o resto da página.
 */
async function fetchAndRenderMenu() {
  try {
    const items   = await apiFetch(API_ROUTES.menu);
    const grouped = groupMenuItems(items);
    renderMenuIntoDOM(grouped);

    // Notifica menu-tabs.js que o DOM está populado
    document.dispatchEvent(new CustomEvent('menuRendered'));
  } catch (err) {
    console.warn('[menu-data] Falha ao carregar cardápio da API:', err.message);
    // Dispara mesmo em caso de erro para que menu-tabs.js não fique esperando
    document.dispatchEvent(new CustomEvent('menuRendered', { detail: { error: true } }));
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTO-EXECUÇÃO
   Inicia o fetch assim que o DOM estiver pronto.
════════════════════════════════════════════════════════════════════════════ */
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', fetchAndRenderMenu);
} else {
  // DOM já carregado (script diferido, etc.)
  fetchAndRenderMenu();
}

/* ── Export (usado por testes ou integrações externas, se necessário) ────── */
window.MenuData = { fetchAndRenderMenu, groupMenuItems, renderMenuIntoDOM };
