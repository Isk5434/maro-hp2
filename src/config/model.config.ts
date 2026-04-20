const base = import.meta.env.BASE_URL

export const MODEL_CONFIG = {
  path: `${base}models/main-model.glb`,

  position: [0, 0.6, 0] as [number, number, number],
  scale: [1, 1, 1] as [number, number, number],
  rotation: [0, 4.538, 0] as [number, number, number],

  autoRotate: false,
  autoRotateSpeed: 0.004,

  usePrimitives: false,
}
