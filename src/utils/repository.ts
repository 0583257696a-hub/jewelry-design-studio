/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JewelryDesign, MetalConfiguration } from "../types";
import { getTemplateById, TEMPLATE_REGISTRY } from "./templates";
import { getMetalById } from "./metals";
import { calculateDesignVolumeMm3, calculateEstimatedMetalWeight, calculateEstimatedPrice } from "./calculators";
import { validateDesign } from "./validator";

export interface JewelryDesignSummary {
  id: string;
  name: string;
  category: string;
  updatedAt: string;
  version: number;
  templateId: string;
  metalName: string;
  totalPrice: number;
}

export interface DesignRepository {
  list(): Promise<JewelryDesignSummary[]>;
  get(id: string): Promise<JewelryDesign | null>;
  save(design: JewelryDesign): Promise<void>;
  delete(id: string): Promise<void>;
  duplicate(id: string): Promise<JewelryDesign>;
}

// Initial default designs to populate database if empty
function createDefaultDesign(templateId: string, name: string): JewelryDesign {
  const template = getTemplateById(templateId);
  const metal = getMetalById("yellow_gold_18k");
  
  // Calculate default pricing/volume
  const { netVolume } = calculateDesignVolumeMm3(
    template.category,
    template.defaultMeasurements,
    template.defaultStones.length
  );
  const { estimatedFinishedWeight } = calculateEstimatedMetalWeight(netVolume, metal.density);
  const calculations = {
    netVolumeMm3: netVolume,
    estimatedMetalWeightGrams: estimatedFinishedWeight,
    estimatedStoneWeightCarats: template.defaultStones.reduce((sum, s) => sum + s.carat, 0),
    stoneCount: template.defaultStones.length,
    ...calculateEstimatedPrice(estimatedFinishedWeight, metal.pricePerGram, template.defaultStones, false)
  };

  const design: JewelryDesign = {
    id: `design_${templateId}_default`,
    name,
    category: template.category,
    templateId,
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    measurements: { ...template.defaultMeasurements },
    metal,
    finish: "polished",
    stones: JSON.parse(JSON.stringify(template.defaultStones)),
    engravings: [],
    calculations,
    validation: [],
  };

  design.validation = validateDesign(design);
  return design;
}

const STORAGE_KEY = "es_leviev_designs_v1";

class LocalStorageDesignRepository implements DesignRepository {
  private async loadAll(): Promise<Record<string, JewelryDesign>> {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // Seed default designs
      const seeded: Record<string, JewelryDesign> = {};
      const defaults = [
        createDefaultDesign("classic_solitaire_4p", "טבעת אירוסין קלאסית - עיצוב הבית"),
        createDefaultDesign("halo_ring", "טבעת הילה יוקרתית - ES LEVIEV Signature"),
        createDefaultDesign("comfort_fit_band", "טבעת נישואין קומפורט קלאסית"),
        createDefaultDesign("tennis_bracelet_round", "צמיד טניס יהלומים קלאסי 3.0קראט")
      ];
      defaults.forEach((d) => {
        seeded[d.id] = d;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    try {
      return JSON.parse(raw);
    } catch (e) {
      console.error("Error parsing saved designs, resetting to defaults", e);
      return {};
    }
  }

  private async saveAll(designs: Record<string, JewelryDesign>): Promise<void> {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(designs));
  }

  async list(): Promise<JewelryDesignSummary[]> {
    const all = await this.loadAll();
    return Object.values(all).map((d) => ({
      id: d.id,
      name: d.name,
      category: d.category,
      updatedAt: d.updatedAt,
      version: d.version,
      templateId: d.templateId,
      metalName: d.metal.name,
      totalPrice: d.calculations.totalPrice,
    }));
  }

  async get(id: string): Promise<JewelryDesign | null> {
    const all = await this.loadAll();
    return all[id] || null;
  }

  async save(design: JewelryDesign): Promise<void> {
    const all = await this.loadAll();
    const updated = {
      ...design,
      updatedAt: new Date().toISOString(),
    };
    all[design.id] = updated;
    await this.saveAll(all);
  }

  async delete(id: string): Promise<void> {
    const all = await this.loadAll();
    if (all[id]) {
      delete all[id];
      await this.saveAll(all);
    }
  }

  async duplicate(id: string): Promise<JewelryDesign> {
    const all = await this.loadAll();
    const source = all[id];
    if (!source) {
      throw new Error("Source design not found");
    }
    const dup: JewelryDesign = JSON.parse(JSON.stringify(source));
    dup.id = `design_${Math.random().toString(36).substr(2, 9)}`;
    dup.name = `${dup.name} (עותק)`;
    dup.version = 1;
    dup.createdAt = new Date().toISOString();
    dup.updatedAt = new Date().toISOString();
    all[dup.id] = dup;
    await this.saveAll(all);
    return dup;
  }
}

export const designRepository: DesignRepository = new LocalStorageDesignRepository();
