/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { StoneInstance } from "../types";

/**
 * Procedurally generates 2D stroke paths for letters in a [-0.9, 0.9] normalized
 * canvas. Each stroke is an ordered polyline — consecutive points are meant to be
 * connected by a solid gold segment, so the letter is built as actual metal
 * rather than a cloud of unconnected dots.
 */
export function getStrokesForLetter(char: string): [number, number][][] {
  const c = char.toUpperCase();
  const strokes: [number, number][][] = [];

  switch (c) {
    case 'M':
      strokes.push([[-0.8, -0.8], [-0.8, 0.8]]); // left vertical
      strokes.push([[-0.8, 0.8], [0, 0], [0.8, 0.8]]); // middle V
      strokes.push([[0.8, 0.8], [0.8, -0.8]]); // right vertical
      break;
    case 'O':
      strokes.push([[-0.25, 0.8], [0.25, 0.8], [0.6, 0.5], [0.6, -0.5], [0.25, -0.8], [-0.25, -0.8], [-0.6, -0.5], [-0.6, 0.5], [-0.25, 0.8]]);
      break;
    case 'A':
      strokes.push([[-0.8, -0.8], [0, 0.9], [0.8, -0.8]]);
      strokes.push([[-0.3, -0.1], [0.3, -0.1]]);
      break;
    case 'B':
      strokes.push([[-0.7, -0.8], [-0.7, 0.8]]);
      strokes.push([[-0.7, 0.8], [0.1, 0.8], [0.5, 0.5], [0.1, 0.2], [-0.7, 0.2]]);
      strokes.push([[-0.7, 0.2], [0.1, 0.2], [0.5, -0.1], [0.5, -0.5], [0.1, -0.8], [-0.7, -0.8]]);
      break;
    case 'C':
      strokes.push([[0.5, 0.6], [0.1, 0.8], [-0.3, 0.8], [-0.6, 0.4], [-0.6, -0.4], [-0.3, -0.8], [0.1, -0.8], [0.5, -0.6]]);
      break;
    case 'D':
      strokes.push([[-0.7, -0.8], [-0.7, 0.8]]);
      strokes.push([[-0.7, 0.8], [0.1, 0.8], [0.5, 0.4], [0.5, -0.4], [0.1, -0.8], [-0.7, -0.8]]);
      break;
    case 'E':
      strokes.push([[-0.6, 0.8], [-0.6, -0.8]]);
      strokes.push([[-0.2, 0.8], [-0.6, 0.8]]);
      strokes.push([[-0.6, 0], [0.2, 0]]);
      strokes.push([[-0.6, -0.8], [0.6, -0.8]]);
      break;
    case 'F':
      strokes.push([[-0.6, -0.8], [-0.6, 0.8], [0.6, 0.8]]);
      strokes.push([[-0.6, 0], [0.2, 0]]);
      break;
    case 'G':
      strokes.push([[0.5, 0.6], [0.1, 0.8], [-0.3, 0.8], [-0.6, 0.4], [-0.6, -0.4], [-0.3, -0.8], [0.1, -0.8], [0.5, -0.6], [0.5, -0.1], [0.2, -0.1]]);
      break;
    case 'H':
      strokes.push([[-0.8, -0.8], [-0.8, 0.8]]);
      strokes.push([[0.8, -0.8], [0.8, 0.8]]);
      strokes.push([[-0.8, 0], [0.8, 0]]);
      break;
    case 'I':
      strokes.push([[0, 0.8], [0, -0.8]]);
      strokes.push([[-0.4, 0.8], [0.4, 0.8]]);
      strokes.push([[-0.4, -0.8], [0.4, -0.8]]);
      break;
    case 'J':
      strokes.push([[0.4, 0.8], [0.4, -0.4], [0, -0.8], [-0.4, -0.6]]);
      strokes.push([[-0.1, 0.8], [0.7, 0.8]]);
      break;
    case 'K':
      strokes.push([[-0.7, -0.8], [-0.7, 0.8]]);
      strokes.push([[-0.7, 0], [0.5, 0.7]]);
      strokes.push([[-0.5, -0.2], [0.5, -0.7]]);
      break;
    case 'L':
      strokes.push([[-0.6, 0.8], [-0.6, -0.8], [0.6, -0.8]]);
      break;
    case 'N':
      strokes.push([[-0.8, -0.8], [-0.8, 0.8]]);
      strokes.push([[-0.8, 0.8], [0.8, -0.8]]);
      strokes.push([[0.8, -0.8], [0.8, 0.8]]);
      break;
    case 'P':
      strokes.push([[-0.7, -0.8], [-0.7, 0.8], [0.1, 0.8], [0.5, 0.5], [0.1, 0.2], [-0.7, 0.2]]);
      break;
    case 'R':
      strokes.push([[-0.7, -0.8], [-0.7, 0.8], [0.1, 0.8], [0.5, 0.5], [0.1, 0.2], [-0.7, 0.2]]);
      strokes.push([[0.1, 0.2], [0.5, -0.8]]);
      break;
    case 'S':
      strokes.push([[0.4, 0.6], [0, 0.8], [-0.4, 0.6], [-0.3, 0.2], [0, 0], [0.3, -0.2], [0.4, -0.6], [0, -0.8], [-0.4, -0.6]]);
      break;
    case 'T':
      strokes.push([[-0.7, 0.8], [0.7, 0.8]]);
      strokes.push([[0, 0.8], [0, -0.8]]);
      break;
    case 'U':
      strokes.push([[-0.6, 0.8], [-0.6, -0.4], [-0.3, -0.8], [0.3, -0.8], [0.6, -0.4], [0.6, 0.8]]);
      break;
    case 'V':
      strokes.push([[-0.7, 0.8], [0, -0.9], [0.7, 0.8]]);
      break;
    case 'W':
      strokes.push([[-0.8, 0.8], [-0.5, -0.8], [0, -0.2], [0.5, -0.8], [0.8, 0.8]]);
      break;
    case 'Y':
      strokes.push([[-0.5, 0.8], [0, 0]]);
      strokes.push([[0.5, 0.8], [0, 0]]);
      strokes.push([[0, 0], [0, -0.8]]);
      break;
    case 'Z':
      strokes.push([[-0.6, 0.8], [0.6, 0.8], [-0.6, -0.8], [0.6, -0.8]]);
      break;
    default:
      // A small geometric heart layout for unmapped/spaces
      strokes.push([[0, -0.6], [-0.8, 0.4], [-0.4, 0.8], [0, 0.4], [0.4, 0.8], [0.8, 0.4], [0, -0.6]]);
      break;
  }

  return strokes;
}

