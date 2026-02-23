import { useEffect, useRef } from 'react';
import { TICK_MS } from '../lib/constants';
import type { MovementPayload } from '../lib/types';

/**
 * Hook untuk membatasi frekuensi broadcast pergerakan ke 20Hz (50ms).
 * Diadaptasi dari PRD.
 * Bahasa: Indonesia
 */
export function useThrottledMovementBroadcast(
    send: (payload: MovementPayload) => void,
    tickMs = TICK_MS
) {
    const lastSentAtRef = useRef(0);
    const queuedRef = useRef<MovementPayload | null>(null);
    const timerRef = useRef<number | null>(null);

    const flush = () => {
        if (queuedRef.current) {
            send(queuedRef.current);
            queuedRef.current = null;
            lastSentAtRef.current = performance.now();
        }
        timerRef.current = null;
    };

    const emit = (payload: MovementPayload) => {
        queuedRef.current = payload;
        const now = performance.now();
        const remaining = tickMs - (now - lastSentAtRef.current);

        if (remaining <= 0) {
            flush();
            return;
        }

        if (timerRef.current === null) {
            timerRef.current = window.setTimeout(flush, remaining);
        }
    };

    useEffect(() => {
        return () => {
            if (timerRef.current !== null) {
                clearTimeout(timerRef.current);
            }
        };
    }, []);

    return { emit };
}
