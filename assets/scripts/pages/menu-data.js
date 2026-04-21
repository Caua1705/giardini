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

console.log('[menu-data] script loaded — API_ROUTES.menu:', API_ROUTES.menu);

// ── INÍCIO IMEDIATO DA REQUISIÇÃO ─────────────────────────────────────────────
// Disparamos o fetch aqui no topo para que a rede comece a trabalhar enquanto
// o navegador ainda está fazendo o parsing do HTML/CSS.
const menuDataPromise = apiFetch(API_ROUTES.menu).catch(err => {
  console.error('[menu-data] Erro crítico na requisição antecipada:', err);
  return null;
});
// ─────────────────────────────────────────────────────────────────────────────

/* ── Mapeamento: subcategory slug (API) → section ID no HTML ────────────── */
const SUBCATEGORY_TO_SECTION_ID = {
  'Croissants':      'croissants',
  'Pães & Chapa':    'paes',
  'Combos':          'combos',
  'Tapioca & Cuscuz':'tapioca',
  'Bruschettas':     'bruschettas',
  'Sanduíches':      'sanduiches',
  'Salgados':        'salgados',
  'Drinks':          'drinks',
  'Sucos':           'sucos',
  'Soft Drinks':     'softdrinks',
  'Barista':         'barista',
  'Mundo Fit':       'fit',
  'Confeitaria':     'confeitaria',
  'Adicionais':      'adicionais',
};

