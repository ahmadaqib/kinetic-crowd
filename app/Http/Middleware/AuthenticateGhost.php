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
        // Ambil session ID dari header, query, json body, lalu fallback ke socket_id
        $sessionId = $request->header('X-Session-ID') 
            ?? $request->input('session_id') 
            ?? $request->input('socket_id');

        if ($sessionId) {
            // Gunakan GenericUser untuk menghindari masalah model User default
            // yang meng-cast UUID string non-numeric menjadi integer 0.
            $user = new \Illuminate\Auth\GenericUser([
                'id' => $sessionId,
                'name' => 'Ghost'
            ]);
            
            // Login user secara temporer untuk request ini
            Auth::setUser($user);
        }

        return $next($request);
    }
}
