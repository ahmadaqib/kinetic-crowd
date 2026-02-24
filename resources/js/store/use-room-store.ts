import { create } from 'zustand';
import { PresenceChannel } from 'laravel-echo';
import type { PlayerState } from '../lib/types';

interface RoomStore {
    myId: string | null;
    players: Map<string, Pick<PlayerState, 'id' | 'name' | 'joinedAt'>>;
    hostId: string | null;
    isHost: boolean;
    channel: PresenceChannel | null;
    connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';

    // Actions
    setMyId: (id: string) => void;
    addPlayer: (id: string, name: string, joinedAt: number) => void;
    removePlayer: (id: string) => void;
    updatePlayers: (players: Array<{ id: string, name: string, joinedAt: number }>) => void;
    electHost: () => void;
    setChannel: (channel: PresenceChannel | null) => void;
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => void;
}

/**
 * Zustand Store untuk Presence Registry.
 * Sesuai instruksi: TIDAK menyimpan koordinat x, y, z di sini.
 * Koordinat akan dikelola lewat ref/imperative mutation.
 */
export const useRoomStore = create<RoomStore>((set, get) => ({
    myId: null,
    players: new Map(),
    hostId: null,
    isHost: false,
    channel: null,
    connectionStatus: 'disconnected',

    setChannel: (channel: PresenceChannel | null) => set({ channel }),
    setConnectionStatus: (status: 'disconnected' | 'connecting' | 'connected' | 'error') => set({ connectionStatus: status }),

    setMyId: (id: string) => {
        const idString = String(id).trim().toLowerCase();
        set({ myId: idString });
        get().electHost();
    },

    addPlayer: (id, name, joinedAt) => {
        const idString = String(id).trim().toLowerCase();
        set((state) => {
            const newPlayers = new Map(state.players);
            newPlayers.set(idString, { id: idString, name, joinedAt });
            return { players: newPlayers };
        });
        get().electHost();
    },

    removePlayer: (id) => {
        const idString = String(id).trim().toLowerCase();
        set((state) => {
            const newPlayers = new Map(state.players);
            newPlayers.delete(idString);
            return { players: newPlayers };
        });
        get().electHost();
    },

    updatePlayers: (playerList) => {
        const newPlayers = new Map();
        playerList.forEach(p => {
            const idString = String(p.id).trim().toLowerCase();
            newPlayers.set(idString, { ...p, id: idString });
        });
        set({ players: newPlayers });
        get().electHost();
    },

    electHost: () => {
        const { players, myId } = get();
        const normalizedMyId = myId ? String(myId).trim().toLowerCase() : null;

        if (players.size === 0) {
            if (normalizedMyId) {
                set({ hostId: normalizedMyId, isHost: true });
            }
            return;
        }

        // Host selection: player yang join paling lama (joinedAt terkecil)
        const sortedPlayers = Array.from(players.values()).sort((a, b) => {
            if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
            return a.id.localeCompare(b.id);
        });

        const oldestActive = sortedPlayers[0];
        const newHostId = oldestActive?.id || null;
        const normalizedHostId = newHostId ? String(newHostId).trim().toLowerCase() : null;

        const amIHost = normalizedMyId === normalizedHostId && normalizedMyId !== null;

        // Diagnostic log: Sangat penting untuk Debug Zombie
        console.log('ELECT HOST:', {
            activeCount: players.size,
            myId: normalizedMyId,
            hostId: normalizedHostId,
            amIHost,
            players: Array.from(players.keys())
        });

        set({
            hostId: normalizedHostId,
            isHost: amIHost
        });
    }
}));
