import { Insumo, Cotizacion, Cliente, ConfiguracionEmpresa } from '../types';
import { SEED_INSUMOS, DEFAULT_CONFIG } from '../data/seedData';

// Declaración global para la API de Electron si existe
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
      savePdfFile?: (data: { filename: string; base64Data: string }) => Promise<string | null>;
    };
  }
}

const STORAGE_KEYS = {
  QUOTES: 'conobras_quotes_v1',
  MATERIALS: 'conobras_materials_v1',
  CLIENTS: 'conobras_clients_v1',
  CONFIG: 'conobras_config_v1'
};

const getCsrfToken = (): string => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') || '' : '';
};

const defaultHeaders = () => ({
  'Content-Type': 'application/json',
  'Accept': 'application/json',
  'X-CSRF-TOKEN': getCsrfToken(),
  'X-Requested-With': 'XMLHttpRequest'
});

class StorageService {
  // --- COTIZACIONES (QUOTES) ---
  async getQuotes(): Promise<Cotizacion[]> {
    // 1. Intentar API Laravel
    try {
      const res = await fetch('/api/quotes', {
        headers: defaultHeaders()
      });
      if (res.ok) {
        const quotes: Cotizacion[] = await res.json();
        const filtered = (quotes || []).filter(q => q.id !== 'cot-001');
        localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(filtered));
        return filtered;
      }
    } catch {
      // Continuar al siguiente fallback
    }

    // 2. Intentar Electron API
    if (window.electronAPI?.getQuotes) {
      try {
        const electronQuotes = await window.electronAPI.getQuotes();
        return (electronQuotes || []).filter(q => q.id !== 'cot-001');
      } catch (e) {
        console.warn('Fallback a local storage para cotizaciones:', e);
      }
    }

