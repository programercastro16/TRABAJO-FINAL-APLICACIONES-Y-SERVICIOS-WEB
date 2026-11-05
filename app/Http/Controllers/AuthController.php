<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
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
            'password' => 'required|string|min:6',
            'phone' => 'nullable|string|max:50',
            'role' => 'nullable|string|max:100',
            'company' => 'nullable|string|max:255',
        ]);

        $user = User::create([
            'name' => $validated['name'],
            'email' => strtolower(trim($validated['email'])),
            'password' => Hash::make($validated['password']),
            'phone' => $validated['phone'] ?? '',
            'role' => $validated['role'] ?? 'Arquitecto / Administrador',
            'company' => $validated['company'] ?? 'Conobras Construcción + Arquitectura',
            'avatar' => '',
        ]);

        $token = bin2hex(random_bytes(32));

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
        $request->validate([
            'email' => 'required|string',
            'password' => 'required|string',
        ]);

        $loginIdentifier = strtolower(trim($request->input('email')));
        $password = $request->input('password');

        // Allow login by email or name
        $user = User::where('email', $loginIdentifier)
            ->orWhere('name', $loginIdentifier)
            ->first();

        if (!$user || !Hash::check($password, $user->password)) {
            return response()->json([
                'success' => false,
                'message' => 'Credenciales inválidas. Verifica tu correo y contraseña.',
            ], 401);
        }

        $token = bin2hex(random_bytes(32));

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
        $email = $request->query('email');
        if ($email) {
            $user = User::where('email', strtolower(trim($email)))->first();
            if ($user) {
                return response()->json([
                    'success' => true,
                    'user' => $user->toFrontendArray()
                ]);
            }
        }

        // Default or first user fallback
        $firstUser = User::first();
        if ($firstUser) {
            return response()->json([
                'success' => true,
                'user' => $firstUser->toFrontendArray()
            ]);
        }

        return response()->json(['success' => false, 'message' => 'No hay sesión activa.'], 404);
    }

    /**
     * Update user profile
     */
    public function updateProfile(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'role' => 'nullable|string|max:100',
            'company' => 'nullable|string|max:255',
            'current_password' => 'nullable|string',
            'new_password' => 'nullable|string|min:6',
        ]);

        $id = $request->input('id');
        $user = null;

        if ($id) {
            $user = User::find($id);
        }

        if (!$user) {
            $user = User::where('email', strtolower(trim($request->input('email'))))->first();
        }

        if (!$user) {
            $user = User::first();
        }

        if (!$user) {
            return response()->json(['success' => false, 'message' => 'Usuario no encontrado.'], 404);
        }

        // Check if email changed and is taken
        $newEmail = strtolower(trim($request->input('email')));
        if ($newEmail !== $user->email) {
            $existing = User::where('email', $newEmail)->where('id', '!=', $user->id)->first();
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'message' => 'El correo electrónico ya está registrado por otro usuario.',
                ], 422);
            }
            $user->email = $newEmail;
        }

        $user->name = $request->input('name');
        if ($request->has('phone')) $user->phone = $request->input('phone');
        if ($request->has('role')) $user->role = $request->input('role');
        if ($request->has('company')) $user->company = $request->input('company');
        if ($request->has('avatar')) $user->avatar = $request->input('avatar');

        // Optional password change
        $newPassword = $request->input('new_password');
        if (!empty($newPassword)) {
            $currentPassword = $request->input('current_password');
            if (!empty($currentPassword) && !Hash::check($currentPassword, $user->password)) {
                return response()->json([
                    'success' => false,
                    'message' => 'La contraseña actual no es correcta.',
                ], 422);
            }
            $user->password = Hash::make($newPassword);
        }

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
    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        $email = strtolower(trim($request->input('email')));
        $user = User::where('email', $email)->first();

        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'No existe ninguna cuenta asociada a este correo electrónico.',
            ], 404);
        }

        // Generate 6-digit verification code
        $code = (string) mt_rand(100000, 999999);

        // Store in password_reset_tokens
        DB::table('password_reset_tokens')->updateOrInsert(
            ['email' => $email],
            [
                'token' => $code,
                'created_at' => now(),
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Código de recuperación generado correctamente.',
            'code' => $code, // Returned for easy recovery / testing in local environments
            'email' => $email,
        ]);
    }

    /**
     * Reset password with verification code
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'token' => 'required|string',
            'password' => 'required|string|min:6',
        ]);

        $email = strtolower(trim($request->input('email')));
        $token = trim($request->input('token'));
        $newPassword = $request->input('password');

        $record = DB::table('password_reset_tokens')
            ->where('email', $email)
            ->where('token', $token)
            ->first();

        if (!$record) {
            return response()->json([
                'success' => false,
                'message' => 'El código de verificación es inválido o ha expirado.',
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
            return response()->json([
                'success' => false,
                'message' => 'Usuario no encontrado.',
            ], 404);
        }

        $user->password = Hash::make($newPassword);
        $user->save();

        // Clear used reset token
        DB::table('password_reset_tokens')->where('email', $email)->delete();

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
        return response()->json([
            'success' => true,
            'message' => 'Sesión cerrada exitosamente.',
        ]);
    }
}

