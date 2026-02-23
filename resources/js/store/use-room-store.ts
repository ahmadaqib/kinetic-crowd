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

    setMyId: (id) => {
        set({ myId: id });
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
            if (myId) {
                set({
                    hostId: myId,
                    isHost: true
                });
            }
            return;
        }

        // Host selection: player yang join paling lama (joinedAt terkecil)
        // Tie-break: UUID lexicographical order
        const sortedPlayers = Array.from(players.values()).sort((a, b) => {
            if (a.joinedAt !== b.joinedAt) return a.joinedAt - b.joinedAt;
            return a.id.localeCompare(b.id);
        });

        const newHostId = sortedPlayers[0]?.id || null;
        const normalizedHostId = newHostId ? String(newHostId).trim().toLowerCase() : null;

        set({
            hostId: newHostId,
            isHost: normalizedMyId === normalizedHostId && normalizedMyId !== null
        });
    }
}));
