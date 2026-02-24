import { useEffect } from 'react';
import { remoteObjectTargets } from '../canvas/objects/physics-cube';
import { PRESENCE_CHANNEL } from '../lib/constants';
import { useRoomStore } from '../store/use-room-store';
import { useRoomChannel } from './use-room-channel';

/**
 * Hook untuk menerima data pergerakan objek environment (Host updates).
 * Bahasa: Indonesia
 */
export function useObjectSyncReceiver() {
    const isHost = useRoomStore(s => s.isHost);
    const channel = useRoomChannel();

    useEffect(() => {
        if (!channel || isHost) return;

        channel.listenForWhisper('object-sync', (payload: { id: string, pos: [number, number, number], quat: [number, number, number, number] }) => {
            const { id, pos, quat } = payload;

            // Update global object target buffer
            remoteObjectTargets.set(id, { pos, quat });
        });
    }, [channel, isHost]);
}
