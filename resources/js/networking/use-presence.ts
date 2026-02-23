import { useEffect } from 'react';
import { useSessionId } from '../identity/use-session-id';
import { PRESENCE_CHANNEL } from '../lib/constants';
import { useRoomStore } from '../store/use-room-store';
import { useReverb } from './use-reverb';

/**
 * Hook untuk mengelola kehadiran (presence) di dalam room.
 * Bahasa: Indonesia
 */
export function usePresence() {
    const echo = useReverb();
    const sessionId = useSessionId();
    const setMyId = useRoomStore(s => s.setMyId);
    const updatePlayers = useRoomStore(s => s.updatePlayers);
    const addPlayer = useRoomStore(s => s.addPlayer);
    const removePlayer = useRoomStore(s => s.removePlayer);

    useEffect(() => {
        if (!sessionId) return;
        setMyId(sessionId);
    }, [sessionId, setMyId]);

    useEffect(() => {
        if (!echo || !sessionId) return;

        const channel = echo.join(PRESENCE_CHANNEL);

        channel.here((users: Array<{ id: string; name: string; joined_at?: number }>) => {
            // users adalah array of {id, name, joined_at}
            // sesuaikan mapping jika perlu
            const mapped = users.map(u => ({
                id: u.id,
                name: u.name,
                joinedAt: u.joined_at || Date.now()
            }));
            updatePlayers(mapped);
        })
            .joining((user: { id: string; name: string; joined_at?: number }) => {
                addPlayer(user.id, user.name, user.joined_at || Date.now());
            })
            .leaving((user: { id: string; name: string }) => {
                removePlayer(user.id);
            });

        return () => {
            echo.leave(PRESENCE_CHANNEL);
        };
    }, [echo, sessionId, addPlayer, removePlayer, updatePlayers]);
}
