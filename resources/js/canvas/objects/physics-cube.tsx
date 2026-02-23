import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { RigidBody } from '@react-three/rapier';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { MOVEMENT_CHANNEL, LERP_DAMPING } from '../../lib/constants';
import { computeAlpha } from '../../lib/lerp';
import { useReverb } from '../../networking/use-reverb';
import { useRoomStore } from '../../store/use-room-store';

interface Props {
    id: string;
    position: [number, number, number];
    color?: string;
}

// Global map untuk object sync (non-reactive)
export const remoteObjectTargets = new Map<string, {
    pos: [number, number, number],
    quat: [number, number, number, number]
}>();

/**
 * Kubus interaktif yang tersinkronisasi antar tab.
 * Host mensimulasikan fisika (dynamic), Guest mengikuti (kinematic).
 * Bahasa: Indonesia
 */
export function PhysicsCube({ id, position, color = "#ef4444" }: Props) {
    const rbRef = useRef<RapierRigidBody>(null);
    const isHost = useRoomStore(s => s.isHost);
    const echo = useReverb();
    const lastBroadcastRef = useRef(0);

    // Buffer target untuk guest
    const targetRef = useRef({
        pos: new THREE.Vector3(...position),
        quat: new THREE.Quaternion(0, 0, 0, 1)
    });

    useFrame((_, delta) => {
        if (!rbRef.current) return;

        if (isHost) {
            // LOGIKA HOST: Broadcast posisi objek ke Guest setiap 100ms (P3 bisa lebih lambat dari player)
            const now = performance.now();
            if (now - lastBroadcastRef.current > 100 && echo) {
                const pos = rbRef.current.translation();
                const rot = rbRef.current.rotation();

                echo.private(MOVEMENT_CHANNEL).whisper('object-sync', {
                    id,
                    pos: [pos.x, pos.y, pos.z],
                    quat: [rot.x, rot.y, rot.z, rot.w]
                });
                lastBroadcastRef.current = now;
            }
        } else {
            // LOGIKA GUEST: Follow Host data
            const target = remoteObjectTargets.get(id);
            if (target) {
                targetRef.current.pos.set(...target.pos);
                targetRef.current.quat.set(...target.quat);
            }

            // Interpolation smooth
            const alpha = computeAlpha(LERP_DAMPING, delta);
            const currentPos = rbRef.current.translation();
            const currentQuat = rbRef.current.rotation();

            const nextPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)
                .lerp(targetRef.current.pos, alpha);
            const nextQuat = new THREE.Quaternion(currentQuat.x, currentQuat.y, currentQuat.z, currentQuat.w)
                .slerp(targetRef.current.quat, alpha);

            rbRef.current.setNextKinematicTranslation(nextPos);
            rbRef.current.setNextKinematicRotation(nextQuat);
        }
    });

    return (
        <RigidBody
            ref={rbRef}
            type={isHost ? "dynamic" : "kinematicPosition"}
            position={position}
            restitution={0.5}
            friction={0.5}
            name={`cube-${id}`}
        >
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
            </mesh>
        </RigidBody>
    );
}
