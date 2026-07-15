/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type JewelryCategory =
  | "engagement_ring"
  | "wedding_band"
  | "tennis_bracelet"
  | "earrings"
  | "pendant"
  | "necklace"
  | "bangle"
  | "signet_ring"
  | "custom";

export interface JewelryMeasurements {
  innerDiameter: number;   // In mm
  width: number;           // In mm
  thickness: number;       // In mm
  profile: "flat" | "half_round" | "comfort_fit" | "oval" | "beveled" | "knife_edge";
  length?: number;         // For bracelets/necklaces in cm
  headHeight?: number;     // For engagement rings center stone elevation in mm
  shoulderWidth?: number;  // For engagement rings in mm
}

export interface MetalConfiguration {
  id: string;              // yellow_gold_18k, white_gold_14k, etc.
  name: string;            // Hebrew display name
  type: "yellow_gold" | "white_gold" | "rose_gold" | "platinum" | "silver";
  karat: number;           // 9, 10, 14, 18, 21, 22, or 950 (for platinum)
  color: string;           // Hex color for ThreeJS material
  density: number;         // g/cm3 (e.g. 18K yellow is ~15.5, Platinum is 21.45)
  pricePerGram: number;    // Configurable price in ILS
  roughness: number;
  metalness: number;
}

export interface StoneInstance {
  id: string;
  family: "natural_diamond" | "lab_grown_diamond" | "zircon" | "moissanite" | "gemstone";
  familyHebrew: string;
  type: string;            // e.g. "D IF", "Sapphire", etc.
  shape: "round" | "oval" | "princess" | "emerald" | "pear" | "marquise" | "cushion";
  width: number;           // mm
  length: number;          // mm
  depth: number;           // mm
  carat: number;           // estimated weight
  color: string;           // Hex for visualization
  settingType: "four_prong" | "six_prong" | "bezel" | "channel" | "pave" | "flush" | "tension" | "halo" | "shared_prong";
  position: [number, number, number]; // [x, y, z] relative to center or along path
  rotation: [number, number, number]; // [rx, ry, rz]
  offsetFromSurface?: number;
  isCenterStone?: boolean;
}

export interface EngravingInstance {
  text: string;
  font: "serif" | "sans" | "mono";
  fontSize: number;        // mm
  inside: boolean;         // inside or outside ring
  position: number;        // angle/position along ring in degrees (0-360)
  letterSpacing: number;
  depth: number;           // negative for engraved, positive for raised
}

export interface CalculationSnapshot {
  netVolumeMm3: number;
  estimatedMetalWeightGrams: number;
  estimatedStoneWeightCarats: number;
  stoneCount: number;
  materialCost: number;
  stoneCost: number;
  settingCost: number;
  laborCost: number;
  additionalCost: number;
  totalPrice: number;
}

export interface ValidationResult {
  id: string;
  level: "info" | "recommendation" | "warning" | "blocker";
  messageHebrew: string;
  affectedObjectId?: string;
}

export interface JewelryDesign {
  id: string;
  name: string;
  category: JewelryCategory;
  templateId: string;
  version: number;
  createdAt: string;
  updatedAt: string;
  measurements: JewelryMeasurements;
  metal: MetalConfiguration;
  finish: "polished" | "matte" | "satin" | "brushed" | "hammered" | "sandblasted" | "diamond_cut";
  stones: StoneInstance[];
  engravings: EngravingInstance[];
  calculations: CalculationSnapshot;
  validation: ValidationResult[];
  /** The word spelled by ring_custom_letters / pendant_custom_letters designs. */
  customText?: string;
}

export interface JewelryTemplate {
  id: string;
  category: JewelryCategory;
  displayName: string;
  displayNameHebrew: string;
  defaultMeasurements: JewelryMeasurements;
  allowedWidthRange: [number, number];
  allowedThicknessRange: [number, number];
  defaultStones: StoneInstance[];
  manufacturingWarnings: string[];
}

export interface HistoryState {
  past: JewelryDesign[];
  present: JewelryDesign;
  future: JewelryDesign[];
}

export type DesignAction =
  | { type: "CHANGE_METAL"; metalType: string; karat: number; color?: string }
  | { type: "ADD_STONE"; stone: Omit<StoneInstance, "id" | "position" | "rotation">; placement: "center" | "halo" | "shoulders" | "ring_array" | "manual" }
  | { type: "ADD_HALO"; targetStoneId?: string; stoneShape: string; stoneSizeMm: number; quantity: number; distanceMm: number }
  | { type: "UPDATE_MEASUREMENT"; field: string; value: number }
  | { type: "ADD_ENGRAVING"; text: string; location: "inside" | "outside" }
  | { type: "SET_DESIGN"; design: JewelryDesign };

export type AccuracyLevel = "visual" | "commercial_estimate" | "cad_validated";

export interface MetalWeightResult {
  theoreticalWeightGrams: number;
  estimatedFinishedWeightGrams: number;
  volumeEstimateMm3: number;
  densityGramsPerCm3: number;
  wasteFactorPercent: number;
  calculationMethod: "parametric_cross_section" | "closed_mesh_volume" | "template_lookup";
  accuracyLevel: AccuracyLevel;
  includedComponents: string[];
  excludedComponents: string[];
  warnings: string[];
}

export interface MetalAlloy {
  id: string;
  metal: "gold" | "platinum" | "silver";
  karat?: number;
  color?: "yellow" | "white" | "rose";
  densityGramsPerCm3: number;
  densitySourceNote: string;
  isDemoValue: boolean;
}

export interface JewelryDesignVersion {
  versionId: string;
  designId: string;
  versionNumber: number;
  createdAt: string;
  createdBy: string;
  title?: string;
  designSnapshot: JewelryDesign;
  calculationsSnapshot: CalculationSnapshot;
  validationSnapshot: ValidationResult[];
  previewImageUrl?: string;
}

export interface JewelryDesignSummary {
  id: string;
  name: string;
  category: JewelryCategory;
  version: number;
  updatedAt: string;
  stoneCount: number;
  totalPrice: number;
}

