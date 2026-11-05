export type InsumoCategoria = 'TODO_COSTO' | 'MATERIAL' | 'MANO_DE_OBRA' | 'EQUIPO' | 'SUBCONTRATO';
export const UNIDADES_VALIDAS = ['m2', 'm3', 'ml', 'kg', 'gl', 'vj', 'un'] as const;
export type MedidaUnidad = typeof UNIDADES_VALIDAS[number];

export interface Insumo {
  id: string;
  codigo: string;
  descripcion: string;
  categoria: InsumoCategoria;
  unidad: string; // m2, ml, m3, kg, pza, glb, jor, etc.
  precioUnitario: number;
  fechaActualizacion: string;
}

export interface ItemPartida {
  id: string;
  insumoId?: string;
  descripcion: string;
  categoria: InsumoCategoria;
  unidad: string;
  cantidad: number;
  precioUnitario: number;
}

export interface Partida {
  id: string;
  titulo: string;
  items: ItemPartida[];
}

export type ModoCalculoPresupuesto = 'DESGLOSADO' | 'SIMPLIFICADO';

export interface CalculosPresupuesto {
  partidasCalculadas: Array<Partida & { subtotal: number }>;
  costoDirectoTotal: number;
  
  // Modo 1: Desglosado (AIU Detallado)
  porcentajeAdministracion: number;
  montoAdministracion: number;
  porcentajeImprevistos: number;
  montoImprevistos: number;
  porcentajeUtilidad: number;
  montoUtilidad: number;
  subtotalAiuDesglosado: number;
  
  // Modo 2: Simplificado (AIU Global)
  porcentajeAiuGlobal: number;
  montoAiuGlobal: number;
  subtotalConAiuSimplificado: number;
  
  // IVA y Base
  aplicaIva: boolean;
  porcentajeIva: number;
  baseIva: number;
  montoIva: number;
  
  // Total consolidado y modo activo
  totalFinal: number;
  modoCalculo: ModoCalculoPresupuesto;

  // Campos de compatibilidad histórica
  montoGastosGenerales: number;
  subtotalOperativo: number;
  montoHonorarios: number;
  subtotalAntesIva: number;
}

export type EstadoCotizacion = 'BORRADOR' | 'PRESENTADA' | 'APROBADA' | 'RECHAZADA';

export interface Cotizacion {
  id: string;
  codigo: string;
  cliente: string;
  telefono: string;
  email: string;
  proyecto: string;
  ubicacion: string;
  fecha: string;
  validezDias: number;
  moneda: string;
  
  // Modalidad de cálculo
  modoCalculo?: ModoCalculoPresupuesto;

  // Parámetros porcentuales Modo Desglosado
  porcentajeAdministracion?: number; // Administración (A)
  porcentajeImprevistos: number; // Imprevistos (I)
  porcentajeGastosGenerales: number; // Compatibilidad con Administración (A)
  porcentajeHonorarios: number; // Utilidad (U) / Honorarios

  // Parámetros porcentuales Modo Simplificado
  porcentajeAiuGlobal?: number; // AIU Global (%)
  
  // Impuestos
  aplicaIva: boolean;
  porcentajeIva: number;
  
  partidas: Partida[];
  notas: string;
  estado: EstadoCotizacion;
  creadoEn: string;
  actualizadoEn: string;
}

export interface Cliente {
  id: string;
  nombre: string;
  empresa?: string;
  telefono?: string;
  email?: string;
  direccion?: string;
  notas?: string;
}

export interface ConfiguracionEmpresa {
  nombreEmpresa: string;
  eslogan: string;
  arquitecto: string;
  especialidad?: string;
  cedulaProfesional?: string;
  telefono: string;
  email: string;
  direccion: string;
  sitioWeb?: string;
  monedaSimbolo: string;
  modoCalculoDefault?: ModoCalculoPresupuesto;
  porcentajeAdministracionDefault?: number;
  porcentajeImprevistosDefault: number;
  porcentajeGastosGeneralesDefault: number;
  porcentajeHonorariosDefault: number;
  porcentajeAiuGlobalDefault?: number;
  porcentajeIvaDefault: number;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  avatar?: string;
  token?: string;
  created_at?: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  password_confirmation?: string;
  phone?: string;
  role?: string;
  company?: string;
}

export interface LoginData {
  email: string;
  password: string;
  remember?: boolean;
}

export interface UpdateProfileData {
  name: string;
  email: string;
  phone?: string;
  role?: string;
  company?: string;
  current_password?: string;
  new_password?: string;
  new_password_confirmation?: string;
}

export interface ResetPasswordData {
  email: string;
  token: string;
  password: string;
  password_confirmation?: string;
}
