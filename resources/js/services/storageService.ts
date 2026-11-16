
import {
  Insumo,
  Cotizacion,
  ConfiguracionEmpresa
} from '../types';

import { DEFAULT_CONFIG } from '../data/seedData';

// Compatibilidad con la API de Electron, si se ejecuta en ese entorno
declare global {
  interface Window {
    electronAPI?: {
      isElectron: boolean;
      getQuotes: () => Promise<Cotizacion[]>;
      saveQuote: (quote: Cotizacion) => Promise<boolean>;
      deleteQuote: (id: string) => Promise<boolean>;
      getMaterials: () => Promise<Insumo[]>;
      saveMaterial: (material: Insumo) => Promise<boolean>;
      deleteMaterial: (id: string) => Promise<boolean>;
      getConfig: () => Promise<ConfiguracionEmpresa>;
      saveConfig: (config: ConfiguracionEmpresa) => Promise<boolean>;
      exportPdf: (data: any) => Promise<string>;
      savePdfFile?: (data: {
        filename: string;
        base64Data: string;
      }) => Promise<string | null>;
    };
  }
}

const AUTH_TOKEN_KEY = 'conobras_auth_token_v1';

// Obtener el token de autenticación de Sanctum
const getAuthToken = (): string => {
  const token = localStorage.getItem(AUTH_TOKEN_KEY);

  if (!token) {
    throw new Error(
      'No existe una sesión autenticada. Inicia sesión nuevamente.'
    );
  }

  return token;
};

// Encabezados para las peticiones autenticadas
const defaultHeaders = (): HeadersInit => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'Authorization': `Bearer ${getAuthToken()}`,
  'X-Requested-With': 'XMLHttpRequest'
});

// Función centralizada para comunicarse con Laravel
async function apiRequest<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...defaultHeaders(),
      ...(options.headers || {})
    }
  });

  // Manejo de errores HTTP
  if (!response.ok) {
    let message = `Error HTTP ${response.status}`;

    try {
      const errorData = await response.json();

      if (errorData.message) {
        message = errorData.message;
      } else if (errorData.errors) {
        message = Object.values(errorData.errors)
          .flat()
          .join(' ');
      }
    } catch {
      // Mantener el mensaje HTTP original
    }

    if (response.status === 401) {
      throw new Error(
        'Tu sesión ha expirado. Inicia sesión nuevamente.'
      );
    }

    if (response.status === 403) {
      throw new Error(
        'No tienes permisos para realizar esta operación.'
      );
    }

    throw new Error(message);
  }

  // Respuestas sin contenido, por ejemplo HTTP 204
  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type');

  if (contentType?.includes('application/json')) {
    return await response.json() as T;
  }

  return undefined as T;
}

class StorageService {

  // ==========================================
  // COTIZACIONES
  // ==========================================

  async getQuotes(): Promise<Cotizacion[]> {
    // Electron
    if (window.electronAPI?.isElectron) {
      return await window.electronAPI.getQuotes();
    }

    // Laravel
    const quotes = await apiRequest<Cotizacion[]>(
      '/api/quotes'
    );

    return (quotes || []).filter(
      quote => quote.id !== 'cot-001'
    );
  }

  async saveQuote(quote: Cotizacion): Promise<void> {
    // Electron
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.saveQuote(quote);
      return;
    }

    // Laravel
    await apiRequest<void>(
      '/api/quotes',
      {
        method: 'POST',
        body: JSON.stringify(quote)
      }
    );
  }

  async deleteQuote(id: string): Promise<void> {
    // Electron
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.deleteQuote(id);
      return;
    }

    // Laravel
    await apiRequest<void>(
      `/api/quotes/${encodeURIComponent(id)}`,
      {
        method: 'DELETE'
      }
    );
  }

  // ==========================================
  // MATERIALES / INSUMOS
  // ==========================================

  async getMaterials(): Promise<Insumo[]> {
    // Electron
    if (window.electronAPI?.isElectron) {
      return await window.electronAPI.getMaterials();
    }

    // Laravel
    const materials = await apiRequest<Insumo[]>(
      '/api/materials'
    );

    return materials || [];
  }

  async saveMaterial(material: Insumo): Promise<void> {
    // Electron
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.saveMaterial(material);
      return;
    }

    // Laravel
    await apiRequest<void>(
      '/api/materials',
      {
        method: 'POST',
        body: JSON.stringify(material)
      }
    );
  }

  async deleteMaterial(id: string): Promise<void> {
    // Electron
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.deleteMaterial(id);
      return;
    }

    // Laravel
    await apiRequest<void>(
      `/api/materials/${encodeURIComponent(id)}`,
      {
        method: 'DELETE'
      }
    );
  }

  // ==========================================
  // CONFIGURACIÓN DE EMPRESA
  // ==========================================

  async getConfig(): Promise<ConfiguracionEmpresa> {
    // Electron
    if (window.electronAPI?.isElectron) {
      const config = await window.electronAPI.getConfig();

      return config || DEFAULT_CONFIG;
    }

    // Laravel
    const config = await apiRequest<ConfiguracionEmpresa>(
      '/api/config'
    );

    return config || DEFAULT_CONFIG;
  }

  async saveConfig(
    config: ConfiguracionEmpresa
  ): Promise<void> {
    // Electron
    if (window.electronAPI?.isElectron) {
      await window.electronAPI.saveConfig(config);
      return;
    }

    // Laravel
    await apiRequest<void>(
      '/api/config',
      {
        method: 'POST',
        body: JSON.stringify(config)
      }
    );
  }
}

export const storageService = new StorageService();
