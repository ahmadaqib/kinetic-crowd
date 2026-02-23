import { useEffect } from 'react';
import { remoteObjectTargets } from '../canvas/objects/physics-cube';
import { MOVEMENT_CHANNEL } from '../lib/constants';
import { useRoomStore } from '../store/use-room-store';
import { useReverb } from './use-reverb';

/**
 * Hook untuk menerima data pergerakan objek environment (Host updates).
 * Bahasa: Indonesia
 */
export function useObjectSyncReceiver() {
    const echo = useReverb();
    const isHost = useRoomStore(s => s.isHost);

    useEffect(() => {
        if (!echo || isHost) return;

        const channel = echo.private(MOVEMENT_CHANNEL);

        channel.listenForWhisper('object-sync', (payload: { id: string, pos: [number, number, number], quat: [number, number, number, number] }) => {
            const { id, pos, quat } = payload;

            // Update global object target buffer
            remoteObjectTargets.set(id, { pos, quat });
        });
    }, [echo, isHost]);
}
