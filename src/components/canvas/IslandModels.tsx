import { useRef, Suspense, Component, type ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

const base = import.meta.env.BASE_URL

const ISLANDS = [
  { id: 'temple',  path: `${base}models/floating-island-temple.glb`, position: [-0.2,  0.15,  0.0] as [number,number,number], rotation: [0, 0.4,  0] as [number,number,number], scale: 1.0, floatOffset: 0.0, floatSpeed: 0.42 },
  { id: 'pagoda',  path: `${base}models/pagoda.glb`,                 position: [ 1.9,  0.1,  -0.3] as [number,number,number], rotation: [0, -0.3, 0] as [number,number,number], scale: 0.8, floatOffset: 1.8, floatSpeed: 0.38 },
  { id: 'float',   path: `${base}models/floating-island.glb`,        position: [-1.9,  0.2,  -0.3] as [number,number,number], rotation: [0,  0.6, 0] as [number,number,number], scale: 0.65, floatOffset: 3.2, floatSpeed: 0.46 },
  { id: 'rock',    path: `${base}models/low-poly-rock-island.glb`,   position: [ 0.9, -1.05,  0.2] as [number,number,number], rotation: [0,  1.0, 0] as [number,number,number], scale: 0.55, floatOffset: 0.0, floatSpeed: 0.6 },
]

ISLANDS.forEach(({ path }) => useGLTF.preload(path))

function IslandGlb({ id, path, position, rotation, scale, floatOffset, floatSpeed }: typeof ISLANDS[number]) {
  const { scene } = useGLTF(path)
  const groupRef = useRef<THREE.Group>(null)
  const baseY = position[1]
  const time = useRef(floatOffset)

  const normalizedScene = (() => {
    const clone = scene.clone()
    const box = new THREE.Box3().setFromObject(clone)
    const size = new THREE.Vector3()
    box.getSize(size)
    const maxDim = Math.max(size.x, size.y, size.z)
    const s = maxDim > 0 ? 1.2 / maxDim : 1
    clone.scale.setScalar(s)
    const center = new THREE.Vector3()
    new THREE.Box3().setFromObject(clone).getCenter(center)
    clone.position.sub(center)
    return clone
  })()

  useFrame((state, delta) => {
    if (!groupRef.current) return
    const y = id === 'rock'
      ? baseY + Math.sin(state.clock.elapsedTime * 0.6) * 0.12
      : (() => { time.current += delta * floatSpeed; return baseY + Math.sin(time.current) * 0.12 })()
    groupRef.current.position.y = y
    groupRef.current.rotation.y += 0.0008
  })

  return (
    <group key={id} ref={groupRef} position={position} rotation={rotation} scale={scale}>
      <primitive object={normalizedScene} />
    </group>
  )
}

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? null : this.props.children }
}

export function IslandModels() {
  return (
    <>
      {ISLANDS.map((cfg) => (
        <ErrorBoundary key={cfg.id}>
          <Suspense fallback={null}>
            <IslandGlb {...cfg} />
          </Suspense>
        </ErrorBoundary>
      ))}
    </>
  )
}
