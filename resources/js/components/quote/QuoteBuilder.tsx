import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Building2, 
  Plus, 
  Trash2, 
  FileText, 
  Download, 
  Save, 
  MapPin, 
  User, 
  Calendar, 
  Layers, 
  Check, 
  Sparkles,
  BookOpen,
  DollarSign,
  Phone,
  Mail,
  Edit3,
  SlidersHorizontal,
  Calculator
} from 'lucide-react';
import { 
  Cotizacion, 
  Partida, 
  ItemPartida, 
  Insumo, 
  InsumoCategoria, 
  ConfiguracionEmpresa,
  EstadoCotizacion,
  ModoCalculoPresupuesto,
  CalculosPresupuesto,
  UNIDADES_VALIDAS
} from '../../types';
import { storageService } from '../../services/storageService';
import { TiltCard } from '../common/TiltCard';
import { InteractiveButton } from '../common/InteractiveButton';
import { AnimatedCounter } from '../common/AnimatedCounter';

// Componente numérico de alta precisión para evitar bloqueos al borrar o escribir decimales
interface NumericInputProps {
  value: number;
  onChange: (val: number) => void;
  className?: string;
  placeholder?: string;
  min?: number;
}

const NumericInput: React.FC<NumericInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = '0',
  min = 0
}) => {
  const [text, setText] = useState<string>(value !== undefined && value !== null ? String(value) : '');
  const isFocusedRef = useRef(false);

  useEffect(() => {
    if (!isFocusedRef.current) {
      setText(value !== undefined && value !== null ? String(value) : '');
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Permitir dígitos, un punto decimal o vacío
    if (/^[0-9]*\.?[0-9]*$/.test(val) || val === '') {
      setText(val);
      const parsed = parseFloat(val);
      if (!isNaN(parsed)) {
        onChange(parsed);
      } else if (val === '') {
        onChange(0);
      }
    }
  };

  const handleBlur = () => {
    isFocusedRef.current = false;
    const parsed = parseFloat(text);
    if (isNaN(parsed) || text.trim() === '') {
      setText('0');
      onChange(0);
    } else {
      setText(String(parsed));
      onChange(parsed);
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={text}
      onFocus={() => { isFocusedRef.current = true; }}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
};

interface QuoteBuilderProps {
  currentQuote: Cotizacion;
  config: ConfiguracionEmpresa;
  materials: Insumo[];
  onQuoteSaved: () => void;
  onOpenPdf: (quote: Cotizacion) => void;
  onUpdateCurrentQuote?: (quote: Cotizacion) => void;
}

export const QuoteBuilder: React.FC<QuoteBuilderProps> = ({
  currentQuote,
  config,
  materials,
  onQuoteSaved,
  onOpenPdf,
  onUpdateCurrentQuote
}) => {
  const [quote, setQuote] = useState<Cotizacion>(currentQuote);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  // Selector rápido de insumos desde catálogo
  const [activeCatalogPicker, setActiveCatalogPicker] = useState<{
    partidaId: string;
    itemId: string;
  } | null>(null);
  const [catalogSearch, setCatalogSearch] = useState('');

  // Sincronizar cuando cambia la cotización externa (ej. al abrir otra del historial o editar la misma)
  useEffect(() => {
    if (currentQuote) {
      setQuote(currentQuote);
    }
  }, [currentQuote.id, currentQuote.actualizadoEn]);

  // Notificar al componente superior cuando cambie localmente
  const updateQuote = (newQuote: Cotizacion) => {
    setQuote(newQuote);
    if (onUpdateCurrentQuote) {
      onUpdateCurrentQuote(newQuote);
    }
  };

  // Cálculos matemáticos en tiempo real
  const calculos: CalculosPresupuesto = useMemo(() => {
    const partidas = Array.isArray(quote?.partidas) ? quote.partidas : [];
    const partidasCalculadas = partidas.map(p => {
      const items = Array.isArray(p?.items) ? p.items : [];
      const subtotal = items.reduce((sum, item) => sum + (Number(item?.cantidad || 0) * Number(item?.precioUnitario || 0)), 0);
      return { ...p, items, subtotal };
    });

    const costoDirectoTotal = partidasCalculadas.reduce((sum, p) => sum + p.subtotal, 0);
    const modoCalculo: ModoCalculoPresupuesto = quote?.modoCalculo || 'DESGLOSADO';

    // Porcentajes para Modo 1: Desglosado (AIU Detallado)
    const porcentajeAdministracion = Number(quote?.porcentajeAdministracion ?? quote?.porcentajeGastosGenerales ?? 8);
    const porcentajeImprevistos = Number(quote?.porcentajeImprevistos ?? 5);
    const porcentajeUtilidad = Number(quote?.porcentajeHonorarios ?? 15);

    // Cálculos monetarios Modo 1 (Calculados sobre el Costo Directo Total)
    const montoAdministracion = costoDirectoTotal * (porcentajeAdministracion / 100);
    const montoImprevistos = costoDirectoTotal * (porcentajeImprevistos / 100);
    const montoUtilidad = costoDirectoTotal * (porcentajeUtilidad / 100);
    const subtotalAiuDesglosado = montoAdministracion + montoImprevistos + montoUtilidad;

    // Porcentaje y monto para Modo 2: Simplificado (AIU Global tradicional)
    const defaultAiuGlobal = porcentajeAdministracion + porcentajeImprevistos + porcentajeUtilidad;
    const porcentajeAiuGlobal = Number(quote?.porcentajeAiuGlobal !== undefined ? quote.porcentajeAiuGlobal : defaultAiuGlobal);
    const montoAiuGlobal = costoDirectoTotal * (porcentajeAiuGlobal / 100);
    const subtotalConAiuSimplificado = costoDirectoTotal + montoAiuGlobal;

    // Parámetros de IVA
    const aplicaIva = Boolean(quote?.aplicaIva);
    const porcentajeIva = Number(quote?.porcentajeIva !== undefined ? quote.porcentajeIva : 19);

    let baseIva = 0;
    let montoIva = 0;
    let totalFinal = 0;

    if (modoCalculo === 'DESGLOSADO') {
      // Requerimiento Modo 1: El IVA se calcula ÚNICAMENTE sobre la Utilidad (U)
      baseIva = montoUtilidad;
      montoIva = aplicaIva ? baseIva * (porcentajeIva / 100) : 0;
      // Inversión Total: Costo Directo + Administración + Imprevistos + Utilidad + IVA sobre Utilidad
      totalFinal = costoDirectoTotal + montoAdministracion + montoImprevistos + montoUtilidad + montoIva;
    } else {
      // Requerimiento Modo 2: Simplificado (IVA calculado sobre la Base Gravable: Utilidad)
      baseIva = montoAiuGlobal;
      montoIva = aplicaIva ? baseIva * (porcentajeIva / 100) : 0;
      // Inversión Total: Subtotal + Utilidad + IVA sobre Base Gravable
      totalFinal = subtotalConAiuSimplificado + montoIva;
    }

    // Campos de retrocompatibilidad
    const subtotalOperativo = costoDirectoTotal + montoImprevistos + montoAdministracion;
    const montoHonorarios = montoUtilidad;
    const subtotalAntesIva = modoCalculo === 'DESGLOSADO' 
      ? (costoDirectoTotal + subtotalAiuDesglosado)
      : subtotalConAiuSimplificado;

    return {
      partidasCalculadas,
      costoDirectoTotal,
      porcentajeAdministracion,
      montoAdministracion,
      porcentajeImprevistos,
      montoImprevistos,
      porcentajeUtilidad,
      montoUtilidad,
      subtotalAiuDesglosado,
      porcentajeAiuGlobal,
      montoAiuGlobal,
      subtotalConAiuSimplificado,
      aplicaIva,
      porcentajeIva,
      baseIva,
      montoIva,
      totalFinal,
      modoCalculo,
      montoGastosGenerales: montoAdministracion,
      subtotalOperativo,
      montoHonorarios,
      subtotalAntesIva
    };
  }, [quote]);

  // Guardar cotización mediante el servicio de almacenamiento
  const handleSave = async () => {
    try {
      await storageService.saveQuote(quote);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      onQuoteSaved();
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
      alert(
        error instanceof Error
          ? error.message
          : 'No se pudo guardar la cotización.'
      );
    }
  };

  // Manipulación de Partidas
  const handleAddPartida = () => {
    const newPartida: Partida = {
      id: `partida-${Date.now()}`,
      titulo: `${quote.partidas.length + 1}. PARTIDA DE OBRA`,
      items: []
    };
    updateQuote({ ...quote, partidas: [...quote.partidas, newPartida] });
  };

  const handleRemovePartida = (partidaId: string) => {
    updateQuote({
      ...quote,
      partidas: quote.partidas.filter(p => p.id !== partidaId)
    });
  };

  const handleUpdatePartidaTitulo = (partidaId: string, titulo: string) => {
    updateQuote({
      ...quote,
      partidas: quote.partidas.map(p => p.id === partidaId ? { ...p, titulo } : p)
    });
  };

  // Manipulación de Ítems
  const handleAddItem = (partidaId: string) => {
    const newItem: ItemPartida = {
      id: `item-${Date.now()}`,
      descripcion: '',
      categoria: 'TODO_COSTO',
      unidad: 'm2',
      cantidad: 1,
      precioUnitario: 0
    };
    updateQuote({
      ...quote,
      partidas: quote.partidas.map(p => {
        if (p.id === partidaId) {
          return { ...p, items: [...p.items, newItem] };
        }
        return p;
      })
    });
  };

  const handleUpdateItem = (partidaId: string, itemId: string, field: keyof ItemPartida, value: any) => {
    updateQuote({
      ...quote,
      partidas: quote.partidas.map(p => {
        if (p.id === partidaId) {
          return {
            ...p,
            items: p.items.map(item => {
              if (item.id === itemId) {
                return { ...item, [field]: value };
              }
              return item;
            })
          };
        }
        return p;
      })
    });
  };

  const handleRemoveItem = (partidaId: string, itemId: string) => {
    updateQuote({
      ...quote,
      partidas: quote.partidas.map(p => {
        if (p.id === partidaId) {
          return { ...p, items: p.items.filter(i => i.id !== itemId) };
        }
        return p;
      })
    });
  };

  // Selección de Insumo desde el catálogo preexistente
  const handleSelectFromCatalog = (insumo: Insumo) => {
    if (!activeCatalogPicker) return;
    const { partidaId, itemId } = activeCatalogPicker;

    updateQuote({
      ...quote,
      partidas: quote.partidas.map(p => {
        if (p.id === partidaId) {
          return {
            ...p,
            items: p.items.map(item => {
              if (item.id === itemId) {
                return {
                  ...item,
                  insumoId: insumo.id,
                  descripcion: insumo.descripcion,
                  categoria: insumo.categoria,
                  unidad: insumo.unidad,
                  precioUnitario: insumo.precioUnitario
                };
              }
              return item;
            })
          };
        }
        return p;
      })
    });

    setActiveCatalogPicker(null);
    setCatalogSearch('');
  };

  const filteredCatalog = (materials || []).filter(m => 
    (m?.descripcion || '').toLowerCase().includes(catalogSearch.toLowerCase()) ||
    (m?.codigo || '').toLowerCase().includes(catalogSearch.toLowerCase())
  );

  const formatMoneda = (valor: number) => {
    return `${quote.moneda} ${valor.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6">
      
      {/* BARRA SUPERIOR: BRANDING, ESTADO Y ACCIONES PRINCIPALES */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-5 rounded-2xl bg-white border border-[#C5CAD2] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex items-center justify-center shrink-0">
            <img 
              src="./assets/conobras-icon.png" 
              alt="conobras" 
              className="h-14 w-auto max-w-[110px] object-contain filter drop-shadow-[0_2px_8px_rgba(250,202,20,0.35)] hover:scale-105 transition-transform"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-[#111622] uppercase tracking-wider">
                Presupuesto y Cómputo Métrico
              </h2>
              <select
                value={quote.estado}
                onChange={(e) => updateQuote({ ...quote, estado: e.target.value as EstadoCotizacion })}
                className="bg-[#F5F6F9] text-[11px] font-mono font-bold text-[#9E7A18] border border-[#D4AF37]/50 rounded px-2.5 py-1 focus:outline-none focus:ring-1 focus:ring-[#D4AF37]"
              >
                <option value="BORRADOR">BORRADOR</option>
                <option value="PRESENTADA">PRESENTADA</option>
                <option value="APROBADA">APROBADA</option>
                <option value="RECHAZADA">RECHAZADA</option>
              </select>
            </div>
            <p className="text-xs text-[#586274]">
              Haz clic en cualquier campo para editar textos, conceptos y precios unitarios
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {saveSuccess && (
            <div className="flex items-center gap-1.5 text-xs text-[#15803D] bg-[#DCFCE7] px-3 py-1.5 rounded-lg border border-[#16A34A]/30 animate-in fade-in">
              <Check size={14} />
              <span>Guardado Correctamente</span>
            </div>
          )}

          <InteractiveButton
            variant="glass"
            size="md"
            onClick={handleSave}
            icon={<Save size={15} className="text-[#9E7A18]" />}
          >
            Guardar Cotización
          </InteractiveButton>

          <InteractiveButton
            variant="gold"
            size="md"
            shimmer={true}
            glow={true}
            onClick={() => onOpenPdf(quote)}
            icon={<Download size={15} />}
          >
            Propuesta Institucional / PDF
          </InteractiveButton>
        </div>
      </div>

      {/* METADATOS DEL PROYECTO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Proyecto & Ubicación */}
        <div className="h-full p-5 rounded-2xl bg-white border border-[#C5CAD2] space-y-3 hover:border-[#D4AF37]/50 transition-colors shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E7A18]">
            <Building2 size={14} />
            <span>Obra & Ubicación</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#586274] block mb-1">Nombre del Proyecto</label>
              <input 
                type="text" 
                value={quote.proyecto || ''} 
                onChange={(e) => updateQuote({ ...quote, proyecto: e.target.value })}
                className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 transition-all select-text"
                placeholder="Ej. Casa Habitación Santa Fe"
              />
            </div>
            <div>
              <label className="text-[11px] text-[#586274] block mb-1">Ubicación de Obra</label>
              <div className="relative">
                <MapPin size={13} className="absolute left-3 top-2.5 text-[#586274] pointer-events-none" />
                <input 
                  type="text" 
                  value={quote.ubicacion || ''} 
                  onChange={(e) => updateQuote({ ...quote, ubicacion: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg pl-8 pr-3 py-2 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 transition-all select-text"
                  placeholder="Dirección, lote o municipio"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Cliente & Contacto */}
        <div className="h-full p-5 rounded-2xl bg-white border border-[#C5CAD2] space-y-3 hover:border-[#D4AF37]/50 transition-colors shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E7A18]">
            <User size={14} />
            <span>Cliente</span>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-[11px] text-[#586274] block mb-1">Cliente / Propietario</label>
              <input 
                type="text" 
                value={quote.cliente || ''} 
                onChange={(e) => updateQuote({ ...quote, cliente: e.target.value })}
                className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 transition-all select-text"
                placeholder="Nombre del cliente o empresa"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-[#586274] block mb-1">Teléfono / WhatsApp</label>
                <input 
                  type="text" 
                  value={quote.telefono || ''} 
                  onChange={(e) => updateQuote({ ...quote, telefono: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 transition-all select-text"
                  placeholder="+52 ..."
                />
              </div>
              <div>
                <label className="text-[11px] text-[#586274] block mb-1">Correo Electrónico</label>
                <input 
                  type="email" 
                  value={quote.email || ''} 
                  onChange={(e) => updateQuote({ ...quote, email: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 transition-all select-text"
                  placeholder="cliente@correo.com"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Emisión y Moneda */}
        <div className="h-full p-5 rounded-2xl bg-white border border-[#C5CAD2] space-y-3 hover:border-[#D4AF37]/50 transition-colors shadow-sm">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E7A18]">
            <Calendar size={14} />
            <span>Condiciones de Emisión</span>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[11px] text-[#586274] block mb-1">Folio Cotización</label>
                <input 
                  type="text" 
                  value={quote.codigo || ''} 
                  onChange={(e) => updateQuote({ ...quote, codigo: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs font-mono text-[#9E7A18] font-bold focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 select-text"
                />
              </div>
              <div>
                <label className="text-[11px] text-[#586274] block mb-1">Moneda</label>
                <select 
                  value={quote.moneda}
                  onChange={(e) => updateQuote({ ...quote, moneda: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40"
                >
                  <option value="$">$ (Pesos / Dólares)</option>
                  <option value="USD $">USD $</option>
                  <option value="€">EUR €</option>
                  <option value="COP $">COP $</option>
                </select>
              </div>
            </div>
            <div>
              <label className="text-[11px] text-[#586274] block mb-1">Fecha Emisión</label>
              <input 
                type="date" 
                value={quote.fecha || ''} 
                onChange={(e) => updateQuote({ ...quote, fecha: e.target.value })}
                className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] focus:outline-none focus:ring-1 focus:ring-[#D4AF37]/40 select-text"
              />
            </div>
          </div>
        </div>
      </div>

      {/* PARTIDAS DE OBRA */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Layers size={18} className="text-[#9E7A18]" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-[#111622]">
              Partidas y Desglose de Costo Directo
            </h3>
          </div>
          <InteractiveButton
            variant="glass"
            size="sm"
            onClick={handleAddPartida}
            icon={<Plus size={14} className="text-[#9E7A18]" />}
          >
            Añadir Partida
          </InteractiveButton>
        </div>

        {calculos.partidasCalculadas.length === 0 ? (
          <div className="p-10 rounded-2xl bg-white border border-dashed border-[#C5CAD2] text-center flex flex-col items-center justify-center space-y-4 shadow-sm">
            <div className="h-14 w-14 rounded-full bg-[#F5F6F9] border border-[#D4AF37]/40 flex items-center justify-center text-[#AA8820]">
              <Layers size={24} />
            </div>
            <div className="max-w-md">
              <h4 className="text-sm font-semibold text-[#111622] mb-1">Cotización lista para comenzar</h4>
              <p className="text-xs text-[#586274] leading-relaxed">
                No hay partidas registradas en este presupuesto. Agrega tu primera partida para comenzar a desglosar conceptos y cómputos métricos a tu gusto.
              </p>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddPartida}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA8820] hover:from-[#E6C65A] hover:to-[#D4AF37] text-[#111622] font-semibold text-xs shadow-md shadow-[#D4AF37]/20 transition-all active:scale-95 cursor-pointer"
              >
                <Plus size={15} />
                <span>Añadir Primera Partida</span>
              </button>
            </div>
          </div>
        ) : (
          calculos.partidasCalculadas.map((partida, partidaIdx) => (
          <div 
            key={partida.id} 
            className="rounded-2xl bg-white border border-[#C5CAD2] overflow-hidden shadow-sm"
          >
            {/* Header de Partida */}
            <div className="flex items-center justify-between bg-[#EEF1F5] px-5 py-3 border-b border-[#C5CAD2]">
              <div className="flex-1 mr-4">
                <input 
                  type="text" 
                  value={partida.titulo} 
                  placeholder="Título de la partida (ej. 1. TRABAJOS PRELIMINARES)"
                  onChange={(e) => handleUpdatePartidaTitulo(partida.id, e.target.value)}
                  className="w-full bg-transparent font-bold text-xs uppercase tracking-wider text-[#111622] placeholder-[#8E99A8] focus:outline-none focus:bg-white px-2 py-1 rounded transition-colors"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <span className="text-[10px] text-[#586274] uppercase tracking-wider block font-semibold">Subtotal Partida</span>
                  <span className="text-xs font-mono font-bold text-[#AA8820]">
                    {formatMoneda(partida.subtotal)}
                  </span>
                </div>
                <button 
                  onClick={() => handleRemovePartida(partida.id)}
                  className="p-1 text-[#586274] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                  title="Eliminar Partida"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>

            {/* Tabla de Conceptos */}
            <div className="p-4 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-[#586274] uppercase border-b border-[#C5CAD2] pb-2 font-semibold">
                    <th className="pb-2 w-12 font-mono">#</th>
                    <th className="pb-2">Concepto / Insumo</th>
                    <th className="pb-2 w-32">Tipo</th>
                    <th className="pb-2 w-20 text-center">Unidad</th>
                    <th className="pb-2 w-24 text-right">Cantidad</th>
                    <th className="pb-2 w-28 text-right">P. Unitario</th>
                    <th className="pb-2 w-32 text-right">Importe</th>
                    <th className="pb-2 w-16 text-center">APU'S</th>
                    <th className="pb-2 w-8"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E2E6EB]">
                  {partida.items.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-7 text-center text-[#586274]">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <span className="text-xs">Esta partida no tiene conceptos aún.</span>
                            <button
                              type="button"
                              onClick={() => handleAddItem(partida.id)}
                              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#F5F6F9] hover:bg-[#EEF1F5] text-[#9E7A18] border border-[#D4AF37]/40 text-xs font-semibold transition-all cursor-pointer shadow-sm"
                            >
                              <Plus size={13} />
                              <span>Agregar Concepto</span>
                            </button>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    partida.items.map((item, itemIdx) => {
                    const importe = Number(item.cantidad || 0) * Number(item.precioUnitario || 0);
                    return (
                      <tr key={item.id} className="hover:bg-[#F8F9FA] transition-colors">
                        <td className="py-2.5 text-[#586274] font-mono text-[11px] font-semibold">{partidaIdx + 1}.{itemIdx + 1}</td>
                        <td className="py-2.5 pr-2">
                          <input 
                            type="text" 
                            value={item.descripcion}
                            onChange={(e) => handleUpdateItem(partida.id, item.id, 'descripcion', e.target.value)}
                            placeholder="Descripción del concepto de obra..."
                            className="w-full bg-[#F8F9FA] hover:bg-white focus:bg-white text-[#111622] border border-[#E2E6EB] focus:border-[#D4AF37] focus:outline-none px-2.5 py-1.5 rounded text-xs transition-colors"
                          />
                        </td>
                        <td className="py-2.5 pr-2">
                          <select 
                            value="TODO_COSTO"
                            onChange={(e) => handleUpdateItem(partida.id, item.id, 'categoria', e.target.value as InsumoCategoria)}
                            className="w-full bg-[#F8F9FA] border border-[#C8CDD5] text-[11px] rounded px-2 py-1.5 text-[#111622] font-semibold focus:outline-none focus:border-[#D4AF37]"
                          >
                            <option value="TODO_COSTO">Todo costo</option>
                          </select>
                        </td>
                        <td className="py-2.5 pr-2 text-center">
                          <select 
                            value={item.unidad || 'm2'}
                            onChange={(e) => handleUpdateItem(partida.id, item.id, 'unidad', e.target.value)}
                            className="w-16 bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded px-1.5 py-1.5 text-center font-mono text-[11px] text-[#111622] focus:outline-none cursor-pointer"
                          >
                            {!UNIDADES_VALIDAS.includes(item.unidad as any) && item.unidad && (
                              <option value={item.unidad}>{item.unidad}</option>
                            )}
                            {UNIDADES_VALIDAS.map((u) => (
                              <option key={u} value={u}>{u}</option>
                            ))}
                          </select>
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <NumericInput 
                            value={item.cantidad}
                            onChange={(val) => handleUpdateItem(partida.id, item.id, 'cantidad', val)}
                            className="w-20 bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded px-2 py-1.5 text-right font-mono text-[11px] text-[#111622] focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 pr-2 text-right">
                          <NumericInput 
                            value={item.precioUnitario}
                            onChange={(val) => handleUpdateItem(partida.id, item.id, 'precioUnitario', val)}
                            className="w-24 bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded px-2 py-1.5 text-right font-mono text-[11px] text-[#AA8820] font-bold focus:outline-none"
                          />
                        </td>
                        <td className="py-2.5 text-right font-mono font-semibold text-[#111622] text-[11px]">
                          {formatMoneda(importe)}
                        </td>
                        <td className="py-2.5 text-center">
                          <button
                            type="button"
                            onClick={() => setActiveCatalogPicker({ partidaId: partida.id, itemId: item.id })}
                            title="Seleccionar insumo desde base de APU'S preexistente"
                            className="p-1.5 text-[#9E7A18] hover:bg-[#D4AF37]/15 rounded transition-colors cursor-pointer"
                          >
                            <BookOpen size={14} />
                          </button>
                        </td>
                        <td className="py-2.5 text-center">
                          <button 
                            onClick={() => handleRemoveItem(partida.id, item.id)}
                            className="p-1.5 text-[#586274] hover:text-red-600 hover:bg-red-50 rounded transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
                </tbody>
              </table>

              <div className="mt-3 pt-3 border-t border-[#E2E6EB] flex justify-between items-center">
                <button 
                  onClick={() => handleAddItem(partida.id)}
                  className="flex items-center gap-1.5 text-xs text-[#586274] hover:text-[#AA8820] transition-colors py-1 px-2.5 rounded hover:bg-[#EEF1F5] font-semibold cursor-pointer"
                >
                  <Plus size={13} />
                  <span>Agregar Concepto</span>
                </button>
              </div>
            </div>
          </div>
        ))
      )}
      </div>

      {/* LIQUIDACIÓN DE COSTOS, INDIRECTOS Y HONORARIOS CON PERSPECTIVA 3D */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pt-2">
        {/* Términos de pago y condiciones */}
        <div className="lg:col-span-5 h-full">
          <TiltCard maxTilt={5} className="h-full">
            <div className="h-full p-6 rounded-2xl bg-white border border-[#C5CAD2] flex flex-col justify-between shadow-sm hover:border-[#D4AF37]/50 transition-colors">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#9E7A18] mb-3">
                  <FileText size={14} />
                  <span>Condiciones Comerciales & Esquema de Pago</span>
                </div>
                <textarea 
                  rows={8}
                  value={quote.notas}
                  onChange={(e) => updateQuote({ ...quote, notas: e.target.value })}
                  className="w-full bg-[#F8F9FA] border border-[#C8CDD5] focus:border-[#D4AF37] rounded-xl p-3 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none resize-none leading-relaxed transition-all"
                  placeholder="Especifica anticipos, estimaciones por avance de obra, exclusiones o condiciones técnicas..."
                />
              </div>
              <div className="mt-4 p-3 rounded-xl bg-[#F5F6F9] border border-[#C5CAD2] flex items-center gap-3">
                <Sparkles size={16} className="text-[#9E7A18] shrink-0" />
                <p className="text-[11px] text-[#586274] leading-tight">
                  {(quote.modoCalculo || 'DESGLOSADO') === 'DESGLOSADO' 
                    ? 'Modalidad Desglosada: AIU sobre Costo Directo con IVA aplicado exclusivamente sobre la Utilidad pactada.'
                    : 'Modalidad Simplificada: Costo Directo + Utilidad (base gravable) con IVA general sobre el total.'}
                </p>
              </div>
            </div>
          </TiltCard>
        </div>

        {/* Liquidación Matemática con Selector de Modalidad */}
        <div className="lg:col-span-7 h-full">
          <TiltCard maxTilt={5} className="h-full">
            <div className="h-full p-6 rounded-2xl bg-white border border-[#D4AF37]/40 shadow-md space-y-4 hover:border-[#D4AF37] transition-colors">
              
              {/* Encabezado y Selector de Modalidad */}
              <div className="border-b border-[#C5CAD2] pb-3 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#9E7A18] flex items-center gap-1.5">
                    <Calculator size={15} className="text-[#9E7A18]" />
                    <span>Liquidación del Presupuesto de Obra</span>
                  </h3>
                  <span className="font-mono text-[10px] text-[#586274] font-semibold bg-[#F5F6F9] border border-[#D8DCE3] px-2 py-0.5 rounded-full">
                    {(quote.modoCalculo || 'DESGLOSADO') === 'DESGLOSADO' ? 'MODO 1: DESGLOSADO' : 'MODO 2: SIMPLIFICADO'}
                  </span>
                </div>

                {/* Selector Principal de Modalidad de Cálculo */}
                <div className="grid grid-cols-2 gap-2 bg-[#F1F3F7] p-1.5 rounded-xl border border-[#D9DFE7]">
                  <button
                    type="button"
                    onClick={() => updateQuote({ ...quote, modoCalculo: 'DESGLOSADO' })}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all cursor-pointer ${
                      (quote.modoCalculo || 'DESGLOSADO') === 'DESGLOSADO'
                        ? 'bg-white text-[#111622] shadow-sm border border-[#C5CAD2] ring-1 ring-[#D4AF37]/50'
                        : 'text-[#677489] hover:text-[#111622] hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <Layers size={14} className={(quote.modoCalculo || 'DESGLOSADO') === 'DESGLOSADO' ? 'text-[#9E7A18]' : ''} />
                      <span>Modo 1: Desglosado</span>
                    </div>
                    <span className="text-[10px] text-[#586274] mt-0.5 font-medium">
                      AIU Detallado + IVA en Utilidad
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => updateQuote({ 
                      ...quote, 
                      modoCalculo: 'SIMPLIFICADO',
                      porcentajeAiuGlobal: quote.porcentajeAiuGlobal ?? (calculos.porcentajeAdministracion + calculos.porcentajeImprevistos + calculos.porcentajeUtilidad)
                    })}
                    className={`flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all cursor-pointer ${
                      quote.modoCalculo === 'SIMPLIFICADO'
                        ? 'bg-white text-[#111622] shadow-sm border border-[#C5CAD2] ring-1 ring-[#D4AF37]/50'
                        : 'text-[#677489] hover:text-[#111622] hover:bg-white/50'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-xs font-bold">
                      <SlidersHorizontal size={14} className={quote.modoCalculo === 'SIMPLIFICADO' ? 'text-[#9E7A18]' : ''} />
                      <span>Modo 2: Simplificado</span>
                    </div>
                    <span className="text-[10px] text-[#586274] mt-0.5 font-medium">
                      Subtotal + IVA
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                {/* Costo Directo Total (común a ambos modos) */}
                <div className="flex justify-between items-center text-[#586274] bg-[#F8F9FA] p-2.5 rounded-xl border border-[#C8CDD5]/70">
                  <div>
                    <span className="font-semibold text-[#111622] block">
                      Subtotal
                    </span>
                    <span className="text-[10px] text-[#7E8B9E]">Mano de Obra + Materiales + Equipos</span>
                  </div>
                  <AnimatedCounter 
                    value={calculos.costoDirectoTotal} 
                    prefix={`${quote.moneda} `} 
                    className="font-mono font-bold text-sm text-[#111622]" 
                  />
                </div>

                {/* CONTENIDO SEGÚN LA MODALIDAD SELECCIONADA */}
                {(quote.modoCalculo || 'DESGLOSADO') === 'DESGLOSADO' ? (
                  /* ====== MODO 1: DESGLOSADO ====== */
                  <div className="space-y-2.5">
                    {/* Bloque AIU Detallado */}
                    <div className="p-3 bg-[#FCFCFD] border border-[#E0E4EC] rounded-xl space-y-2.5 shadow-2xs">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#586274] border-b border-[#E8ECF2] pb-1.5">
                        <span className="flex items-center gap-1 text-[#9E7A18]">
                          <Layers size={13} />
                          Componentes del AIU (Calculados s/ Costo Directo)
                        </span>
                        <span className="font-mono text-[10px] bg-[#EFEFEF] px-1.5 py-0.5 rounded text-[#111622]">
                          AIU Total: {(calculos.porcentajeAdministracion + calculos.porcentajeImprevistos + calculos.porcentajeUtilidad).toFixed(1)}%
                        </span>
                      </div>

                      {/* Administración (A) */}
                      <div className="flex justify-between items-center text-[#586274]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#EEF1F5] font-bold text-[10px] text-[#111622]">A</span>
                          <span>Administración</span>
                          <div className="flex items-center bg-white border border-[#C8CDD5] focus-within:border-[#D4AF37] rounded-lg px-2 py-0.5 shadow-2xs">
                            <NumericInput 
                              value={quote.porcentajeAdministracion ?? quote.porcentajeGastosGenerales ?? 8}
                              onChange={(val) => updateQuote({ ...quote, porcentajeAdministracion: val, porcentajeGastosGenerales: val })}
                              className="w-12 bg-transparent text-right font-mono text-[11px] text-[#111622] focus:outline-none"
                            />
                            <span className="text-[10px] text-[#586274] ml-1 font-semibold">%</span>
                          </div>
                        </div>
                        <AnimatedCounter 
                          value={calculos.montoAdministracion} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono text-[#111622] font-semibold" 
                        />
                      </div>

                      {/* Imprevistos (I) */}
                      <div className="flex justify-between items-center text-[#586274]">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#EEF1F5] font-bold text-[10px] text-[#111622]">I</span>
                          <span>Imprevistos</span>
                          <div className="flex items-center bg-white border border-[#C8CDD5] focus-within:border-[#D4AF37] rounded-lg px-2 py-0.5 shadow-2xs">
                            <NumericInput 
                              value={quote.porcentajeImprevistos}
                              onChange={(val) => updateQuote({ ...quote, porcentajeImprevistos: val })}
                              className="w-12 bg-transparent text-right font-mono text-[11px] text-[#111622] focus:outline-none"
                            />
                            <span className="text-[10px] text-[#586274] ml-1 font-semibold">%</span>
                          </div>
                        </div>
                        <AnimatedCounter 
                          value={calculos.montoImprevistos} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono text-[#111622] font-semibold" 
                        />
                      </div>

                      {/* Utilidad (U) - Destacado en dorado */}
                      <div className="flex justify-between items-center text-[#9E7A18] bg-[#D4AF37]/10 p-2 rounded-lg border border-[#D4AF37]/40">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-4 h-4 rounded bg-[#D4AF37]/30 font-bold text-[10px] text-[#9E7A18]">U</span>
                          <span className="font-semibold">Utilidad (Honorarios)</span>
                          <div className="flex items-center bg-white border border-[#D4AF37]/50 focus-within:border-[#D4AF37] rounded-lg px-2 py-0.5 shadow-2xs">
                            <NumericInput 
                              value={quote.porcentajeHonorarios}
                              onChange={(val) => updateQuote({ ...quote, porcentajeHonorarios: val })}
                              className="w-12 bg-transparent text-right font-mono text-[11px] text-[#9E7A18] focus:outline-none font-bold"
                            />
                            <span className="text-[10px] text-[#9E7A18] ml-1 font-bold">%</span>
                          </div>
                        </div>
                        <AnimatedCounter 
                          value={calculos.montoUtilidad} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono font-bold text-sm text-[#9E7A18]" 
                        />
                      </div>

                      {/* Subtotal AIU */}
                      <div className="flex justify-between items-center text-[11px] text-[#586274] pt-1 border-t border-dashed border-[#D9DFE7]">
                        <span className="italic">Subtotal AIU Consolidado (A + I + U):</span>
                        <AnimatedCounter 
                          value={calculos.subtotalAiuDesglosado} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono text-[#111622] font-semibold" 
                        />
                      </div>
                    </div>

                    {/* IVA sobre la Utilidad (U) */}
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#C8CDD5]/80 space-y-1.5">
                      <div className="flex justify-between items-center text-[#586274]">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={quote.aplicaIva}
                              onChange={(e) => updateQuote({ ...quote, aplicaIva: e.target.checked })}
                              className="accent-[#D4AF37] rounded cursor-pointer"
                            />
                            <span className="font-semibold text-[#111622]">Aplicar IVA sobre la Utilidad</span>
                          </label>
                          <div className="flex items-center bg-white border border-[#C8CDD5] focus-within:border-[#D4AF37] rounded-lg px-2 py-0.5">
                            <NumericInput 
                              value={quote.porcentajeIva}
                              onChange={(val) => updateQuote({ ...quote, porcentajeIva: val })}
                              className="w-10 bg-transparent text-right font-mono text-[11px] text-[#111622] focus:outline-none font-semibold"
                            />
                            <span className="text-[10px] text-[#586274] ml-1 font-semibold">%</span>
                          </div>
                        </div>
                        <AnimatedCounter 
                          value={calculos.montoIva} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono text-[#111622] font-semibold" 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#7E8B9E] pl-5">
                        <span>Base Imponible: 100% de la Utilidad ({quote.moneda} {calculos.montoUtilidad.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                        {quote.aplicaIva && (
                          <span className="text-[#9E7A18] font-medium">Excluye Costo Directo, A e I</span>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* ====== MODO 2: SIMPLIFICADO ====== */
                  <div className="space-y-2.5">
                    {/* Utilidad (base gravable) */}
                    <div className="p-3 bg-[#FCFCFD] border border-[#E0E4EC] rounded-xl shadow-2xs">
                      <div className="flex justify-between items-center text-[#586274]">
                        <div className="flex items-center gap-2">
                          <div>
                            <span className="font-semibold text-[#111622] block">Utilidad (base gravable)</span>
                            <span className="text-[10px] text-[#7E8B9E]">Porcentaje sobre subtotal</span>
                          </div>
                          <div className="flex items-center bg-white border border-[#C8CDD5] focus-within:border-[#D4AF37] rounded-lg px-2 py-0.5 ml-2 shadow-2xs">
                            <NumericInput 
                              value={quote.porcentajeAiuGlobal ?? 28}
                              onChange={(val) => updateQuote({ ...quote, porcentajeAiuGlobal: val })}
                              className="w-12 bg-transparent text-right font-mono text-[11px] text-[#111622] focus:outline-none font-bold"
                            />
                            <span className="text-[10px] text-[#586274] ml-1 font-semibold">%</span>
                          </div>
                        </div>
                        <AnimatedCounter 
                          value={calculos.montoAiuGlobal} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono text-[#111622] font-semibold text-sm" 
                        />
                      </div>
                    </div>

                    {/* IVA General */}
                    <div className="p-3 bg-[#F8F9FA] rounded-xl border border-[#C8CDD5]/80 space-y-1.5">
                      <div className="flex justify-between items-center text-[#586274]">
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-2 cursor-pointer select-none">
                            <input 
                              type="checkbox"
                              checked={quote.aplicaIva}
                              onChange={(e) => updateQuote({ ...quote, aplicaIva: e.target.checked })}
                              className="accent-[#D4AF37] rounded cursor-pointer"
                            />
                            <span className="font-semibold text-[#111622]">Aplicar IVA</span>
                          </label>
                          <div className="flex items-center bg-white border border-[#C8CDD5] focus-within:border-[#D4AF37] rounded-lg px-2 py-0.5">
                            <NumericInput 
                              value={quote.porcentajeIva}
                              onChange={(val) => updateQuote({ ...quote, porcentajeIva: val })}
                              className="w-10 bg-transparent text-right font-mono text-[11px] text-[#111622] focus:outline-none font-semibold"
                            />
                            <span className="text-[10px] text-[#586274] ml-1 font-semibold">%</span>
                          </div>
                        </div>
                        <AnimatedCounter 
                          value={calculos.montoIva} 
                          prefix={`${quote.moneda} `} 
                          className="font-mono text-[#111622] font-semibold" 
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-[#7E8B9E] pl-5">
                        <span>Base Gravable: Utilidad ({quote.moneda} {calculos.montoAiuGlobal.toLocaleString('es-CO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})</span>
                        {quote.aplicaIva && (
                          <span className="text-[#9E7A18] font-medium">IVA s/ Base Gravable</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Inversión Total */}
                <div className="pt-4 border-t-2 border-[#C5CAD2] flex justify-between items-baseline">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-widest text-[#586274] block">
                      Inversión Total de la Obra
                    </span>
                    <span className="text-[10px] text-[#9E7A18] font-bold">
                      {(quote.modoCalculo || 'DESGLOSADO') === 'DESGLOSADO' 
                        ? 'Costo Directo + AIU + IVA s/ Utilidad' 
                        : 'Subtotal + IVA'} · <span className="font-brand font-bold text-xs lowercase">conobras</span>
                    </span>
                  </div>
                  <AnimatedCounter 
                    value={calculos.totalFinal} 
                    prefix={`${quote.moneda} `} 
                    className="text-3xl font-mono font-bold bg-gradient-to-r from-[#111622] via-[#AA8820] to-[#D4AF37] bg-clip-text text-transparent animate-gradient-text" 
                  />
                </div>
              </div>
            </div>
          </TiltCard>
        </div>
      </div>

      {/* MODAL PICKER DE INSUMOS DESDE CATÁLOGO */}
      {activeCatalogPicker && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#C5CAD2] rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">
            <div className="p-4 border-b border-[#C5CAD2] bg-[#EEF1F5] flex items-center justify-between">
              <h4 className="text-xs font-bold uppercase text-[#111622] tracking-wider flex items-center gap-2">
                <BookOpen size={16} className="text-[#9E7A18]" />
                <span>Seleccionar Ítem de APU'S</span>
              </h4>
              <button 
                onClick={() => setActiveCatalogPicker(null)}
                className="text-[#586274] hover:text-[#111622] font-bold cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="p-3 border-b border-[#C5CAD2] bg-[#F8F9FA]">
              <input 
                type="text"
                placeholder="Filtrar por nombre (ej. concreto, varilla, cuadrilla)..."
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                autoFocus
                className="w-full bg-white border border-[#C8CDD5] focus:border-[#D4AF37] rounded-lg px-3 py-2 text-xs text-[#111622] placeholder-[#8E99A8] focus:outline-none"
              />
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#E2E6EB] p-2 bg-white">
              {filteredCatalog.length === 0 ? (
                <div className="p-8 text-center text-xs text-[#586274]">
                  No se encontraron insumos.
                </div>
              ) : (
                filteredCatalog.map(item => (
                  <div
                    key={item.id}
                    onClick={() => handleSelectFromCatalog(item)}
                    className="p-3 hover:bg-[#F8F9FA] rounded-lg cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-semibold text-[#111622]">{item.descripcion}</div>
                      <div className="text-[10px] text-[#586274] font-mono mt-0.5">
                        {item.codigo} • {item.categoria} • Unidad: {item.unidad}
                      </div>
                    </div>
                    <div className="font-mono font-bold text-[#AA8820] text-right">
                      $ {item.precioUnitario.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
