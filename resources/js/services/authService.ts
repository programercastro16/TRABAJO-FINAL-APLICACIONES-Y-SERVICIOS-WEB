
import {
  User,
  RegisterData,
  LoginData,
  UpdateProfileData,
  ResetPasswordData,
} from '../types';

const STORAGE_KEYS = {
  CURRENT_USER: 'conobras_auth_user_v1',
  TOKEN: 'conobras_auth_token_v1',
};

class AuthService {
  /**
   * Obtiene el token de autenticación almacenado.
   */
  private getToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Construye las cabeceras para las solicitudes a Laravel.
   */
  private defaultHeaders(): HeadersInit {
    const token = this.getToken();

    return {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };
  }

  /**
   * Procesa las respuestas de la API y presenta errores de validación.
   */
  private async handleResponse<T>(res: Response): Promise<T> {
    const json = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(
          json.message || 'La sesión no es válida. Inicia sesión nuevamente.'
        );
      }

      if (json.errors) {
        const validationMessages = Object.values(
          json.errors as Record<string, string[]>
        )
          .flat()
          .join(' ');

        throw new Error(
          validationMessages || json.message || 'Error de validación.'
        );
      }

      throw new Error(
        json.message || `Error del servidor (${res.status}).`
      );
    }

    return json as T;
  }

  /**
   * Guarda los datos de la sesión.
   * El token se almacena separado de la información del usuario.
   */
  private saveSession(user: User, token: string): User {
    const safeUser = { ...user };
    delete safeUser.token;
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    localStorage.setItem(
      STORAGE_KEYS.CURRENT_USER,
      JSON.stringify(safeUser)
    );

    return safeUser;
  }

  /**
   * Elimina los datos de autenticación locales.
   */
  private clearSession(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
  }

  /**
   * Obtiene el usuario guardado en el navegador.
   * No confirma por sí solo que el token siga vigente.
   */
  getCurrentUser(): User | null {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);

      if (!data) return null;

      const user = JSON.parse(data) as User;

      // Migración de sesiones antiguas:
      // recupera tokens reales, pero descarta los tokens locales ficticios.
      if (user.token) {
        if (!user.token.startsWith('local-token-')) {
          localStorage.setItem(STORAGE_KEYS.TOKEN, user.token);
        }

        delete user.token;

        localStorage.setItem(
          STORAGE_KEYS.CURRENT_USER,
          JSON.stringify(user)
        );
      }

      return user;
    } catch {
      return null;
    }
  }

  /**
   * Registro de un nuevo usuario mediante Laravel.
   */
  async register(
    data: RegisterData
  ): Promise<{ user: User; message: string }> {
    const payload = {
      name: data.name.trim(),
      email: data.email.trim().toLowerCase(),
      password: data.password,
      password_confirmation:
        data.password_confirmation ?? data.password,
      phone: data.phone?.trim() || '',
      company: data.company?.trim() || '',
    };

    const res = await fetch('/api/auth/register', {
      method: 'POST',
      headers: this.defaultHeaders(),
      body: JSON.stringify(payload),
    });

    const json = await this.handleResponse<{
      success: boolean;
      message: string;
      user: User;
      token: string;
    }>(res);

    const user = this.saveSession(json.user, json.token);

    return {
      user,
      message: json.message || 'Usuario registrado exitosamente.',
    };
  }

  /**
   * Inicio de sesión mediante Laravel.
   */
  async login(
    data: LoginData
  ): Promise<{ user: User; message: string }> {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: this.defaultHeaders(),
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        password: data.password,
      }),
    });

    const json = await this.handleResponse<{
      success: boolean;
      message: string;
      user: User;
      token: string;
    }>(res);

    const user = this.saveSession(json.user, json.token);

    return {
      user,
      message: json.message || 'Inicio de sesión exitoso.',
    };
  }

  /**
   * Verifica el token y obtiene el usuario autenticado desde Laravel.
   */
  async getMe(): Promise<User> {
    const token = this.getToken();

    if (!token) {
      this.clearSession();
      throw new Error('No existe una sesión activa.');
    }

    const res = await fetch('/api/auth/me', {
      method: 'GET',
      headers: this.defaultHeaders(),
    });

    const json = await this.handleResponse<{
      success: boolean;
      user: User;
    }>(res);

    const user = this.saveSession(json.user, token);

    return user;
  }

  /**
   * Cierra la sesión y revoca el token en Laravel.
   */
  async logout(): Promise<void> {
    try {
      if (this.getToken()) {
        const res = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: this.defaultHeaders(),
        });

        if (!res.ok && res.status !== 401) {
          console.warn('Laravel no pudo confirmar el cierre de sesión.');
        }
      }
    } catch (error) {
      console.warn(
        'No fue posible contactar al servidor para cerrar sesión.',
        error
      );
    } finally {
      this.clearSession();
    }
  }

  /**
   * Actualiza el perfil del usuario autenticado.
   */
  async updateProfile(
    data: UpdateProfileData
  ): Promise<{ user: User; message: string }> {
    if (!this.getToken()) {
      throw new Error('No hay una sesión activa.');
    }

    const res = await fetch('/api/auth/profile', {
      method: 'PUT',
      headers: this.defaultHeaders(),
      body: JSON.stringify({
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        phone: data.phone?.trim() || '',
        company: data.company?.trim() || '',
        current_password: data.current_password,
        new_password: data.new_password,
        new_password_confirmation:
          data.new_password_confirmation,
      }),
    });

    const json = await this.handleResponse<{
      success: boolean;
      message: string;
      user: User;
    }>(res);

    const currentToken = this.getToken();

    if (!currentToken) {
      throw new Error('La sesión expiró. Inicia sesión nuevamente.');
    }

    const user = this.saveSession(json.user, currentToken);

    return {
      user,
      message: json.message || 'Perfil actualizado exitosamente.',
    };
  }

  /**
   * Solicita instrucciones para recuperar la contraseña.
   */
  async requestPasswordReset(
    email: string
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: this.defaultHeaders(),
      body: JSON.stringify({
        email: email.trim().toLowerCase(),
      }),
    });

    const json = await this.handleResponse<{
      success: boolean;
      message: string;
    }>(res);

    return {
      success: json.success,
      message:
        json.message ||
        'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
    };
  }

  /**
   * Restablece la contraseña utilizando el token enviado por Laravel.
   */
  async resetPassword(
    data: ResetPasswordData
  ): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/reset-password', {
      method: 'POST',
      headers: this.defaultHeaders(),
      body: JSON.stringify({
        email: data.email.trim().toLowerCase(),
        token: data.token.trim(),
        password: data.password,
        password_confirmation:
          data.password_confirmation ?? data.password,
      }),
    });

    const json = await this.handleResponse<{
      success: boolean;
      message: string;
    }>(res);

    return {
      success: json.success,
      message:
        json.message || 'Contraseña restablecida correctamente.',
    };
  }
}

export const authService = new AuthService();
