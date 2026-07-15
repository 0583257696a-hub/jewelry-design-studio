/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JewelryDesign, ValidationResult } from "../types";

export function validateDesign(design: JewelryDesign): ValidationResult[] {
  const results: ValidationResult[] = [];
  const { measurements, stones, engravings, category, metal } = design;

  // Rule 1: Metal thickness below template minimum (blocker or warning)
  if (measurements.thickness < 1.3) {
    results.push({
      id: "err_thickness_blocker",
      level: "blocker",
      messageHebrew: "עובי הטבעת נמוך מ-1.3 מ\"מ. סכנת עיוות או שבירה בייצור!",
    });
  } else if (measurements.thickness < 1.5) {
    results.push({
      id: "err_thickness_warning",
      level: "warning",
      messageHebrew: "עובי הטבעת קטן מ-1.5 מ\"מ. מומלץ לעבות לחוזק מקסימלי.",
    });
  }

  // Rule 2: Ring width vs stone size (blocker if stone is wider than ring shank and has pave/channel)
  stones.forEach((stone) => {
    if (category === "engagement_ring" && !stone.isCenterStone) {
      if (stone.width > measurements.width) {
        results.push({
          id: `err_stone_width_${stone.id}`,
          level: "blocker",
          messageHebrew: `אבן הקישוט (${stone.width} מ"מ) רחבה מרוחב גוף הטבעת (${measurements.width} מ"מ). לא ניתן לשבץ.`,
          affectedObjectId: stone.id,
        });
      }
    }
  });

  // Rule 3: Center stone size vs ring width
  const centerStone = stones.find((s) => s.isCenterStone);
  if (centerStone && category === "engagement_ring") {
    if (centerStone.width > measurements.width * 2.5) {
      results.push({
        id: "err_center_stone_huge",
        level: "warning",
        messageHebrew: `האבן המרכזית (${centerStone.width} מ"מ) גדולה משמעותית מרוחב הטבעת (${measurements.width} מ"מ). ייתכן חוסר יציבות מבנית.`,
        affectedObjectId: centerStone.id,
      });
    }
  }

  // Rule 4: Engraving validation
  engravings.forEach((eng) => {
    if (eng.text.trim().length > 25) {
      results.push({
        id: "err_engraving_too_long",
        level: "blocker",
        messageHebrew: `טקסט החריטה ארוך מדי (${eng.text.length} תווים). המקסימום הוא 25 תווים.`,
      });
    } else if (eng.text.trim().length > 15) {
      results.push({
        id: "err_engraving_warn_long",
        level: "recommendation",
        messageHebrew: "טקסט חריטה ארוך יחסית. מומלץ לקצר כדי להבטיח קריאות מושלמת.",
      });
    }

    if (measurements.width < 2.0) {
      results.push({
        id: "err_engraving_too_narrow",
        level: "warning",
        messageHebrew: `רוחב הטבעת (${measurements.width} מ"מ) צר מדי לחריטה לייזר ברורה. מומלץ רוחב מינימלי של 2.2 מ"מ.`,
      });
    }
  });

  // Rule 5: Bracelet length range
  if (category === "tennis_bracelet") {
    const lengthCm = measurements.length || 17;
    if (lengthCm < 14 || lengthCm > 22) {
      results.push({
        id: "err_bracelet_length",
        level: "blocker",
        messageHebrew: `אורך צמיד (${lengthCm} ס"מ) מחוץ לטווח התקין לייצור (14-22 ס"מ).`,
      });
    }
  }

  // Rule 6: Heavy weight warnings
  const weightGrams = design.calculations.estimatedMetalWeightGrams;
  if (category === "engagement_ring" && weightGrams > 12) {
    results.push({
      id: "err_ring_heavy",
      level: "recommendation",
      messageHebrew: `משקל זהב משוער גבוה (${weightGrams.toFixed(1)} גרם). טבעת כבדה עשויה להסתובב על האצבע.`,
    });
  } else if (category === "tennis_bracelet" && weightGrams > 28) {
    results.push({
      id: "err_bracelet_heavy",
      level: "recommendation",
      messageHebrew: `משקל הצמיד גבוה (${weightGrams.toFixed(1)} גרם).`,
    });
  }

  // Rule 7: Metal selection recommendations
  if (metal.type === "platinum" && category === "tennis_bracelet") {
    results.push({
      id: "err_platinum_bracelet",
      level: "warning",
      messageHebrew: "ייצור צמיד טניס בפלטינה מייקר משמעותית את עלות העבודה והמשקל.",
    });
  }

  // Rule 8: Ring sizes
  if (category === "engagement_ring" || category === "wedding_band") {
    const size = measurements.innerDiameter;
    if (size < 13.0 || size > 23.0) {
      results.push({
        id: "err_ring_size_extreme",
        level: "warning",
        messageHebrew: "מידת האצבע הנבחרת קיצונית. ייתכן שיידרש תמחור מיוחד לייצור שבלונה אישית.",
      });
    }
  }

  // Rule 9: Default check if no errors exist
  if (results.length === 0) {
    results.push({
      id: "info_all_good",
      level: "info",
      messageHebrew: "העיצוב תקין לחלוטין ועומד בדרישות הייצור והCAD של ES LEVIEV!",
    });
  }

  return results;
}
