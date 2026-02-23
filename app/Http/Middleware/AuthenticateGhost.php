<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\User;

class AuthenticateGhost
{
    /**
     * Handle an incoming request.
     * Middleware ini mengautentikasi "Ghost" user berdasarkan X-Session-ID.
     * Bahasa: Indonesia
     */
    public function handle(Request $request, Closure $next)
    {
        // Ambil session ID dari header atau request
        $sessionId = $request->header('X-Session-ID') ?? $request->input('socket_id');

        if ($sessionId) {
            // Gunakan User model standar tapi tidak di-save ke DB secara permanen jika tidak perlu
            // Namun untuk Reverb, kita butuh instance Authenticatable.
            // Kita buat instance User "virtual"
            $user = new User();
            $user->id = $sessionId; // UUID sebagai ID
            $user->name = 'Ghost';
            
            // Login user secara temporer untuk request ini
            Auth::setUser($user);
        }

        return $next($request);
    }
}
