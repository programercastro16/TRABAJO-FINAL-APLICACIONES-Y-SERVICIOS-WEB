
import React, { useState } from 'react';
import {
  Lock,
  Mail,
  User as UserIcon,
  Phone,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { authService } from '../../services/authService';
import { User } from '../../types';
import { AmbientBackground3D } from '../common/AmbientBackground3D';

interface AuthViewProps {
  onAuthenticated: (user: User) => void;
}

type AuthMode = 'login' | 'register' | 'forgot';

export const AuthView: React.FC<AuthViewProps> = ({ onAuthenticated }) => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados del inicio de sesión
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Estados del registro
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPhone, setRegPhone] = useState('');
  const [regCompany, setRegCompany] = useState(
    'Conobras Construcción + Arquitectura'
  );
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');

  // Estados de recuperación de contraseña
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  const clearMessages = () => {
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // INICIAR SESIÓN
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!loginEmail.trim() || !loginPassword) {
      setErrorMessage('Por favor ingresa tu correo y contraseña.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.login({
        email: loginEmail.trim(),
        password: loginPassword,
      });

      setSuccessMessage(res.message);

      setTimeout(() => {
        onAuthenticated(res.user);
      }, 350);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al iniciar sesión.');
    } finally {
      setLoading(false);
    }
  };

  // REGISTRAR CUENTA
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!regName.trim() || !regEmail.trim() || !regPassword) {
      setErrorMessage(
        'Por favor completa todos los campos requeridos (*).'
      );
      return;
    }

    if (regPassword.length < 8) {
      setErrorMessage(
        'La contraseña debe tener al menos 8 caracteres.'
      );
      return;
    }

    if (regPassword !== regConfirmPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.register({
        name: regName.trim(),
        email: regEmail.trim(),
        phone: regPhone.trim(),
        company: regCompany.trim(),
        password: regPassword,
        password_confirmation: regConfirmPassword,
      });

      setSuccessMessage(
        '¡Cuenta creada exitosamente! Ingresando al sistema...'
      );

      setTimeout(() => {
        onAuthenticated(res.user);
      }, 500);
    } catch (err: any) {
      setErrorMessage(err.message || 'Error al crear la cuenta.');
    } finally {
      setLoading(false);
    }
  };

  // SOLICITAR RESTABLECIMIENTO DE CONTRASEÑA
  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!forgotEmail.trim()) {
      setErrorMessage(
        'Ingresa el correo electrónico asociado a tu cuenta.'
      );
      return;
    }

    setLoading(true);

    try {
      const res = await authService.requestPasswordReset(forgotEmail);

      setSuccessMessage(
        `${res.message} Revisa tu correo electrónico para obtener el enlace y el token de recuperación.`
      );

      setResetToken('');
      setForgotStep(2);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'No fue posible solicitar el restablecimiento.'
      );
    } finally {
      setLoading(false);
    }
  };

  // RESTABLECER CONTRASEÑA
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!resetToken.trim() || !newPassword) {
      setErrorMessage(
        'Ingresa el token de recuperación y tu nueva contraseña.'
      );
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage(
        'La nueva contraseña debe tener mínimo 8 caracteres.'
      );
      return;
    }

    if (newPassword !== confirmNewPassword) {
      setErrorMessage('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      const res = await authService.resetPassword({
        email: forgotEmail,
        token: resetToken.trim(),
        password: newPassword,
        password_confirmation: confirmNewPassword,
      });

      setSuccessMessage(res.message);

      setTimeout(() => {
        setMode('login');
        setLoginEmail(forgotEmail);
        setLoginPassword('');
        setForgotStep(1);
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
        clearMessages();
      }, 1500);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Error al restablecer la contraseña.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-screen flex items-center justify-center bg-[#0C1017] text-white p-4 overflow-hidden select-none font-sans">
      {/* FONDO DINÁMICO 3D */}
      <AmbientBackground3D />

      {/* GRADIENTE AMBIENTAL */}
      <div className="absolute inset-0 bg-radial-gradient pointer-events-none opacity-60" />
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#D4AF37]/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-[#38BDF8]/15 rounded-full blur-3xl pointer-events-none" />

      {/* CONTENEDOR CENTRAL */}
      <div className="relative z-10 w-full max-w-md my-8">
        <div className="bg-[#111622]/95 backdrop-blur-2xl border border-[#FACA14]/40 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.8)] overflow-hidden">

          {/* ENCABEZADO */}
          <div className="p-6 text-center border-b border-[#252E42] bg-gradient-to-b from-[#182133] to-[#111622] relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#FACA14] to-transparent" />

            <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-[#0B0F17] border border-[#FACA14]/30 shadow-inner mb-3">
              <img
                src="./assets/conobras-icon.png"
                alt="Conobras"
                className="h-10 w-auto object-contain filter drop-shadow-[0_2px_10px_rgba(250,202,20,0.6)]"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />

              <span className="font-brand font-bold text-2xl text-white ml-2 lowercase tracking-tight">
                conobras
              </span>

              <span className="ml-2 text-[10px] px-2 py-0.5 rounded-full bg-[#FACA14]/20 text-[#FACA14] font-mono font-bold border border-[#FACA14]/40">
                PRO
              </span>
            </div>

            <p className="text-xs text-[#94A3B8] font-medium tracking-wide">
              {mode === 'login' &&
                'Sistema de Presupuestos & Costos Arquitectónicos'}

              {mode === 'register' &&
                'Registro de Nuevo Usuario & Estudio'}

              {mode === 'forgot' &&
                'Centro de Recuperación de Contraseña'}
            </p>
          </div>

          {/* ALERTA DE ERROR */}
          {errorMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/40 text-red-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <AlertCircle
                size={16}
                className="shrink-0 mt-0.5 text-red-400"
              />
              <div className="leading-relaxed">{errorMessage}</div>
            </div>
          )}

          {/* ALERTA DE ÉXITO */}
          {successMessage && (
            <div className="mx-6 mt-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/40 text-emerald-300 text-xs flex items-start gap-2.5 animate-fade-in">
              <CheckCircle2
                size={16}
                className="shrink-0 mt-0.5 text-emerald-400"
              />
              <div className="leading-relaxed">{successMessage}</div>
            </div>
          )}

          {/* CUERPO DEL FORMULARIO */}
          <div className="p-6">

            {/* 1. INICIAR SESIÓN */}
            {mode === 'login' && (
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                    Correo Electrónico o Usuario
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <Mail size={16} />
                    </div>

                    <input
                      type="text"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      placeholder="nombre@conobras.com"
                      required
                      autoComplete="username"
                      className="w-full pl-9 pr-3 py-2.5 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14] focus:ring-1 focus:ring-[#FACA14] transition-all"
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-semibold text-[#CBD5E1]">
                      Contraseña
                    </label>

                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setForgotEmail(loginEmail);
                        setForgotStep(1);
                        setMode('forgot');
                      }}
                      className="text-[11px] text-[#FACA14] hover:text-[#FDE047] transition-colors cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  </div>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <Lock size={16} />
                    </div>

                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      autoComplete="current-password"
                      className="w-full pl-9 pr-10 py-2.5 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14] focus:ring-1 focus:ring-[#FACA14] transition-all"
                    />

                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword
                          ? 'Ocultar contraseña'
                          : 'Mostrar contraseña'
                      }
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B] hover:text-[#CBD5E1] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff size={16} />
                      ) : (
                        <Eye size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* BOTÓN LOGIN */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-2 py-3 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-[#FACA14] via-[#EAB308] to-[#CA8A04] hover:from-[#FDE047] hover:to-[#EAB308] shadow-[0_4px_20px_rgba(250,202,20,0.35)] hover:shadow-[0_4px_25px_rgba(250,202,20,0.5)] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Iniciando sesión...</span>
                    </>
                  ) : (
                    <>
                      <span>Ingresar al Sistema</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* ENLACE A REGISTRO */}
                <div className="pt-3 border-t border-[#252E42] text-center">
                  <p className="text-xs text-[#94A3B8]">
                    ¿No tienes una cuenta aún?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode('register');
                      }}
                      className="text-[#FACA14] font-bold hover:underline cursor-pointer"
                    >
                      Regístrate aquí
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 2. REGISTRO */}
            {mode === 'register' && (
              <form onSubmit={handleRegister} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Nombre Completo *
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <UserIcon size={16} />
                    </div>

                    <input
                      type="text"
                      value={regName}
                      onChange={(e) => setRegName(e.target.value)}
                      placeholder="Arq. Juan Pérez"
                      required
                      autoComplete="name"
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14] focus:ring-1 focus:ring-[#FACA14]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Correo Electrónico *
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <Mail size={16} />
                    </div>

                    <input
                      type="email"
                      value={regEmail}
                      onChange={(e) => setRegEmail(e.target.value)}
                      placeholder="usuario@dominio.com"
                      required
                      autoComplete="email"
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14] focus:ring-1 focus:ring-[#FACA14]"
                    />
                  </div>
                </div>

                {/* TELÉFONO */}
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Teléfono
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <Phone size={15} />
                    </div>

                    <input
                      type="tel"
                      value={regPhone}
                      onChange={(e) => setRegPhone(e.target.value)}
                      placeholder="312 000 0000"
                      autoComplete="tel"
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14]"
                    />
                  </div>
                </div>

                {/* EMPRESA */}
                <div>
                  <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                    Empresa / Estudio
                  </label>

                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                      <Building size={15} />
                    </div>

                    <input
                      type="text"
                      value={regCompany}
                      onChange={(e) => setRegCompany(e.target.value)}
                      placeholder="Conobras Construcción + Arquitectura"
                      className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14]"
                    />
                  </div>
                </div>

                {/* CONTRASEÑAS */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                      Contraseña *
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#64748B]">
                        <Lock size={14} />
                      </div>

                      <input
                        type={showPassword ? 'text' : 'password'}
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        placeholder="Mín. 8 car."
                        required
                        autoComplete="new-password"
                        className="w-full pl-8 pr-8 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14]"
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#64748B]"
                      >
                        {showPassword ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                      Confirmar *
                    </label>

                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-[#64748B]">
                        <ShieldCheck size={14} />
                      </div>

                      <input
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={regConfirmPassword}
                        onChange={(e) =>
                          setRegConfirmPassword(e.target.value)
                        }
                        placeholder="Repetir clave"
                        required
                        autoComplete="new-password"
                        className="w-full pl-8 pr-8 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-xs text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14]"
                      />

                      <button
                        type="button"
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                        aria-label={
                          showConfirmPassword
                            ? 'Ocultar contraseña'
                            : 'Mostrar contraseña'
                        }
                        className="absolute inset-y-0 right-0 pr-2 flex items-center text-[#64748B]"
                      >
                        {showConfirmPassword ? (
                          <EyeOff size={13} />
                        ) : (
                          <Eye size={13} />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* BOTÓN REGISTRO */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full mt-3 py-3 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-[#FACA14] via-[#EAB308] to-[#CA8A04] hover:from-[#FDE047] hover:to-[#EAB308] shadow-[0_4px_20px_rgba(250,202,20,0.35)] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      <span>Creando cuenta...</span>
                    </>
                  ) : (
                    <>
                      <span>Registrarse e Iniciar</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* VOLVER A LOGIN */}
                <div className="pt-2 border-t border-[#252E42] text-center">
                  <p className="text-xs text-[#94A3B8]">
                    ¿Ya tienes una cuenta registrada?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        clearMessages();
                        setMode('login');
                      }}
                      className="text-[#FACA14] font-bold hover:underline cursor-pointer"
                    >
                      Inicia sesión
                    </button>
                  </p>
                </div>
              </form>
            )}

            {/* 3. RECUPERACIÓN DE CONTRASEÑA */}
            {mode === 'forgot' && (
              <div className="space-y-4">
                {forgotStep === 1 ? (
                  <form
                    onSubmit={handleRequestResetCode}
                    className="space-y-4"
                  >
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Ingresa el correo electrónico con el que te registraste.
                      Si está asociado a una cuenta, recibirás instrucciones
                      para restablecer tu contraseña.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1.5">
                        Correo Electrónico
                      </label>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                          <Mail size={16} />
                        </div>

                        <input
                          type="email"
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder="tu-correo@conobras.com"
                          required
                          autoComplete="email"
                          className="w-full pl-9 pr-3 py-2.5 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#FACA14]"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full py-2.5 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-[#FACA14] to-[#EAB308] hover:from-[#FDE047] hover:to-[#EAB308] shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Solicitando recuperación...</span>
                        </>
                      ) : (
                        <>
                          <KeyRound size={16} />
                          <span>Solicitar Recuperación de Contraseña</span>
                        </>
                      )}
                    </button>
                  </form>
                ) : (
                  <form
                    onSubmit={handleResetPassword}
                    className="space-y-3.5"
                  >
                    <p className="text-xs text-[#94A3B8] leading-relaxed">
                      Ingresa el token recibido en el enlace de recuperación
                      y define tu nueva contraseña.
                    </p>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                        Token de Recuperación
                      </label>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#FACA14]">
                          <KeyRound size={16} />
                        </div>

                        <input
                          type="text"
                          value={resetToken}
                          onChange={(e) => setResetToken(e.target.value)}
                          placeholder="Pega aquí el token recibido"
                          required
                          autoComplete="off"
                          className="w-full pl-9 pr-3 py-2 bg-[#0B0F17] border border-[#FACA14]/50 rounded-xl text-sm text-white font-mono focus:outline-none focus:border-[#FACA14]"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                        Nueva Contraseña (mínimo 8 caracteres)
                      </label>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                          <Lock size={15} />
                        </div>

                        <input
                          type={showPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          className="w-full pl-9 pr-10 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white focus:outline-none focus:border-[#FACA14]"
                        />

                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={
                            showPassword
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B]"
                        >
                          {showPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#CBD5E1] mb-1">
                        Confirmar Nueva Contraseña
                      </label>

                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#64748B]">
                          <ShieldCheck size={15} />
                        </div>

                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmNewPassword}
                          onChange={(e) =>
                            setConfirmNewPassword(e.target.value)
                          }
                          placeholder="••••••••"
                          required
                          autoComplete="new-password"
                          className="w-full pl-9 pr-10 py-2 bg-[#0B0F17] border border-[#2D3748] rounded-xl text-sm text-white focus:outline-none focus:border-[#FACA14]"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowConfirmPassword(!showConfirmPassword)
                          }
                          aria-label={
                            showConfirmPassword
                              ? 'Ocultar contraseña'
                              : 'Mostrar contraseña'
                          }
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#64748B]"
                        >
                          {showConfirmPassword ? (
                            <EyeOff size={15} />
                          ) : (
                            <Eye size={15} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* BOTÓN RESTABLECER */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full mt-2 py-2.5 px-4 rounded-xl font-bold text-sm text-black bg-gradient-to-r from-[#FACA14] to-[#EAB308] hover:from-[#FDE047] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      {loading ? (
                        <>
                          <RefreshCw size={16} className="animate-spin" />
                          <span>Guardando nueva contraseña...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 size={16} />
                          <span>Restablecer y Guardar Contraseña</span>
                        </>
                      )}
                    </button>
                  </form>
                )}

                {/* VOLVER A LOGIN */}
                <div className="pt-2 border-t border-[#252E42] text-center">
                  <button
                    type="button"
                    onClick={() => {
                      clearMessages();
                      setMode('login');
                      setForgotStep(1);
                      setResetToken('');
                      setNewPassword('');
                      setConfirmNewPassword('');
                    }}
                    className="text-xs text-[#94A3B8] hover:text-[#FACA14] transition-colors cursor-pointer"
                  >
                    ← Regresar al inicio de sesión
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PIE DE SEGURIDAD */}
          <div className="px-6 py-3 bg-[#0B0F17] border-t border-[#252E42] flex items-center justify-between text-[11px] text-[#64748B]">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={13} className="text-[#16A34A]" />
              <span>Cifrado y Sesión Segura</span>
            </div>

            <span className="font-mono text-[#FACA14]">
              v1.2 Pro
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
