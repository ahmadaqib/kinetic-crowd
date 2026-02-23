import { useEffect, useState } from 'react';

/**
 * Hook untuk mendapatkan atau membuat Session ID (UUID) yang disimpan di sessionStorage.
 * Session ID ini digunakan untuk identifikasi player tanpa perlu login.
 * Bahasa: Indonesia (sesuai instruksi user)
 */
export function useSessionId() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        // Ambil dari session storage jika sudah ada
        let id = sessionStorage.getItem('kinetic_session_id');

        if (!id) {
            // Jika belum ada, generate UUID baru
            id = crypto.randomUUID();
            sessionStorage.setItem('kinetic_session_id', id);
        }

        setSessionId(id);
    }, []);

    return sessionId;
}
