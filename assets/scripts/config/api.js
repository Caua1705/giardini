/**
 * api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Configuração centralizada de API para o frontend do Giardini Café.
 *
 * Para trocar o ambiente (dev → prod), altere apenas API_BASE_URL aqui.
 * Nenhum outro arquivo precisa ser modificado.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const API_BASE_URL = 'https://api.giardini.cloud/api/v1';

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
  return `${API_BASE_URL}${path}`;
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
  const response = await fetch(buildApiUrl(path), options);

  if (!response.ok) {
    throw new Error(`API error ${response.status} em ${path}`);
  }

  return response.json();
}
