/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JewelryDesign, MetalConfiguration, StoneInstance } from "../types";

// --- STONE CARAT WEIGHT CALCULATIONS ---
// Density factors relative to diamond (3.52 g/cm³)
export const STONE_DENSITY_FACTORS = {
  natural_diamond: 1.0,
  lab_grown_diamond: 1.0,
  zircon: 1.34,       // Density ~4.7
  moissanite: 0.91,   // Density ~3.2
  gemstone: 1.14,     // Density ~4.0 (Sapphire/Ruby)
};

// Shape factors for standard mathematical carat estimation
// Carat = Length (mm) * Width (mm) * Depth (mm) * ShapeFactor * DensityFactor
export const SHAPE_FACTORS = {
  round: 0.0018,
  oval: 0.0018 * 0.9,
  princess: 0.0023,
  emerald: 0.00245,
  pear: 0.0018 * 0.92,
  marquise: 0.0016,
  cushion: 0.0018 * 0.95,
};

export function calculateSingleStoneCarat(
  shape: StoneInstance["shape"],
  width: number,
  length: number,
  depth: number,
  family: StoneInstance["family"]
): number {
  const shapeFactor = SHAPE_FACTORS[shape as keyof typeof SHAPE_FACTORS] || 0.0018;
  const densityFactor = STONE_DENSITY_FACTORS[family] || 1.0;
  const carat = width * length * depth * shapeFactor * densityFactor;
  return parseFloat(carat.toFixed(3));
}

// --- METAL VOLUME & WEIGHT CALCULATIONS ---
// Average cross-section factor compared to flat rectangular band
export const PROFILE_CROSS_SECTION_FACTORS = {
  flat: 1.0,
  half_round: 0.76,
  comfort_fit: 0.88,
  oval: 0.82,
  beveled: 0.84,
  knife_edge: 0.62,
};

export function calculateDesignVolumeMm3(
  category: string,
  measurements: {
    innerDiameter: number;
    width: number;
    thickness: number;
    profile: string;
    length?: number;
  },
  stonesCount: number
): { netVolume: number; calculationMethod: string; accuracyStatus: string } {
  let netVolume = 0;
  let method = "חצי-פרמטרי CAD";
  let accuracy = "גבוהה (משוערת)";

  if (category === "tennis_bracelet") {
    // For tennis bracelet: repeated links
    const totalLengthCm = measurements.length || 17;
    const linkWidthMm = measurements.width; // e.g. 3mm
    const linkThicknessMm = measurements.thickness; // e.g. 2.5mm
    const linkLengthMm = linkWidthMm + 0.5; // length of single link along bracelet
    
    const numLinks = Math.floor((totalLengthCm * 10) / linkLengthMm);
    // Approximate volume of single metal box link (outer box minus hollow stone cavity)
    const singleLinkVolume = (linkWidthMm * linkLengthMm * linkThicknessMm) * 0.55; 
    const claspVolume = 120; // Clasp lock is ~120 mm3

    netVolume = numLinks * singleLinkVolume + claspVolume;
    method = "חישוב לינארי של חוליות";
  } else {
    // For Rings: Ring band volume
    const d = measurements.innerDiameter;
    const t = measurements.thickness;
    const w = measurements.width;
    const profile = measurements.profile;

    const crossSectionFactor = PROFILE_CROSS_SECTION_FACTORS[profile as keyof typeof PROFILE_CROSS_SECTION_FACTORS] || 0.8;
    const baseArea = w * t * crossSectionFactor;
    const averageCircumference = Math.PI * (d + t);
    
    const bandVolume = baseArea * averageCircumference;

    // Prongs/Settings addition:
    // Large center setting adds ~25mm³ volume, smaller accents add ~3.5mm³ each
    const settingsVolume = stonesCount > 0 ? (25 + (stonesCount - 1) * 3.5) : 0;
    
    // Stone cavities subtraction:
    // Stones displace metal. Standard displacement is ~30% of total stone volume
    const displacedVolume = stonesCount * 6; // Average 6mm³ displaced per stone

    netVolume = Math.max(bandVolume + settingsVolume - displacedVolume, bandVolume * 0.85);
  }

  return {
    netVolume: parseFloat(netVolume.toFixed(2)),
    calculationMethod: method,
    accuracyStatus: accuracy,
  };
}

