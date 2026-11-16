
import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';

import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { NavigationTabs } from './components/layout/NavigationTabs';
import { QuoteBuilder } from './components/quote/QuoteBuilder';
import { MaterialsCatalog } from './components/materials/MaterialsCatalog';
import { QuoteHistory } from './components/history/QuoteHistory';
import { SettingsView } from './components/settings/SettingsView';
import { ProposalPdfModal } from './components/quote/ProposalPdfModal';
import { AmbientBackground3D } from './components/common/AmbientBackground3D';
import { AuthView } from './components/auth/AuthView';
import { UserProfileModal } from './components/auth/UserProfileModal';

import {
  Cotizacion,
  Insumo,
  ConfiguracionEmpresa,
  User
} from './types';

import { storageService } from './services/storageService';
import { authService } from './services/authService';
import { DEFAULT_CONFIG } from './data/seedData';

// Generador de cotización completamente vacía
const createEmptyQuote = (
  cfg?: ConfiguracionEmpresa,
  count = 0
): Cotizacion => {
  const year = new Date().getFullYear();

  return {
    id: `cot-${Date.now()}`,
    codigo: `CNB-${year}-${String(count + 1).padStart(3, '0')}`,
    cliente: '',
    telefono: '',
    email: '',
    proyecto: '',
    ubicacion: '',
    fecha: new Date().toISOString().split('T')[0],
    validezDias: 15,
    moneda: cfg?.monedaSimbolo || '$',
    modoCalculo: cfg?.modoCalculoDefault ?? 'DESGLOSADO',
    porcentajeAdministracion:
      cfg?.porcentajeAdministracionDefault ??
      cfg?.porcentajeGastosGeneralesDefault ??
      8,
    porcentajeImprevistos: cfg?.porcentajeImprevistosDefault ?? 5,
    porcentajeGastosGenerales:
      cfg?.porcentajeGastosGeneralesDefault ?? 8,
    porcentajeHonorarios: cfg?.porcentajeHonorariosDefault ?? 15,
    porcentajeAiuGlobal: cfg?.porcentajeAiuGlobalDefault ?? 28,
    aplicaIva: false,
    porcentajeIva: cfg?.porcentajeIvaDefault ?? 19,
    partidas: [],
    notas: '',
    estado: 'BORRADOR',
    creadoEn: new Date().toISOString(),
    actualizadoEn: new Date().toISOString()
  };
};

