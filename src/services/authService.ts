import { User, RegisterData, LoginData, UpdateProfileData, ResetPasswordData } from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'conobras_auth_user_v1',
  USERS_LIST: 'conobras_registered_users_v1',
  RESET_CODES: 'conobras_reset_codes_v1',
};

// Usuario semilla preconfigurado para pruebas rápidas
const DEFAULT_SEED_USER: User & { password?: string } = {
  id: 'usr-default-01',
  name: 'Arq. John Fabio Giraldo',
  email: 'arq.john@conobras.com',
  phone: '3128710555',
  role: 'Arquitecto Titular & Constructor',
  company: 'Conobras Construcción + Arquitectura',
  avatar: '',
  password: 'conobras2026',
  created_at: new Date().toISOString(),
};

const getCsrfToken = (): string => {
  const meta = document.querySelector('meta[name="csrf-token"]');
  return meta ? meta.getAttribute('content') || '' : '';
};

const defaultHeaders = () => {
  const currentUser = authService.getCurrentUser();
  return {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'X-CSRF-TOKEN': getCsrfToken(),
    'X-Requested-With': 'XMLHttpRequest',
    ...(currentUser?.token ? { 'Authorization': `Bearer ${currentUser.token}` } : {})
  };
};

class AuthService {
  private getLocalUsers(): Array<User & { password?: string }> {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USERS_LIST);
      if (!data) {
        const initial = [DEFAULT_SEED_USER];
        localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(initial));
        return initial;
      }
      return JSON.parse(data);
    } catch {
      return [DEFAULT_SEED_USER];
    }
  }

  private saveLocalUsers(users: Array<User & { password?: string }>): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USERS_LIST, JSON.stringify(users));
    } catch (e) {
      console.warn('Error guardando usuarios en cache local:', e);
    }
  }

  /**
   * Obtiene el usuario autenticado actualmente en la sesión
   */
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
      if (!data) return null;
      return JSON.parse(data);
    } catch {
      return null;
    }
  }

  /**
   * Registro de un nuevo usuario
   */
  async register(data: RegisterData): Promise<{ user: User; message: string }> {
    const emailNormalized = data.email.trim().toLowerCase();

    // 1. Intentar registrar en backend Laravel API
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        const user: User = {
          ...json.user,
          token: json.token,
        };
        // Guardar sesión activa y sincronizar en caché local
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        
        // Sincronizar catálogo local
        const localUsers = this.getLocalUsers();
        if (!localUsers.some(u => u.email.toLowerCase() === emailNormalized)) {
          localUsers.push({ ...user, password: data.password });
          this.saveLocalUsers(localUsers);
        }

        return { user, message: json.message || 'Usuario registrado exitosamente.' };
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message || errJson.errors) {
          const detail = errJson.errors ? Object.values(errJson.errors).flat().join(' ') : errJson.message;
          throw new Error(detail);
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
      // Si el servidor Laravel no está corriendo, continuamos con persistencia offline robusta
    }

    // 2. Fallback local offline
    const users = this.getLocalUsers();
    if (users.some(u => u.email.toLowerCase() === emailNormalized)) {
      throw new Error('El correo electrónico ya se encuentra registrado.');
    }

    const newUser: User & { password?: string } = {
      id: `usr-${Date.now()}`,
      name: data.name.trim(),
      email: emailNormalized,
      phone: data.phone?.trim() || '',
      role: data.role?.trim() || 'Arquitecto / Administrador',
      company: data.company?.trim() || 'Conobras Construcción + Arquitectura',
      avatar: '',
      password: data.password,
      token: `local-token-${Date.now()}`,
      created_at: new Date().toISOString(),
    };

    users.push(newUser);
    this.saveLocalUsers(users);

    // No almacenar la contraseña en el objeto de sesión actual
    const sessionUser: User = {
      id: newUser.id,
      name: newUser.name,
      email: newUser.email,
      phone: newUser.phone,
      role: newUser.role,
      company: newUser.company,
      avatar: newUser.avatar,
      token: newUser.token,
      created_at: newUser.created_at,
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    return { user: sessionUser, message: 'Cuenta creada y sesión iniciada exitosamente.' };
  }

  /**
   * Inicio de sesión con usuario/correo y contraseña
   */
  async login(data: LoginData): Promise<{ user: User; message: string }> {
    const identifier = data.email.trim().toLowerCase();

    // 1. Intentar API Laravel
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify(data),
      });

      if (res.ok) {
        const json = await res.json();
        const user: User = {
          ...json.user,
          token: json.token,
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
        return { user, message: json.message || 'Inicio de sesión correcto.' };
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message) {
          throw new Error(errJson.message);
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
      // Continuar con autenticación local
    }

    // 2. Fallback de verificación local
    const users = this.getLocalUsers();
    const found = users.find(u => 
      u.email.toLowerCase() === identifier || u.name.toLowerCase() === identifier
    );

    if (!found || (found.password && found.password !== data.password)) {
      throw new Error('Credenciales incorrectas. Verifica tu correo o contraseña.');
    }

    const sessionUser: User = {
      id: found.id,
      name: found.name,
      email: found.email,
      phone: found.phone,
      role: found.role,
      company: found.company,
      avatar: found.avatar,
      token: `local-token-${Date.now()}`,
      created_at: found.created_at,
    };

    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(sessionUser));
    return { user: sessionUser, message: 'Bienvenido de nuevo a Conobras Quote.' };
  }

  /**
   * Cerrar sesión del usuario
   */
  async logout(): Promise<void> {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: defaultHeaders(),
      });
    } catch {
      // Ignorar error de red al salir
    } finally {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  /**
   * Actualizar perfil del usuario
   */
  async updateProfile(data: UpdateProfileData): Promise<{ user: User; message: string }> {
    const currentUser = this.getCurrentUser();
    if (!currentUser) throw new Error('No hay una sesión activa.');

    const newEmail = data.email.trim().toLowerCase();

    // 1. Intentar actualizar en API Laravel
    try {
      const res = await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: defaultHeaders(),
        body: JSON.stringify({
          id: currentUser.id,
          ...data,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        const updatedUser: User = {
          ...currentUser,
          ...json.user,
        };
        localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));
        return { user: updatedUser, message: json.message || 'Perfil actualizado exitosamente.' };
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message) {
          throw new Error(errJson.message);
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

    // 2. Actualización local
    const users = this.getLocalUsers();
    // Validar email no duplicado por otro usuario
    const duplicate = users.find(u => u.email.toLowerCase() === newEmail && u.id !== currentUser.id);
    if (duplicate) {
      throw new Error('Ese correo ya está registrado por otra cuenta.');
    }

    const userIndex = users.findIndex(u => u.id === currentUser.id || u.email.toLowerCase() === currentUser.email.toLowerCase());
    
    // Si quiere cambiar contraseña, validar contraseña actual
    if (data.new_password) {
      if (userIndex >= 0 && users[userIndex].password) {
        if (data.current_password !== users[userIndex].password) {
          throw new Error('La contraseña actual ingresada es incorrecta.');
        }
      }
    }

    const updatedUser: User = {
      ...currentUser,
      name: data.name.trim(),
      email: newEmail,
      phone: data.phone?.trim() ?? currentUser.phone,
      role: data.role?.trim() ?? currentUser.role,
      company: data.company?.trim() ?? currentUser.company,
    };

    if (userIndex >= 0) {
      users[userIndex] = {
        ...users[userIndex],
        ...updatedUser,
        ...(data.new_password ? { password: data.new_password } : {})
      };
    } else {
      users.push({
        ...updatedUser,
        password: data.new_password || 'conobras2026'
      });
    }

    this.saveLocalUsers(users);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(updatedUser));

    return { user: updatedUser, message: 'Perfil y datos guardados correctamente.' };
  }

  /**
   * Solicitar código para restablecimiento de contraseña olvidada
   */
  async requestPasswordReset(email: string): Promise<{ success: boolean; message: string; tempCode?: string }> {
    const emailNorm = email.trim().toLowerCase();

    // 1. Intentar API Laravel
    try {
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify({ email: emailNorm }),
      });

      if (res.ok) {
        const json = await res.json();
        return {
          success: true,
          message: json.message || 'Código de restablecimiento generado con éxito.',
          tempCode: json.code,
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message) {
          throw new Error(errJson.message);
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

    // 2. Manejo local
    const users = this.getLocalUsers();
    const user = users.find(u => u.email.toLowerCase() === emailNorm);
    if (!user) {
      throw new Error('No existe ninguna cuenta registrada con este correo.');
    }

    // Generar código de 6 dígitos aleatorio
    const tempCode = String(Math.floor(100000 + Math.random() * 900000));
    try {
      const codes = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_CODES) || '{}');
      codes[emailNorm] = {
        code: tempCode,
        expires: Date.now() + 15 * 60 * 1000, // 15 minutos
      };
      localStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify(codes));
    } catch (e) {
      console.warn('Error guardando código de recuperación:', e);
    }

    return {
      success: true,
      message: 'Código de recuperación generado correctamente.',
      tempCode,
    };
  }

  /**
   * Confirmar restablecimiento de contraseña
   */
  async resetPassword(data: ResetPasswordData): Promise<{ success: boolean; message: string }> {
    const emailNorm = data.email.trim().toLowerCase();

    // 1. Intentar API Laravel
    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: defaultHeaders(),
        body: JSON.stringify({
          email: emailNorm,
          token: data.token.trim(),
          password: data.password,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        // Actualizar en caché local también
        const users = this.getLocalUsers();
        const idx = users.findIndex(u => u.email.toLowerCase() === emailNorm);
        if (idx >= 0) {
          users[idx].password = data.password;
          this.saveLocalUsers(users);
        }
        return {
          success: true,
          message: json.message || 'Contraseña actualizada correctamente.',
        };
      } else {
        const errJson = await res.json().catch(() => ({}));
        if (errJson.message) {
          throw new Error(errJson.message);
        }
      }
    } catch (e: any) {
      if (e.message && !e.message.includes('fetch') && !e.message.includes('NetworkError')) {
        throw e;
      }
    }

    // 2. Manejo local
    const users = this.getLocalUsers();
    const idx = users.findIndex(u => u.email.toLowerCase() === emailNorm);
    if (idx === -1) {
      throw new Error('Usuario no encontrado.');
    }

    let validCode = false;
    try {
      const codes = JSON.parse(localStorage.getItem(STORAGE_KEYS.RESET_CODES) || '{}');
      const record = codes[emailNorm];
      if (record && record.code === data.token.trim()) {
        validCode = true;
        delete codes[emailNorm];
        localStorage.setItem(STORAGE_KEYS.RESET_CODES, JSON.stringify(codes));
      }
    } catch {
      // Ignorar
    }

    // Permitir si coincide el código generado o token maestro de prueba
    if (!validCode && data.token.trim() !== '123456') {
      throw new Error('El código de verificación es inválido o ha expirado.');
    }

    users[idx].password = data.password;
    this.saveLocalUsers(users);

    return {
      success: true,
      message: 'Contraseña restablecida exitosamente. Ahora puedes iniciar sesión con tu nueva contraseña.',
    };
  }
}

export const authService = new AuthService();

