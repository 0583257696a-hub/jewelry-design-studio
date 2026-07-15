/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JewelryTemplate, StoneInstance } from "../types";
import { generateWordStones } from "./lettering";

// Helper to generate a unique stone ID
function makeId(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

// Default center stone: Round 6.5mm (~1.0ct)
const defaultCenterRound = (setting: "four_prong" | "six_prong"): StoneInstance => ({
  id: "center_stone_solitaire",
  family: "natural_diamond",
  familyHebrew: "יהלום טבעי",
  type: "D VS1",
  shape: "round",
  width: 6.5,
  length: 6.5,
  depth: 3.9,
  carat: 1.0,
  color: "#ffffff",
  settingType: setting,
  position: [0, 9.5, 0], // Elevated above ring shank
  rotation: [0, 0, 0],
  isCenterStone: true,
});

export const TEMPLATE_REGISTRY: JewelryTemplate[] = [
  // --- CUSTOM LETTERING / MOM MODELS ---
  {
    id: "ring_custom_letters",
    category: "engagement_ring",
    displayName: "Custom Name/MOM Signet Ring",
    displayNameHebrew: "טבעת חותם שמות ואותיות (MOM)",
    defaultMeasurements: {
      innerDiameter: 16.5,
      width: 5.2, // wide enough for signet lettering
      thickness: 1.8,
      profile: "flat",
      headHeight: 0,
      shoulderWidth: 3.5,
    },
    allowedWidthRange: [3.5, 8.0],
    allowedThicknessRange: [1.3, 3.0],
    defaultStones: generateWordStones("MOM", "ring", 16.5, 1.8),
    manufacturingWarnings: [
      "טבעת חותם אותיות דורשת שיבוץ מיקרו-פאווה מדויק של יהלומים זעירים (0.9 מ\"מ)."
    ]
  },
  {
    id: "pendant_custom_letters",
    category: "pendant",
    displayName: "Custom Nameplate Pendant (MOM)",
    displayNameHebrew: "תליון שמות ואותיות בשיבוץ יהלומים",
    defaultMeasurements: {
      innerDiameter: 70,
      width: 1.2,
      thickness: 1.2,
      profile: "oval",
    },
    allowedWidthRange: [1.0, 3.0],
    allowedThicknessRange: [1.0, 3.0],
    defaultStones: generateWordStones("MOM", "pendant", 70, 1.2),
    manufacturingWarnings: [
      "תליון אותיות ולוחית שם מיוצר בטכנולוגיית כרסום CNC מתקדמת לדיוק מירבי."
    ]
  },

  // --- ENGAGEMENT RINGS ---
  {
    id: "classic_solitaire_4p",
    category: "engagement_ring",
    displayName: "Classic Solitaire 4-Prong",
    displayNameHebrew: "סוליטר קלאסי 4 שיניים",
    defaultMeasurements: {
      innerDiameter: 16.5, // Israeli size 12
      width: 2.2,
      thickness: 1.6,
      profile: "half_round",
      headHeight: 5.5,
      shoulderWidth: 2.0,
    },
    allowedWidthRange: [1.5, 4.0],
    allowedThicknessRange: [1.2, 3.0],
    defaultStones: [
      defaultCenterRound("four_prong")
    ],
    manufacturingWarnings: [
      "רוחב טבעת קטן מ-1.8 מ\"מ עשוי להיות שביר תחת עומס יומיומי.",
      "מומלץ לבדוק את גובה ראש השיבוץ בהתאם לגודל האבן הנבחרת."
    ]
  },
  {
    id: "classic_solitaire_6p",
    category: "engagement_ring",
    displayName: "Classic Solitaire 6-Prong",
    displayNameHebrew: "סוליטר קלאסי 6 שיניים",
    defaultMeasurements: {
      innerDiameter: 16.5,
      width: 2.2,
      thickness: 1.6,
      profile: "half_round",
      headHeight: 5.5,
      shoulderWidth: 2.0,
    },
    allowedWidthRange: [1.5, 4.0],
    allowedThicknessRange: [1.2, 3.0],
    defaultStones: [
      defaultCenterRound("six_prong")
    ],
    manufacturingWarnings: [
      "שיבוץ 6 שיניים מספק הגנה מקסימלית אך מסתיר מעט יותר משטח פני היהלום."
    ]
  },
  {
    id: "halo_ring",
    category: "engagement_ring",
    displayName: "Halo Ring",
    displayNameHebrew: "טבעת הילה (Halo)",
    defaultMeasurements: {
      innerDiameter: 16.5,
      width: 2.4,
      thickness: 1.7,
      profile: "comfort_fit",
      headHeight: 6.0,
      shoulderWidth: 2.2,
    },
    allowedWidthRange: [1.8, 5.0],
    allowedThicknessRange: [1.3, 3.0],
    defaultStones: [
      // Center
      {
        id: "center_halo",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "E VVS2",
        shape: "round",
        width: 6.0,
        length: 6.0,
        depth: 3.6,
        carat: 0.8,
        color: "#ffffff",
        settingType: "four_prong",
        position: [0, 10.0, 0],
        rotation: [0, 0, 0],
        isCenterStone: true,
      },
      // Halo array (16 small stones, 1.2mm each, surrounding the center at radius ~4.2mm)
      ...Array.from({ length: 16 }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / 16;
        const radius = 4.2;
        return {
          id: `halo_stone_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "F VS",
          shape: "round" as const,
          width: 1.2,
          length: 1.2,
          depth: 0.72,
          carat: 0.008,
          color: "#ffffff",
          settingType: "pave" as const,
          position: [Math.cos(angle) * radius, 10.0, Math.sin(angle) * radius] as [number, number, number],
          rotation: [0, -angle, 0] as [number, number, number],
        };
      })
    ],
    manufacturingWarnings: [
      "אבני ההילה קטנות מאוד (1.2 מ\"מ). שיבוץ מיקרו-פאווה דורש עבודה תחת מיקרוסקופ."
    ]
  },
  {
    id: "three_stone",
    category: "engagement_ring",
    displayName: "Three-Stone Ring",
    displayNameHebrew: "טבעת שלושה שושים (Three-Stone)",
    defaultMeasurements: {
      innerDiameter: 16.5,
      width: 2.5,
      thickness: 1.8,
      profile: "comfort_fit",
      headHeight: 5.8,
      shoulderWidth: 2.4,
    },
    allowedWidthRange: [2.0, 5.0],
    allowedThicknessRange: [1.4, 3.0],
    defaultStones: [
      // Center Round 6.0mm
      {
        id: "center_3s",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "D VS2",
        shape: "round",
        width: 6.0,
        length: 6.0,
        depth: 3.6,
        carat: 0.8,
        color: "#ffffff",
        settingType: "four_prong",
        position: [0, 9.8, 0],
        rotation: [0, 0, 0],
        isCenterStone: true,
      },
      // Left Round 4.0mm
      {
        id: "left_3s",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "G VS1",
        shape: "round",
        width: 4.0,
        length: 4.0,
        depth: 2.4,
        carat: 0.25,
        color: "#ffffff",
        settingType: "four_prong",
        position: [-3.8, 9.2, 0],
        rotation: [0, 0, 0.25], // Tilted outward
      },
      // Right Round 4.0mm
      {
        id: "right_3s",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "G VS1",
        shape: "round",
        width: 4.0,
        length: 4.0,
        depth: 2.4,
        carat: 0.25,
        color: "#ffffff",
        settingType: "four_prong",
        position: [3.8, 9.2, 0],
        rotation: [0, 0, -0.25], // Tilted outward
      },
    ],
    manufacturingWarnings: [
      "יש לוודא סימטריה מלאה בין שתי אבני הצד מבחינת קוטר, צבע וניקיון."
    ]
  },
  {
    id: "pave_shoulders",
    category: "engagement_ring",
    displayName: "Pavé Shoulders Solitaire",
    displayNameHebrew: "טבעת סוליטר עם כתפי פאווה (Pavé)",
    defaultMeasurements: {
      innerDiameter: 16.5,
      width: 2.4,
      thickness: 1.7,
      profile: "half_round",
      headHeight: 5.5,
      shoulderWidth: 2.2,
    },
    allowedWidthRange: [2.0, 4.0],
    allowedThicknessRange: [1.3, 3.0],
    defaultStones: [
      // Center
      defaultCenterRound("four_prong"),
      // Left shoulder stones (5 stones, staggered along the left arc)
      ...Array.from({ length: 5 }).map((_, i) => {
        const angle = Math.PI/2 + 0.15 + i * 0.12; // Start just below head
        const radius = 16.5/2 + 1.7/2 + 0.5; // Slightly outside ring shank surface
        return {
          id: `pave_left_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "F VS",
          shape: "round" as const,
          width: 1.5,
          length: 1.5,
          depth: 0.9,
          carat: 0.015,
          color: "#ffffff",
          settingType: "pave" as const,
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
          rotation: [0, 0, angle - Math.PI/2] as [number, number, number],
        };
      }),
      // Right shoulder stones (5 stones)
      ...Array.from({ length: 5 }).map((_, i) => {
        const angle = Math.PI/2 - 0.15 - i * 0.12;
        const radius = 16.5/2 + 1.7/2 + 0.5;
        return {
          id: `pave_right_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "F VS",
          shape: "round" as const,
          width: 1.5,
          length: 1.5,
          depth: 0.9,
          carat: 0.015,
          color: "#ffffff",
          settingType: "pave" as const,
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
          rotation: [0, 0, angle - Math.PI/2] as [number, number, number],
        };
      })
    ],
    manufacturingWarnings: [
      "טבעות פאווה בכתפיים דורשות עובי דופן מינימלי של 1.5 מ\"מ על מנת לשמור על חוזק מבני לאחר הקידוח."
    ]
  },

  // --- WEDDING BANDS ---
  {
    id: "flat_band",
    category: "wedding_band",
    displayName: "Flat Band",
    displayNameHebrew: "טבעת נישואין שטוחה (Flat)",
    defaultMeasurements: {
      innerDiameter: 17.5, // Size 15
      width: 4.0,
      thickness: 1.5,
      profile: "flat",
    },
    allowedWidthRange: [2.0, 10.0],
    allowedThicknessRange: [1.0, 3.0],
    defaultStones: [],
    manufacturingWarnings: [
      "דפנות ישרות וחדות עשויות לפגוע בנוחות החבישה הממושכת."
    ]
  },
  {
    id: "comfort_fit_band",
    category: "wedding_band",
    displayName: "Comfort-Fit Band",
    displayNameHebrew: "טבעת נישואין קומפורט-פיט",
    defaultMeasurements: {
      innerDiameter: 17.5,
      width: 4.0,
      thickness: 1.7,
      profile: "comfort_fit",
    },
    allowedWidthRange: [2.0, 10.0],
    allowedThicknessRange: [1.2, 3.0],
    defaultStones: [],
    manufacturingWarnings: [
      "טבעת קומפורט-פיט כוללת קימור פנימי המעניק נוחות מרבית ומונע לחץ."
    ]
  },
  {
    id: "half_round_band",
    category: "wedding_band",
    displayName: "Half-Round Band",
    displayNameHebrew: "טבעת נישואין חצי-עגולה",
    defaultMeasurements: {
      innerDiameter: 17.5,
      width: 3.5,
      thickness: 1.6,
      profile: "half_round",
    },
    allowedWidthRange: [2.0, 8.0],
    allowedThicknessRange: [1.1, 3.0],
    defaultStones: [],
    manufacturingWarnings: []
  },
  {
    id: "beveled_band",
    category: "wedding_band",
    displayName: "Beveled Band",
    displayNameHebrew: "טבעת נישואין עם דפנות משופעות",
    defaultMeasurements: {
      innerDiameter: 17.5,
      width: 5.0,
      thickness: 1.8,
      profile: "beveled",
    },
    allowedWidthRange: [3.0, 9.0],
    allowedThicknessRange: [1.3, 3.0],
    defaultStones: [],
    manufacturingWarnings: []
  },
  {
    id: "channel_set_band",
    category: "wedding_band",
    displayName: "Channel-Set Eternity",
    displayNameHebrew: "טבעת נישואין חצי קומפורט עם מסילה",
    defaultMeasurements: {
      innerDiameter: 17.5,
      width: 3.5,
      thickness: 1.9,
      profile: "flat",
    },
    allowedWidthRange: [2.5, 6.0],
    allowedThicknessRange: [1.5, 3.0],
    defaultStones: Array.from({ length: 11 }).map((_, i) => {
      const angle = Math.PI/2 - 0.7 + i * 0.14; // Upper top arc only
      const radius = 17.5/2 + 1.9/2 + 0.1;
      return {
        id: `channel_stone_${i}`,
        family: "natural_diamond" as const,
        familyHebrew: "יהלום טבעי",
        type: "F VS",
        shape: "round" as const, // Support round stone channel
        width: 1.8,
        length: 1.8,
        depth: 1.08,
        carat: 0.025,
        color: "#ffffff",
        settingType: "channel" as const,
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
        rotation: [0, 0, angle - Math.PI/2] as [number, number, number],
      };
    }),
    manufacturingWarnings: [
      "שיבוץ מסילה (Channel) דורש עובי טבעת מינימלי של 1.6 מ\"מ על מנת ליצור חריץ מסילה תומך."
    ]
  },

  // --- TENNIS BRACELETS ---
  {
    id: "tennis_bracelet_round",
    category: "tennis_bracelet",
    displayName: "Classic 4-Prong Tennis Bracelet",
    displayNameHebrew: "צמיד טניס קלאסי 4 שיניים",
    defaultMeasurements: {
      innerDiameter: 55, // Dummy diameter for curved look (fits 17cm length)
      width: 3.0,
      thickness: 2.5,
      profile: "oval",
      length: 17, // 17cm length
    },
    allowedWidthRange: [2.0, 6.0],
    allowedThicknessRange: [1.8, 4.0],
    defaultStones: Array.from({ length: 52 }).map((_, i) => {
      // Create stones spaced along the 17cm curved presentation
      const totalStones = 52;
      const angle = (i / totalStones) * Math.PI * 1.5 - Math.PI * 0.75; // Curved horseshoe presentation
      const radius = 28; // Fits 55mm diameter approx
      return {
        id: `tennis_stone_${i}`,
        family: "natural_diamond" as const,
        familyHebrew: "יהלום טבעי",
        type: "G VS",
        shape: "round" as const,
        width: 2.2,
        length: 2.2,
        depth: 1.3,
        carat: 0.04,
        color: "#ffffff",
        settingType: "four_prong" as const,
        position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
        rotation: [0, 0, angle - Math.PI/2] as [number, number, number],
      };
    }),
    manufacturingWarnings: [
      "צמיד טניס מחייב צירים גמישים ואיכותיים בין כל חוליה וחוליה לחוזק ועמידות."
    ]
  },

  // --- PENDANTS ---
  {
    id: "pendant_solitaire",
    category: "pendant",
    displayName: "Classic Solitaire Pendant",
    displayNameHebrew: "תליון סוליטר קלאסי 4 שיניים",
    defaultMeasurements: {
      innerDiameter: 70, // Represents mock neckwire loop diameter
      width: 1.2,
      thickness: 1.2,
      profile: "oval",
    },
    allowedWidthRange: [1.0, 3.0],
    allowedThicknessRange: [1.0, 3.0],
    defaultStones: [
      {
        id: "pendant_center_solitaire",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "D VVS1",
        shape: "round",
        width: 7.0, // Large 1.3ct diamond
        length: 7.0,
        depth: 4.2,
        carat: 1.3,
        color: "#ffffff",
        settingType: "four_prong",
        position: [0, -2.5, 0], // Hangs slightly below neckwire
        rotation: [0, 0, 0],
        isCenterStone: true,
      }
    ],
    manufacturingWarnings: [
      "מומלץ להשתמש בשרשרת לולאות קלאסית בעובי של 1.0 מ\"מ לפחות לנשיאה בטוחה של התליון."
    ]
  },
  {
    id: "pendant_royal_halo",
    category: "pendant",
    displayName: "Royal Halo Pendant",
    displayNameHebrew: "תליון הילה מלכותי (Halo)",
    defaultMeasurements: {
      innerDiameter: 70,
      width: 1.2,
      thickness: 1.2,
      profile: "oval",
    },
    allowedWidthRange: [1.0, 3.0],
    allowedThicknessRange: [1.0, 3.0],
    defaultStones: [
      // Center
      {
        id: "pendant_halo_center",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "E VS1",
        shape: "round",
        width: 5.5,
        length: 5.5,
        depth: 3.3,
        carat: 0.62,
        color: "#ffffff",
        settingType: "four_prong",
        position: [0, -2.5, 0],
        rotation: [0, 0, 0],
        isCenterStone: true,
      },
      // Halo array (12 stones of 1.1mm surrounding center at radius ~3.6mm)
      ...Array.from({ length: 12 }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / 12;
        const radius = 3.6;
        return {
          id: `pendant_halo_stone_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "F VS",
          shape: "round" as const,
          width: 1.1,
          length: 1.1,
          depth: 0.66,
          carat: 0.006,
          color: "#ffffff",
          settingType: "pave" as const,
          position: [Math.cos(angle) * radius, -2.5, Math.sin(angle) * radius] as [number, number, number],
          rotation: [0, -angle, 0] as [number, number, number],
        };
      })
    ],
    manufacturingWarnings: [
      "שיבוץ המיקרו-פאווה בהילה דורש פינישים עדינים למניעת תפיסת סיבי לבוש."
    ]
  },
  {
    id: "pendant_heart",
    category: "pendant",
    displayName: "Love Heart Diamond Pendant",
    displayNameHebrew: "תליון לב אהבה משובץ יהלומים",
    defaultMeasurements: {
      innerDiameter: 70,
      width: 1.2,
      thickness: 1.2,
      profile: "oval",
    },
    allowedWidthRange: [1.0, 3.0],
    allowedThicknessRange: [1.0, 3.0],
    defaultStones: [
      // 12 stones arranged in a gorgeous heart shape
      ...Array.from({ length: 12 }).map((_, i) => {
        const t = (i / 12) * 2 * Math.PI;
        // Heart parametric scaling to ~6.5mm width and height
        const x = 0.23 * (16 * Math.pow(Math.sin(t), 3));
        const z = 0.23 * (13 * Math.cos(t) - 5 * Math.cos(2*t) - 2 * Math.cos(3*t) - Math.cos(4*t));
        return {
          id: `pendant_heart_stone_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "F VS",
          shape: "round" as const,
          width: 1.2,
          length: 1.2,
          depth: 0.72,
          carat: 0.008,
          color: "#ffffff",
          settingType: "pave" as const,
          position: [x, -2.5, z] as [number, number, number],
          rotation: [0, -t, 0] as [number, number, number],
        };
      })
    ],
    manufacturingWarnings: [
      "תליון לב יהלומים דורש יישור ופילוס קפדני של האבנים לשמירה על צורת הלב ההנדסית."
    ]
  },

  // --- NECKLACES ---
  {
    id: "necklace_emerald_solitaire",
    category: "necklace",
    displayName: "Emerald-Cut Solitaire Necklace",
    displayNameHebrew: "שרשרת סוליטר אמרלד יוקרתית",
    defaultMeasurements: {
      innerDiameter: 70,
      width: 1.2,
      thickness: 1.2,
      profile: "oval",
    },
    allowedWidthRange: [1.0, 3.5],
    allowedThicknessRange: [1.0, 3.5],
    defaultStones: [
      {
        id: "necklace_center_emerald",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "D IF",
        shape: "emerald",
        width: 8.0, // Large 2.0ct emerald cut
        length: 6.0,
        depth: 3.6,
        carat: 2.0,
        color: "#ffffff",
        settingType: "bezel", // High-end bezel collar setting
        position: [0, -2.5, 0],
        rotation: [0, 0, 0],
        isCenterStone: true,
      }
    ],
    manufacturingWarnings: [
      "שיבוץ כוס (Bezel) ליהלום אמרלד מעניק מראה מודרני מרהיב ומגן על הפינות הרגישות של חיתוך המדרגות."
    ]
  },
  {
    id: "necklace_riviera",
    category: "necklace",
    displayName: "Luxury Riviera Diamond Necklace",
    displayNameHebrew: "ענק שרשרת יהלומים - ריביירה מלכותית",
    defaultMeasurements: {
      innerDiameter: 70, // Loop base
      width: 1.8,
      thickness: 1.8,
      profile: "half_round",
    },
    allowedWidthRange: [1.5, 4.5],
    allowedThicknessRange: [1.2, 4.0],
    defaultStones: [
      // Graduated diamond array along the front arc
      ...Array.from({ length: 15 }).map((_, i) => {
        const totalStones = 15;
        const angle = -Math.PI / 4 + (i / (totalStones - 1)) * Math.PI / 2;
        const radius = 35; // hangs directly along the bottom of the chain
        const distFromCenter = Math.abs(i - (totalStones - 1) / 2);
        
        // Center is 4.8mm, tapering down to 2.8mm
        const stoneSize = 4.8 - distFromCenter * 0.28;
        const carat = parseFloat(((stoneSize * stoneSize * 0.14) / 10).toFixed(3));
        
        return {
          id: `riviera_stone_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "G VS",
          shape: "round" as const,
          width: stoneSize,
          length: stoneSize,
          depth: stoneSize * 0.6,
          carat: carat,
          color: "#ffffff",
          settingType: "four_prong" as const,
          // Position relative to the center Y which is offset
          position: [Math.sin(angle) * radius, 35 - Math.cos(angle) * radius + 2.0, 0] as [number, number, number],
          rotation: [0, 0, -angle] as [number, number, number],
        };
      })
    ],
    manufacturingWarnings: [
      "שרשרת ריביירה מדורגת דורשת מיון ידני מומחה של 15 יהלומים להתאמה מוחלטת בצבע ואיכות."
    ]
  },

  // --- BANGLES ---
  {
    id: "bangle_classic",
    category: "bangle",
    displayName: "Classic Diamond-Set Bangle",
    displayNameHebrew: "צמיד חישוק קלאסי משובץ יהלומים",
    defaultMeasurements: {
      innerDiameter: 58, // Standard bangle size 58mm
      width: 3.2,
      thickness: 1.8,
      profile: "comfort_fit",
    },
    allowedWidthRange: [2.0, 8.0],
    allowedThicknessRange: [1.2, 4.0],
    defaultStones: [
      // Row of 11 diamonds set on top
      ...Array.from({ length: 11 }).map((_, i) => {
        const angle = Math.PI / 2 - 0.5 + i * 0.1;
        const radius = 58 / 2 + 1.8 / 2;
        return {
          id: `bangle_stone_${i}`,
          family: "natural_diamond" as const,
          familyHebrew: "יהלום טבעי",
          type: "F VS",
          shape: "round" as const,
          width: 2.2,
          length: 2.2,
          depth: 1.32,
          carat: 0.04,
          color: "#ffffff",
          settingType: "pave" as const,
          position: [Math.cos(angle) * radius, Math.sin(angle) * radius, 0] as [number, number, number],
          rotation: [0, 0, angle - Math.PI / 2] as [number, number, number],
        };
      })
    ],
    manufacturingWarnings: [
      "צמיד חישוק קשיח דורש ציר וסגר ביטחון כפול לעמידות מקסימלית בשימוש יומיומי."
    ]
  },
  {
    id: "bangle_with_heart_charm",
    category: "bangle",
    displayName: "Bangle with Hanging Heart Charm",
    displayNameHebrew: "צמיד חישוק קשיח עם תליון לב תלוי",
    defaultMeasurements: {
      innerDiameter: 58,
      width: 2.8,
      thickness: 1.8,
      profile: "half_round",
    },
    allowedWidthRange: [1.8, 6.0],
    allowedThicknessRange: [1.2, 3.0],
    defaultStones: [
      // A large dangling heart/round bezel diamond right at the bottom
      {
        id: "bangle_hanging_charm",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "E VVS2",
        shape: "round",
        width: 5.8, // Large charm diamond
        length: 5.8,
        depth: 3.5,
        carat: 0.72,
        color: "#ffffff",
        settingType: "bezel",
        position: [0, -58 / 2 - 4.5, 0], // Hangs below the bottom of the bangle
        rotation: [0, 0, 0],
        isCenterStone: true,
      },
      // Two small diamonds flanking the hanger
      {
        id: "bangle_flank_left",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "F VS",
        shape: "round",
        width: 1.6,
        length: 1.6,
        depth: 1.0,
        carat: 0.018,
        color: "#ffffff",
        settingType: "pave",
        position: [-1.8, -58 / 2, 0],
        rotation: [0, 0, 0],
      },
      {
        id: "bangle_flank_right",
        family: "natural_diamond",
        familyHebrew: "יהלום טבעי",
        type: "F VS",
        shape: "round",
        width: 1.6,
        length: 1.6,
        depth: 1.0,
        carat: 0.018,
        color: "#ffffff",
        settingType: "pave",
        position: [1.8, -58 / 2, 0],
        rotation: [0, 0, 0],
      },
    ],
    manufacturingWarnings: [
      "התליון התלוי מחובר באמצעות לולאת זהב מולחמת לקשיחות ועמידות בפני פגיעות ומשיכות."
    ]
  }
];

export function getTemplateById(id: string): JewelryTemplate {
  const template = TEMPLATE_REGISTRY.find((t) => t.id === id);
  if (!template) {
    return TEMPLATE_REGISTRY[0]; // Solitaire fallback
  }
  return template;
}
