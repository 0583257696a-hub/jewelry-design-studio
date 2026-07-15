/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { JewelryDesign } from "../types";

/**
 * Procedurally constructs an ultra-detailed, hyper-realistic, professional-grade
 * image generator prompt based on the exact CAD metrics and selections of the jewelry item.
 */
export function buildImagePrompt(design: JewelryDesign): string {
  const { category, metal, finish, stones, measurements, engravings } = design;

  // 1. Metal translation & description
  let metalDesc = "";
  if (metal.type === "yellow_gold") {
    metalDesc = `${metal.karat}k yellow gold, possessing a rich warm golden luster`;
  } else if (metal.type === "white_gold") {
    metalDesc = `${metal.karat}k solid white gold, with a brilliant rhodium-plated icy shine`;
  } else if (metal.type === "rose_gold") {
    metalDesc = `${metal.karat}k rose gold, displaying a soft romantic copper-pink sheen`;
  } else if (metal.type === "platinum") {
    metalDesc = "pure solid 950 Platinum, exhibiting a heavy, luxurious, bright metallic white glow";
  } else {
    metalDesc = "925 Sterling Silver, with a highly reflective bright metal polish";
  }

  // 2. Finish description
  let finishDesc = "";
  switch (finish) {
    case "matte":
      finishDesc = "a velvety non-reflective matte finish";
      break;
    case "satin":
      finishDesc = "a smooth satin finish with soft directional brushstrokes";
      break;
    case "brushed":
      finishDesc = "a modern brushed texture with visible fine fiber grains";
      break;
    case "hammered":
      finishDesc = "a hand-crafted hammered finish showing organic light-catching faceted dimples";
      break;
    case "sandblasted":
      finishDesc = "a highly textured, frosted sandblasted surface";
      break;
    case "diamond_cut":
      finishDesc = "a dazzling diamond-cut surface with sharp shimmering facets";
      break;
    case "polished":
    default:
      finishDesc = "a flawless mirror-polished high-gloss surface";
      break;
  }

  // 3. Category & Template descriptions
  let categoryName = "";
  let baseShapeDesc = "";
  if (category === "engagement_ring") {
    categoryName = "bespoke luxury diamond engagement ring";
    baseShapeDesc = `The ring shank has a width of ${measurements.width}mm and a thickness of ${measurements.thickness}mm with a comfortable ${measurements.profile} profile.`;
  } else if (category === "wedding_band") {
    categoryName = "custom hand-crafted wedding band";
    baseShapeDesc = `The band is ${measurements.width}mm wide, crafted with a perfect ${measurements.profile} geometric shape.`;
  } else if (category === "tennis_bracelet") {
    categoryName = "majestic graduated diamond tennis bracelet";
    baseShapeDesc = `Comprising high-density interconnected flexible solid links of ${measurements.width}mm width, repeating beautifully.`;
  } else if (category === "pendant") {
    categoryName = "bespoke designer diamond pendant";
    baseShapeDesc = "The pendant hangs from a solid, highly polished gold bail loop onto an elegant delicate chain.";
  } else if (category === "necklace") {
    categoryName = "magnificent high-jewelry collar necklace";
    baseShapeDesc = "Draped elegantly with high-precision solid custom metal linkages.";
  } else if (category === "bangle") {
    categoryName = "solid gold high-jewelry bangle bracelet";
    baseShapeDesc = `A rigid, sturdy oval bangle of ${measurements.width}mm width, crafted with maximum luxury thickness.`;
  } else {
    categoryName = "custom high-end fine jewelry item";
  }

  // 4. Stones breakdown
  let stonesDesc = "";
  const centerStone = stones.find(s => s.isCenterStone);
  const sideStones = stones.filter(s => !s.isCenterStone && !s.id.startsWith("letter_stone"));
  const letterStones = stones.filter(s => s.id.startsWith("letter_stone"));

  if (centerStone) {
    let familyName = "";
    if (centerStone.family === "natural_diamond") {
      familyName = "Natural Diamond";
    } else if (centerStone.family === "lab_grown_diamond") {
      familyName = "Lab-Grown Diamond";
    } else if (centerStone.family === "moissanite") {
      familyName = "Moissanite";
    } else if (centerStone.family === "zircon") {
      familyName = "Zircon";
    } else {
      familyName = "Gemstone";
    }

    // Only include type/grading if specifically present in design data
    let details = "";
    if (centerStone.type && centerStone.type.trim() !== "") {
      details = ` (${centerStone.type})`;
    }

    stonesDesc += `Centering a spectacular ${centerStone.carat.toFixed(2)} carat ${centerStone.shape}-cut ${familyName}${details}, secured in a standard ${centerStone.settingType.replace("_", " ")} setting. `;
  }

  if (letterStones.length > 0) {
    // Determine the letters spelled (usually "MOM" or custom)
    // We can infer the custom text length or look at the template
    const textTarget = design.templateId === "ring_custom_letters" ? "on a flat rectangular signet face plate" : "on a solid rectangular bar nameplate";
    stonesDesc += `The design features micro-pave round brilliant diamonds set ${textTarget} to form custom lettering, spelling out a word in a beautiful, glittering typography. Each tiny diamond is precisely hand-set in pave beads to ensure an unbroken sparkling text look. `;
  }

  if (sideStones.length > 0) {
    const isHalo = sideStones.length >= 10 && sideStones.some(s => s.id.includes("halo"));
    const isShoulder = sideStones.some(s => s.id.includes("shoulder"));
    
    if (isHalo) {
      stonesDesc += `Surrounded by a royal halo of ${sideStones.length} micro-pave round brilliant diamonds catching light from all angles. `;
    } else if (isShoulder) {
      stonesDesc += `Flanked by ${sideStones.length} graduated brilliant diamonds channel-set symmetrically down the shoulders of the shank. `;
    } else {
      stonesDesc += `Accentuated with a row of ${sideStones.length} small brilliant diamonds in high-end micro-pave settings. `;
    }
  }

  // 5. Engravings
  let engravingDesc = "";
  if (engravings.length > 0 && engravings[0].text.trim() !== "") {
    engravingDesc = `The inner band is meticulously laser engraved with the romantic inscription "${engravings[0].text}".`;
  }

  // Combine into a masterpiece prompt
  const fullPrompt = [
    `A professional, award-winning macro studio photograph of an exquisite, ${categoryName}.`,
    `Crafted from highly polished ${metalDesc} featuring ${finishDesc}.`,
    baseShapeDesc,
    stonesDesc,
    engravingDesc,
    "Hyper-realistic details, dramatic gallery spot lighting, catching pristine mirror reflections on the metal, sharp macro focus, shallow depth of field, high-contrast, set against a dark luxurious silk velvet showcase backdrop, 8k resolution, octane render quality, nano banana style."
  ].filter(p => p !== "").join(" ");

  return fullPrompt;
}