/** Flattens a letter's strokes into a single point list, used for diamond placement. */
function getPointsForLetter(char: string): [number, number][] {
  return getStrokesForLetter(char).flat();
}

/** Shared layout math so stone diamonds and gold letter strokes line up exactly. */
function layoutWord(word: string) {
  const letters = word.trim().substring(0, 8); // clamp to 8 letters max to maintain gorgeous density
  const totalLetters = letters.length;
  const spacing = totalLetters <= 3 ? 4.2 : totalLetters <= 5 ? 3.2 : 2.4;
  const startX = -((totalLetters - 1) * spacing) / 2;
  const uScale = totalLetters <= 3 ? 1.4 : totalLetters <= 5 ? 1.0 : 0.75;
  const vScale = totalLetters <= 3 ? 1.4 : totalLetters <= 5 ? 1.0 : 0.85;
  return { letters, totalLetters, spacing, startX, uScale, vScale };
}

function place(
  target: "ring" | "pendant",
  letterX: number,
  u: number,
  v: number,
  innerDiameter: number,
  thickness: number
): [number, number, number] {
  if (target === "ring") {
    // Lay out flat on top of the ring (X-Z plane)
    return [letterX + u, innerDiameter / 2 + thickness + 0.35, v];
  }
  // Lay out on a pendant face (X-Y plane, Z is slightly outward)
  return [letterX + u, -2.5 + v, 0.15];
}

/**
 * Generates an array of StoneInstance spelling the input word for either a Ring (Signet) or Pendant.
 * These are accent diamonds set along the gold letter strokes (see generateWordLetterSegments) —
 * the letters themselves are solid metal, not a plate the stones sit on.
 */
export function generateWordStones(
  word: string,
  target: "ring" | "pendant",
  innerDiameter: number,
  thickness: number
): StoneInstance[] {
  const { letters, totalLetters, spacing, startX, uScale, vScale } = layoutWord(word);
  if (!letters) return [];

  const stones: StoneInstance[] = [];

  for (let l = 0; l < totalLetters; l++) {
    const char = letters[l];
    if (char === " " || char === "-") continue;

    const letterX = startX + l * spacing;
    const letterPoints = getPointsForLetter(char);

    letterPoints.forEach((pt, ptIdx) => {
      const [u, v] = pt;
      const stoneId = `letter_stone_${l}_${ptIdx}_${Math.random().toString(36).substr(2, 5)}`;
      const position = place(target, letterX, u * uScale, v * vScale, innerDiameter, thickness);

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
        rotation: [0, 0, 0],
        isCenterStone: false,
      });
    });
  }

  return stones;
}

export interface LetterStrokeSegment3D {
  start: [number, number, number];
  end: [number, number, number];
}

/**
 * Generates the solid-gold stroke segments that form the literal shape of the
 * word — the ring/pendant band flows directly into the letters instead of a
 * flat plate with stones scattered on top.
 */
export function generateWordLetterSegments(
  word: string,
  target: "ring" | "pendant",
  innerDiameter: number,
  thickness: number
): LetterStrokeSegment3D[] {
  const { letters, totalLetters, spacing, startX, uScale, vScale } = layoutWord(word);
  if (!letters) return [];

  const segments: LetterStrokeSegment3D[] = [];

  for (let l = 0; l < totalLetters; l++) {
    const char = letters[l];
    if (char === " " || char === "-") continue;

    const letterX = startX + l * spacing;
    const strokes = getStrokesForLetter(char);

    strokes.forEach((stroke) => {
      for (let i = 0; i < stroke.length - 1; i++) {
        const [u1, v1] = stroke[i];
        const [u2, v2] = stroke[i + 1];
        segments.push({
          start: place(target, letterX, u1 * uScale, v1 * vScale, innerDiameter, thickness),
          end: place(target, letterX, u2 * uScale, v2 * vScale, innerDiameter, thickness),
        });
      }
    });
  }

  return segments;
}
