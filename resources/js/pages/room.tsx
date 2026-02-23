import { Head } from '@inertiajs/react';
import { Scene } from '../canvas/scene';
import { useMovementReceiver } from '../networking/use-movement-receiver';
import { useObjectSyncReceiver } from '../networking/use-object-sync';
import { usePresence } from '../networking/use-presence';
import { useRoomStore } from '../store/use-room-store';

/**
 * Halaman utama Room Sandbox.
 * Bahasa: Indonesia
 */
export default function RoomPage() {
    // Inisialisasi presence, movement, dan object sync
    usePresence();
    useMovementReceiver();
    useObjectSyncReceiver();

    const playerCount = useRoomStore(s => s.players.size);
    const isHost = useRoomStore(s => s.isHost);
    const myId = useRoomStore(s => s.myId);

    return (
        <div className="relative h-screen w-screen overflow-hidden bg-black text-white">
            <Head title="Sandbox Room" />

            {/* Canvas 3D (Background / Main View) */}
            <Scene />

            {/* HUD Overlay - Sesuai instruksi: pointer-events-none */}
            <div className="pointer-events-none absolute inset-0 flex flex-col items-start justify-start p-6">
                <div className="pointer-events-auto rounded-lg bg-black/50 p-4 backdrop-blur-sm border border-white/10">
                    <h1 className="text-xl font-bold tracking-tight">THE KINETIC CROWD</h1>
                    <div className="mt-2 space-y-1 text-sm opacity-80">
                        <p>Session ID: <span className="text-pink-400 font-mono text-[10px]">{myId?.substring(0, 8) || 'CONNECTING...'}</span></p>
                        <p>Players Online: <span className="text-blue-400 font-mono">{playerCount}</span></p>
                        <p>Status: <span className={isHost ? "text-green-400" : "text-yellow-400"}>
                            {isHost ? "KAMU ADALAH HOST" : "TAMU (GUEST)"}
                        </span></p>
                    </div>
                </div>

                <div className="mt-auto pointer-events-auto rounded-lg bg-black/30 p-2 text-xs opacity-50">
                    Kontrol: WASD untuk bergerak
                </div>
            </div>
        </div>
    );
}
