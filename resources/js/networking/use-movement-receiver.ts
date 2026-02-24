import { useEffect, useRef } from 'react';
import { PRESENCE_CHANNEL } from '../lib/constants';
import type { MovementPayload } from '../lib/types';
import { useRoomChannel } from './use-room-channel';

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
    const lastSeqRef = useRef<Map<string, number>>(new Map());
    const channel = useRoomChannel();

    useEffect(() => {
        if (!channel) return;

        // Listen whisper event
        channel.listenForWhisper('movement', (payload: MovementPayload) => {
            const [rawId, t, seq, x, y, z, qx, qy, qz, qw] = payload;
            const id = String(rawId).trim().toLowerCase();

            if (seq % 100 === 0) console.log('--- WHISPER RECEIVED ---', id, seq);

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
    }, [channel]);
}
