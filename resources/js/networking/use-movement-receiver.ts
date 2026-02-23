import { useEffect, useRef } from 'react';
import { MOVEMENT_CHANNEL } from '../lib/constants';
import type { MovementPayload } from '../lib/types';
import { useReverb } from './use-reverb';

// Global map untuk menyimpan target pergerakan terbaru (non-reactive)
// Sesuai instruksi: koordinat tidak di Zustand.
export const remoteMovementTargets = new Map<string, {
    pos: [number, number, number],
    quat: [number, number, number, number],
    seq: number,
    t: number
}>();

/**
 * Hook untuk menerima data pergerakan via whisper.
 * Bahasa: Indonesia
 */
export function useMovementReceiver() {
    const echo = useReverb();
    const lastSeqRef = useRef<Map<string, number>>(new Map());

    useEffect(() => {
        if (!echo) return;

        const channel = echo.private(MOVEMENT_CHANNEL);

        // Listen whisper event
        // Note: Nama event whisper biasanya diawali dengan 'client-'
        channel.listenForWhisper('movement', (payload: MovementPayload) => {
            const [id, t, seq, x, y, z, qx, qy, qz, qw] = payload;

            // Discard packets dengan sequence lebih rendah (ordering)
            const lastSeq = lastSeqRef.current.get(id) || -1;
            if (seq <= lastSeq) return;

            lastSeqRef.current.set(id, seq);

            // Update global target (non-reactive)
            remoteMovementTargets.set(id, {
                pos: [x, y, z],
                quat: [qx, qy, qz, qw],
                seq,
                t
            });
        });

        return () => {
            echo.leave(MOVEMENT_CHANNEL);
        };
    }, [echo]);
}
