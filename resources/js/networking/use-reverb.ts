import Echo from 'laravel-echo';
import Pusher from 'pusher-js';
import { useEffect, useState } from 'react';
import { useSessionId } from '../identity/use-session-id';

// Windows compatibility: Pusher di window
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(window as any).Pusher = Pusher;

let echoInstance: Echo<'reverb'> | null = null;

/**
 * Hook untuk inisialisasi dan akses Laravel Echo (Reverb).
 * Singleton pattern untuk memastikan hanya ada satu koneksi.
 */
export function useReverb() {
    const sessionId = useSessionId();
    const [echo, setEcho] = useState<Echo<'reverb'> | null>(echoInstance);

    useEffect(() => {
        if (!sessionId || echoInstance) return;

        // Inisialisasi Echo
        echoInstance = new Echo({
            broadcaster: 'reverb',
            key: import.meta.env.VITE_REVERB_APP_KEY,
            wsHost: import.meta.env.VITE_REVERB_HOST,
            wsPort: import.meta.env.VITE_REVERB_PORT,
            wssPort: import.meta.env.VITE_REVERB_PORT,
            forceTLS: import.meta.env.VITE_REVERB_SCHEME === 'https',
            enabledTransports: ['ws', 'wss'],
            // Inject session ID as authorizer header if needed or just use for auth
            auth: {
                headers: {
                    'X-Session-ID': sessionId,
                },
            },
        });

        setEcho(echoInstance);
    }, [sessionId]);

    return echo;
}
