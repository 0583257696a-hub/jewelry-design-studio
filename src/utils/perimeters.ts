/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Vector2 } from "three";

/**
 * Sampling points along the perimeter of a Round shape.
 */
export function getRoundPerimeter(width: number, length: number, count = 24): Vector2[] {
  const r = width / 2;
  const points: Vector2[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i * Math.PI * 2) / count;
    points.push(new Vector2(r * Math.cos(theta), r * Math.sin(theta)));
  }
  return points;
}

/**
 * Sampling points along the perimeter of an Oval (true ellipse).
 */
export function getOvalPerimeter(width: number, length: number, count = 24): Vector2[] {
  const rx = width / 2;
  const ry = length / 2;
  const points: Vector2[] = [];
  for (let i = 0; i < count; i++) {
    const theta = (i * Math.PI * 2) / count;
    points.push(new Vector2(rx * Math.cos(theta), ry * Math.sin(theta)));
  }
  return points;
}

/**
 * Princess: Square or rectangular perimeter.
 */
export function getPrincessPerimeter(width: number, length: number, count = 16): Vector2[] {
  const w = width / 2;
  const l = length / 2;
  const points: Vector2[] = [];
  
  // Create 4 straight sides
  const ptsPerSide = Math.max(1, Math.floor(count / 4));
  
  // Top edge (left to right)
  for (let i = 0; i < ptsPerSide; i++) {
    const t = i / ptsPerSide;
    points.push(new Vector2(-w + t * (w * 2), l));
  }
  // Right edge (top to bottom)
  for (let i = 0; i < ptsPerSide; i++) {
    const t = i / ptsPerSide;
    points.push(new Vector2(w, l - t * (l * 2)));
  }
  // Bottom edge (right to left)
  for (let i = 0; i < ptsPerSide; i++) {
    const t = i / ptsPerSide;
    points.push(new Vector2(w - t * (w * 2), -l));
  }
  // Left edge (bottom to top)
  for (let i = 0; i < ptsPerSide; i++) {
    const t = i / ptsPerSide;
    points.push(new Vector2(-w, -l + t * (l * 2)));
  }
  
  return points;
}

/**
 * Emerald: Octagon with corner chamfers.
 */
export function getEmeraldPerimeter(width: number, length: number, count = 16): Vector2[] {
  const w = width / 2;
  const l = length / 2;
  // Chamfer amount is typically 15-20% of the smaller dimension
  const chamfer = Math.min(width, length) * 0.15;
  
  // Define 8 key vertices
  const v = [
    new Vector2(-w + chamfer, l),      // 0: top-left start
    new Vector2(w - chamfer, l),       // 1: top-right start
    new Vector2(w, l - chamfer),       // 2: right-top start
    new Vector2(w, -l + chamfer),      // 3: right-bottom start
    new Vector2(w - chamfer, -l),      // 4: bottom-right start
    new Vector2(-w + chamfer, -l),     // 5: bottom-left start
    new Vector2(-w, -l + chamfer),     // 6: left-bottom start
    new Vector2(-w, l - chamfer),      // 7: left-top start
  ];

  const points: Vector2[] = [];
  const segments = 8;
  const ptsPerSeg = Math.max(1, Math.floor(count / segments));

  for (let s = 0; s < segments; s++) {
    const pStart = v[s];
    const pEnd = v[(s + 1) % segments];
    for (let i = 0; i < ptsPerSeg; i++) {
      const t = i / ptsPerSeg;
      points.push(new Vector2(pStart.x + t * (pEnd.x - pStart.x), pStart.y + t * (pEnd.y - pStart.y)));
    }
  }
  return points;
}

/**
 * Cushion: Rounded square or rectangle.
 */
