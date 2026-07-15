/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MetalConfiguration, MetalAlloy } from "../types";

export const METAL_ALLOYS: MetalAlloy[] = [
  {
    id: "yellow_gold_18k",
    metal: "gold",
    karat: 18,
    color: "yellow",
    densityGramsPerCm3: 15.5,
    densitySourceNote: "Standard 18K Yellow Gold alloy (75% Au, 12.5% Ag, 12.5% Cu). Can vary slightly based on actual alloy ratios.",
    isDemoValue: false
  },
  {
    id: "yellow_gold_14k",
    metal: "gold",
    karat: 14,
    color: "yellow",
    densityGramsPerCm3: 12.9,
    densitySourceNote: "Standard 14K Yellow Gold alloy (58.3% Au, 30% Ag, 11.7% Cu).",
    isDemoValue: false
  },
  {
    id: "yellow_gold_9k",
    metal: "gold",
    karat: 9,
    color: "yellow",
    densityGramsPerCm3: 11.2,
    densitySourceNote: "Standard 9K Yellow Gold alloy.",
    isDemoValue: false
  },
  {
    id: "white_gold_18k",
    metal: "gold",
    karat: 18,
    color: "white",
    densityGramsPerCm3: 15.9,
    densitySourceNote: "18K White Gold alloy with Palladium (75% Au, 25% Pd/Ag). Typically denser than yellow/rose gold.",
    isDemoValue: false
  },
  {
    id: "white_gold_14k",
    metal: "gold",
    karat: 14,
    color: "white",
    densityGramsPerCm3: 12.6,
    densitySourceNote: "14K White Gold alloy with Nickel/Zinc/Silver.",
    isDemoValue: false
  },
  {
    id: "rose_gold_18k",
    metal: "gold",
    karat: 18,
    color: "rose",
    densityGramsPerCm3: 15.1,
    densitySourceNote: "18K Rose Gold alloy (75% Au, 22.25% Cu, 2.75% Ag) with high copper ratio.",
    isDemoValue: false
  },
  {
    id: "rose_gold_14k",
    metal: "gold",
    karat: 14,
    color: "rose",
    densityGramsPerCm3: 13.0,
    densitySourceNote: "14K Rose Gold alloy (58.3% Au, 32.5% Cu, 9.2% Ag).",
    isDemoValue: false
  },
  {
    id: "platinum_950",
    metal: "platinum",
    karat: 95,
    color: "white",
    densityGramsPerCm3: 21.45,
    densitySourceNote: "95% Pure Platinum, 5% Ruthenium or Cobalt alloy.",
    isDemoValue: false
  }
];

export const METAL_DENSITY_WARNING_HE = "המשקל מחושב לפי צפיפות סגסוגת מוגדרת ועשוי להשתנות בהתאם להרכב המתכת בפועל.";

export const METAL_REGISTRY: MetalConfiguration[] = [
  // 18K Yellow Gold
  {
    id: "yellow_gold_18k",
    name: "זהב צהוב 18K",
    type: "yellow_gold",
    karat: 18,
    color: "#e6c229",
    density: 15.5,
    pricePerGram: 290, // ILS per gram
    roughness: 0.15,
    metalness: 0.95,
  },
  // 14K Yellow Gold
  {
    id: "yellow_gold_14k",
    name: "זהב צהוב 14K",
    type: "yellow_gold",
    karat: 14,
    color: "#f1d460",
    density: 12.9,
    pricePerGram: 230,
    roughness: 0.18,
    metalness: 0.95,
  },
  // 9K Yellow Gold
  {
    id: "yellow_gold_9k",
    name: "זהב צהוב 9K",
    type: "yellow_gold",
    karat: 9,
    color: "#eed185",
    density: 11.2,
    pricePerGram: 150,
    roughness: 0.2,
    metalness: 0.9,
  },
  // 18K White Gold
  {
    id: "white_gold_18k",
    name: "זהב לבן 18K",
    type: "white_gold",
    karat: 18,
    color: "#e5e9f0",
    density: 15.9,
    pricePerGram: 295,
    roughness: 0.12,
    metalness: 0.95,
  },
  // 14K White Gold
  {
    id: "white_gold_14k",
    name: "זהב לבן 14K",
    type: "white_gold",
    karat: 14,
    color: "#f3f4f6",
    density: 12.6,
    pricePerGram: 235,
    roughness: 0.15,
    metalness: 0.95,
  },
  // 18K Rose Gold
  {
    id: "rose_gold_18k",
    name: "זהב רוז 18K",
    type: "rose_gold",
    karat: 18,
    color: "#e0a899",
    density: 15.1,
    pricePerGram: 290,
    roughness: 0.14,
    metalness: 0.95,
  },
  // 14K Rose Gold
  {
    id: "rose_gold_14k",
    name: "זהב רוז 14K",
    type: "rose_gold",
    karat: 14,
    color: "#e8bdae",
    density: 13.0,
    pricePerGram: 230,
    roughness: 0.16,
    metalness: 0.95,
  },
  // Platinum 950
  {
    id: "platinum_950",
    name: "פלטינה 950",
    type: "platinum",
    karat: 95, // Indicates PT950
    color: "#d1d5db",
    density: 21.45,
    pricePerGram: 420,
    roughness: 0.1,
    metalness: 0.98,
  },
];

export function getMetalById(id: string): MetalConfiguration {
  const metal = METAL_REGISTRY.find((m) => m.id === id);
  if (!metal) {
    return METAL_REGISTRY[0]; // Fallback to 18K yellow gold
  }
  return metal;
}

export function calibrateAlloyDensity(id: string, density: number): void {
  const alloy = METAL_ALLOYS.find(a => a.id === id);
  if (alloy) {
    alloy.densityGramsPerCm3 = density;
  }
  const reg = METAL_REGISTRY.find(m => m.id === id);
  if (reg) {
    reg.density = density;
  }
}

