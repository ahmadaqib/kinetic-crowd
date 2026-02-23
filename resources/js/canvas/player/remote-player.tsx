import { Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import type { RapierRigidBody } from '@react-three/rapier';
import { RigidBody } from '@react-three/rapier';
import { useRef } from 'react';
import * as THREE from 'three';
import { LERP_DAMPING } from '../../lib/constants';
import { computeAlpha } from '../../lib/lerp';
import { remoteMovementTargets } from '../../networking/use-movement-receiver';

interface Props {
    id: string;
}

/**
 * Player remote (player lain).
 * Menggunakan pergerakan kinematic dan interpolasi (lerp).
 * Bahasa: Indonesia
 */
export function RemotePlayer({ id }: Props) {
    const rbRef = useRef<RapierRigidBody>(null);
    const meshRef = useRef<THREE.Mesh>(null);

    // Buffer target pergerakan
    const targetRef = useRef({
        pos: new THREE.Vector3(0, 5, 0),
        quat: new THREE.Quaternion(0, 0, 0, 1),
        hasSync: false,
    });

    useFrame((_, delta) => {
        if (!rbRef.current) return;

        // Ambil target pergerakan terbaru dari buffer networking (non-reactive)
        const target = remoteMovementTargets.get(id);
        if (target) {
            targetRef.current.pos.set(target.pos[0], target.pos[1], target.pos[2]);
            targetRef.current.quat.set(target.quat[0], target.quat[1], target.quat[2], target.quat[3]);
            targetRef.current.hasSync = true;
        }

        if (!targetRef.current.hasSync) return;

        // Interpolasi: lerp target murni (sesuai PRD)
        // Alpha = 1 - Math.pow(damping, delta) -> Frame-rate independent
        const alpha = computeAlpha(LERP_DAMPING, delta);

        // Pindahkan kinematic body secara fisik
        const currentPos = rbRef.current.translation();
        const currentQuat = rbRef.current.rotation();

        const nextPos = new THREE.Vector3(currentPos.x, currentPos.y, currentPos.z)
            .lerp(targetRef.current.pos, alpha);

        const nextQuat = new THREE.Quaternion(currentQuat.x, currentQuat.y, currentQuat.z, currentQuat.w)
            .slerp(targetRef.current.quat, alpha);

        rbRef.current.setNextKinematicTranslation(nextPos);
        rbRef.current.setNextKinematicRotation(nextQuat);
    });

    return (
        <RigidBody
            ref={rbRef}
            type="kinematicPosition"
            colliders="ball"
            position={[0, 5, 0]} // Awal di udara sampai ada sync
            name={`remote-player-${id}`}
        >
            <mesh ref={meshRef}>
                <sphereGeometry args={[0.5, 32, 32]} />
                <meshStandardMaterial color="#6366f1" roughness={0.5} opacity={0.8} transparent />
            </mesh>

            {/* Label ID Player */}
            <Text
                position={[0, 0.8, 0]}
                fontSize={0.2}
                color="white"
                anchorX="center"
                anchorY="middle"
            >
                {typeof id === 'string' ? id.substring(0, 4) : '????'}...
            </Text>
        </RigidBody>
    );
}
