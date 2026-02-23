import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { BallCollider, RigidBody } from '@react-three/rapier';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { useSessionId } from '../../identity/use-session-id';
import { MOVEMENT_CHANNEL } from '../../lib/constants';
import type { MovementPayload } from '../../lib/types';
import { useThrottledMovementBroadcast } from '../../networking/use-movement-broadcast';
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
        if (!echo) return;
        const channel = echo.private(MOVEMENT_CHANNEL);
        // Whisper event 'movement' (Laravel Reverb)
        channel.whisper('movement', payload);
    });

    useFrame((state, delta) => {
        if (!rbRef.current || !sessionId) return;

        // movement logic (Direct velocity for debug)
        const speed = 2;
        const vel = { x: 0, y: 0, z: 0 };

        if (keys.current['w'] || keys.current['arrowup']) vel.z -= speed;
        if (keys.current['s'] || keys.current['arrowdown']) vel.z += speed;
        if (keys.current['a'] || keys.current['arrowleft']) vel.x -= speed;
        if (keys.current['d'] || keys.current['arrowright']) vel.x += speed;

        const linvel = rbRef.current.linvel();

        if (vel.x !== 0 || vel.z !== 0) {
            // Apply impulse for more reliable movement with physics
            const impulseScale = 0.5;
            rbRef.current.applyImpulse(
                { x: vel.x * impulseScale, y: 0, z: vel.z * impulseScale },
                true
            );

            // Console log untuk memastikan state berubah (throttle log)
            if (seqRef.current % 30 === 0) {
                console.log('MOVING:', vel, 'POS:', rbRef.current.translation());
            }
        }

        // Custom horizontal drag using impulse to prevent overriding Y (gravity/collisions)
        // Semakin besar kecepatan X/Z, semakin besar drag berlawanan yang diberikan
        const dragFactor = 5.0 * delta;
        if (Math.abs(linvel.x) > 0.1 || Math.abs(linvel.z) > 0.1) {
            rbRef.current.applyImpulse(
                { x: -linvel.x * dragFactor, y: 0, z: -linvel.z * dragFactor },
                true
            );
        }

        // Camera follow (Penting agar pergerakan terlihat jelas!)
        const pos = rbRef.current.translation();
        const cameraTarget = new THREE.Vector3(pos.x, pos.y, pos.z);
        // Kamera berada di atas (Y+8), dan di belakang pemain (Z+10)
        // Karena di Three.js -Z adalah "maju" (menjauhi monitor), maka dengan setting ini
        // menekan 'W' (-Z) akan membuat bola bergerak menjauh (ke atas layar).
        state.camera.position.lerp(new THREE.Vector3(pos.x, pos.y + 8, pos.z + 10), 0.1);
        state.camera.lookAt(cameraTarget);

        // Broadcast posisi saat ini
        const rot = rbRef.current.rotation();

        const payload: MovementPayload = [
            sessionId,
            Date.now(),
            seqRef.current++,
            pos.x, pos.y, pos.z,
            rot.x, rot.y, rot.z, rot.w
        ];

        emit(payload);
    });

    // Randomize initial position slightly so players don't spawn exactly on top of each other
    const initialPosition = useRef<[number, number, number]>([
        Math.random() * 4 - 2, // -2 to 2
        5, // Spawn higher up to prevent clipping floor or boxes on load
        Math.random() * 4 - 2  // -2 to 2
    ]);

    return (
        <RigidBody
            ref={rbRef}
            type="dynamic"
            colliders={false}
            position={initialPosition.current}
            canSleep={false}
            enabledRotations={[false, false, false]} // Mencegah bola berguling
            restitution={0.5}
            friction={0}
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
