import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { RigidBody } from '@react-three/rapier';
import { useRef, useState, useEffect } from 'react';
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

        // movement logic
        const impulse = { x: 0, y: 0, z: 0 };
        const speed = 20 * delta;

        if (keys.current['w'] || keys.current['arrowup']) impulse.z -= speed;
        if (keys.current['s'] || keys.current['arrowdown']) impulse.z += speed;
        if (keys.current['a'] || keys.current['arrowleft']) impulse.x -= speed;
        if (keys.current['d'] || keys.current['arrowright']) impulse.x += speed;

        rbRef.current.applyImpulse(impulse, true);

        // Limit velocity (drag sederhana)
        const linvel = rbRef.current.linvel();
        rbRef.current.setLinvel({
            x: linvel.x * 0.95,
            y: linvel.y,
            z: linvel.z * 0.95
        }, true);

        // Broadcast posisi saat ini
        const pos = rbRef.current.translation();
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

    return (
        <RigidBody
            ref={rbRef}
            colliders="ball"
            position={[0, 2, 0]}
            enabledRotations={[false, false, false]} // Mencegah bola berguling
            restitution={0.5}
            friction={1}
            name="local-player"
        >
            <mesh castShadow>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="#3b82f6" roughness={0.3} metalness={0.8} />
            </mesh>
        </RigidBody>
    );
}
