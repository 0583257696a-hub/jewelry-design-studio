import { describe, it, expect } from "vitest";
import { 
  calculateSingleStoneCarat, 
  calculateDesignVolumeMm3, 
  calculateEstimatedMetalWeight, 
  calculateEstimatedPrice 
} from "../calculators";
import { StoneInstance } from "../../types";

describe("Jewelry Pricing and Weight Calculators", () => {
  it("calculates exact carat weights for multiple cuts using standard factors", () => {
    // Round cut diamond 6.5 x 6.5 x 3.9 mm (typical 1 carat physically, but calculated with 0.0018 factor)
    const roundCarat = calculateSingleStoneCarat("round", 6.5, 6.5, 3.9, "natural_diamond");
    expect(roundCarat).toBeCloseTo(0.297, 3);

    // Princess cut diamond 5.5 x 5.5 x 3.9 mm
    const princessCarat = calculateSingleStoneCarat("princess", 5.5, 5.5, 3.9, "natural_diamond");
    expect(princessCarat).toBeCloseTo(0.271, 3);
  });

  it("calculates correct physical volume for band profiles", () => {
    const ringSpecs = {
      innerDiameter: 16.5, // Ring size 52 approx
      width: 3.0,
      thickness: 1.8,
      profile: "flat"
    };

    // Calculate band volume: width * thickness * profileFactor * Math.PI * (diameter + thickness)
    const result = calculateDesignVolumeMm3("ring", ringSpecs, 0);
    expect(result.netVolume).toBeGreaterThan(250);
    expect(result.calculationMethod).toBe("חצי-פרמטרי CAD");
  });

  it("calculates correct metal weights including casting sprues", () => {
    const vol = 300; // mm³
    const density = 15.5; // 18K Yellow Gold density in codebase

    const weight = calculateEstimatedMetalWeight(vol, density, 1.08);
    // theoretical = (300 / 1000) * 15.5 = 4.65g
    expect(weight.theoreticalWeight).toBeCloseTo(4.65);
    // finished = 4.65 * 1.08 = 5.022 => 5.02g
    expect(weight.estimatedFinishedWeight).toBeCloseTo(5.02);
  });

  it("calculates complex multi-factor retail pricing", () => {
    const stones: StoneInstance[] = [
      {
        id: "center_stone",
        shape: "round",
        width: 6.5,
        length: 6.5,
        depth: 3.9,
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "D IF",
        carat: 0.297,
        color: "D",
        settingType: "four_prong",
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        isCenterStone: true
      }
    ];

    const price = calculateEstimatedPrice(4.62, 350, stones, true);
    expect(price.materialCost).toBeCloseTo(1617, 0);
    expect(price.stoneCost).toBeCloseTo(1040, 0); // 0.297 * 3500 = 1039.5 -> 1040
    expect(price.settingCost).toBeCloseTo(180, 0);
    expect(price.totalPrice).toBeGreaterThan(6000);
  });
});
