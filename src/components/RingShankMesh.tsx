/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from "react";
import { Vector2, DoubleSide } from "three";
import { JewelryMeasurements, MetalConfiguration } from "../types";

interface RingShankMeshProps {
  measurements: JewelryMeasurements;
  metal: MetalConfiguration;
  finish: "polished" | "matte" | "satin" | "brushed" | "hammered" | "sandblasted" | "diamond_cut";
  showDimensions?: boolean;
}

export const RingShankMesh: React.FC<RingShankMeshProps> = ({
  measurements,
  metal,
  finish,
  showDimensions = false,
}) => {
  const { innerDiameter, width, thickness, profile } = measurements;

  // Generate 2D Profile Points for Lathe Geometry
  // The Lathe revolves points around the Y-axis. 
  // Points are defined in the X-Y plane where:
  // - X is the horizontal distance from Y-axis (radius of the ring)
  // - Y is the vertical height (width of the ring band)
  const lathePoints = useMemo(() => {
    const Rin = innerDiameter / 2;
    const t = thickness;
    const w = width;
    const points: Vector2[] = [];

    const numArcPoints = 12;

    switch (profile) {
      case "half_round":
        // Curved outer side, flat inner side
        // Outer arc: X goes from Rin to Rin + t, Y goes from -w/2 to +w/2
        for (let i = 0; i <= numArcPoints; i++) {
          const theta = -Math.PI / 2 + (i * Math.PI) / numArcPoints;
          const x = Rin + t * Math.cos(theta);
          const y = (w / 2) * Math.sin(theta);
          points.push(new Vector2(x, y));
        }
        // Inner straight side (from top back to bottom)
        points.push(new Vector2(Rin, w / 2));
        points.push(new Vector2(Rin, -w / 2));
        break;

      case "comfort_fit":
        // Curved inner side (slightly rounded) and curved outer side
        // Outer arc
        for (let i = 0; i <= numArcPoints; i++) {
          const theta = -Math.PI / 2 + (i * Math.PI) / numArcPoints;
          const x = Rin + t * 0.9 + t * 0.1 * Math.cos(theta); // slight curve outer
          const y = (w / 2) * Math.sin(theta);
          points.push(new Vector2(x, y));
        }
        // Inner comfort curve (bulges slightly inwards)
        for (let i = numArcPoints; i >= 0; i--) {
          const theta = -Math.PI / 2 + (i * Math.PI) / numArcPoints;
          const x = Rin + 0.15 * t - 0.15 * t * Math.cos(theta); // curve inward
          const y = (w / 2) * Math.sin(theta);
          points.push(new Vector2(x, y));
        }
        break;

      case "oval":
        // Fully rounded oval/elliptical cross-section
        const centerOffset = Rin + t / 2;
        const radiusX = t / 2;
        const radiusY = w / 2;
        for (let i = 0; i <= numArcPoints * 2; i++) {
          const theta = (i * 2 * Math.PI) / (numArcPoints * 2);
          const x = centerOffset + radiusX * Math.cos(theta);
          const y = radiusY * Math.sin(theta);
          points.push(new Vector2(x, y));
        }
        break;

      case "beveled":
        // Flat center top, chamfered/sloped sides
        points.push(new Vector2(Rin, -w / 2));
        points.push(new Vector2(Rin + t * 0.4, -w / 2));
        points.push(new Vector2(Rin + t, -w * 0.25));
        points.push(new Vector2(Rin + t, w * 0.25));
        points.push(new Vector2(Rin + t * 0.4, w / 2));
        points.push(new Vector2(Rin, w / 2));
        points.push(new Vector2(Rin, -w / 2));
        break;

      case "knife_edge":
        // Pointed ridge in the center
        points.push(new Vector2(Rin, -w / 2));
        points.push(new Vector2(Rin + t * 0.2, -w / 2));
        points.push(new Vector2(Rin + t, 0.0)); // pointed peak
        points.push(new Vector2(Rin + t * 0.2, w / 2));
        points.push(new Vector2(Rin, w / 2));
        points.push(new Vector2(Rin, -w / 2));
        break;

      case "flat":
      default:
        // Flat rectangular cross section
        points.push(new Vector2(Rin, -w / 2));
        points.push(new Vector2(Rin + t, -w / 2));
        points.push(new Vector2(Rin + t, w / 2));
        points.push(new Vector2(Rin, w / 2));
        points.push(new Vector2(Rin, -w / 2));
        break;
    }

    return points;
  }, [innerDiameter, width, thickness, profile]);

  // Adjust material parameters based on selected surface finish
  const materialProps = useMemo(() => {
    const base = {
      color: metal.color,
      metalness: Math.min(metal.metalness, 0.88), // Cap at 0.88 for a beautiful golden diffuse color fallback
      roughness: metal.roughness,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      side: DoubleSide,
      flatShading: false,
    };

    switch (finish) {
      case "matte":
        base.roughness = 0.65;
        base.metalness = 0.75;
        base.clearcoat = 0.0;
        break;
      case "satin":
        base.roughness = 0.35;
        base.metalness = 0.82;
        base.clearcoat = 0.15;
        break;
      case "brushed":
        base.roughness = 0.45;
        base.metalness = 0.84;
        base.clearcoat = 0.2;
        base.clearcoatRoughness = 0.4;
        break;
      case "hammered":
        base.roughness = 0.05;
        base.metalness = 0.88;
        base.flatShading = true; // Use flat shading to create visible hammered facets!
        base.clearcoat = 1.0;
        base.clearcoatRoughness = 0.05;
        break;
      case "sandblasted":
        base.roughness = 0.8;
        base.metalness = 0.65;
        base.clearcoat = 0.0;
        break;
      case "diamond_cut":
        base.roughness = 0.02;
        base.metalness = 0.88;
        base.flatShading = true; // facets catch light beautifully
        base.clearcoat = 1.0;
        base.clearcoatRoughness = 0.02;
        break;
      case "polished":
      default:
        base.roughness = 0.03; // highly polished, mirror-like gloss
        base.metalness = 0.88; // solid golden metal appearance
        base.clearcoat = 1.0;
        base.clearcoatRoughness = 0.02;
        break;
    }

    return base;
  }, [metal, finish]);

  // For a hammered finish, we use fewer segments to make the facets bolder
  const segments = useMemo(() => {
    if (finish === "hammered") return 36; // Lower segment count for nice hand-crafted facets
    if (finish === "diamond_cut") return 48;
    return 80; // High smoothness for normal bands
  }, [finish]);

  return (
    <group rotation={[Math.PI / 2, 0, 0]}>
      {/* Shank Mesh */}
      <mesh castShadow receiveShadow>
        <latheGeometry args={[lathePoints, segments]} />
        <meshPhysicalMaterial {...materialProps} />
      </mesh>

      {/* Visual Dimension Guides (Toggleable) */}
      {showDimensions && (
        <group rotation={[-Math.PI / 2, 0, 0]}>
          {/* Inner Diameter Ring Guide */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[innerDiameter / 2 - 0.05, innerDiameter / 2 + 0.05, 64]} />
            <meshBasicMaterial color="#d4af37" side={DoubleSide} />
          </mesh>
          {/* Outer Diameter Ring Guide */}
          <mesh position={[0, 0, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <ringGeometry args={[(innerDiameter / 2 + thickness) - 0.05, (innerDiameter / 2 + thickness) + 0.05, 64]} />
            <meshBasicMaterial color="#3b82f6" side={DoubleSide} />
          </mesh>
        </group>
      )}
    </group>
  );
};
