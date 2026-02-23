import { create } from 'zustand';
import type { PlayerState } from '../lib/types';

interface RoomStore {
    myId: string | null;
    players: Map<string, Pick<PlayerState, 'id' | 'name' | 'joinedAt'>>;
    hostId: string | null;
    isHost: boolean;

    // Actions
    setMyId: (id: string) => void;
    addPlayer: (id: string, name: string, joinedAt: number) => void;
    removePlayer: (id: string) => void;
    updatePlayers: (players: Array<{ id: string, name: string, joinedAt: number }>) => void;
    electHost: () => void;
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

    setMyId: (id) => set({ myId: id }),

    addPlayer: (id, name, joinedAt) => {
        set((state) => {
            const newPlayers = new Map(state.players);
            newPlayers.set(id, { id, name, joinedAt });
            return { players: newPlayers };
        });
        get().electHost();
    },

    removePlayer: (id) => {
        set((state) => {
            const newPlayers = new Map(state.players);
            newPlayers.delete(id);
            return { players: newPlayers };
        });
        get().electHost();
    },

    updatePlayers: (playerList) => {
        const newPlayers = new Map();
        playerList.forEach(p => newPlayers.set(p.id, p));
        set({ players: newPlayers });
        get().electHost();
    },

    electHost: () => {
        const { players, myId } = get();
        if (players.size === 0) return;

        // Host selection: player yang join paling lama (joinedAt terkecil)
        // Tie-break: UUID lexicographical order
        const sortedPlayers = Array.from(players.values()).sort((a, b) => {
            if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
            return a.id.localeCompare(b.id);
        });

        const newHostId = sortedPlayers[0]?.id || null;
        set({
            hostId: newHostId,
            isHost: myId === newHostId
        });
    }
}));
