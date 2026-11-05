import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  FolderOpen,
  Sparkles,
  Clock,
  User as UserIcon,
  LogOut,
  ChevronDown,
  ShieldCheck,
  Settings,
  Building
} from 'lucide-react';
import { InteractiveButton } from '../common/InteractiveButton';
import { TypewriterHeadline, ShimmerBadge } from '../common/AnimatedText';
import { User } from '../../types';

interface HeaderProps {
  onNewQuote: () => void;
  onOpenCatalog: () => void;
  user?: User | null;
  onOpenProfile?: () => void;
  onLogout?: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ 
  onNewQuote, 
  onOpenCatalog,
  user,
  onOpenProfile,
  onLogout,
  onOpenSettings,
}) => {
  const [timeStr, setTimeStr] = useState<string>('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString('es-MX', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const currentDate = new Date().toLocaleDateString('es-MX', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  const getInitials = (name?: string) => {
    if (!name) return 'CO';
    return name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]?.toUpperCase() || '')
      .join('');
  };

  return (
    <header className="h-16 border-b border-[#C5CAD2] bg-[#E5E9EE]/95 backdrop-blur-xl px-6 flex items-center justify-between no-print z-20 select-none shadow-sm">
      {/* SECCIÓN IZQUIERDA: SLOGAN DINÁMICO ANIMADO Y FECHA/HORA DE ESTUDIO */}
      <div className="flex items-center gap-4">
        {/* Reloj de Precisión de Obra */}
        <div className="hidden sm:flex items-center gap-2 text-xs text-[#586274] font-mono bg-white/80 px-2.5 py-1 rounded-lg border border-[#C5CAD2] shadow-sm">
          <Clock size={12} className="text-[#9E7A18]" />
          <span className="capitalize">{currentDate}</span>
          <span className="text-[#9E7A18]">•</span>
          <span className="text-[#111622] font-bold">{timeStr}</span>
        </div>

        {/* Separador */}
        <span className="hidden sm:inline text-[#B4B7BC]">•</span>

        {/* Headline Dinámico con Efecto Typewriter */}
        <div className="hidden md:block">
          <TypewriterHeadline 
            prefix="conobras •"
            typingSpeed={40}
            pauseTime={2500}
          />
        </div>
      </div>

      {/* SECCIÓN DERECHA: ACCIONES RÁPIDAS Y MENÚ DE USUARIO */}
      <div className="flex items-center gap-3">
        <ShimmerBadge variant="gold" icon={<Sparkles size={11} className="animate-spin-slow-3d" />}>
          Estudio de Arquitectura
        </ShimmerBadge>

        <InteractiveButton
          variant="glass"
          size="sm"
          onClick={onOpenCatalog}
          icon={<FolderOpen size={14} className="text-[#38BDF8]" />}
        >
          Insumos Rápidos
        </InteractiveButton>

        <InteractiveButton
          variant="gold"
          size="sm"
          shimmer={true}
          glow={true}
          onClick={onNewQuote}
          icon={<Plus size={15} />}
        >
          Nueva Cotización
        </InteractiveButton>

        {/* MENÚ DE USUARIO Y LOGOUT */}
        {user && (
          <div className="relative pl-2 ml-1 border-l border-[#C5CAD2]" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-xl bg-white/90 hover:bg-white border border-[#C5CAD2] hover:border-[#D4AF37] shadow-sm transition-all cursor-pointer group"
            >
              {/* Avatar circle */}
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-[#111622] to-[#1F2937] text-[#FACA14] font-bold text-xs flex items-center justify-center border border-[#FACA14]/40 shadow-inner group-hover:scale-105 transition-transform">
                {getInitials(user.name)}
              </div>

              {/* User text */}
              <div className="hidden sm:block text-left">
                <div className="text-xs font-bold text-[#111622] max-w-[130px] truncate leading-tight">
                  {user.name}
                </div>
                <div className="text-[10px] text-[#586274] font-medium max-w-[130px] truncate leading-tight">
                  {user.role || 'Arquitecto'}
                </div>
              </div>

              <ChevronDown 
                size={14} 
                className={`text-[#586274] transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-[#9E7A18]' : ''}`} 
              />
            </button>

            {/* DROPDOWN MENU */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-[#CBD5E1] overflow-hidden z-50 animate-fade-in-up">
                {/* User card header */}
                <div className="p-3.5 bg-gradient-to-r from-[#111622] to-[#1E293B] text-white">
                  <div className="flex items-center gap-2.5 mb-1.5">
                    <div className="h-9 w-9 rounded-lg bg-gradient-to-tr from-[#D4AF37] to-[#FACA14] text-black font-bold text-xs flex items-center justify-center shadow-md">
                      {getInitials(user.name)}
                    </div>
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">
                        {user.name}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] truncate">
                        {user.email}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] pt-1.5 border-t border-white/10 text-[#CBD5E1]">
                    <span className="truncate">{user.company || 'Conobras'}</span>
                    <span className="shrink-0 px-1.5 py-0.5 rounded bg-[#FACA14]/20 text-[#FACA14] font-mono text-[9px] font-bold">
                      PRO
                    </span>
                  </div>
                </div>

                {/* Dropdown items */}
                <div className="p-1.5 space-y-1">
                  {/* EDITAR PERFIL */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onOpenProfile?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1E293B] hover:bg-[#F1F5F9] hover:text-[#9E7A18] transition-colors text-left cursor-pointer"
                  >
                    <UserIcon size={15} className="text-[#9E7A18]" />
                    <span>Editar Mi Perfil</span>
                  </button>

                  {/* CONFIGURACIÓN ESTUDIO */}
                  {onOpenSettings && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onOpenSettings();
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-[#1E293B] hover:bg-[#F1F5F9] transition-colors text-left cursor-pointer"
                    >
                      <Settings size={15} className="text-[#38BDF8]" />
                      <span>Configuración del Estudio</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[#E2E8F0]" />

                  {/* CERRAR SESIÓN (LOGOUT) */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogout?.();
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-bold text-red-600 hover:bg-red-50 transition-colors text-left cursor-pointer group"
                  >
                    <LogOut size={15} className="text-red-500 group-hover:scale-110 transition-transform" />
                    <span>Cerrar Sesión</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
