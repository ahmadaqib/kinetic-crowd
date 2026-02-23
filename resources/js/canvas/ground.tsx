import { CuboidCollider, RigidBody } from '@react-three/rapier';

/**
 * Ground plane (lantai) sandbox.
 * Bahasa: Indonesia
 */
export function Ground() {
    return (
        <>
            <RigidBody type="fixed" restitution={0.2} friction={1} colliders={false}>
                <CuboidCollider args={[50, 0.5, 50]} position={[0, -0.5, 0]} />
                <mesh receiveShadow position={[0, -0.5, 0]}>
                    <boxGeometry args={[100, 1, 100]} />
                    <meshStandardMaterial color="#111" />
                </mesh>
            </RigidBody>

            {/* Grid helper untuk referensi visual */}
            <gridHelper args={[100, 50, '#333', '#222']} position={[0, 0.01, 0]} />
        </>
    );
}