export function getCushionPerimeter(width: number, length: number, count = 24): Vector2[] {
  const w = width / 2;
  const l = length / 2;
  const r = Math.min(width, length) * 0.25; // corner radius
  const points: Vector2[] = [];
  
  const hW = w - r;
  const hL = l - r;
  
  const quarters = 4;
  const ptsPerQuarter = Math.max(1, Math.floor(count / quarters));
  
  // Quadrant 1 (Top-Right Arc, from 0 to PI/2)
  for (let i = 0; i < ptsPerQuarter; i++) {
    const theta = (i * Math.PI) / 2 / ptsPerQuarter;
    points.push(new Vector2(hW + r * Math.cos(theta), hL + r * Math.sin(theta)));
  }
  // Quadrant 2 (Top-Left Arc, from PI/2 to PI)
  for (let i = 0; i < ptsPerQuarter; i++) {
    const theta = Math.PI / 2 + (i * Math.PI) / 2 / ptsPerQuarter;
    points.push(new Vector2(-hW + r * Math.cos(theta), hL + r * Math.sin(theta)));
  }
  // Quadrant 3 (Bottom-Left Arc, from PI to 3PI/2)
  for (let i = 0; i < ptsPerQuarter; i++) {
    const theta = Math.PI + (i * Math.PI) / 2 / ptsPerQuarter;
    points.push(new Vector2(-hW + r * Math.cos(theta), -hL + r * Math.sin(theta)));
  }
  // Quadrant 4 (Bottom-Right Arc, from 3PI/2 to 2PI)
  for (let i = 0; i < ptsPerQuarter; i++) {
    const theta = (Math.PI * 3) / 2 + (i * Math.PI) / 2 / ptsPerQuarter;
    points.push(new Vector2(hW + r * Math.cos(theta), -hL + r * Math.sin(theta)));
  }
  
  return points;
}

/**
 * Pear: Teardrop shape. Symmetrical along Y-axis.
 * Pointed tip is at y = +length/2, rounded bottom is at y < 0.
 */
export function getPearPerimeter(width: number, length: number, count = 24): Vector2[] {
  const rx = width / 2;
  const ry = length / 2;
  const points: Vector2[] = [];
  
  for (let i = 0; i < count; i++) {
    const t = (i * Math.PI * 2) / count;
    let x = 0;
    let y = 0;
    
    if (t >= 0 && t <= Math.PI) {
      // Top half, tapering to (0, ry)
      const factor = Math.sin(t);
      // w reduces as we approach t = PI/2 (y = ry)
      // We can scale width as a function of height
      x = rx * Math.cos(t) * (1 - 0.7 * (Math.sin(t) * Math.sin(t)));
      y = ry * Math.sin(t);
    } else {
      // Bottom half, standard ellipse arc
      x = rx * Math.cos(t);
      y = ry * Math.sin(t);
    }
    points.push(new Vector2(x, y));
  }
  return points;
}

/**
 * Marquise: Eye/football shape. Symmetrical along both axes.
 * Pointed tips are at y = +length/2 and y = -length/2.
 */
export function getMarquisePerimeter(width: number, length: number, count = 24): Vector2[] {
  const rx = width / 2;
  const ry = length / 2;
  const points: Vector2[] = [];
  
  for (let i = 0; i < count; i++) {
    const theta = (i * Math.PI * 2) / count;
    const cosVal = Math.cos(theta);
    const sinVal = Math.sin(theta);
    
    const factor = Math.abs(cosVal);
    const x = rx * cosVal * Math.sqrt(factor);
    const y = ry * sinVal;
    
    points.push(new Vector2(x, y));
  }
  return points;
}

export function getPerimeterPoints(shape: string, width: number, length: number, count = 24): Vector2[] {
  switch (shape.toLowerCase()) {
    case "oval":
      return getOvalPerimeter(width, length, count);
    case "princess":
      return getPrincessPerimeter(width, length, count);
    case "emerald":
      return getEmeraldPerimeter(width, length, count);
    case "cushion":
      return getCushionPerimeter(width, length, count);
    case "pear":
      return getPearPerimeter(width, length, count);
    case "marquise":
      return getMarquisePerimeter(width, length, count);
    case "round":
    default:
      return getRoundPerimeter(width, length, count);
  }
}