    // 3. Fallback LocalStorage
    const data = localStorage.getItem(STORAGE_KEYS.QUOTES);
    if (!data) return [];
    try {
      const parsed: Cotizacion[] = JSON.parse(data);
      return parsed.filter(q => q.id !== 'cot-001');
    } catch {
      return [];
    }
  }

  async saveQuote(quote: Cotizacion): Promise<void> {
    // Sincronizar en cache local inmediatamente para UI optimista
    const localQuotes = await this.getQuotes();
    const existingIndex = localQuotes.findIndex(q => q.id === quote.id);
    if (existingIndex >= 0) {
      localQuotes[existingIndex] = { ...quote, actualizadoEn: new Date().toISOString() };
    } else {
      localQuotes.unshift({ ...quote, creadoEn: new Date().toISOString(), actualizadoEn: new Date().toISOString() });
    }
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(localQuotes));

    // 1. Guardar en API Laravel (Eloquent + SQLite)
    try {
      await fetch('/api/quotes', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(quote)
      });
    } catch (e) {
      console.warn('No se pudo sincronizar cotización con el backend Laravel:', e);
    }

    // 2. Guardar en Electron si existe
    if (window.electronAPI?.saveQuote) {
      try {
        await window.electronAPI.saveQuote(quote);
      } catch (e) {
        console.warn('Fallback a local storage para guardar cotización en Electron:', e);
      }
    }
  }

  async deleteQuote(id: string): Promise<void> {
    // Sincronizar cache local
    const localQuotes = await this.getQuotes();
    const filtered = localQuotes.filter(q => q.id !== id);
    localStorage.setItem(STORAGE_KEYS.QUOTES, JSON.stringify(filtered));

    // 1. Eliminar en API Laravel
    try {
      await fetch(`/api/quotes/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders()
      });
    } catch (e) {
      console.warn('No se pudo eliminar cotización en el backend Laravel:', e);
    }

    // 2. Eliminar en Electron
    if (window.electronAPI?.deleteQuote) {
      try {
        await window.electronAPI.deleteQuote(id);
      } catch (e) {
        console.warn('Fallback a local storage para eliminar:', e);
      }
    }
  }

  // --- MATERIALES / INSUMOS ---
  async getMaterials(): Promise<Insumo[]> {
    // 1. Intentar API Laravel
    try {
      const res = await fetch('/api/materials', {
        headers: defaultHeaders()
      });
      if (res.ok) {
        const materials: Insumo[] = await res.json();
        if (materials && materials.length > 0) {
          localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));
          return materials;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Intentar Electron API
    if (window.electronAPI?.getMaterials) {
      try {
        return await window.electronAPI.getMaterials();
      } catch (e) {
        console.warn('Fallback a local storage para insumos:', e);
      }
    }

    // 3. Fallback LocalStorage / Seeds
    const data = localStorage.getItem(STORAGE_KEYS.MATERIALS);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(SEED_INSUMOS));
      return SEED_INSUMOS;
    }
    try {
      return JSON.parse(data);
    } catch {
      return SEED_INSUMOS;
    }
  }

  async saveMaterial(material: Insumo): Promise<void> {
    // Actualizar cache local
    const materials = await this.getMaterials();
    const index = materials.findIndex(m => m.id === material.id);
    const updated = { ...material, fechaActualizacion: new Date().toISOString().split('T')[0] };
    if (index >= 0) {
      materials[index] = updated;
    } else {
      materials.unshift(updated);
    }
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(materials));

    // 1. Guardar en API Laravel
    try {
      await fetch('/api/materials', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(material)
      });
    } catch (e) {
      console.warn('No se pudo guardar insumo en el backend Laravel:', e);
    }

    // 2. Guardar en Electron
    if (window.electronAPI?.saveMaterial) {
      try {
        await window.electronAPI.saveMaterial(material);
      } catch (e) {
        console.warn('Fallback a local storage para insumos:', e);
      }
    }
  }

  async deleteMaterial(id: string): Promise<void> {
    const materials = await this.getMaterials();
    const filtered = materials.filter(m => m.id !== id);
    localStorage.setItem(STORAGE_KEYS.MATERIALS, JSON.stringify(filtered));

    // 1. Eliminar en API Laravel
    try {
      await fetch(`/api/materials/${id}`, {
        method: 'DELETE',
        headers: defaultHeaders()
      });
    } catch (e) {
      console.warn('No se pudo eliminar insumo en el backend Laravel:', e);
    }

    // 2. Eliminar en Electron
    if (window.electronAPI?.deleteMaterial) {
      try {
        await window.electronAPI.deleteMaterial(id);
      } catch (e) {
        console.warn('Fallback a local storage para eliminar insumo:', e);
      }
    }
  }

  // --- CONFIGURACIÓN DE EMPRESA ---
  async getConfig(): Promise<ConfiguracionEmpresa> {
    // 1. Intentar API Laravel
    try {
      const res = await fetch('/api/config', {
        headers: defaultHeaders()
      });
      if (res.ok) {
        const config: ConfiguracionEmpresa = await res.json();
        if (config && config.nombreEmpresa) {
          localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
          return config;
        }
      }
    } catch {
      // Fallback
    }

    // 2. Intentar Electron API
    if (window.electronAPI?.getConfig) {
      try {
        const conf = await window.electronAPI.getConfig();
        if (conf && conf.nombreEmpresa) {
          return conf;
        }
      } catch (e) {
        console.warn('Fallback a local storage para configuración:', e);
      }
    }

    // 3. Fallback LocalStorage / Default
    const data = localStorage.getItem(STORAGE_KEYS.CONFIG);
    if (!data) {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(DEFAULT_CONFIG));
      return DEFAULT_CONFIG;
    }
    try {
      const parsed = JSON.parse(data);
      return (parsed && parsed.nombreEmpresa) ? parsed : DEFAULT_CONFIG;
    } catch {
      return DEFAULT_CONFIG;
    }
  }

  async saveConfig(config: ConfiguracionEmpresa): Promise<void> {
    localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));

    // 1. Guardar en API Laravel
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(config)
      });
    } catch (e) {
      console.warn('No se pudo guardar la configuración en backend Laravel:', e);
    }

    // 2. Guardar en Electron
    if (window.electronAPI?.saveConfig) {
      try {
        await window.electronAPI.saveConfig(config);
      } catch (e) {
        console.warn('Fallback a local storage para configuración:', e);
      }
    }
  }
}

export const storageService = new StorageService();
