/**
 * Payload movement: [id, t, seq, x, y, z, qx, qy, qz, qw]
 * Array datar agar efisiensi payload (sesuai PRD).
 */
export type MovementPayload = [
    string, // id
    number, // t (timestamp)
    number, // seq (sequence)
    number, // x
    number, // y
    number, // z
    number, // qx
    number, // qy
    number, // qz
    number, // qw
];

export interface PlayerState {
    id: string;
    name: string;
    joinedAt: number;
    // Target untuk lerp
    targetPosition: [number, number, number];
    targetQuaternion: [number, number, number, number];
    lastSeq: number;
}

export interface RoomState {
    players: Map<string, PlayerState>;
    hostId: string | null;
    isHost: boolean;
}
