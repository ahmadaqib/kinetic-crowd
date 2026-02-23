import { Canvas } from '@react-three/fiber';
import { Physics } from '@react-three/rapier';
import { Suspense } from 'react';
import { useRoomStore } from '../store/use-room-store';
import { Ground } from './ground';
import { PhysicsCube } from './objects/physics-cube';
import { LocalPlayer } from './player/local-player';
import { RemotePlayer } from './player/remote-player';

/**
 * Scene container: R3F Canvas + Rapier Physics
 * Bahasa: Indonesia
 */
export function Scene() {
    // Ambil list player dari store (hanya ID)
    const players = useRoomStore(s => s.players);
    const myId = useRoomStore(s => s.myId);

    // Filter remote players (exclude me dengan pengecekan string yang aman)
    const remotePlayers = Array.from(players.keys()).filter(id => {
        if (!myId) return true;
        return String(id).trim() !== String(myId).trim();
    });

    return (
        <Canvas
            shadows
            camera={{ position: [0, 10, 15], fov: 45 }}
            style={{ position: 'absolute', top: 0, left: 0 }}
        >
            <color attach="background" args={['#050505']} />
            <fog attach="fog" args={['#050505', 10, 50]} />

            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1.5} castShadow />
            <directionalLight
                position={[-10, 20, 10]}
                intensity={1}
                castShadow
                shadow-mapSize={[2048, 2048]}
            />

            <Suspense fallback={null}>
                <Physics gravity={[0, -9.81, 0]} debug>
                    <Ground />

                    <PhysicsCube id="cube-1" position={[2, 5, 0]} color="#ef4444" />
                    <PhysicsCube id="cube-2" position={[-2, 5, 2]} color="#fbbf24" />
                    <PhysicsCube id="cube-3" position={[0, 8, -2]} color="#10b981" />
                    <PhysicsCube id="cube-4" position={[3, 10, 3]} color="#3b82f6" />
                    <PhysicsCube id="cube-5" position={[-3, 12, -3]} color="#8b5cf6" />

                    {/* Player Lokal */}
                    <LocalPlayer />

                    {/* Player Remote */}
                    {remotePlayers.map(id => (
                        <RemotePlayer key={id} id={id} />
                    ))}
                </Physics>
            </Suspense>
        </Canvas>
    );
}