/* ════════════════════════════════════════════════════════════════════════════
   AGRUPAMENTO
   Transforma o array flat da API em:
   Map<subcategory, Map<product_slug, { meta, variants[] }>>
════════════════════════════════════════════════════════════════════════════ */
function groupMenuItems(items) {
  console.log('[menu-data] groupMenuItems → total de rows recebidas:', items.length);
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

/** Formata valores para moeda local (R$) */
function formatPrice(val) {
  if (val === null || val === undefined || val === '') return '';
  const strVal = String(val).trim();
  if (strVal.startsWith('R$')) return strVal;
  
  // Substitui vírgula por ponto para parse
  const num = parseFloat(strVal.replace(',', '.'));
  if (!isNaN(num)) {
    let formatted = num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    if (formatted.endsWith(',00')) {
      formatted = formatted.substring(0, formatted.length - 3);
    }
    return `R$ ${formatted}`;
  }
  return `R$ ${strVal}`;
}

/** Detecta labels genéricos como "Preço 1", "Valor 2", etc. */
function isGenericLabel(name) {
  if (!name) return true;
  const n = name.toLowerCase();
  return n.includes('preço') || n.includes('valor') || /^\d+$/.test(n);
}

/** Gera o bloco de preço de um produto. */
function renderPriceHtml(product, sectionId = '') {
  // Se for a seção de Tapioca & Cuscuz, simplificamos para mostrar apenas um preço por vez (o toggle controla)
  if (sectionId === 'tapioca') {
    const tapVar = product.variants.find(v => v.name.toLowerCase().includes('tapioca'));
    const initialPrice = tapVar ? tapVar.price : product.price;
    return `<p class="item-price dynamic-price">${formatPrice(initialPrice)}</p>`;
  }

  // Produto simples (sem variantes)
  if (!product.has_variants || product.variants.length === 0) {
    return `<p class="item-price">${formatPrice(product.price)}</p>`;
  }

  // Produto com variantes: lista cada variante estruturada e organizada
  const lines = product.variants
    .map(v => {
      const priceStr = formatPrice(v.price);
      const isGeneric = isGenericLabel(v.name);
      
      // Se for genérico, não mostramos o label nem o separador
      if (isGeneric) {
        return `<div class="variant-item">
          <span class="variant-price">${priceStr}</span>
        </div>`;
      }

      // Layout compacto: label — preço na mesma linha
      // Apenas nomes muito longos (> 22 chars) ficam empilhados verticalmente
      const isShort = v.name.length <= 22;
      const compactClass = isShort ? 'variant-item--compact' : '';

      return `<div class="variant-item ${compactClass}">
        <span class="variant-label">${v.name}</span>
        ${isShort ? '<span class="variant-separator">—</span>' : ''}
        <span class="variant-price">${priceStr}</span>
      </div>`;
    })
    .join('');

  return `<div class="variant-list">${lines}</div>`;
}

/** Gera o HTML completo de um card .menu-item. */
function renderMenuItemHtml(product, sectionId = '') {
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

  const priceHtml = renderPriceHtml(product, sectionId);

  // data-attributes consumidos pelo modal em menu-tabs.js
  const safeDesc  = product.description ? product.description.replace(/"/g, '&quot;') : '';
  const safeImg   = product.image_url ?? '';
  const safeBadge = product.badge ? product.badge.replace(/"/g, '&quot;') : '';

  // Lógica específica de variantes para Tapioca & Cuscuz
  let extraAttrs = '';
  let finalSafePrice = formatPrice(product.price);

  if (sectionId === 'tapioca') {
    const tapVar = product.variants.find(v => v.name.toLowerCase().includes('tapioca'));
    const cusVar = product.variants.find(v => v.name.toLowerCase().includes('cuscuz'));
    
    const pTap = tapVar ? formatPrice(tapVar.price) : formatPrice(product.price);
    const pCus = cusVar ? formatPrice(cusVar.price) : formatPrice(product.price);
    
    extraAttrs = `data-price-tapioca="${pTap}" data-price-cuscuz="${pCus}"`;
    // Inicialmente mostramos o da Tapioca por padrão no modal se estivermos nela
    finalSafePrice = pTap;
  } else {
    finalSafePrice = product.has_variants && product.variants.length > 0
      ? product.variants
          .filter(v => !isGenericLabel(v.name)) // Remove labels feios do modal também
          .map(v => `${v.name}: ${formatPrice(v.price)}`).join(' / ')
      : formatPrice(product.price);
    
    // Se ficou vazio por causa do filtro genérico, usa apenas os preços
    if (product.has_variants && (!finalSafePrice || finalSafePrice.trim() === '')) {
      finalSafePrice = product.variants.map(v => formatPrice(v.price)).join(' / ');
    }
  }

  return `<div class="menu-item reveal" ${extraAttrs}
      data-item-name="${product.name}"
      data-item-desc="${safeDesc}"
      data-item-price="${finalSafePrice}"
      data-item-image="${safeImg}"
      data-item-badge="${safeBadge}">
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
  console.log('[menu-data] renderMenuIntoDOM → subcategorias no grouped:', [...grouped.keys()]);
  for (const [subcategory, subMap] of grouped) {
    const sectionId = SUBCATEGORY_TO_SECTION_ID[subcategory];
    console.log('[menu-data] rendering section → subcategory:', subcategory, '| sectionId:', sectionId, '| produtos:', subMap.size);
    if (!sectionId) { console.warn('[menu-data] subcategory SEM mapeamento — ignorada:', subcategory); continue; }

    const section = document.getElementById(sectionId);
    if (!section) continue;

    // Render cards
    const grid = section.querySelector('.menu-grid');
    if (grid) {
      const cards = [];
      for (const [, product] of subMap) {
        cards.push(renderMenuItemHtml(product, sectionId));
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
  console.log('[menu-data] fetchAndRenderMenu → aguardando dados da API e prontidão do DOM');
  try {
    // Aguarda a promessa que foi disparada no topo do script
    const items = await menuDataPromise;
    
    if (!items) {
      throw new Error('Nenhum dado recebido da API (fetch retornou null)');
    }

    console.log('[menu-data] items received via pre-fetch → total:', items.length);
    const grouped = groupMenuItems(items);
    renderMenuIntoDOM(grouped);
    console.log('[menu-data] renderização concluída — disparando evento menuRendered');

    // Notifica menu-tabs.js que o DOM está populado
    document.dispatchEvent(new CustomEvent('menuRendered'));
  } catch (err) {
    console.error('[menu-data] ERRO em fetchAndRenderMenu:', err);
    document.dispatchEvent(new CustomEvent('menuRendered', { detail: { error: true } }));
  }
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTO-EXECUÇÃO
   Inicia o fetch assim que o DOM estiver pronto.
════════════════════════════════════════════════════════════════════════════ */
if (document.readyState === 'loading') {
  console.log('[menu-data] DOM ainda carregando — aguardando DOMContentLoaded');
  document.addEventListener('DOMContentLoaded', () => {
    console.log('[menu-data] DOMContentLoaded disparado — chamando fetchAndRenderMenu');
    fetchAndRenderMenu();
  });
} else {
  // DOM já carregado (script diferido, etc.)
  console.log('[menu-data] DOM já pronto (readyState: "' + document.readyState + '") — chamando fetchAndRenderMenu imediatamente');
  fetchAndRenderMenu();
}

/* ── Export (usado por testes ou integrações externas, se necessário) ────── */
window.MenuData = { fetchAndRenderMenu, groupMenuItems, renderMenuIntoDOM };
