import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { CuboidCollider, RigidBody } from '@react-three/rapier';
import { useRef, useEffect } from 'react';
import * as THREE from 'three';
import { PRESENCE_CHANNEL } from '../../lib/constants';
import { useRoomChannel } from '../../networking/use-room-channel';
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
 * Host mensimulasikan fisika (dynamic), Guest mengikuti (dynamic dengan client-prediction).
 * Bahasa: Indonesia
 */
export function PhysicsCube({ id, position, color = "#ef4444" }: Props) {
    const rbRef = useRef<RapierRigidBody>(null);
    const isHost = useRoomStore(s => s.isHost);
    const channel = useRoomChannel();
    const channelRef = useRef(channel);
    const lastBroadcastRef = useRef(0);

    // Update ref on setiap render
    useEffect(() => {
        channelRef.current = channel;
    });

    useFrame(() => {
        if (!rbRef.current) return;

        if (isHost) {
            // LOGIKA HOST: Broadcast posisi objek ke Guest setiap 100ms (P3 bisa lebih lambat dari player)
            const now = performance.now();
            if (now - lastBroadcastRef.current > 100 && channelRef.current) {
                const pos = rbRef.current.translation();
                const rot = rbRef.current.rotation();

                channelRef.current.whisper('object-sync', {
                    id,
                    pos: [pos.x, pos.y, pos.z],
                    quat: [rot.x, rot.y, rot.z, rot.w]
                });
                lastBroadcastRef.current = now;
            }
        } else {
            // LOGIKA GUEST: Follow Host data tapi tetap "dynamic" agar bisa didorong lokal (Client Prediction)
            const target = remoteObjectTargets.get(id);
            if (!target) return;

            const currentPos = rbRef.current.translation();
            const currentQuat = rbRef.current.rotation();
            const targetPos = new THREE.Vector3(target.pos[0], target.pos[1], target.pos[2]);
            const targetQuat = new THREE.Quaternion(target.quat[0], target.quat[1], target.quat[2], target.quat[3]);

            // Jarak antara simulasi guest dan canonical host
            const dist = targetPos.distanceTo(currentPos);

            // Jika terlalu melenceng (beda > 0.5 unit), tarik paksa mendekati posisi host
            // (Client-Side Prediction Correction)
            if (dist > 0.5) {
                const nextPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z).lerp(targetPos, 0.2);
                const nextQuat = new THREE.Quaternion(currentQuat.x, currentQuat.y, currentQuat.z, currentQuat.w).slerp(targetQuat, 0.2);

                rbRef.current.setTranslation(nextPos, true);
                rbRef.current.setRotation(nextQuat, true);
            }
        }
    });

    return (
        <RigidBody
            ref={rbRef}
            type="dynamic"
            position={position}
            colliders={false}
            canSleep={false}
            restitution={0.5}
            friction={0.5}
            name={`cube-${id}`}
        >
            <CuboidCollider args={[0.5, 0.5, 0.5]} />
            <mesh castShadow receiveShadow>
                <boxGeometry args={[1, 1, 1]} />
                <meshStandardMaterial color={color} roughness={0.4} metalness={0.2} />
            </mesh>
        </RigidBody>
    );
}
