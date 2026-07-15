/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { DoubleSide } from "three";
import { JewelryMeasurements, MetalConfiguration, StoneInstance } from "../types";
import { StoneMesh } from "./StoneMesh";

interface BraceletMeshProps {
  measurements: JewelryMeasurements;
  metal: MetalConfiguration;
  stones: StoneInstance[];
  finish: string;
  selectedStoneId: string | null;
  onSelectStone: (id: string) => void;
  lowPerformance?: boolean;
}

export const BraceletMesh: React.FC<BraceletMeshProps> = ({
  measurements,
  metal,
  stones,
  finish,
  selectedStoneId,
  onSelectStone,
  lowPerformance = false,
}) => {
  const { width, thickness } = measurements;

  // Material settings for link boxes
  const metalMaterialProps = useMemo(() => {
    const base = {
      color: metal.color,
      metalness: Math.min(metal.metalness, 0.88), // Cap at 0.88 for golden fallback
      roughness: metal.roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: DoubleSide,
    };

    if (finish === "matte") {
      base.roughness = 0.65;
      base.metalness = 0.75;
    } else if (finish === "satin") {
      base.roughness = 0.35;
      base.metalness = 0.82;
    } else if (finish === "hammered") {
      base.roughness = 0.05;
      base.metalness = 0.88;
    }

    return base;
  }, [metal, finish]);

  // Laid out flat in a straight line for design work — a bracelet/necklace
  // chain only curves into a circle once it's actually worn.
  const lastStone = stones[stones.length - 1];
  const claspX = lastStone ? lastStone.position[0] + width * 1.6 : 0;

  return (
    <group>
      {/* 1. Clasp / Lock Box at one end of the line */}
      {stones.length > 1 && (
        <group position={[claspX, 0, 0]} rotation={[0, 0, 0]}>
          {/* Main lock box */}
          <mesh castShadow receiveShadow>
            <boxGeometry args={[width * 1.3, thickness * 1.1, width * 2.2]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
          {/* Small safety latch */}
          <mesh position={[0, 0, width * 1.3]}>
            <boxGeometry args={[width * 0.8, thickness * 0.6, 0.2]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
        </group>
      )}

      {/* 2. Render each link + stone along the straight line */}
      {stones.map((stone, idx) => {
        const isSelected = selectedStoneId === stone.id;

        // Shift the link box base slightly below so the stone and its prongs sit on top of it, beautifully visible!
        const baseThickness = thickness * 0.35;
        const inwardShift = 0.65;
        const basePosition: [number, number, number] = [
          stone.position[0],
          stone.position[1] - inwardShift,
          stone.position[2],
        ];

        // Draw a modular link box enclosing each stone
        return (
          <group key={stone.id || idx}>
            {/* Metal Link Box Geometry */}
            <mesh position={basePosition} castShadow receiveShadow>
              {/* Box casing with a hollow pocket for the stone */}
              <boxGeometry
                args={[
                  width * 1.05,       // link width along the line
                  baseThickness,     // thinner base link thickness
                  width * 1.05        // link length across the band
                ]}
              />
              <meshPhysicalMaterial {...metalMaterialProps} />
            </mesh>

            {/* Micro hinge connecting pins (draw between adjacent links) */}
            {idx < stones.length - 1 && (
              <mesh
                position={[
                  (stone.position[0] + stones[idx + 1].position[0]) / 2,
                  (stone.position[1] + stones[idx + 1].position[1]) / 2,
                  (stone.position[2] + stones[idx + 1].position[2]) / 2,
                ]}
                rotation={[Math.PI / 2, 0, 0]}
              >
                <cylinderGeometry args={[0.25, 0.25, width * 0.9, 8]} />
                <meshPhysicalMaterial {...metalMaterialProps} {...(finish === "matte" ? { roughness: 0.8 } : {})} />
              </mesh>
            )}

            {/* The stone itself with its setting/prongs (pushed out slightly from box top) */}
            <StoneMesh
              stone={stone}
              metal={metal}
              isSelected={isSelected}
              onSelect={() => onSelectStone(stone.id)}
              lowPerformance={lowPerformance}
            />
          </group>
        );
      })}
    </group>
  );
};
