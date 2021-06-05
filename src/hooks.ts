import React, { useCallback, useContext as useContextImpl, useRef } from 'react'
import { Mesh, Vector3 } from 'three'
import { flexContext, boxContext } from './context'

export function useContext<T>(context: React.Context<T>) {
  let result = useContextImpl(context)
  if (!result) {
    console.warn('You must place this hook/component under a <Flex/> component!')
  }
  return result
}

export function useScaleFactor() {
  const { scaleFactor } = useContext(flexContext)
  return scaleFactor
}

export function useReflow() {
  const { requestReflow } = useContext(flexContext)
  return requestReflow
}

export function useFlexSize() {
  const { size } = useContext(boxContext)
  return size
}

export function useNode() {
  const { node } = useContext(boxContext)
  return node
}

export function useSetSize(): (width: number, height: number) => void {
  const scaleFactor = useScaleFactor()
  const node = useNode()
  const reflow = useReflow()

  const sync = useCallback(
    (width: number, height: number) => {
      if (node == null) {
        throw new Error('yoga node is null. sync size is impossible')
      }
      node.setWidth(width * scaleFactor)
      node.setHeight(height * scaleFactor)
      reflow()
    },
    [node, reflow]
  )

  return sync
}

const helperVector = new Vector3()

export function useSyncGeometrySize(): (mesh: Mesh) => void {
  const setSize = useSetSize()
  return useCallback((mesh: Mesh) => {
    mesh.updateMatrixWorld()
    helperVector.setFromMatrixScale(mesh.matrixWorld)
    if (Math.abs(helperVector.x - helperVector.y) > 0.001 || Math.abs(helperVector.y - helperVector.z) > 0.001) {
      throw new Error('text scaled ununiformly')
    }
    const worldScale = helperVector.x
    mesh.geometry.computeBoundingBox()
    const box = mesh.geometry.boundingBox!
    setSize((box.max.x - box.min.x) * worldScale, (box.max.y - box.min.y) * worldScale)
  }, [])
}
