/**
 * api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuração centralizada de API para o frontend do Giardini Café.
 *
 * Para trocar o ambiente (dev → prod), altere apenas API_BASE_URL aqui.
 * Nenhum outro arquivo precisa ser modificado.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const API_BASE_URL = 'http://212.85.0.237:8000';

/** Rotas relativas disponíveis no backend. */
export const API_ROUTES = {
  menu:          '/menu',
  environments:  '/environments',
  availability:  '/availability',
  reservations:  '/reservations',
};

/**
 * Constrói a URL absoluta para um path relativo.
 * @param {string} path - Rota relativa, ex: API_ROUTES.menu
 * @returns {string}
 */
export function buildApiUrl(path) {
  const url = `${API_BASE_URL}${path}`;
  console.log('[api] buildApiUrl → API_BASE_URL:', API_BASE_URL, '| path:', path, '| url final:', url);
  return url;
}

/**
 * Wrapper de fetch com tratamento de erros HTTP padronizado.
 * Lança um Error se a resposta tiver status >= 400.
 *
 * @param {string} path    - Rota relativa (use API_ROUTES)
 * @param {RequestInit} [options] - Opções do fetch (method, body, headers…)
 * @returns {Promise<any>} - JSON da resposta
 */
export async function apiFetch(path, options = {}) {
  const url = buildApiUrl(path);
  console.log('[api] apiFetch → iniciando fetch para:', url, '| options:', options);
  let response;
  try {
    response = await fetch(url, options);
  } catch (networkErr) {
    console.error('[api] apiFetch → ERRO DE REDE (fetch lançou exceção):', networkErr);
    throw networkErr;
  }
  console.log('[api] apiFetch → response recebida | status:', response.status, '| ok:', response.ok, '| url:', response.url);

  if (!response.ok) {
    throw new Error(`API error ${response.status} em ${path}`);
  }

  return response.json();
}
