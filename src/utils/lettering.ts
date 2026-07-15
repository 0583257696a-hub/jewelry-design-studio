/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoneInstance } from "../types";

/**
 * Procedurally generates 2D points for letters in a [-0.8, 0.8] normalized canvas.
 * Highly detailed dot mapping ensuring beautiful diamond pave alignment.
 */
export function getPointsForLetter(char: string): [number, number][] {
  const c = char.toUpperCase();
  const points: [number, number][] = [];
  
  switch (c) {
    case 'M':
      // left vertical
      points.push([-0.8, -0.8], [-0.8, -0.4], [-0.8, 0], [-0.8, 0.4], [-0.8, 0.8]);
      // middle slant down
      points.push([-0.4, 0.4], [0, 0], [0.4, 0.4]);
      // right vertical
      points.push([0.8, -0.8], [0.8, -0.4], [0.8, 0], [0.8, 0.4], [0.8, 0.8]);
      break;
    case 'O':
      // rounded ring shape
      points.push([-0.6, -0.6], [-0.6, -0.2], [-0.6, 0.2], [-0.6, 0.6]);
      points.push([0.6, -0.6], [0.6, -0.2], [0.6, 0.2], [0.6, 0.6]);
      points.push([-0.25, 0.8], [0.25, 0.8]);
      points.push([-0.25, -0.8], [0.25, -0.8]);
      break;
    case 'A':
      points.push([-0.8, -0.8], [-0.6, -0.3], [-0.4, 0.2], [-0.2, 0.7], [0, 0.9]);
      points.push([0.8, -0.8], [0.6, -0.3], [0.4, 0.2], [0.2, 0.7]);
      points.push([-0.3, -0.1], [0, -0.1], [0.3, -0.1]);
      break;
    case 'B':
      points.push([-0.7, -0.8], [-0.7, -0.4], [-0.7, 0], [-0.7, 0.4], [-0.7, 0.8]);
      points.push([-0.3, 0.8], [0.1, 0.8], [0.5, 0.5], [0.1, 0.2], [-0.3, 0.2]);
      points.push([0.1, 0.2], [0.5, -0.1], [0.5, -0.5], [0.1, -0.8], [-0.3, -0.8]);
      break;
    case 'C':
      points.push([-0.6, -0.4], [-0.6, 0], [-0.6, 0.4]);
      points.push([-0.3, 0.8], [0.1, 0.8], [0.5, 0.6]);
      points.push([-0.3, -0.8], [0.1, -0.8], [0.5, -0.6]);
      break;
    case 'D':
      points.push([-0.7, -0.8], [-0.7, -0.4], [-0.7, 0], [-0.7, 0.4], [-0.7, 0.8]);
      points.push([-0.3, 0.8], [0.1, 0.8], [0.5, 0.4], [0.5, -0.4], [0.1, -0.8], [-0.3, -0.8]);
      break;
    case 'E':
      points.push([-0.6, 0.8], [-0.6, 0.4], [-0.6, 0], [-0.6, -0.4], [-0.6, -0.8]);
      points.push([-0.2, 0.8], [0.2, 0.8], [0.6, 0.8]);
      points.push([-0.2, 0], [0.2, 0]);
      points.push([-0.2, -0.8], [0.2, -0.8], [0.6, -0.8]);
      break;
    case 'F':
      points.push([-0.6, 0.8], [-0.6, 0.4], [-0.6, 0], [-0.6, -0.4], [-0.6, -0.8]);
      points.push([-0.2, 0.8], [0.2, 0.8], [0.6, 0.8]);
      points.push([-0.2, 0], [0.2, 0]);
      break;
    case 'G':
      points.push([-0.6, -0.4], [-0.6, 0], [-0.6, 0.4]);
      points.push([-0.3, 0.8], [0.1, 0.8], [0.5, 0.6]);
      points.push([-0.3, -0.8], [0.1, -0.8], [0.5, -0.6]);
      points.push([0.5, -0.2], [0.5, 0.1], [0.2, 0.1]);
      break;
    case 'H':
      points.push([-0.8, -0.8], [-0.8, -0.4], [-0.8, 0], [-0.8, 0.4], [-0.8, 0.8]);
      points.push([0.8, -0.8], [0.8, -0.4], [0.8, 0], [0.8, 0.4], [0.8, 0.8]);
      points.push([-0.4, 0], [0, 0], [0.4, 0]);
      break;
    case 'I':
      points.push([0, 0.8], [0, 0.4], [0, 0], [0, -0.4], [0, -0.8]);
      points.push([-0.4, 0.8], [0.4, 0.8]);
      points.push([-0.4, -0.8], [0.4, -0.8]);
      break;
    case 'J':
      points.push([0.4, 0.8], [0.4, 0.4], [0.4, 0], [0.4, -0.4]);
      points.push([0, -0.8], [-0.4, -0.6]);
      points.push([-0.1, 0.8], [0.7, 0.8]);
      break;
    case 'K':
      points.push([-0.7, -0.8], [-0.7, -0.4], [-0.7, 0], [-0.7, 0.4], [-0.7, 0.8]);
      points.push([-0.3, 0], [0.1, 0.3], [0.5, 0.7]);
      points.push([0.1, -0.3], [0.5, -0.7]);
      break;
    case 'L':
      points.push([-0.6, 0.8], [-0.6, 0.4], [-0.6, 0], [-0.6, -0.4], [-0.6, -0.8]);
      points.push([-0.2, -0.8], [0.2, -0.8], [0.6, -0.8]);
      break;
    case 'N':
      points.push([-0.8, -0.8], [-0.8, -0.4], [-0.8, 0], [-0.8, 0.4], [-0.8, 0.8]);
      points.push([0.8, -0.8], [0.8, -0.4], [0.8, 0], [0.8, 0.4], [0.8, 0.8]);
      points.push([-0.4, 0.3], [0, 0], [0.4, -0.3]);
      break;
    case 'P':
      points.push([-0.7, -0.8], [-0.7, -0.4], [-0.7, 0], [-0.7, 0.4], [-0.7, 0.8]);
      points.push([-0.3, 0.8], [0.1, 0.8], [0.5, 0.5], [0.1, 0.2], [-0.3, 0.2]);
      break;
    case 'R':
      points.push([-0.7, -0.8], [-0.7, -0.4], [-0.7, 0], [-0.7, 0.4], [-0.7, 0.8]);
      points.push([-0.3, 0.8], [0.1, 0.8], [0.5, 0.5], [0.1, 0.2], [-0.3, 0.2]);
      points.push([0.1, -0.2], [0.3, -0.5], [0.5, -0.8]);
      break;
    case 'S':
      points.push([0.4, 0.6], [0, 0.8], [-0.4, 0.6], [-0.3, 0.2], [0, 0], [0.3, -0.2], [0.4, -0.6], [0, -0.8], [-0.4, -0.6]);
      break;
    case 'T':
      points.push([0, 0.8], [0, 0.4], [0, 0], [0, -0.4], [0, -0.8]);
      points.push([-0.7, 0.8], [-0.3, 0.8], [0.3, 0.8], [0.7, 0.8]);
      break;
    case 'U':
      points.push([-0.6, 0.8], [-0.6, 0.4], [-0.6, 0], [-0.6, -0.4]);
      points.push([0.6, 0.8], [0.6, 0.4], [0.6, 0], [0.6, -0.4]);
      points.push([-0.3, -0.8], [0.3, -0.8], [0, -0.8]);
      break;
    case 'V':
      points.push([-0.7, 0.8], [-0.5, 0.3], [-0.3, -0.2], [-0.1, -0.7]);
      points.push([0.7, 0.8], [0.5, 0.3], [0.3, -0.2], [0.1, -0.7]);
      points.push([0, -0.9]);
      break;
    case 'W':
      points.push([-0.8, 0.8], [-0.7, 0.2], [-0.6, -0.4], [-0.5, -0.8]);
      points.push([0.8, 0.8], [0.7, 0.2], [0.6, -0.4], [0.5, -0.8]);
      points.push([-0.25, -0.2], [0, -0.8], [0.25, -0.2]);
      break;
    case 'Y':
      points.push([0, -0.8], [0, -0.4], [0, 0]);
      points.push([-0.5, 0.8], [-0.25, 0.4]);
      points.push([0.5, 0.8], [0.25, 0.4]);
      break;
    case 'Z':
      points.push([-0.6, 0.8], [-0.2, 0.8], [0.2, 0.8], [0.6, 0.8]);
      points.push([0.4, 0.5], [0.1, 0.2], [-0.1, -0.2], [-0.4, -0.5]);
      points.push([-0.6, -0.8], [-0.2, -0.8], [0.2, -0.8], [0.6, -0.8]);
      break;
    default:
      // A small geometric heart layout for unmapped/spaces
      points.push([0, 0.4], [-0.4, 0.8], [-0.8, 0.4], [0, -0.6], [0.8, 0.4], [0.4, 0.8]);
      break;
  }
  
  return points;
}

