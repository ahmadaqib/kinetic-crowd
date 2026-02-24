import Echo, { PresenceChannel } from 'laravel-echo';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { BallCollider, RigidBody } from '@react-three/rapier';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSessionId } from '../../identity/use-session-id';
import { PRESENCE_CHANNEL } from '../../lib/constants';
import type { MovementPayload } from '../../lib/types';
import { useThrottledMovementBroadcast } from '../../networking/use-movement-broadcast';
import { useRoomChannel } from '../../networking/use-room-channel';
import { useRoomStore } from '../../store/use-room-store';
import { useReverb } from '../../networking/use-reverb';

/**
 * Player yang dikontrol oleh user lokal.
 * Bahasa: Indonesia
 */
export function LocalPlayer() {
    const rbRef = useRef<RapierRigidBody>(null);
    const echo = useReverb();
    const sessionId = useSessionId();
    const seqRef = useRef(0);
    const channel = useRoomChannel();
    const channelRef = useRef(channel);

    // Update ref on every render
    useEffect(() => {
        channelRef.current = channel;
    });

    // Track input
    const keys = useRef<{ [key: string]: boolean }>({});

    useEffect(() => {
        const handleDown = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = true;
        const handleUp = (e: KeyboardEvent) => keys.current[e.key.toLowerCase()] = false;

        window.addEventListener('keydown', handleDown);
        window.addEventListener('keyup', handleUp);
        return () => {
            window.removeEventListener('keydown', handleDown);
            window.removeEventListener('keyup', handleUp);
        };
    }, []);

    // Helper untuk broadcast pergerakan via whisper
    const { emit } = useThrottledMovementBroadcast((payload) => {
        channelRef.current?.whisper('movement', payload);
    });

    const myId = useRoomStore(s => s.myId);

    useFrame((state) => {
        if (!rbRef.current || !myId) return;

        // movement logic (Vector based for snappy feel)
        const speed = 7; // Speed ditingkatkan
        const vel = { x: 0, y: 0, z: 0 };

        if (keys.current['w'] || keys.current['arrowup']) vel.z -= speed;
        if (keys.current['s'] || keys.current['arrowdown']) vel.z += speed;
        if (keys.current['a'] || keys.current['arrowleft']) vel.x -= speed;
        if (keys.current['d'] || keys.current['arrowright']) vel.x += speed;

        // Gunakan setLinvel untuk kontrol presisi pada sumbu horizontal
        // tapi tetap pertahankan velocity Y (gravitasi)
        const currentLinvel = rbRef.current.linvel();
        rbRef.current.setLinvel(
            { x: vel.x, y: currentLinvel.y, z: vel.z },
            true
        );

        // Camera follow
        const pos = rbRef.current.translation();
        const cameraTarget = new THREE.Vector3(pos.x, pos.y, pos.z);
        state.camera.position.lerp(new THREE.Vector3(pos.x, pos.y + 8, pos.z + 10), 0.1);
        state.camera.lookAt(cameraTarget);

        // Broadcast posisi saat ini
        const rot = rbRef.current.rotation();

        const payload: MovementPayload = [
            myId,
            Date.now(),
            seqRef.current++,
            pos.x, pos.y, pos.z,
            rot.x, rot.y, rot.z, rot.w
        ];

        emit(payload);

    });

    // Randomize initial position sedikit lebih tinggi
    const initialPosition = useRef<[number, number, number]>([
        Math.random() * 4 - 2,
        8,
        Math.random() * 4 - 2
    ]);

    return (
        <RigidBody
            ref={rbRef}
            type="dynamic"
            colliders={false}
            position={initialPosition.current}
            canSleep={false}
            enabledRotations={[true, true, true]} // Bola bisa berguling (roll)
            restitution={0.5}
            friction={0.2} // Sedikit gesekan agar tidak licin sekali
            name="local-player"
        >
            <BallCollider args={[0.5]} />
            <mesh castShadow>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
            </mesh>
        </RigidBody>
    );
}
