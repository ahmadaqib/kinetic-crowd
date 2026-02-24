import { useEffect } from 'react';
import { PresenceChannel } from 'laravel-echo';
import { PRESENCE_CHANNEL } from '../lib/constants';
import { useReverb } from './use-reverb';
import { useRoomStore } from '../store/use-room-store';

/**
 * Sync hook untuk mengelola Presence Channel di Zustand Store.
 * Mencegah multiple join dan memberikan status koneksi yang reaktif.
 * Bahasa: Indonesia
 */
export function useRoomChannel() {
    const echo = useReverb();
    const channel = useRoomStore(s => s.channel);
    const setChannel = useRoomStore(s => s.setChannel);
    const setStatus = useRoomStore(s => s.setConnectionStatus);

    useEffect(() => {
        if (!echo || channel) return;

        console.log('--- JOINING CHANNEL ---');
        setStatus('connecting');

        const instance = echo.join(PRESENCE_CHANNEL) as PresenceChannel;

        instance.subscribed(() => {
            console.log('--- CHANNEL SUBSCRIBED ---');
            setStatus('connected');
            setChannel(instance);
        });

        instance.error((err: any) => {
            console.error('--- CHANNEL ERROR ---', err);
            setStatus('error');
        });

        // Cleanup: Sebaiknya channel jangan di-leave agar singleton tetap aktif
        // kecuali jika komponen RoomPage unmount total (bisa dihandle di RoomPage).
    }, [echo, channel, setChannel, setStatus]);

    return channel;
}