/**
 * Generates an array of StoneInstance spelling the input word for either a Ring (Signet) or Pendant.
 */
export function generateWordStones(
  word: string,
  target: "ring" | "pendant",
  innerDiameter: number,
  thickness: number
): StoneInstance[] {
  const letters = word.trim().substring(0, 8); // clamp to 8 letters max to maintain gorgeous density
  if (!letters) return [];

  const stones: StoneInstance[] = [];
  const totalLetters = letters.length;
  
  // horizontal spacing between letters
  const spacing = totalLetters <= 3 ? 4.2 : totalLetters <= 5 ? 3.2 : 2.4; 
  const startX = -((totalLetters - 1) * spacing) / 2;

  for (let l = 0; l < totalLetters; l++) {
    const char = letters[l];
    if (char === " " || char === "-") continue;

    const letterX = startX + l * spacing;
    const letterPoints = getPointsForLetter(char);

    // Scaling factors based on space limits
    const uScale = totalLetters <= 3 ? 1.4 : totalLetters <= 5 ? 1.0 : 0.75;
    const vScale = totalLetters <= 3 ? 1.4 : totalLetters <= 5 ? 1.0 : 0.85;

    letterPoints.forEach((pt, ptIdx) => {
      const [u, v] = pt;
      const stoneId = `letter_stone_${l}_${ptIdx}_${Math.random().toString(36).substr(2, 5)}`;
      
      let position: [number, number, number] = [0, 0, 0];
      let rotation: [number, number, number] = [0, 0, 0];

      if (target === "ring") {
        // Lay out flat on top of the ring (X-Z plane)
        // X goes across width, Z goes along the band depth
        position = [
          letterX + u * uScale,
          innerDiameter / 2 + thickness + 0.35, // sits cleanly on signet top surface
          v * vScale,
        ];
        rotation = [0, 0, 0]; // face up
      } else {
        // Lay out on a pendant face (X-Y plane, Z is slightly outward)
        position = [
          letterX + u * uScale,
          -2.5 + v * vScale, // centered vertically on nameplate
          0.15, // slightly extruded forward
        ];
        rotation = [0, 0, 0]; // facing front
      }

      stones.push({
        id: stoneId,
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "F VS2",
        shape: "round",
        width: 0.9,
        length: 0.9,
        depth: 0.54,
        carat: 0.004,
        color: "#ffffff",
        settingType: "pave",
        position,
        rotation,
        isCenterStone: false,
      });
    });
  }

  return stones;
}
