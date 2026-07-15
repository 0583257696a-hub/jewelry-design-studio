import { describe, it, expect } from "vitest";
import { 
  getRoundPerimeter, 
  getOvalPerimeter, 
  getPrincessPerimeter, 
  getEmeraldPerimeter, 
  getCushionPerimeter, 
  getPearPerimeter, 
  getMarquisePerimeter, 
  getPerimeterPoints 
} from "../perimeters";

describe("Jewelry Stone 2D Perimeters", () => {
  it("generates correct number of points for Round shape", () => {
    const pts = getRoundPerimeter(10, 24);
    expect(pts).toHaveLength(24);
    
    // First point should be at [5, 0] or extremely close due to floating point math
    expect(pts[0].x).toBeCloseTo(5);
    expect(pts[0].y).toBeCloseTo(0);
  });

  it("generates correct symmetrical points for Oval shape", () => {
    const pts = getOvalPerimeter(10, 14, 24);
    expect(pts).toHaveLength(24);
    
    // Extrema points
    expect(pts[0].x).toBeCloseTo(5);
    expect(pts[0].y).toBeCloseTo(0);
    expect(pts[6].x).toBeCloseTo(0);
    expect(pts[6].y).toBeCloseTo(7);
  });

  it("generates Princess cut rectangular boundary", () => {
    const pts = getPrincessPerimeter(8, 8, 24);
    expect(pts).toHaveLength(24);
    
    // Points should lie along the square perimeter [-4, -4] to [4, 4]
    pts.forEach(p => {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(4.001);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(4.001);
    });
  });

  it("generates Emerald cut octagon boundary", () => {
    const pts = getEmeraldPerimeter(8, 12, 24);
    expect(pts).toHaveLength(24);
    
    // Corners are chamfered
    const chamfer = 8 * 0.15; // 1.2
    pts.forEach(p => {
      // Must stay inside the maximum box [±4, ±6]
      expect(Math.abs(p.x)).toBeLessThanOrEqual(4.001);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(6.001);
      
      // And must not exceed chamfer limits
      if (Math.abs(p.x) > 4.0 - chamfer && Math.abs(p.y) > 6.0 - chamfer) {
        expect(Math.abs(p.x) + Math.abs(p.y)).toBeLessThanOrEqual(10.0 - chamfer * 0.5);
      }
    });
  });

  it("generates Cushion cut rounded rectangular boundary", () => {
    const pts = getCushionPerimeter(10, 10, 24);
    expect(pts).toHaveLength(24);
    
    pts.forEach(p => {
      expect(Math.abs(p.x)).toBeLessThanOrEqual(5.001);
      expect(Math.abs(p.y)).toBeLessThanOrEqual(5.001);
    });
  });

  it("generates Pear cut tear-drop boundary", () => {
    const pts = getPearPerimeter(10, 15, 24);
    expect(pts).toHaveLength(24);
    
    // Tip is at y = 7.5
    const tipPoint = pts.find(p => p.y > 7.4);
    expect(tipPoint).toBeDefined();
    expect(Math.abs(tipPoint!.x)).toBeLessThanOrEqual(0.1);
  });

  it("generates Marquise eye-shaped boundary", () => {
    const pts = getMarquisePerimeter(8, 16, 24);
    expect(pts).toHaveLength(24);
    
    // Tips are at y = ±8
    const topTip = pts.find(p => p.y > 7.9);
    expect(topTip).toBeDefined();
    expect(Math.abs(topTip!.x)).toBeLessThanOrEqual(0.1);

    const bottomTip = pts.find(p => p.y < -7.9);
    expect(bottomTip).toBeDefined();
    expect(Math.abs(bottomTip!.x)).toBeLessThanOrEqual(0.1);
  });

  it("polymorphic getPerimeterPoints returns correct values", () => {
    const pts = getPerimeterPoints("round", 10, 10, 16);
    expect(pts).toHaveLength(16);
  });
});
