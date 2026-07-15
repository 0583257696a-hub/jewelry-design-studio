import { describe, it, expect } from "vitest";
import { 
  getMetalById, 
  calibrateAlloyDensity, 
  METAL_DENSITY_WARNING_HE,
  METAL_ALLOYS
} from "../metals";

describe("Metal Alloys and Calibration System", () => {
  it("retrieves the correct properties for a default alloy code", () => {
    const alloy = getMetalById("yellow_gold_18k");
    expect(alloy).toBeDefined();
    expect(alloy.name).toBe("זהב צהוב 18K");
    expect(alloy.density).toBeCloseTo(15.5);
    expect(alloy.type).toBe("yellow_gold");
  });

  it("calibrates and updates active density on demand", () => {
    const originalAlloy = getMetalById("white_gold_14k");
    expect(originalAlloy.density).toBeCloseTo(12.6);

    // Let's calibrate to a different white gold density
    calibrateAlloyDensity("white_gold_14k", 12.8);
    
    // Verify lookup is updated
    const retrieved = getMetalById("white_gold_14k");
    expect(retrieved.density).toBeCloseTo(12.8);

    // Verify alloy is also updated
    const alloy = METAL_ALLOYS.find(a => a.id === "white_gold_14k");
    expect(alloy).toBeDefined();
    expect(alloy!.densityGramsPerCm3).toBeCloseTo(12.8);
  });

  it("contains the legal Hebrew density warning", () => {
    expect(METAL_DENSITY_WARNING_HE).toContain("המשקל מחושב לפי צפיפות סגסוגת");
  });
});