/**
 * Creates a shorter, poetic Hebrew version for display/approval.
 */
export function buildHebrewDescription(design: JewelryDesign): string {
  const { category, metal, finish, stones } = design;
  
  const metalMap = {
    yellow_gold: "זהב צהוב",
    white_gold: "זהב לבן",
    rose_gold: "זהב אדום",
    platinum: "פלטינה 950",
    silver: "כסף סטרלינג 925"
  };

  const finishMap = {
    polished: "מבריק קלאסי",
    matte: "מט קטיפתי",
    satin: "סאטן חלק",
    brushed: "מוברש סיבים",
    hammered: "מרוקע בעבודת יד",
    sandblasted: "התזת חול מחוספסת",
    diamond_cut: "חיתוך יהלום מנצנץ"
  };

  const catMap = {
    engagement_ring: "טבעת אירוסין",
    wedding_band: "טבעת נישואין",
    tennis_bracelet: "צמיד טניס",
    pendant: "תליון יוקרתי",
    necklace: "ענק שרשרת",
    bangle: "צמיד חישוק קשיח",
    signet_ring: "טבעת חותם",
    custom: "תכשיט בעיצוב אישי"
  };

  const metalText = `${metal.karat ? metal.karat + ' קראט ' : ''}${metalMap[metal.type as keyof typeof metalMap] || "זהב"}`;
  const finishText = finishMap[finish as keyof typeof finishMap] || "מבריק";
  const catText = catMap[category as keyof typeof catMap] || "תכשיט";

  let stoneSummary = "";
  const center = stones.find(s => s.isCenterStone);
  const count = stones.length;

  if (center) {
    const shapeMap = {
      round: "עגול",
      oval: "אובלי",
      princess: "מרובע פרינסס",
      emerald: "מלבני אמרלד",
      pear: "טיפה",
      marquise: "מרקיזה",
      cushion: "קושן"
    };
    const shapeHeb = shapeMap[center.shape as keyof typeof shapeMap] || "עגול";
    stoneSummary = `יהלום מרכזי בליטוש ${shapeHeb} במשקל ${center.carat.toFixed(2)} קראט`;
  }

  if (stones.some(s => s.id.startsWith("letter_stone"))) {
    stoneSummary += `${stoneSummary ? " ו" : ""}שיבוץ אותיות אישי ביהלומי מיקרו-פאווה מרהיבים`;
  } else if (stones.length > 1) {
    stoneSummary += `${stoneSummary ? " ו" : ""}שיבוץ של עוד ${count - (center ? 1 : 0)} יהלומי צד איכותיים`;
  }

  return `${catText} יוקרתית מ${metalText} בגימור ${finishText}. ${stoneSummary ? `מאפייני שיבוץ: ${stoneSummary}.` : ""}`;
}
