/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { DoubleSide } from "three";
import { StoneInstance, MetalConfiguration } from "../types";
import { getPerimeterPoints } from "../utils/perimeters";

interface StoneMeshProps {
  stone: StoneInstance;
  metal: MetalConfiguration;
  isSelected?: boolean;
  onSelect?: (e: any) => void;
  lowPerformance?: boolean;
  ringOuterRadius?: number;
}

export const StoneMesh: React.FC<StoneMeshProps> = ({
  stone,
  metal,
  isSelected = false,
  onSelect,
  lowPerformance = false,
  ringOuterRadius,
}) => {
  const { shape, width, length, depth, color, settingType, position, rotation } = stone;

  // Calculate distance from center to find shankOffset
  const d = useMemo(() => {
    if (!position) return 0;
    return Math.sqrt(position[0] ** 2 + position[1] ** 2 + position[2] ** 2);
  }, [position]);

  const shankOffset = useMemo(() => {
    if (!ringOuterRadius || d <= 0) return 0;
    // Calculate exact distance from center of stone to the shank outer surface
    return Math.max(0, d - ringOuterRadius);
  }, [ringOuterRadius, d]);

  // 1. Core Gemstone Geometry
  // We approximate different cuts using basic 3D primitives to guarantee rendering without external files.
  const stoneGeometry = useMemo(() => {
    // We scale the base shapes according to width, length, depth
    // The pavilion (bottom) is a cone, crown (top) is a cylinder/girdle
    return null; // Render dynamically in JSX to avoid hook overhead for many items
  }, []);

  // Physically Based Diamond/Gemstone Material
  const gemMaterialProps = useMemo(() => {
    if (lowPerformance) {
      return {
        color: color || "#ffffff",
        roughness: 0.1,
        metalness: 0.1,
        transparent: true,
        opacity: 0.75,
        transmission: 0.4,
        ior: 1.5,
      };
    }
    
    // Premium refractive diamond material
    const isSapphire = stone.type.toLowerCase().includes("sapphire") || stone.family === "gemstone";
    const gemColor = isSapphire ? "#1d4ed8" : (color || "#ffffff");

    return {
      color: gemColor,
      roughness: 0.02,
      metalness: 0.1, // Gives high-lustre diamond brilliance to facet edges in Three.js
      clearcoat: 1.0,
      clearcoatRoughness: 0.0,
      transmission: isSapphire ? 0.35 : 0.45, // Cap transmission to ensure solid gemstone outlines are beautifully visible
      opacity: 1.0,
      thickness: depth || 1.5, // physical thickness for refraction
      ior: isSapphire ? 1.76 : 2.417, // Diamond IOR is 2.417, Sapphire is 1.76
      side: DoubleSide,
    };
  }, [color, depth, stone.type, stone.family, lowPerformance]);

  // Metal Setting Material
  const metalMaterialProps = useMemo(() => {
    return {
      color: metal.color,
      roughness: metal.roughness,
      metalness: Math.min(metal.metalness, 0.88), // Cap at 0.88 for golden fallback
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
    };
  }, [metal]);

  const handlePointerDown = (e: any) => {
    if (onSelect) {
      e.stopPropagation();
      onSelect(e);
    }
  };

  // Render Stone Shape Group
  const renderStoneShape = () => {
    const rx = width / 2;
    const rz = length / 2;
    const h = depth;

    if (shape === "round" || shape === "oval") {
      return (
        <group scale={[rx, h, rz]}>
          {/* Table & Crown */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.6, 1.0, 0.3, 16, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
          {/* Pavilion (Conical Point) */}
          <mesh position={[0, -0.35, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.0, 0.7, 16, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
        </group>
      );
    }

    if (shape === "princess" || shape === "cushion") {
      const segs = shape === "cushion" ? 16 : 4;
      const rot = shape === "princess" ? Math.PI / 4 : 0;
      return (
        <group scale={[rx, h, rz]} rotation={[0, rot, 0]}>
          {/* Top Crown Box */}
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.7, 1.0, 0.3, segs, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
          {/* Bottom Pavilion Pyramid */}
          <mesh position={[0, -0.35, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.0, 0.7, segs, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
        </group>
      );
    }

    if (shape === "emerald") {
      // Step-cut represented by a chamfered octagon-like box
      return (
        <group scale={[rx, h, rz]}>
          <mesh position={[0, 0.15, 0]}>
            <cylinderGeometry args={[0.7, 1.0, 0.3, 8, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
          <mesh position={[0, -0.35, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.0, 0.7, 8, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
        </group>
      );
    }

    if (shape === "pear" || shape === "marquise") {
      // Teardrop shape approximated by asymmetric scaling
      return (
        <group scale={[rx, h, rz]}>
          {/* We combine a round cut and taper it on Z */}
          <mesh position={[0, 0.15, -0.1]}>
            <cylinderGeometry args={[0.5, 1.0, 0.3, 12, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
          <mesh position={[0, -0.35, -0.1]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[1.0, 0.7, 12, 1, false]} />
            <meshPhysicalMaterial {...gemMaterialProps} />
          </mesh>
        </group>
      );
    }

    // Default round cut fallback
    return (
      <mesh scale={[rx, h / 2, rz]}>
        <cylinderGeometry args={[1, 1, 2, 8, 1, false]} />
        <meshPhysicalMaterial {...gemMaterialProps} />
      </mesh>
    );
  };

  // Render Metal Setting
  const renderSetting = () => {
    const sw = width / 2;
    const sl = length / 2;
    const sh = depth;
    const prongRadius = 0.16; // slightly thicker prongs for premium realism
    const prongHeight = sh + 0.5;
    const topY = prongHeight / 2 - sh * 0.45 + prongHeight / 2; // top of prong shaft

    // Help specify segments, rotation, and scale for other setting shapes like bezel
    let segments = 24;
    let rotY = 0;
    let scaleX = 1;
    let scaleZ = 1;

    if (shape === "princess") {
      segments = 4;
      rotY = Math.PI / 4; // aligns with the rotated princess stone
    } else if (shape === "cushion") {
      segments = 16;
      rotY = 0;
    } else if (shape === "emerald") {
      segments = 8;
      rotY = 0; // step-cut alignment with flat axes
    } else if (shape === "oval" || shape === "pear" || shape === "marquise") {
      segments = 24;
      scaleX = sw / Math.max(sw, sl);
      scaleZ = sl / Math.max(sw, sl);
    }

    const baseRadius = Math.max(sw, sl);

    // 1. Get exact prong coordinate anchors based on perimeter mathematics
    const getProngPositions = () => {
      switch (shape) {
        case "round": {
          const isSix = settingType === "six_prong";
          const angles = isSix 
            ? [0, Math.PI / 3, (2 * Math.PI) / 3, Math.PI, (4 * Math.PI) / 3, (5 * Math.PI) / 3]
            : [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
          const r = sw * 0.98;
          return angles.map(a => ({
            x: r * Math.cos(a),
            z: r * Math.sin(a)
          }));
        }
        case "oval": {
          const angles = [Math.PI / 4, (3 * Math.PI) / 4, (5 * Math.PI) / 4, (7 * Math.PI) / 4];
          return angles.map(a => ({
            x: sw * 0.96 * Math.cos(a),
            z: sl * 0.96 * Math.sin(a)
          }));
        }
        case "princess": {
          return [
            { x: -sw * 0.96, z: -sl * 0.96 },
            { x: sw * 0.96, z: -sl * 0.96 },
            { x: -sw * 0.96, z: sl * 0.96 },
            { x: sw * 0.96, z: sl * 0.96 }
          ];
        }
        case "emerald": {
          const chamfer = Math.min(width, length) * 0.15;
          const dx = sw - chamfer * 0.4;
          const dz = sl - chamfer * 0.4;
          return [
            { x: -dx, z: -dz },
            { x: dx, z: -dz },
            { x: -dx, z: dz },
            { x: dx, z: dz }
          ];
        }
        case "cushion": {
          const r = Math.min(width, length) * 0.25;
          const dx = sw - r * 0.3;
          const dz = sl - r * 0.3;
          return [
            { x: -dx, z: -dz },
            { x: dx, z: -dz },
            { x: -dx, z: dz },
            { x: dx, z: dz }
          ];
        }
        case "pear": {
          // 1 V-prong at tip (z = sl) and 4 round prongs on the bottom curve
          return [
            { x: 0, z: sl, isTipProtection: true, angleY: 0 },
            { x: -sw * 0.92, z: -sl * 0.3 },
            { x: sw * 0.92, z: -sl * 0.3 },
            { x: -sw * 0.55, z: -sl * 0.85 },
            { x: sw * 0.55, z: -sl * 0.85 }
          ];
        }
        case "marquise": {
          // 2 V-prongs at tips (z = ±sl) and 4 side prongs
          return [
            { x: 0, z: sl, isTipProtection: true, angleY: 0 },
            { x: 0, z: -sl, isTipProtection: true, angleY: Math.PI },
            { x: -sw * 0.92, z: -sl * 0.3 },
            { x: sw * 0.92, z: -sl * 0.3 },
            { x: -sw * 0.92, z: sl * 0.3 },
            { x: sw * 0.92, z: sl * 0.3 }
          ];
        }
        default:
          return [
            { x: -sw * 0.95, z: -sl * 0.95 },
            { x: sw * 0.95, z: -sl * 0.95 },
            { x: -sw * 0.95, z: sl * 0.95 },
            { x: sw * 0.95, z: sl * 0.95 }
          ];
      }
    };

    const prongs = getProngPositions();

    // 2. Procedural Gallery Rail constructor along true perimeter points
    const renderGalleryRail = (yPos: number, thicknessFactor: number, perimeterScale = 1.0) => {
      const pts = getPerimeterPoints(shape, width, length, 24);
      const meshes: React.ReactNode[] = [];
      for (let i = 0; i < pts.length; i++) {
        const p1 = pts[i].clone().multiplyScalar(perimeterScale);
        const p2 = pts[(i + 1) % pts.length].clone().multiplyScalar(perimeterScale);
        
        const dx = p2.x - p1.x;
        const dz = p2.y - p1.y; // 2D y is 3D z
        const dist = Math.sqrt(dx * dx + dz * dz);
        const midX = (p1.x + p2.x) / 2;
        const midZ = (p1.y + p2.y) / 2;
        const angle = Math.atan2(dx, dz);
        
        meshes.push(
          <mesh 
            key={`rail-${yPos}-${i}`} 
            position={[midX, yPos, midZ]} 
            rotation={[Math.PI / 2, 0, angle]} 
            castShadow
          >
            <cylinderGeometry args={[thicknessFactor, thicknessFactor, dist * 1.05, 6]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
        );
      }
      return <group>{meshes}</group>;
    };

    const pillarHeight = Math.max(0.1, shankOffset - sh * 0.55);
    const pillarY = -sh * 0.55 - pillarHeight / 2;

    if (settingType === "four_prong" || settingType === "six_prong") {
      return (
        <group rotation={[0, rotY, 0]}>
          {/* A. Dynamic Prongs following actual perimeter, featuring triangular V-prongs for tips */}
          {prongs.map((pr, idx) => {
            if (pr.isTipProtection) {
              return (
                <group key={`prong_${idx}`} position={[pr.x, prongHeight / 2 - sh * 0.45, pr.z]} rotation={[0, pr.angleY || 0, 0]}>
                  {/* Triangular prismatic shape */}
                  <mesh castShadow>
                    <cylinderGeometry args={[prongRadius * 1.4, prongRadius * 1.4, prongHeight, 3]} />
                    <meshPhysicalMaterial {...metalMaterialProps} />
                  </mesh>
                  {/* Matching triangular claw cap */}
                  <mesh position={[0, prongHeight / 2 - 0.05, 0]} castShadow>
                    <sphereGeometry args={[prongRadius * 1.6, 12, 12]} />
                    <meshPhysicalMaterial {...metalMaterialProps} />
                  </mesh>
                </group>
              );
            } else {
              const rxVal = pr.x;
              const rzVal = pr.z;
              const norm = Math.sqrt(rxVal * rxVal + rzVal * rzVal);
              const inwardOverlap = 0.12;
              const cx = rxVal - (rxVal / norm) * inwardOverlap;
              const cz = rzVal - (rzVal / norm) * inwardOverlap;
              
              return (
                <group key={`prong_${idx}`}>
                  <mesh position={[rxVal, prongHeight / 2 - sh * 0.45, rzVal]} castShadow>
                    <cylinderGeometry args={[prongRadius * 0.9, prongRadius, prongHeight, 8]} />
                    <meshPhysicalMaterial {...metalMaterialProps} />
                  </mesh>
                  <mesh position={[cx, topY - 0.05, cz]} castShadow>
                    <sphereGeometry args={[prongRadius * 1.3, 12, 12]} />
                    <meshPhysicalMaterial {...metalMaterialProps} />
                  </mesh>
                </group>
              );
            }
          })}

          {/* B. True custom envelope rails along the exact mathematical perimeter of the stone */}
          {renderGalleryRail(-sh * 0.05, prongRadius * 0.6, 1.01)}
          {renderGalleryRail(-sh * 0.55, prongRadius * 0.7, 0.7)}

          {/* C. Solid gold support pillars reaching down to the shank */}
          {shankOffset > 0 && (
            <group>
              {/* Support legs placed symmetrically around 4 quadrants */}
              {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((ang, idx) => {
                const px = Math.cos(ang) * sw * 0.6;
                const pz = Math.sin(ang) * sl * 0.6;
                return (
                  <mesh key={`supp_${idx}`} position={[px, pillarY, pz]} castShadow>
                    <cylinderGeometry args={[prongRadius * 1.0, prongRadius * 1.2, pillarHeight, 8]} />
                    <meshPhysicalMaterial {...metalMaterialProps} />
                  </mesh>
                );
              })}
              {/* Sturdy core central support stem */}
              <mesh position={[0, pillarY, 0]} castShadow>
                <cylinderGeometry args={[prongRadius * 1.6, prongRadius * 2.2, pillarHeight, 8]} />
                <meshPhysicalMaterial {...metalMaterialProps} />
              </mesh>
            </group>
          )}
        </group>
      );
    }

    if (settingType === "bezel") {
      // Premium bezel with rounded top polished lip that curves onto the gemstone, perfectly following its contours
      return (
        <group scale={[scaleX, 1, scaleZ]}>
          {/* Bezel Collar Wall matching the shape */}
          <mesh position={[0, sh * 0.05, 0]} rotation={[0, rotY, 0]} castShadow receiveShadow>
            <cylinderGeometry args={[baseRadius + 0.32, baseRadius + 0.28, sh + 0.35, segments, 1, false]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
          {/* Rounded polished metal lip covering gemstone border, matched to square/round contour */}
          {shape === "princess" || shape === "emerald" || shape === "cushion" ? (
            <mesh position={[0, sh * 0.23, 0]} rotation={[0, rotY, 0]} castShadow>
              <cylinderGeometry args={[baseRadius + 0.34, baseRadius + 0.16, 0.18, segments, 1, false]} />
              <meshPhysicalMaterial {...metalMaterialProps} />
            </mesh>
          ) : (
            <mesh position={[0, sh * 0.23, 0]} rotation={[Math.PI / 2, rotY, 0]} castShadow>
              <torusGeometry args={[baseRadius + 0.12, 0.18, 12, segments]} />
              <meshPhysicalMaterial {...metalMaterialProps} />
            </mesh>
          )}
        </group>
      );
    }

    if (settingType === "channel") {
      // Premium thick polished channel walls
      return (
        <group>
          <mesh position={[0, sh * 0.1, -sl - 0.2]} castShadow receiveShadow>
            <boxGeometry args={[sw * 2.1, sh + 0.3, 0.45]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
          <mesh position={[0, sh * 0.1, sl + 0.2]} castShadow receiveShadow>
            <boxGeometry args={[sw * 2.1, sh + 0.3, 0.45]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
        </group>
      );
    }

    if (settingType === "pave" || settingType === "shared_prong") {
      // Tiny polished bead prongs/grains surrounding pavé stones to secure them beautifully
      return (
        <group>
          <mesh position={[-sw * 0.8, sh * 0.3, -sl * 0.8]} castShadow>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
          <mesh position={[sw * 0.8, sh * 0.3, -sl * 0.8]} castShadow>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
          <mesh position={[-sw * 0.8, sh * 0.3, sl * 0.8]} castShadow>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
          <mesh position={[sw * 0.8, sh * 0.3, sl * 0.8]} castShadow>
            <sphereGeometry args={[0.22, 10, 10]} />
            <meshPhysicalMaterial {...metalMaterialProps} />
          </mesh>
        </group>
      );
    }

    return null;
  };

  return (
    <group
      position={position}
      rotation={rotation}
      onPointerDown={handlePointerDown}
    >
      {/* Visual Selection Highlight wireframe */}
      {isSelected && (
        <mesh position={[0, 0.1, 0]}>
          <boxGeometry args={[width + 0.8, depth + 1.2, length + 0.8]} />
          <meshBasicMaterial color="#d4af37" wireframe transparent opacity={0.7} />
        </mesh>
      )}

      {/* Gemstone Mesh */}
      {renderStoneShape()}

      {/* Setting/Prongs Mesh */}
      {renderSetting()}
    </group>
  );
};