// Error Boundary
interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);

    this.state = {
      hasError: false,
      error: null
    };
  }

  static getDerivedStateFromError(
    error: Error
  ): ErrorBoundaryState {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(
    error: Error,
    errorInfo: React.ErrorInfo
  ) {
    console.error(
      '[Conobras ErrorBoundary]:',
      error,
      errorInfo
    );
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 m-6 rounded-2xl bg-white border border-amber-500/30 text-center shadow-2xl">
          <h3 className="text-sm font-bold text-[#D4AF37] uppercase tracking-wider mb-2">
            Aviso de Renderizado
          </h3>

          <p className="text-xs text-[#586274] mb-4 max-w-md">
            {this.state.error?.message ||
              'Se produjo un error al desplegar este módulo.'}
          </p>

          <button
            type="button"
            onClick={() =>
              this.setState({
                hasError: false,
                error: null
              })
            }
            className="px-4 py-2 rounded-lg bg-gradient-to-r from-[#D4AF37] to-[#AA8820] text-black font-semibold text-xs transition-all active:scale-95 cursor-pointer shadow-md"
          >
            Reintentar y Recargar Módulo
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export const App: React.FC = () => {
  // Estado de autenticación y usuario activo
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const [isProfileModalOpen, setIsProfileModalOpen] =
    useState<boolean>(false);

  // Estado de navegación
  const [activeTab, setActiveTab] =
    useState<ActiveTab>('cotizador');

  // Datos de la aplicación
  const [quotes, setQuotes] = useState<Cotizacion[]>([]);
  const [materials, setMaterials] = useState<Insumo[]>([]);
  const [config, setConfig] =
    useState<ConfiguracionEmpresa>(DEFAULT_CONFIG);

  // Cotización en edición activa
  const [currentQuote, setCurrentQuote] = useState<Cotizacion>(
    () => createEmptyQuote(DEFAULT_CONFIG, 0)
  );

  // Cotización para vista previa PDF
  const [previewQuote, setPreviewQuote] =
    useState<Cotizacion | null>(null);

  // Cargar información desde el backend
  const loadData = async () => {
    const [
      loadedQuotes,
      loadedMaterials,
      loadedConfig
    ] = await Promise.all([
      storageService.getQuotes(),
      storageService.getMaterials(),
      storageService.getConfig()
    ]);

    setQuotes(loadedQuotes || []);
    setMaterials(loadedMaterials || []);
    setConfig(loadedConfig || DEFAULT_CONFIG);
  };

  // VERIFICAR SESIÓN CON LARAVEL SANCTUM
  useEffect(() => {
    const verifySession = async () => {
      const cachedUser = authService.getCurrentUser();

      // Si no existe un usuario almacenado,
      // mostrar directamente la pantalla de autenticación
      if (!cachedUser) {
        setCurrentUser(null);
        setIsAuthChecking(false);
        return;
      }

      try {
        // Consultar al backend para validar el token
        const authenticatedUser = await authService.getMe();

        setCurrentUser(authenticatedUser);
      } catch (error) {
        console.warn(
          'La sesión almacenada no pudo ser validada por Laravel.',
          error
        );

        // Limpiar la sesión local si el token no es válido
        await authService.logout();

        setCurrentUser(null);
      } finally {
        setIsAuthChecking(false);
      }
    };

    verifySession();
  }, []);

  // CARGAR DATOS SOLO SI EXISTE UN USUARIO AUTENTICADO
  useEffect(() => {
    if (currentUser) {
      loadData();
    }
  }, [currentUser]);

  // CERRAR SESIÓN
  const handleLogout = async () => {
    if (
      window.confirm(
        '¿Deseas cerrar sesión en Conobras Quote?'
      )
    ) {
      await authService.logout();

      setCurrentUser(null);
      setIsProfileModalOpen(false);
      setPreviewQuote(null);
      setQuotes([]);
      setMaterials([]);
      setConfig(DEFAULT_CONFIG);
      setCurrentQuote(createEmptyQuote(DEFAULT_CONFIG, 0));
      setActiveTab('cotizador');
    }
  };

  // CREAR NUEVA COTIZACIÓN
  const handleNewQuote = () => {
    const newQuote = createEmptyQuote(
      config || DEFAULT_CONFIG,
      quotes.length
    );

    setCurrentQuote(newQuote);
    setActiveTab('cotizador');
  };

  // SELECCIONAR COTIZACIÓN DEL HISTORIAL
  const handleSelectQuoteFromHistory = (
    quote: Cotizacion
  ) => {
    // Clonar para evitar modificar directamente el objeto original
    const freshQuote: Cotizacion = JSON.parse(
      JSON.stringify(quote)
    );

    freshQuote.actualizadoEn = new Date().toISOString();

    setCurrentQuote(freshQuote);
    setActiveTab('cotizador');
  };

  // INSERTAR MATERIAL EN LA COTIZACIÓN ACTIVA
  const handleInsertMaterialIntoActiveQuote = (
    insumo: Insumo
  ) => {
    const updatedPartidas = [
      ...currentQuote.partidas
    ];

    if (updatedPartidas.length === 0) {
      updatedPartidas.push({
        id: 'partida-1',
        titulo: '1. PARTIDA GENERAL',
        items: []
      });
    }

    const lastPartida =
      updatedPartidas[updatedPartidas.length - 1];

    lastPartida.items.push({
      id: `item-${Date.now()}`,
      insumoId: insumo.id,
      descripcion: insumo.descripcion,
      categoria: insumo.categoria,
      unidad: insumo.unidad,
      cantidad: 1,
      precioUnitario: insumo.precioUnitario
    });

    setCurrentQuote({
      ...currentQuote,
      partidas: updatedPartidas
    });

    setActiveTab('cotizador');
  };

  // PANTALLA DE VERIFICACIÓN DE SESIÓN
  if (isAuthChecking) {
    return (
      <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0C1017] text-white overflow-hidden">
        <AmbientBackground3D />

        <div className="relative z-10 flex flex-col items-center gap-4">
          <RefreshCw
            size={32}
            className="animate-spin text-[#FACA14]"
          />

          <p className="text-sm text-[#CBD5E1] font-medium">
            Verificando sesión...
          </p>

          <span className="text-xs text-[#64748B]">
            Conobras Quote Pro
          </span>
        </div>
      </div>
    );
  }

  // SI NO EXISTE UNA SESIÓN VÁLIDA, MOSTRAR AUTENTICACIÓN
  if (!currentUser) {
    return (
      <AuthView
        onAuthenticated={(user) => {
          setCurrentUser(user);
        }}
      />
    );
  }

  // DASHBOARD PRINCIPAL
  return (
    <div className="relative flex h-screen w-screen bg-[#D6D9DE] text-[#111622] overflow-hidden select-none font-sans">

      {/* FONDO DINÁMICO 3D */}
      <AmbientBackground3D />

      {/* BARRA LATERAL */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        quotesCount={quotes.length}
        materialsCount={materials.length}
        user={currentUser}
        onOpenProfile={() =>
          setIsProfileModalOpen(true)
        }
        onLogout={handleLogout}
      />

      {/* ÁREA DE CONTENIDO PRINCIPAL */}
      <div className="flex-1 flex flex-col h-full overflow-hidden z-10 relative">

        {/* ENCABEZADO */}
        <Header
          onNewQuote={handleNewQuote}
          onOpenCatalog={() =>
            setActiveTab('materiales')
          }
          user={currentUser}
          onOpenProfile={() =>
            setIsProfileModalOpen(true)
          }
          onLogout={handleLogout}
          onOpenSettings={() =>
            setActiveTab('configuracion')
          }
        />

        {/* NAVEGACIÓN SUPERIOR */}
        <div className="px-6 lg:px-8 bg-[#D6D9DE]/70 backdrop-blur-md border-b border-[#C5CAD2]/60">
          <NavigationTabs
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            quotesCount={quotes.length}
            materialsCount={materials.length}
            currentQuoteCode={currentQuote?.codigo}
          />
        </div>

        {/* CONTENEDOR PRINCIPAL DESPLAZABLE */}
        <main className="flex-1 overflow-y-auto p-6 lg:p-8 bg-transparent">
          <div className="max-w-7xl mx-auto space-y-6">

            {/* VISTAS MODULARES */}
            <div
              key={activeTab}
              className="animate-fade-in-up"
            >
              {activeTab === 'cotizador' && (
                <QuoteBuilder
                  key={`${currentQuote?.id}-${currentQuote?.actualizadoEn || '0'}`}
                  currentQuote={currentQuote}
                  config={config || DEFAULT_CONFIG}
                  materials={materials}
                  onQuoteSaved={loadData}
                  onOpenPdf={(q) =>
                    setPreviewQuote(q)
                  }
                  onUpdateCurrentQuote={(q) =>
                    setCurrentQuote(q)
                  }
                />
              )}

              {activeTab === 'materiales' && (
                <MaterialsCatalog
                  materials={materials}
                  onRefresh={loadData}
                  onSelectItemForQuote={
                    handleInsertMaterialIntoActiveQuote
                  }
                />
              )}

              {activeTab === 'historial' && (
                <QuoteHistory
                  quotes={quotes}
                  onSelectQuote={
                    handleSelectQuoteFromHistory
                  }
                  onPreviewPdf={(q) =>
                    setPreviewQuote(q)
                  }
                  onRefresh={loadData}
                />
              )}

              {activeTab === 'configuracion' && (
                <SettingsView
                  config={config}
                  onRefresh={loadData}
                />
              )}
            </div>
          </div>
        </main>
      </div>

      {/* MODAL DE VISTA PREVIA Y EXPORTACIÓN PDF */}
      {previewQuote && (
        <ErrorBoundary>
          <ProposalPdfModal
            quote={previewQuote}
            config={config || DEFAULT_CONFIG}
            onClose={() =>
              setPreviewQuote(null)
            }
          />
        </ErrorBoundary>
      )}

      {/* MODAL DE EDICIÓN DE PERFIL */}
      {currentUser && (
        <UserProfileModal
          user={currentUser}
          isOpen={isProfileModalOpen}
          onClose={() =>
            setIsProfileModalOpen(false)
          }
          onUserUpdated={(updatedUser) => {
            setCurrentUser(updatedUser);
          }}
        />
      )}
    </div>
  );
};

export default App;
