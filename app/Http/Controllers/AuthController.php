<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\Rule;
use App\Models\User;

class AuthController extends Controller
{
    /**
     * Register a new user
     */
    public function register(Request $request)
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => trim($validated['name']),
            'email' => strtolower(trim($validated['email'])),
            'password' => $validated['password'],
            'phone' => $validated['phone'] ?? '',
            'role' => 'Usuario',
            'company' => $validated['company'] ?? 'Conobras Construcción + Arquitectura',
            'avatar' => '',
        ]);

        $token = $user->createToken('conobras-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Usuario registrado exitosamente en Conobras Quote.',
            'user' => $user->toFrontendArray(),
            'token' => $token,
        ], 201);
    }

    /**
     * Login user
     */
    public function login(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $identifier = strtolower(trim($validated['email']));

        $user = User::where('email', $identifier)
            ->orWhereRaw('LOWER(name) = ?', [$identifier])
            ->first();

        if (!$user || !Hash::check($validated['password'], $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales inválidas. Verifica tu correo y contraseña.',
            ], 401);
        }

        $token = $user->createToken('conobras-web')->plainTextToken;

        return response()->json([
            'success' => true,
            'message' => 'Inicio de sesión exitoso.',
            'user' => $user->toFrontendArray(),
            'token' => $token,
        ]);
    }

    /**
     * Get current user
     */
    public function me(Request $request)
    {
        return response()->json([
            'success' => true,
            'user' => $request->user()->toFrontendArray(),
        ]);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')->ignore($user->id),
            ],
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'current_password' => 'required_with:new_password|string',
            'new_password' => 'nullable|string|min:8|confirmed',
        ]);

        if (!empty($validated['new_password'])) {
            if (!Hash::check($validated['current_password'], $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual no es correcta.',
                ], 422);
            }

            $user->password = $validated['new_password'];
        }

        $user->name = trim($validated['name']);
        $user->email = strtolower(trim($validated['email']));
        $user->phone = $validated['phone'] ?? '';
        $user->company = $validated['company'] ?? $user->company;

        // El rol no se recibe ni se modifica desde el formulario público.
        $user->save();

        return response()->json([
            'success' => true,
            'message' => 'Perfil actualizado exitosamente.',
            'user' => $user->toFrontendArray(),
        ]);
    }

    /**
     * Request password reset code
     */
    /**
 * Request password reset link
 */
    public function forgotPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($validated['email']));

        Password::sendResetLink([
            'email' => $email,
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Si el correo está registrado, recibirás instrucciones para restablecer tu contraseña.',
        ]);
    }

    /**
     * Reset password with verification code
     */
    /**
 * Reset password using Laravel password broker
 */
    public function resetPassword(Request $request)
    {
        $validated = $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:8|confirmed',
        ]);

        $email = strtolower(trim($validated['email']));

        $status = Password::reset(
            [
                'email' => $email,
                'token' => $validated['token'],
                'password' => $validated['password'],
                'password_confirmation' => $request->input('password_confirmation'),
            ],
            function (User $user, string $password) {
                $user->forceFill([
                    'password' => Hash::make($password),
                ])->save();

                // Revocar los tokens anteriores por seguridad.
                $user->tokens()->delete();
            }
        );

        if ($status !== Password::PASSWORD_RESET) {
            return response()->json([
                'success' => false,
                'message' => 'El enlace de recuperación es inválido o ha expirado.',
            ], 422);
        }

        return response()->json([
            'success' => true,
            'message' => 'Contraseña restablecida correctamente. Ya puedes iniciar sesión con tu nueva clave.',
        ]);
    }

    /**
     * Logout
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }
}

