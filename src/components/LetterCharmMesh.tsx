/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { Quaternion, Vector3 } from "three";
import { MetalConfiguration } from "../types";
import { LetterStrokeSegment3D } from "../utils/lettering";

interface LetterCharmMeshProps {
  segments: LetterStrokeSegment3D[];
  metal: MetalConfiguration;
  finish: string;
  strokeRadius?: number;
}

const UP = new Vector3(0, 1, 0);

/**
 * Renders solid gold letter strokes — the metal literally takes the shape of
 * the word, connecting each stroke's points with an oriented cylinder segment,
 * rather than sitting on a flat plate.
 */
export function LetterCharmMesh({ segments, metal, finish, strokeRadius = 0.17 }: LetterCharmMeshProps) {
  const metalMaterialProps = useMemo(() => {
    const base = {
      color: metal.color,
      metalness: Math.min(metal.metalness, 0.88),
      roughness: metal.roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    };
    if (finish === "matte") {
      base.roughness = 0.65;
      base.metalness = 0.75;
    } else if (finish === "satin") {
      base.roughness = 0.35;
      base.metalness = 0.82;
    }
    return base;
  }, [metal, finish]);

  return (
    <group>
      {segments.map((seg, idx) => {
        const start = new Vector3(...seg.start);
        const end = new Vector3(...seg.end);
        const direction = end.clone().sub(start);
        const length = direction.length();
        if (length < 1e-4) return null;

        const mid = start.clone().add(end).multiplyScalar(0.5);
        const quaternion = new Quaternion().setFromUnitVectors(UP, direction.clone().normalize());

        return (
          <group key={idx}>
            <mesh position={mid.toArray()} quaternion={quaternion.toArray()} castShadow receiveShadow>
              <cylinderGeometry args={[strokeRadius, strokeRadius, length + strokeRadius * 0.9, 8]} />
              <meshPhysicalMaterial {...metalMaterialProps} />
            </mesh>
            {/* Rounded joint cap so consecutive segments meet smoothly */}
            <mesh position={end.toArray()} castShadow>
              <sphereGeometry args={[strokeRadius, 8, 8]} />
              <meshPhysicalMaterial {...metalMaterialProps} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}