export function calculateEstimatedMetalWeight(
  netVolumeMm3: number,
  density: number,
  wasteFactor: number = 1.08 // 8% manufacturing waste / casting sprues
): { theoreticalWeight: number; estimatedFinishedWeight: number } {
  // Density is g/cm3, Volume is mm3
  // Weight (grams) = Volume (mm3) / 1000 * Density (g/cm3)
  const theoretical = (netVolumeMm3 / 1000) * density;
  const finished = theoretical * wasteFactor;

  return {
    theoreticalWeight: parseFloat(theoretical.toFixed(2)),
    estimatedFinishedWeight: parseFloat(finished.toFixed(2)),
  };
}

// --- MODULAR PRICING ENGINE ---
// Standard retail markup and VAT factors (israeli VAT is 17%)
const RETIAL_MARKUP = 1.35; // 35% margin
const VAT_RATE = 1.17;      // 17% VAT

export function calculateEstimatedPrice(
  metalWeight: number,
  pricePerGram: number,
  stones: StoneInstance[],
  hasEngraving: boolean
): {
  materialCost: number;
  stoneCost: number;
  settingCost: number;
  laborCost: number;
  additionalCost: number;
  totalPrice: number;
} {
  // 1. Metal Cost
  const materialCost = metalWeight * pricePerGram;

  // 2. Stones Cost based on family and carat
  let stoneCost = 0;
  let settingCost = 0;

  stones.forEach((stone) => {
    let pricePerCarat = 1200; // default (Lab grown)
    let settingFee = 50;      // default setting fee in ILS

    if (stone.family === "natural_diamond") {
      // Natural diamond pricing scales with size/carat
      if (stone.carat >= 1.0) pricePerCarat = 6500;
      else if (stone.carat >= 0.5) pricePerCarat = 4500;
      else pricePerCarat = 3500;
      settingFee = stone.isCenterStone ? 180 : 60;
    } else if (stone.family === "lab_grown_diamond") {
      if (stone.carat >= 1.0) pricePerCarat = 1800;
      else pricePerCarat = 1100;
      settingFee = stone.isCenterStone ? 120 : 50;
    } else if (stone.family === "moissanite") {
      pricePerCarat = 300;
      settingFee = 45;
    } else if (stone.family === "gemstone") {
      pricePerCarat = 900; // Sapphire/Emerald/Ruby average
      settingFee = stone.isCenterStone ? 100 : 50;
    } else {
      pricePerCarat = 50; // Zircon
      settingFee = 35;
    }

    stoneCost += stone.carat * pricePerCarat;
    settingCost += settingFee;
  });

  // 3. Labor Cost (dependent on complexity)
  const isBracelet = stones.length > 30;
  const baseLabor = isBracelet ? 2500 : 1200; // Crafting tennis bracelet links is harder
  const laborCost = baseLabor;

  // 4. Additional options
  let additionalCost = 0;
  if (hasEngraving) additionalCost += 150; // Engraving fee
  
  // Finish complexity cost
  additionalCost += 100; // Base surface finishing

  // 5. Total calculation with markup and VAT
  const baseTotal = materialCost + stoneCost + settingCost + laborCost + additionalCost;
  const totalPrice = Math.round(baseTotal * RETIAL_MARKUP * VAT_RATE);

  return {
    materialCost: Math.round(materialCost),
    stoneCost: Math.round(stoneCost),
    settingCost: Math.round(settingCost),
    laborCost: Math.round(laborCost),
    additionalCost: Math.round(additionalCost),
    totalPrice,
  };
}
