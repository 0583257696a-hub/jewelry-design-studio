/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, type ReactNode, type ComponentType } from "react";
import {
  Sparkles,
  Save,
  RotateCcw,
  RotateCw,
  Camera,
  FileText,
  Trash2,
  Plus,
  CheckCircle,
  AlertTriangle,
  Info,
  Sliders,
  Scale,
  Maximize2,
  Copy,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  X,
  Settings2,
  LayoutGrid,
  Palette,
  Wand2,
  Gem,
  PenTool,
  Bot,
  Archive,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import {
  JewelryDesign,
  StoneInstance,
  EngravingInstance,
  DesignAction
} from "./types";
import { TEMPLATE_REGISTRY, getTemplateById } from "./utils/templates";
import { METAL_REGISTRY, getMetalById } from "./utils/metals";
import {
  calculateDesignVolumeMm3,
  calculateEstimatedMetalWeight,
  calculateEstimatedPrice,
  calculateSingleStoneCarat
} from "./utils/calculators";
import { validateDesign } from "./utils/validator";
import { designRepository, JewelryDesignSummary } from "./utils/repository";
import { JewelryViewer3D } from "./components/JewelryViewer3D";
import { generateWordStones } from "./utils/lettering";
import { buildImagePrompt, buildHebrewDescription } from "./utils/promptBuilder";

// Reusable action state for AI Assistant
interface AIPendingChange {
  explanation: string;
  actions: DesignAction[];
}

const TABS = [
  { id: "template", label: "תבנית", icon: LayoutGrid },
  { id: "metal", label: "מתכת", icon: Palette },
  { id: "finish", label: "גימור", icon: Wand2 },
  { id: "stones", label: "אבנים", icon: Gem },
  { id: "engraving", label: "חריטה", icon: PenTool },
  { id: "ai", label: "עוזר AI", icon: Bot },
  { id: "library", label: "הארכיון", icon: Archive },
] as const;

export default function App() {
  // --- 1. Core App State ---
  const [design, setDesign] = useState<JewelryDesign | null>(null);
  const [selectedStoneId, setSelectedStoneId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"template" | "metal" | "finish" | "stones" | "engraving" | "ai" | "library">("template");
  const [customLettersText, setCustomLettersText] = useState<string>("MOM");
  const [viewPreset, setViewPreset] = useState<"perspective" | "front" | "back" | "top" | "side">("perspective");
  const [showDimensions, setShowDimensions] = useState<boolean>(false);
  const [savedDesigns, setSavedDesigns] = useState<JewelryDesignSummary[]>([]);

  // History Stack for Undo/Redo
  const [historyPast, setHistoryPast] = useState<JewelryDesign[]>([]);
  const [historyFuture, setHistoryFuture] = useState<JewelryDesign[]>([]);
  const [transactionSnapshot, setTransactionSnapshot] = useState<JewelryDesign | null>(null);

  // Add Stone Panel Wizard State
  const [wizardFamily, setWizardFamily] = useState<StoneInstance["family"]>("natural_diamond");
  const [wizardShape, setWizardShape] = useState<StoneInstance["shape"]>("round");
  const [wizardSize, setWizardSize] = useState<number>(2.0); // mm diameter
  const [wizardSetting, setWizardSetting] = useState<StoneInstance["settingType"]>("four_prong");
  const [wizardPlacement, setWizardPlacement] = useState<"center" | "halo" | "shoulders" | "ring_array">("center");

  // AI Assistant Chat State
  const [aiPrompt, setAiPrompt] = useState<string>("");
  const [aiLoading, setAiLoading] = useState<boolean>(false);
  const [pendingAIChange, setPendingAIChange] = useState<AIPendingChange | null>(null);
  const [aiMessageError, setAiMessageError] = useState<string | null>(null);

  // General Notification HUD
  const [hudMessage, setHudMessage] = useState<{ text: string; type: "success" | "info" | "error" } | null>(null);

  // Layout / UX chrome state
  const [mobileSheetOpen, setMobileSheetOpen] = useState<boolean>(false);
  const [validationOpen, setValidationOpen] = useState<boolean>(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Lock background scroll and allow Escape to close while the mobile sheet is open
  useEffect(() => {
    if (!mobileSheetOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileSheetOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [mobileSheetOpen]);

  // Dismiss any pending delete confirmation when the user navigates away from the library tab
  useEffect(() => {
    if (activeTab !== "library") setDeleteConfirmId(null);
  }, [activeTab]);

  // --- 2. Load Initial Design on Mount ---
  useEffect(() => {
    async function loadInitial() {
      try {
        let summaries = await designRepository.list();

        // If there are no saved designs, create a default one from the first template!
        if (summaries.length === 0) {
          const defaultTemplate = TEMPLATE_REGISTRY[0];
          const defaultMetal = METAL_REGISTRY.find(m => m.id === "yellow_gold_18k") || METAL_REGISTRY[0];

          const { netVolume } = calculateDesignVolumeMm3(
            defaultTemplate.category,
            defaultTemplate.defaultMeasurements,
            defaultTemplate.defaultStones.length
          );
          const { estimatedFinishedWeight } = calculateEstimatedMetalWeight(netVolume, defaultMetal.density);
          const stoneCarat = defaultTemplate.defaultStones.reduce((sum, s) => sum + s.carat, 0);
          const pricing = calculateEstimatedPrice(
            estimatedFinishedWeight,
            defaultMetal.pricePerGram,
            defaultTemplate.defaultStones,
            false
          );

          const calculations = {
            netVolumeMm3: netVolume,
            estimatedMetalWeightGrams: estimatedFinishedWeight,
            estimatedStoneWeightCarats: parseFloat(stoneCarat.toFixed(3)),
            stoneCount: defaultTemplate.defaultStones.length,
            ...pricing
          };

          const newDesign: JewelryDesign = {
            id: `design_${defaultTemplate.id}_initial`,
            name: `עיצוב ראשון - ${defaultTemplate.displayNameHebrew}`,
            category: defaultTemplate.category,
            templateId: defaultTemplate.id,
            version: 1,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            measurements: { ...defaultTemplate.defaultMeasurements },
            metal: defaultMetal,
            finish: "polished",
            stones: JSON.parse(JSON.stringify(defaultTemplate.defaultStones)),
            engravings: [],
            calculations,
            validation: [],
          };
          newDesign.validation = validateDesign(newDesign);

          await designRepository.save(newDesign);
          summaries = await designRepository.list();
        }

        setSavedDesigns(summaries);

        // Load the first design
        if (summaries.length > 0) {
          const first = await designRepository.get(summaries[0].id);
          if (first) {
            setDesign(first);
            setCustomLettersText(first.customText || "MOM");
          }
        }
      } catch (e) {
        console.error("Failed to load initial designs", e);
      }
    }
    loadInitial();
  }, []);

  // Auto-save design to DB so user choices are never lost on refresh
  useEffect(() => {
    if (!design) return;
    const timeoutId = setTimeout(() => {
      designRepository.save(design).then(() => {
        designRepository.list().then((summaries) => {
          setSavedDesigns(summaries);
        });
      });
    }, 1000); // 1 second debounce to prevent DB spam during range sliding
    return () => clearTimeout(timeoutId);
  }, [design]);

  // Show auto-dismiss HUD messages
  const showHUD = (text: string, type: "success" | "info" | "error" = "success") => {
    setHudMessage({ text, type });
    setTimeout(() => {
      setHudMessage(null);
    }, 4500);
  };

  // --- 3. Command History state controller (Undo/Redo) ---
  const beginDesignTransaction = () => {
    if (design && !transactionSnapshot) {
      setTransactionSnapshot(JSON.parse(JSON.stringify(design)));
    }
  };

  const commitDesignTransaction = () => {
    if (transactionSnapshot) {
      // Push the original starting snapshot to history past
      setHistoryPast((prev) => [...prev, transactionSnapshot]);
      setTransactionSnapshot(null); // Clear transaction state
    }
    setHistoryFuture([]); // clear redo stack
  };

  const commitDesignState = (updated: JewelryDesign) => {
    if (!design) return;

    // Calculate final metrics before commit
    const { netVolume } = calculateDesignVolumeMm3(
      updated.category,
      updated.measurements,
      updated.stones.length
    );
    const { estimatedFinishedWeight } = calculateEstimatedMetalWeight(netVolume, updated.metal.density);
    const stoneCarat = updated.stones.reduce((sum, s) => sum + s.carat, 0);
    const hasEngraving = updated.engravings.length > 0 && updated.engravings[0].text.trim() !== "";
    const pricing = calculateEstimatedPrice(
      estimatedFinishedWeight,
      updated.metal.pricePerGram,
      updated.stones,
      hasEngraving
    );

    const calculations = {
      netVolumeMm3: netVolume,
      estimatedMetalWeightGrams: estimatedFinishedWeight,
      estimatedStoneWeightCarats: parseFloat(stoneCarat.toFixed(3)),
      stoneCount: updated.stones.length,
      ...pricing
    };

    const finalDesign: JewelryDesign = {
      ...updated,
      calculations,
      updatedAt: new Date().toISOString(),
    };

    finalDesign.validation = validateDesign(finalDesign);

    // If NO transaction is active, this is an instant operation (e.g. click), commit it instantly
    if (!transactionSnapshot) {
      setHistoryPast((prev) => [...prev, design]);
      setHistoryFuture([]); // clear redo stack
    }

    setDesign(finalDesign);
  };

  const handleUndo = () => {
    if (historyPast.length === 0 || !design) return;
    const previous = historyPast[historyPast.length - 1];
    setHistoryFuture((prev) => [design, ...prev]);
    setHistoryPast((prev) => prev.slice(0, -1));
    setDesign(previous);
    showHUD("פעולה בוטלה בהצלחה", "info");
  };

  const handleRedo = () => {
    if (historyFuture.length === 0 || !design) return;
    const next = historyFuture[0];
    setHistoryPast((prev) => [...prev, design]);
    setHistoryFuture((prev) => prev.slice(1));
    setDesign(next);
    showHUD("פעולה בוצעה מחדש", "info");
  };

  // --- 4. Metal & Dimension Changers ---
  const handleMetalChange = (metalId: string) => {
    if (!design) return;
    const newMetal = getMetalById(metalId);
    commitDesignState({
      ...design,
      metal: newMetal,
    });
    showHUD(`סוג מתכת שונה ל-${newMetal.name}`);
  };

  const handleFinishChange = (newFinish: JewelryDesign["finish"]) => {
    if (!design) return;
    commitDesignState({
      ...design,
      finish: newFinish,
    });
    showHUD(`גימור שונה ל-${newFinish}`);
  };

  const handleCustomLettersTextChange = (text: string) => {
    if (!design) return;
    const sanitized = text.toUpperCase().replace(/[^A-Z\s-]/g, ""); // Allow only letters, spaces, hyphens
    setCustomLettersText(sanitized);

    const target = design.templateId === "ring_custom_letters" ? "ring" : "pendant";
    const newStones = generateWordStones(
      sanitized,
      target,
      design.measurements.innerDiameter,
      design.measurements.thickness
    );

    commitDesignState({
      ...design,
      stones: newStones,
      customText: sanitized,
    });
  };

  const handleMeasurementChange = (field: keyof JewelryDesign["measurements"], value: number) => {
    if (!design) return;
    const updatedMeasurements = {
      ...design.measurements,
      [field]: value,
    };

    // Shift center stone position vertically when ring size or thickness is adjusted
    let updatedStones = [...design.stones];
    if (design.templateId === "ring_custom_letters" || design.templateId === "pendant_custom_letters") {
      const target = design.templateId === "ring_custom_letters" ? "ring" : "pendant";
      const diameter = field === "innerDiameter" ? value : design.measurements.innerDiameter;
      const thickness = field === "thickness" ? value : design.measurements.thickness;
      updatedStones = generateWordStones(customLettersText, target, diameter, thickness);
    } else if ((field === "innerDiameter" || field === "thickness") && (design.category === "engagement_ring" || design.category === "wedding_band")) {
      const radius = (field === "innerDiameter" ? value : design.measurements.innerDiameter) / 2;
      const thickness = field === "thickness" ? value : design.measurements.thickness;
      updatedStones = design.stones.map((stone) => {
        if (stone.isCenterStone) {
          return {
            ...stone,
            position: [0, radius + thickness + 0.8, 0],
          };
        }
        return stone;
      });
    }

    commitDesignState({
      ...design,
      measurements: updatedMeasurements,
      stones: updatedStones,
    });
  };

  const handleProfileChange = (profile: JewelryDesign["measurements"]["profile"]) => {
    if (!design) return;
    commitDesignState({
      ...design,
      measurements: {
        ...design.measurements,
        profile,
      }
    });
  };

  // --- 5. Selected Stone Editors ---
  const handleSelectedStonePropertiesChange = (updates: Partial<StoneInstance>) => {
    if (!design || !selectedStoneId) return;
    const updatedStones = design.stones.map((s) => {
      if (s.id === selectedStoneId) {
        const draft = { ...s, ...updates };
        if (
          updates.width !== undefined ||
          updates.length !== undefined ||
          updates.depth !== undefined ||
          updates.shape !== undefined ||
          updates.family !== undefined
        ) {
          // re-calculate carat estimate
          draft.carat = calculateSingleStoneCarat(
            draft.shape,
            updates.width !== undefined ? updates.width : s.width,
            updates.length !== undefined ? updates.length : s.length,
            updates.depth !== undefined ? updates.depth : s.depth,
            updates.family !== undefined ? updates.family : s.family
          );
        }
        return draft;
      }
      return s;
    });

    commitDesignState({
      ...design,
      stones: updatedStones,
    });
  };

  const handleDuplicateStone = () => {
    if (!design || !selectedStoneId) return;
    const stoneToDup = design.stones.find((s) => s.id === selectedStoneId);
    if (!stoneToDup) return;

    const dup: StoneInstance = {
      ...stoneToDup,
      id: `stone_dup_${Math.random().toString(36).substr(2, 9)}`,
      position: [stoneToDup.position[0] + 1.5, stoneToDup.position[1], stoneToDup.position[2] + 1.5], // offset slightly
      isCenterStone: false,
    };

    commitDesignState({
      ...design,
      stones: [...design.stones, dup],
    });
    setSelectedStoneId(dup.id);
    showHUD("יהלום שוכפל בהצלחה!");
  };

  const handleDeleteStone = () => {
    if (!design || !selectedStoneId) return;
    const updatedStones = design.stones.filter((s) => s.id !== selectedStoneId);
    commitDesignState({
      ...design,
      stones: updatedStones,
    });
    setSelectedStoneId(null);
    showHUD("יהלום הוסר מהעיצוב", "info");
  };

  // --- 6. Add Stone Wizard Trigger ---
  const handleAddStoneConfirm = () => {
    if (!design) return;

    const stoneWidth = wizardSize;
    const stoneDepth = stoneWidth * 0.6; // average proportion
    const calculatedCarat = calculateSingleStoneCarat(
      wizardShape,
      stoneWidth,
      stoneWidth,
      stoneDepth,
      wizardFamily
    );

    const familyHebrewMap = {
      natural_diamond: "יהלום טבעי",
      lab_grown_diamond: "יהלום מעבדה",
      zircon: "זרקון",
      moissanite: "מואסנייט",
      gemstone: "אבן חן"
    };

    const newStone: StoneInstance = {
      id: `stone_added_${Math.random().toString(36).substr(2, 9)}`,
      family: wizardFamily,
      familyHebrew: familyHebrewMap[wizardFamily],
      type: "VS1 G",
      shape: wizardShape,
      width: stoneWidth,
      length: stoneWidth,
      depth: stoneDepth,
      carat: calculatedCarat,
      color: wizardFamily === "gemstone" ? "#3b82f6" : "#ffffff",
      settingType: wizardSetting,
      position: [0, design.measurements.innerDiameter / 2 + design.measurements.thickness + 0.8, 0],
      rotation: [0, 0, 0],
      isCenterStone: wizardPlacement === "center",
    };

    let updatedStones = [...design.stones];

    if (wizardPlacement === "center") {
      // Replace existing center stone if present or set as center
      updatedStones = design.stones.filter((s) => !s.isCenterStone);
      updatedStones.push(newStone);
    } else if (wizardPlacement === "halo") {
      // Generate halo array around center position
      const centerPos = [0, design.measurements.innerDiameter / 2 + design.measurements.thickness + 0.8, 0];
      const haloRadius = stoneWidth * 1.5;
      const quantity = 12;
      // Remove previous side stones to prevent overlapping arrays
      updatedStones = design.stones.filter((s) => s.isCenterStone);
      const haloStones = Array.from({ length: quantity }).map((_, i) => {
        const angle = (i * 2 * Math.PI) / quantity;
        return {
          ...newStone,
          id: `halo_stone_${Math.random().toString(36).substr(2, 9)}`,
          position: [
            centerPos[0] + Math.cos(angle) * haloRadius,
            centerPos[1],
            centerPos[2] + Math.sin(angle) * haloRadius,
          ] as [number, number, number],
          rotation: [0, -angle, 0] as [number, number, number],
          isCenterStone: false,
        };
      });
      updatedStones.push(...haloStones);
    } else if (wizardPlacement === "shoulders") {
      // Symmetrical shoulder diamonds along the shank top curve
      const radius = design.measurements.innerDiameter / 2 + design.measurements.thickness;
      const shoulderAngles = [15, 27, 39, -15, -27, -39].map((deg) => (deg * Math.PI) / 180);
      updatedStones = design.stones.filter((s) => s.isCenterStone); // keep center
      const shoulderStones = shoulderAngles.map((angle) => {
        return {
          ...newStone,
          id: `shoulder_stone_${Math.random().toString(36).substr(2, 9)}`,
          position: [
            Math.sin(angle) * (radius + 0.1),
            Math.cos(angle) * (radius + 0.1),
            0,
          ] as [number, number, number],
          rotation: [0, 0, -angle] as [number, number, number],
          isCenterStone: false,
        };
      });
      updatedStones.push(...shoulderStones);
    } else if (wizardPlacement === "ring_array") {
      // Half eternity array beautifully spanning the upper arch of the ring
      const radius = design.measurements.innerDiameter / 2 + design.measurements.thickness;
      const numStones = 15;
      updatedStones = design.stones.filter((s) => s.isCenterStone); // keep center
      const arrayStones = Array.from({ length: numStones }).map((_, i) => {
        const startAngle = -75 * Math.PI / 180;
        const endAngle = 75 * Math.PI / 180;
        const angle = startAngle + (i * (endAngle - startAngle)) / (numStones - 1);
        return {
          ...newStone,
          id: `array_stone_${Math.random().toString(36).substr(2, 9)}`,
          position: [
            Math.sin(angle) * (radius + 0.1),
            Math.cos(angle) * (radius + 0.1),
            0,
          ] as [number, number, number],
          rotation: [0, 0, -angle] as [number, number, number],
          isCenterStone: false,
        };
      });
      updatedStones.push(...arrayStones);
    } else {
      // Default single shoulder offset
      newStone.position = [1.8, design.measurements.innerDiameter / 2 + design.measurements.thickness + 0.3, 0.5];
      updatedStones.push(newStone);
    }

    commitDesignState({
      ...design,
      stones: updatedStones,
    });
    showHUD("יהלום/ים נוספו בהצלחה לעיצוב!");
  };

  // --- 7. Engravings Changers ---
  const handleEngravingTextChange = (text: string) => {
    if (!design) return;
    const updatedEngravings: EngravingInstance[] = [
      {
        text,
        font: "serif",
        fontSize: 1.2,
        inside: true,
        position: 180,
        letterSpacing: 0.1,
        depth: -0.2,
      },
    ];
    commitDesignState({
      ...design,
      engravings: updatedEngravings,
    });
  };

  // --- 8. AI Assistant Dispatcher ---
  const handleSendAiPrompt = async () => {
    if (!aiPrompt.trim() || !design) return;
    setAiLoading(true);
    setAiMessageError(null);
    setPendingAIChange(null);

    try {
      const res = await fetch("/api/gemini/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: aiPrompt,
          currentDesign: design,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to contact the AI assistant server.");
      }

      const data = await res.json();
      if (data.error) {
        setAiMessageError(data.error);
      } else {
        setPendingAIChange({
          explanation: data.explanationHebrew,
          actions: data.actions,
        });
      }
    } catch (e: any) {
      console.error(e);
      setAiMessageError(e.message || "שגיאה בתקשורת עם השרת");
    } finally {
      setAiLoading(false);
    }
  };

  const handleApplyAIChanges = () => {
    if (!pendingAIChange || !design) return;

    let updated = JSON.parse(JSON.stringify(design)) as JewelryDesign;

    pendingAIChange.actions.forEach((act) => {
      if (act.type === "CHANGE_METAL") {
        // Find best match in registry
        const found = METAL_REGISTRY.find((m) => m.type === act.metalType && m.karat === act.karat);
        if (found) {
          updated.metal = found;
        }
      } else if (act.type === "UPDATE_MEASUREMENT" && act.field) {
        const fieldKey = act.field as keyof JewelryDesign["measurements"];
        if (updated.measurements[fieldKey] !== undefined) {
          (updated.measurements as any)[fieldKey] = act.value;
        }
      } else if (act.type === "ADD_ENGRAVING") {
        updated.engravings = [
          {
            text: act.text || "",
            font: "serif",
            fontSize: 1.2,
            inside: act.location === "inside" || true,
            position: 180,
            letterSpacing: 0.1,
            depth: -0.2,
          }
        ];
      } else if (act.type === "ADD_HALO") {
        const centerPos = [0, updated.measurements.innerDiameter / 2 + updated.measurements.thickness + 0.8, 0];
        const haloRadius = act.stoneSizeMm ? act.stoneSizeMm * 1.5 : 2.5;
        const qty = act.quantity || 14;

        // Generate small halo stones
        const haloStones = Array.from({ length: qty }).map((_, i) => {
          const angle = (i * 2 * Math.PI) / qty;
          return {
            id: `halo_ai_${Math.random().toString(36).substr(2, 9)}`,
            family: "lab_grown_diamond" as const,
            familyHebrew: "יהלום מעבדה",
            type: "VS G",
            shape: (act.stoneShape as any) || "round",
            width: act.stoneSizeMm || 1.3,
            length: act.stoneSizeMm || 1.3,
            depth: (act.stoneSizeMm || 1.3) * 0.6,
            carat: calculateSingleStoneCarat(
              (act.stoneShape as any) || "round",
              act.stoneSizeMm || 1.3,
              act.stoneSizeMm || 1.3,
              (act.stoneSizeMm || 1.3) * 0.6,
              "lab_grown_diamond"
            ),
            color: "#ffffff",
            settingType: "pave" as const,
            position: [
              centerPos[0] + Math.cos(angle) * haloRadius,
              centerPos[1],
              centerPos[2] + Math.sin(angle) * haloRadius,
            ] as [number, number, number],
            rotation: [0, -angle, 0] as [number, number, number],
          };
        });
        updated.stones.push(...haloStones);
      }
    });

    commitDesignState(updated);
    setPendingAIChange(null);
    setAiPrompt("");
    showHUD("שינויי ה-AI הוחלו בהצלחה!");
  };

  // --- 9. Design Persisting Commands ---
  const handleSaveDesign = async () => {
    if (!design) return;
    try {
      await designRepository.save(design);
      const summaries = await designRepository.list();
      setSavedDesigns(summaries);
      showHUD("העיצוב נשמר בהצלחה במסד הנתונים של הסטודיו!", "success");
    } catch (e) {
      console.error(e);
      showHUD("שגיאה בשמירת העיצוב", "error");
    }
  };

  const handleSaveAsNewVersion = async () => {
    if (!design) return;
    try {
      const nextVer = {
        ...design,
        id: `design_ver_${Math.random().toString(36).substr(2, 9)}`,
        name: `${design.name} (גרסה ${design.version + 1})`,
        version: design.version + 1,
        createdAt: new Date().toISOString(),
      };
      await designRepository.save(nextVer);
      setDesign(nextVer);
      const summaries = await designRepository.list();
      setSavedDesigns(summaries);
      showHUD(`גרסה ${nextVer.version} נשמרה בהצלחה!`);
    } catch (e) {
      console.error(e);
    }
  };

  const handleLoadDesign = async (id: string) => {
    try {
      const found = await designRepository.get(id);
      if (found) {
        setDesign(found);
        setCustomLettersText(found.customText || "MOM");
        setHistoryPast([]);
        setHistoryFuture([]);
        setSelectedStoneId(null);
        setMobileSheetOpen(false);
        showHUD(`העיצוב "${found.name}" נטען בהצלחה!`);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDesign = async (id: string) => {
    try {
      await designRepository.delete(id);
      const summaries = await designRepository.list();
      setSavedDesigns(summaries);
      setDeleteConfirmId(null);
      showHUD("העיצוב נמחק מהארכיון", "info");
    } catch (e) {
      console.error(e);
    }
  };

  const handleSwitchTemplate = (templateId: string) => {
    const template = getTemplateById(templateId);
    const metal = design?.metal || getMetalById("yellow_gold_18k");

    const { netVolume } = calculateDesignVolumeMm3(
      template.category,
      template.defaultMeasurements,
      template.defaultStones.length
    );
    const { estimatedFinishedWeight } = calculateEstimatedMetalWeight(netVolume, metal.density);
    const stoneCarat = template.defaultStones.reduce((sum, s) => sum + s.carat, 0);
    const pricing = calculateEstimatedPrice(
      estimatedFinishedWeight,
      metal.pricePerGram,
      template.defaultStones,
      false
    );

    const calculations = {
      netVolumeMm3: netVolume,
      estimatedMetalWeightGrams: estimatedFinishedWeight,
      estimatedStoneWeightCarats: parseFloat(stoneCarat.toFixed(3)),
      stoneCount: template.defaultStones.length,
      ...pricing
    };

    const newDesign: JewelryDesign = {
      id: `design_${templateId}_${Math.random().toString(36).substr(2, 9)}`,
      name: `עיצוב חדש - ${template.displayNameHebrew}`,
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

    newDesign.validation = validateDesign(newDesign);

    if (templateId === "ring_custom_letters" || templateId === "pendant_custom_letters") {
      newDesign.customText = "MOM";
      setCustomLettersText("MOM");
    }

    if (design) {
      setHistoryPast((prev) => [...prev, design]);
    }
    setHistoryFuture([]);
    setDesign(newDesign);
    setSelectedStoneId(null);
    showHUD(`תבנית שונתה ל-${template.displayNameHebrew}`);
  };

  // Export CAD JSON Specs
  const handleExportSpecification = () => {
    if (!design) return;
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(design, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `ES_LEVIEV_${design.name.replace(/\s+/g, "_")}_CAD_SPEC.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showHUD("מפרט ה-CAD יוצא בהצלחה כקובץ JSON!");
  };

  if (!design) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-brand-bg font-sans text-brand-text">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-brand-text font-serif font-medium text-lg">טוען קטלוג סטודיו יוקרה...</p>
        </div>
      </div>
    );
  }

  const worstValidationLevel = design.validation.reduce<null | "info" | "recommendation" | "warning" | "blocker">((worst, v) => {
    const rank = { info: 0, recommendation: 1, warning: 2, blocker: 3 };
    if (!worst || rank[v.level] > rank[worst]) return v.level;
    return worst;
  }, null);

  // ============================================================
  // SHARED PANEL CONTENT — rendered once, positioned differently
  // per breakpoint (desktop side columns vs. mobile bottom sheet)
  // ============================================================

  const inspectorPanel = (
    <div className="flex flex-col gap-5">
      <div>
        <h3 className="text-3xs uppercase tracking-widest text-ink-muted font-mono mb-1">פרמטרים והנדסה</h3>
        <h2 className="text-lg font-serif font-bold text-ink-primary">מאפייני הרכיב</h2>
      </div>

      <AnimatePresence mode="wait">
        {selectedStoneId ? (
          // PROPERTY PANEL FOR SELECTED STONE
          <motion.div
            key="stone_props"
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 12 }}
            className="flex flex-col gap-4"
          >
            <div className="p-3 bg-primary-light/40 rounded-xl border border-primary/25 text-ink-primary flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary-dark shrink-0" />
                <div>
                  <span className="text-3xs uppercase tracking-wider text-ink-secondary block font-mono font-bold">אבן חן נבחרת</span>
                  <span className="text-xs font-bold">מצב עריכה חי ותלת-ממדי</span>
                </div>
              </div>
              <button
                onClick={() => setSelectedStoneId(null)}
                className="p-1.5 hover:bg-white/70 rounded-lg text-ink-secondary hover:text-ink-primary transition-colors cursor-pointer"
                title="חזור למאפייני הטבעת"
                aria-label="חזור למאפייני הטבעת"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Stone details */}
            {design.stones.filter((s) => s.id === selectedStoneId).map((stone) => (
              <div key={stone.id} className="flex flex-col gap-3.5">
                <FieldGroup label="סוג האבן">
                  <select
                    value={stone.family}
                    onChange={(e) => handleSelectedStonePropertiesChange({ family: e.target.value as any })}
                    className={selectClass}
                  >
                    <option value="natural_diamond">יהלום טבעי</option>
                    <option value="lab_grown_diamond">יהלום מעבדה</option>
                    <option value="zircon">זרקון</option>
                    <option value="moissanite">מואסנייט</option>
                    <option value="gemstone">אבן חן</option>
                  </select>
                </FieldGroup>

                <FieldGroup label="צורת ליטוש">
                  <select
                    value={stone.shape}
                    onChange={(e) => handleSelectedStonePropertiesChange({ shape: e.target.value as any })}
                    className={`${selectClass} text-right`}
                  >
                    <option value="round">עגול (Round)</option>
                    <option value="oval">אובל (Oval)</option>
                    <option value="princess">פרינסס (Princess)</option>
                    <option value="emerald">אמרלד (Emerald)</option>
                    <option value="pear">אגס (Pear)</option>
                  </select>
                </FieldGroup>

                <SliderField
                  label="קוטר האבן"
                  value={stone.width}
                  unit={'מ"מ'}
                  min={1.0}
                  max={12.0}
                  step={0.1}
                  onDragStart={beginDesignTransaction}
                  onDragEnd={commitDesignTransaction}
                  onChange={(val) => handleSelectedStonePropertiesChange({ width: val, length: val })}
                />

                <SliderField
                  label="עומק האבן"
                  value={stone.depth}
                  unit={'מ"מ'}
                  min={0.5}
                  max={8.0}
                  step={0.1}
                  onDragStart={beginDesignTransaction}
                  onDragEnd={commitDesignTransaction}
                  onChange={(val) => handleSelectedStonePropertiesChange({ depth: val })}
                />

                <FieldGroup label="סוג השיבוץ">
                  <select
                    value={stone.settingType}
                    onChange={(e) => handleSelectedStonePropertiesChange({ settingType: e.target.value as any })}
                    className={selectClass}
                  >
                    <option value="four_prong">ארבע שיניים</option>
                    <option value="six_prong">שש שיניים</option>
                    <option value="bezel">מסגרת (Bezel)</option>
                    <option value="channel">מסילה (Channel)</option>
                    <option value="pave">פאווה (Pavé)</option>
                  </select>
                </FieldGroup>

                {/* Stat Carat summary */}
                <div className="p-3 bg-surface-sunken rounded-xl font-mono text-xs text-ink-primary flex justify-between border border-border-subtle">
                  <span className="text-ink-secondary">משקל משוער:</span>
                  <span className="font-bold text-primary-dark">{stone.carat.toFixed(3)} קראט</span>
                </div>

                <span className="w-full h-px bg-border-subtle my-1" />

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleDuplicateStone}
                    className="flex-1 py-2.5 bg-surface-sunken hover:bg-primary-light/50 text-ink-primary rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    שכפל אבן
                  </button>
                  <button
                    onClick={handleDeleteStone}
                    className="flex-1 py-2.5 bg-danger-bg hover:bg-danger/15 text-danger rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    מחק אבן
                  </button>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          // DEFAULT PROPERTY PANEL: JEWELRY BAND PARAMETERS
          <motion.div
            key="band_props"
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -12 }}
            className="flex flex-col gap-4"
          >
            <div className="p-3 bg-surface-sunken rounded-xl border border-border-subtle text-ink-secondary text-xs flex items-center gap-2">
              <Gem className="w-4 h-4 text-primary shrink-0" />
              לחצו על אבן כלשהי במודל התלת-ממד כדי לערוך את מאפייניה הפרטניים.
            </div>

            {/* Geometry Controls */}
            <div className="flex flex-col gap-4">
              {/* Category Display */}
              <div className="flex justify-between border-b border-border-subtle pb-2.5">
                <span className="text-xs text-ink-secondary">קטגוריית ייצור</span>
                <span className="text-xs font-bold text-ink-primary font-serif">
                  {design.category === "engagement_ring"
                    ? "טבעת אירוסין"
                    : design.category === "wedding_band"
                    ? "טבעת נישואין"
                    : design.category === "tennis_bracelet"
                    ? "צמיד טניס"
                    : design.category === "pendant"
                    ? "תליון"
                    : design.category === "necklace"
                    ? "שרשרת"
                    : "צמיד חישוק"}
                </span>
              </div>

              {/* Ring Size / Bracelet Length Slider */}
              {design.category === "tennis_bracelet" ? (
                <SliderField
                  label="אורך צמיד"
                  value={design.measurements.length || 17}
                  unit={'ס"מ'}
                  min={14}
                  max={22}
                  step={1}
                  onDragStart={beginDesignTransaction}
                  onDragEnd={commitDesignTransaction}
                  onChange={(val) => handleMeasurementChange("length", val)}
                />
              ) : (
                <div>
                  <SliderField
                    label="מידת אצבע (קוטר פנימי)"
                    value={design.measurements.innerDiameter}
                    unit={'מ"מ'}
                    min={13.0}
                    max={23.0}
                    step={0.1}
                    onDragStart={beginDesignTransaction}
                    onDragEnd={commitDesignTransaction}
                    onChange={(val) => handleMeasurementChange("innerDiameter", val)}
                  />
                  <span className="text-3xs text-ink-muted block text-left mt-1.5 font-mono">
                    מקביל למידה ישראלית {Math.round(design.measurements.innerDiameter * 2 - 21)}
                  </span>
                </div>
              )}

              <SliderField
                label="רוחב מתכת"
                value={design.measurements.width}
                unit={'מ"מ'}
                min={1.5}
                max={8.0}
                step={0.1}
                onDragStart={beginDesignTransaction}
                onDragEnd={commitDesignTransaction}
                onChange={(val) => handleMeasurementChange("width", val)}
              />

              <SliderField
                label="עובי מתכת"
                value={design.measurements.thickness}
                unit={'מ"מ'}
                min={1.0}
                max={3.0}
                step={0.1}
                onDragStart={beginDesignTransaction}
                onDragEnd={commitDesignTransaction}
                onChange={(val) => handleMeasurementChange("thickness", val)}
              />

              {/* Profile Selection */}
              {design.category !== "tennis_bracelet" && (
                <div>
                  <label className="text-xs text-ink-secondary block mb-2">פרופיל גיאומטרי של החישוק</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { id: "flat", name: "שטוח (Flat)" },
                      { id: "half_round", name: "חצי עגול" },
                      { id: "comfort_fit", name: "Comfort" },
                      { id: "oval", name: "אובלי (Oval)" },
                      { id: "beveled", name: "משופע" },
                      { id: "knife_edge", name: "סכין" },
                    ].map((prof) => (
                      <button
                        key={prof.id}
                        onClick={() => handleProfileChange(prof.id as any)}
                        className={`py-2 px-2 rounded-lg border text-2xs font-medium text-center transition-all cursor-pointer ${
                          design.measurements.profile === prof.id
                            ? "bg-primary border-primary-dark text-white shadow-sm"
                            : "bg-surface hover:bg-primary-light/40 text-ink-primary border-border-subtle"
                        }`}
                      >
                        {prof.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const catalogPanel = (
    <div className="flex flex-col gap-5 h-full">
      {/* Navigation Tab rail */}
      <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5 lg:flex lg:border-b lg:border-border-subtle lg:pb-2">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex flex-col lg:flex-1 items-center justify-center gap-1 rounded-xl lg:rounded-lg py-2 lg:py-1.5 px-1 text-3xs lg:text-2xs font-semibold transition-all cursor-pointer border lg:border-0 ${
                isActive
                  ? "bg-primary text-white border-primary-dark lg:bg-transparent lg:text-ink-primary lg:border-b-2 lg:border-b-primary lg:rounded-none"
                  : "bg-surface text-ink-secondary border-border-subtle hover:bg-primary-light/30 lg:border-b-2 lg:border-b-transparent lg:hover:text-ink-primary"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="whitespace-nowrap">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Panel */}
      <div className="flex-1">
        <AnimatePresence mode="wait">

          {/* TAB 1: TEMPLATE SELECTOR */}
          {activeTab === "template" && (
            <motion.div key="tab_template" {...tabMotionProps} className="flex flex-col gap-4">
              <h3 className="text-sm font-serif font-bold text-ink-primary mb-1">קטלוג תבניות CAD בסיסיות</h3>

              {/* Dynamic Lettering Editor Card */}
              {(design.templateId === "ring_custom_letters" || design.templateId === "pendant_custom_letters") && (
                <div className="bg-primary-light/25 p-4 rounded-xl border border-primary/30 flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-primary-dark" />
                    <span className="text-2xs uppercase font-bold tracking-wider text-primary-dark font-mono">שיבוץ אותיות ולוחית שם אישי</span>
                  </div>
                  <p className="text-xs text-ink-secondary leading-relaxed">
                    הקלידו מילה או שם באנגלית (עד 8 אותיות, למשל: MOM, LOVE, QUEEN). המערכת תחשב ותשבץ מיידית יהלומים תואמים בלוחית התלת-ממד:
                  </p>
                  <input
                    type="text"
                    maxLength={8}
                    placeholder="MOM"
                    value={customLettersText}
                    onChange={(e) => handleCustomLettersTextChange(e.target.value)}
                    className="w-full bg-surface border border-border rounded-lg px-3 py-2.5 text-sm font-bold text-ink-primary focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none tracking-widest text-center"
                  />
                  <span className="text-3xs text-ink-muted">
                    * השיבוץ מיוצר במיקרו-פאווה מדויק ומתעדכן ישירות במחיר ובמשקל של התכשיט.
                  </span>
                </div>
              )}

              {/* Category Sections */}
              {["engagement_ring", "wedding_band", "tennis_bracelet", "pendant", "necklace", "bangle"].map((cat) => (
                <div key={cat} className="flex flex-col gap-2">
                  <span className="text-3xs uppercase tracking-widest text-ink-muted font-mono font-bold">
                    {cat === "engagement_ring"
                      ? "טבעות אירוסין"
                      : cat === "wedding_band"
                      ? "טבעות נישואין"
                      : cat === "tennis_bracelet"
                      ? "צמידי טניס"
                      : cat === "pendant"
                      ? "תליונים בעיצוב אישי"
                      : cat === "necklace"
                      ? "שרשראות יהלומים יוקרתיות"
                      : "צמידי חישוק קשיחים (Bangles)"}
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {TEMPLATE_REGISTRY.filter((t) => t.category === cat).map((t) => (
                      <button
                        key={t.id}
                        onClick={() => handleSwitchTemplate(t.id)}
                        className={`p-3.5 rounded-xl border text-right transition-all flex justify-between items-center cursor-pointer ${
                          design.templateId === t.id
                            ? "bg-primary-light/30 border-primary shadow-sm animate-pulse-subtle"
                            : "bg-surface hover:bg-surface-hover border-border-subtle"
                        }`}
                      >
                        <span className="text-sm font-bold text-ink-primary">{t.displayNameHebrew}</span>
                        <ChevronRight className={`w-4 h-4 ${design.templateId === t.id ? "text-primary-dark" : "text-ink-muted"}`} />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {/* TAB 2: METAL SELECTION */}
          {activeTab === "metal" && (
            <motion.div key="tab_metal" {...tabMotionProps} className="flex flex-col gap-4">
              <h3 className="text-sm font-serif font-bold text-ink-primary mb-1">בחירת מתכת וטוהר קראט</h3>
              <div className="grid grid-cols-1 gap-2.5">
                {METAL_REGISTRY.map((m) => {
                  const isSelected = design.metal.id === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => handleMetalChange(m.id)}
                      className={`p-3 rounded-xl border text-right flex items-center gap-4 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-primary-light/30 border-primary shadow-sm"
                          : "bg-surface hover:bg-surface-hover border-border-subtle"
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-full shadow-inner border border-border shrink-0"
                        style={{ backgroundColor: m.color }}
                      />
                      <div className="flex-1">
                        <span className="text-sm font-bold text-ink-primary block">{m.name}</span>
                        <span className="text-3xs text-ink-muted font-mono">
                          צפיפות: {m.density} g/cm³ | {m.pricePerGram} ש&quot;ח לגרם
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 3: SURFACE FINISHES */}
          {activeTab === "finish" && (
            <motion.div key="tab_finish" {...tabMotionProps} className="flex flex-col gap-4">
              <h3 className="text-sm font-serif font-bold text-ink-primary mb-1">גימור שטח פני המתכת</h3>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: "polished", label: "מבריק קלאסי", desc: "החזר אור מלוטש ומראה מראה" },
                  { id: "matte", label: "מט (Matte)", desc: "מראה קטיפתי עדין ללא השתקפות" },
                  { id: "satin", label: "סאטן חלק", desc: "ליטוש קווי עדין וחצי מבריק" },
                  { id: "brushed", label: "מוברש", desc: "מרקם סיבים אופקי קשוח ומתוחכם" },
                  { id: "hammered", label: "מרוקע פטיש", desc: "פאות אמנותיות המיוצרות בעבודת יד" },
                  { id: "sandblasted", label: "התזת חול", desc: "מרקם מחוספס וגרגירי ייחודי" },
                  { id: "diamond_cut", label: "חיתוך יהלום", desc: "פאות מנצנצות מבריקות במיוחד" },
                ].map((f) => {
                  const isSelected = design.finish === f.id;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleFinishChange(f.id as any)}
                      className={`p-3 rounded-xl border text-right transition-all flex flex-col justify-between h-24 cursor-pointer ${
                        isSelected
                          ? "bg-primary-light/30 border-primary shadow-sm"
                          : "bg-surface hover:bg-surface-hover border-border-subtle"
                      }`}
                    >
                      <span className="text-xs font-bold text-ink-primary">{f.label}</span>
                      <span className="text-3xs text-ink-muted leading-normal">{f.desc}</span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* TAB 4: ADD STONE WIZARD */}
          {activeTab === "stones" && (
            <motion.div key="tab_stones" {...tabMotionProps} className="flex flex-col gap-4">
              <h3 className="text-sm font-serif font-bold text-ink-primary mb-1">מחולל שיבוץ יהלומים ואבנים</h3>

              <div className="flex flex-col gap-3">
                <FieldGroup label="משפחת אבן">
                  <select
                    value={wizardFamily}
                    onChange={(e) => setWizardFamily(e.target.value as any)}
                    className={selectClass}
                  >
                    <option value="natural_diamond">יהלום טבעי</option>
                    <option value="lab_grown_diamond">יהלום מעבדה</option>
                    <option value="zircon">זרקון</option>
                    <option value="moissanite">מואסנייט</option>
                    <option value="gemstone">אבן חן</option>
                  </select>
                </FieldGroup>

                <FieldGroup label="צורת הליטוש">
                  <select
                    value={wizardShape}
                    onChange={(e) => setWizardShape(e.target.value as any)}
                    className={`${selectClass} text-right`}
                  >
                    <option value="round">עגול (Round)</option>
                    <option value="oval">אובל (Oval)</option>
                    <option value="princess">פרינסס (Princess)</option>
                    <option value="emerald">אמרלד (Emerald)</option>
                    <option value="pear">אגס (Pear)</option>
                  </select>
                </FieldGroup>

                <SliderField
                  label="קוטר האבן"
                  value={wizardSize}
                  unit={'מ"מ'}
                  min={1.2}
                  max={10.0}
                  step={0.1}
                  onChange={(val) => setWizardSize(val)}
                />

                <FieldGroup label="סוג השיבוץ המבוקש">
                  <select
                    value={wizardSetting}
                    onChange={(e) => setWizardSetting(e.target.value as any)}
                    className={selectClass}
                  >
                    <option value="four_prong">ארבע שיניים (קלאסי)</option>
                    <option value="six_prong">שש שיניים</option>
                    <option value="bezel">שיבוץ כוס (Bezel)</option>
                    <option value="pave">פאווה / נקודות חרוז</option>
                  </select>
                </FieldGroup>

                <div>
                  <label className="text-xs text-ink-secondary block mb-2">אופן שילוב ומיקום בעבודה</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {[
                      { id: "center", label: "אבן מרכזית" },
                      { id: "halo", label: "הילת אבנים" },
                      { id: "shoulders", label: "שיבוץ כתף" },
                    ].map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setWizardPlacement(p.id as any)}
                        className={`py-2 px-2 rounded-lg border text-2xs font-medium text-center transition-all cursor-pointer ${
                          wizardPlacement === p.id
                            ? "bg-primary border-primary-dark text-white shadow-sm"
                            : "bg-surface hover:bg-surface-hover text-ink-primary border-border-subtle"
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddStoneConfirm}
                  className="w-full py-3 bg-primary-dark hover:bg-primary text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 mt-1 cursor-pointer hover:shadow-lg"
                >
                  <Plus className="w-4 h-4" />
                  הוסף יהלום לעיצוב
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 5: ENGRAVING SYSTEM */}
          {activeTab === "engraving" && (
            <motion.div key="tab_engraving" {...tabMotionProps} className="flex flex-col gap-4">
              <h3 className="text-sm font-serif font-bold text-ink-primary mb-1">חריטה אישית (בלייזר)</h3>

              <div className="flex flex-col gap-3">
                <FieldGroup label="טקסט חריטה בעברית או באנגלית">
                  <input
                    type="text"
                    placeholder="למשל: שלי לנצח 14.02.2026"
                    value={design.engravings[0]?.text || ""}
                    onChange={(e) => handleEngravingTextChange(e.target.value)}
                    className="w-full bg-surface border border-border-subtle rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none"
                  />
                </FieldGroup>

                <div className="p-3 bg-surface-sunken rounded-xl border border-border-subtle flex gap-2.5">
                  <Info className="w-4 h-4 text-ink-muted shrink-0 mt-0.5" />
                  <p className="text-2xs text-ink-secondary leading-relaxed">
                    החריטה מבוצעת באמצעות טכנולוגיית לייזר סיב מתקדמת בחלק הפנימי של חישוק הזהב.
                    מוגבל ל-25 תווים. אותיות מיוחדות ותאריכים נתמכים באופן מלא.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* TAB 6: AI DESIGN ASSISTANT */}
          {activeTab === "ai" && (
            <motion.div key="tab_ai" {...tabMotionProps} className="flex flex-col gap-4">
              <div className="flex items-center gap-2 mb-1">
                <Bot className="w-5 h-5 text-primary-dark" />
                <h3 className="text-sm font-serif font-bold text-ink-primary">עוזר העיצוב החכם של ES LEVIEV</h3>
              </div>

              {pendingAIChange ? (
                <div className="p-4 bg-surface-sunken border border-primary/40 rounded-xl flex flex-col gap-3.5">
                  <div className="flex items-start gap-2.5">
                    <Info className="w-5 h-5 text-primary-dark shrink-0 mt-0.5" />
                    <div>
                      <span className="text-2xs font-bold text-ink-primary block">עוזר ה-AI מציע שינוי בעיצוב:</span>
                      <p className="text-xs text-ink-primary/90 leading-relaxed mt-1 font-medium">
                        {pendingAIChange.explanation}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={handleApplyAIChanges}
                      className="flex-1 py-2.5 bg-primary-dark hover:bg-primary text-white rounded-lg text-xs font-bold shadow-md transition-all cursor-pointer"
                    >
                      אשר והחל שינויים
                    </button>
                    <button
                      onClick={() => setPendingAIChange(null)}
                      className="flex-1 py-2.5 bg-surface hover:bg-surface-hover text-ink-secondary rounded-lg text-xs font-medium border border-border-subtle transition-all cursor-pointer"
                    >
                      ביטול
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-3.5">
                  <textarea
                    rows={4}
                    placeholder="למשל: 'שנה את הטבעת לזהב לבן 18 קראט, תוסיף חריטה 'שלי לנצח' ותגדיל את האבן המרכזית ל-1.5 קראט'"
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    className="w-full bg-surface border border-border-subtle rounded-lg p-3 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none leading-relaxed"
                  />

                  {aiMessageError && (
                    <div className="p-2.5 bg-danger-bg border border-danger/30 rounded-lg text-danger text-xs font-medium">
                      {aiMessageError}
                    </div>
                  )}

                  <button
                    onClick={handleSendAiPrompt}
                    disabled={aiLoading || !aiPrompt.trim()}
                    className="w-full py-3 bg-primary-dark hover:bg-primary disabled:opacity-50 text-white rounded-lg text-xs font-semibold shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {aiLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                    שלח לעוזר ה-AI
                  </button>

                  <div className="mt-1 text-right">
                    <span className="text-3xs uppercase tracking-wider text-ink-muted block mb-1.5 font-mono font-bold">הצעות לפקודות:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {[
                        "הפוך לזהב רוז 18 קראט",
                        "הגדל את האבן ל-1.5 קראט",
                        "הוסף הילה עגולה",
                        "רחב את הטבעת ל-3 מ\"מ",
                      ].map((suggest, idx) => (
                        <button
                          key={idx}
                          onClick={() => setAiPrompt(suggest)}
                          className="text-3xs bg-surface-sunken hover:bg-primary-light/50 text-ink-primary px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          {suggest}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Real-time Photorealistic Image Prompt Generator */}
              <div className="border-t border-border-subtle pt-4 mt-2 flex flex-col gap-3.5">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4 text-primary-dark" />
                  <h4 className="text-xs font-bold text-ink-primary">מחולל הדמיות פוטו-ריאליסטיות (Prompt)</h4>
                </div>

                <div className="p-3 bg-surface-sunken border border-border-subtle rounded-xl flex flex-col gap-2.5">
                  <div className="flex justify-between items-center text-3xs font-semibold text-ink-secondary">
                    <span>תיאור העיצוב בעברית:</span>
                    <span className="text-primary-dark">Leviev Spec v1.0</span>
                  </div>
                  <p className="text-xs text-ink-primary leading-normal text-right">
                    {buildHebrewDescription(design)}
                  </p>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex justify-between items-center text-3xs font-semibold text-ink-secondary">
                    <span>פרומפט למחולל תמונות (Nano Banana / Midjourney):</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(buildImagePrompt(design));
                        showHUD("הפרומפט הועתק ללוח! מוכן להדמיה ריאליסטית", "success");
                      }}
                      className="text-3xs text-primary-dark hover:text-primary font-bold flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Copy className="w-3 h-3" />
                      העתק פרומפט
                    </button>
                  </div>

                  <textarea
                    readOnly
                    rows={6}
                    value={buildImagePrompt(design)}
                    className="w-full bg-[#1c1917] text-stone-300 rounded-lg p-3 text-3xs font-mono leading-relaxed outline-none border border-stone-800 resize-none select-all text-left"
                    dir="ltr"
                  />
                </div>

                <p className="text-3xs text-ink-muted leading-relaxed text-right">
                  * טיפ: העתיקו את הפרומפט לעיל, והזינו אותו ישירות ב-<strong>Nano Banana</strong> או ב-<strong>Midjourney</strong> לקבלת הדמיה פוטו-ריאליסטית מרהיבה של הטבעת או התליון שבניתם ברמת דיוק מקסימלית.
                </p>
              </div>
            </motion.div>
          )}

          {/* TAB 7: SAVED DESIGNS & ARCHIVE */}
          {activeTab === "library" && (
            <motion.div key="tab_library" {...tabMotionProps} className="flex flex-col gap-4">
              <h3 className="text-sm font-serif font-bold text-ink-primary mb-1">ארכיון עיצובים השמורים שלך</h3>

              {savedDesigns.length === 0 ? (
                <div className="text-center py-8 text-ink-muted text-xs flex flex-col items-center gap-2">
                  <Archive className="w-8 h-8 text-ink-muted/60" />
                  אין עיצובים שמורים עדיין. לחצו על שמירה בראש הדף כדי לשמור גרסת עיצוב ראשונה!
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {savedDesigns.map((d) =>
                    deleteConfirmId === d.id ? (
                      <div
                        key={d.id}
                        className="p-3 bg-danger-bg border border-danger/40 rounded-xl flex items-center justify-between gap-2"
                      >
                        <span className="text-2xs text-danger font-medium flex-1">למחוק לצמיתות את &quot;{d.name}&quot;?</span>
                        <button
                          onClick={() => handleDeleteDesign(d.id)}
                          className="px-3 py-1.5 bg-danger hover:bg-danger/90 text-white rounded-lg text-2xs font-bold cursor-pointer whitespace-nowrap"
                        >
                          מחק
                        </button>
                        <button
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-3 py-1.5 bg-surface hover:bg-surface-hover text-ink-secondary border border-border-subtle rounded-lg text-2xs font-medium cursor-pointer whitespace-nowrap"
                        >
                          ביטול
                        </button>
                      </div>
                    ) : (
                      <div
                        key={d.id}
                        className={`p-3 bg-surface border rounded-xl text-right flex items-center justify-between shadow-xs transition-all ${
                          d.id === design.id ? "border-primary/60 ring-1 ring-primary/30" : "border-border-subtle hover:border-border"
                        }`}
                      >
                        <div className="flex-1 cursor-pointer" onClick={() => handleLoadDesign(d.id)}>
                          <span className="text-xs font-bold text-ink-primary block mb-0.5">{d.name}</span>
                          <span className="text-3xs text-ink-muted block leading-relaxed font-mono">
                            {d.metalName} | {d.totalPrice.toLocaleString()} ₪ | גרסה {d.version}
                          </span>
                        </div>

                        <button
                          onClick={() => setDeleteConfirmId(d.id)}
                          className="p-2 hover:bg-danger-bg text-ink-muted hover:text-danger rounded-lg transition-colors cursor-pointer"
                          aria-label="מחק עיצוב"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )
                  )}
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-brand-bg font-sans select-none overflow-hidden text-ink-primary" dir="rtl">
      {/* --- HUD NOTIFICATION TOAST --- */}
      <AnimatePresence>
        {hudMessage && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className={`fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-3 px-5 py-3.5 rounded-xl shadow-float border max-w-[92vw] ${
              hudMessage.type === "success"
                ? "bg-[#2D2821] border-[#3E3830] text-primary"
                : hudMessage.type === "error"
                ? "bg-rose-950 border-rose-900 text-rose-200"
                : "bg-[#3E3830] border-stone-700 text-stone-200"
            }`}
          >
            <Sparkles className="w-5 h-5 text-primary shrink-0" />
            <span className="text-sm font-medium">{hudMessage.text}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ================= HEADER TOOLBAR ================= */}
      <header className="bg-brand-secondary border-b border-border-subtle py-2.5 px-3 sm:px-5 flex items-center justify-between gap-3 shadow-sm select-none z-20 shrink-0">
        {/* Brand & Design Name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="border-l-2 border-primary pl-3 shrink-0 hidden sm:block">
            <h1 className="text-lg font-bold tracking-wider text-ink-primary font-serif leading-tight">
              ES LEVIEV
            </h1>
            <p className="text-3xs uppercase tracking-widest text-ink-muted font-mono leading-tight">
              Jewelry Design Studio 360
            </p>
          </div>
          <div className="min-w-0">
            <span className="text-3xs text-ink-muted block font-mono">שם העיצוב &middot; גרסה {design.version}</span>
            <input
              type="text"
              value={design.name}
              onChange={(e) => commitDesignState({ ...design, name: e.target.value })}
              className="w-full text-sm sm:text-base font-medium text-ink-primary bg-transparent border-b border-transparent hover:border-border focus:border-primary outline-none pb-0.5 transition-colors font-serif"
            />
          </div>
        </div>

        {/* CAD & State Actions */}
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 shrink-0">
          <ToolbarButton onClick={handleUndo} disabled={historyPast.length === 0} label="בטל" icon={RotateCcw} iconOnly />
          <ToolbarButton onClick={handleRedo} disabled={historyFuture.length === 0} label="בצע מחדש" icon={RotateCw} iconOnly />

          <span className="w-px h-6 bg-border mx-0.5 hidden sm:block" />

          <ToolbarButton
            onClick={() => {
              setViewPreset("perspective");
              showHUD("תצוגה אופסה למצב ברירת מחדל!");
            }}
            label="איפוס תצוגה"
            className="hidden md:inline-flex"
          />

          <ToolbarButton
            onClick={() => {
              setShowDimensions(!showDimensions);
              showHUD(showDimensions ? "הצגת מידות כובתה" : "הצגת מידות פעילה");
            }}
            label="הצגת מידות"
            active={showDimensions}
            className="hidden md:inline-flex"
          />

          <button
            onClick={handleSaveDesign}
            className="px-3 sm:px-3.5 py-2 bg-[#2D2821] hover:bg-[#3E3830] text-primary hover:text-primary-light rounded-lg text-xs font-medium shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span className="hidden sm:inline">שמירה</span>
          </button>

          <ToolbarButton onClick={handleSaveAsNewVersion} label="גרסה חדשה" className="hidden lg:inline-flex" />
          <ToolbarButton onClick={handleExportSpecification} label="ייצוא CAD" icon={FileText} className="hidden lg:inline-flex" />
        </div>
      </header>

      {/* ================= MAIN CONFIGURATOR AREA ================= */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* LEFT PANEL: Selected Item Properties (desktop only) */}
        <aside className="hidden lg:flex lg:w-72 bg-brand-secondary border-l border-border-subtle p-5 flex-col shrink-0 overflow-y-auto">
          {inspectorPanel}
        </aside>

        {/* CENTER INTERACTIVE 3D STAGE */}
        <main className="flex-1 flex flex-col p-3 lg:p-4 gap-3 relative min-w-0">

          {/* Top Camera Preset HUD Toolbar */}
          <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 flex gap-1 bg-[#2D2821]/95 backdrop-blur border border-[#3E3830] p-1 rounded-xl shadow-lg select-none scale-90 sm:scale-100 whitespace-nowrap">
            {[
              { id: "perspective", name: "תלת-ממד" },
              { id: "front", name: "חזית" },
              { id: "top", name: "מלמעלה" },
              { id: "side", name: "צד" },
            ].map((preset) => (
              <button
                key={preset.id}
                onClick={() => setViewPreset(preset.id as any)}
                className={`py-1.5 px-3 rounded-lg text-2xs font-medium transition-all cursor-pointer ${
                  viewPreset === preset.id
                    ? "bg-primary text-white shadow-sm"
                    : "text-stone-300 hover:bg-[#3E3830]/80 hover:text-white"
                }`}
              >
                {preset.name}
              </button>
            ))}
          </div>

          {/* Core WebGL 3D Viewer */}
          <div className="flex-1 min-h-0 rounded-2xl overflow-hidden bg-gradient-to-b from-surface-sunken to-brand-bg">
            <JewelryViewer3D
              design={design}
              selectedStoneId={selectedStoneId}
              onSelectStone={setSelectedStoneId}
              showDimensions={showDimensions}
              viewPreset={viewPreset}
            />
          </div>

          {/* Mobile floating trigger to open the customization sheet */}
          <button
            onClick={() => setMobileSheetOpen(true)}
            className="lg:hidden fixed bottom-24 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 bg-primary-dark hover:bg-primary text-white px-5 py-3 rounded-full shadow-float text-sm font-bold cursor-pointer"
          >
            <Settings2 className="w-4 h-4" />
            התאמה אישית
          </button>
        </main>

        {/* RIGHT PANEL: Design and Customization Options Library (desktop only) */}
        <aside className="hidden lg:flex lg:w-96 bg-brand-secondary border-r border-border-subtle p-5 flex-col shrink-0 overflow-y-auto">
          {catalogPanel}
        </aside>

        {/* ============ MOBILE BOTTOM SHEET ============ */}
        <AnimatePresence>
          {mobileSheetOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileSheetOpen(false)}
                className="lg:hidden fixed inset-0 bg-black/45 z-40"
              />
              <motion.div
                role="dialog"
                aria-modal="true"
                aria-label="התאמה אישית"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 32, stiffness: 320 }}
                className="lg:hidden fixed inset-x-0 bottom-0 z-50 bg-brand-secondary rounded-t-3xl shadow-float max-h-[85vh] flex flex-col"
              >
                <div className="flex items-center justify-between px-5 pt-3 pb-2 shrink-0 border-b border-border-subtle">
                  <span className="w-10 h-1.5 bg-border rounded-full mx-auto absolute left-1/2 -translate-x-1/2 top-2" />
                  <span className="text-sm font-serif font-bold text-ink-primary">התאמה אישית</span>
                  <button
                    onClick={() => setMobileSheetOpen(false)}
                    className="p-1.5 hover:bg-surface-sunken rounded-lg text-ink-secondary cursor-pointer"
                    aria-label="סגור"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <div className="overflow-y-auto p-5 flex flex-col gap-6">
                  {inspectorPanel}
                  <div className="h-px bg-border-subtle" />
                  {catalogPanel}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>

      {/* ================= BOTTOM METRICS & PRICE BAR ================= */}
      <footer className="bg-[#1E1A15] border-t border-[#3E3830] text-white shrink-0 z-20 select-none relative">
        {/* Expanded validation issue list */}
        <AnimatePresence>
          {validationOpen && design.validation.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="absolute bottom-full mb-2 right-3 left-3 sm:right-auto sm:left-auto sm:w-[420px] max-h-72 overflow-y-auto bg-[#110E0C] border border-[#3E3830] rounded-xl shadow-float p-3 flex flex-col gap-2"
            >
              {design.validation.map((v) => (
                <div key={v.id} className="flex items-start gap-2 text-right">
                  {v.level === "blocker" ? (
                    <AlertTriangle className="w-4 h-4 text-danger shrink-0 mt-0.5" />
                  ) : v.level === "warning" ? (
                    <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  ) : (
                    <Info className="w-4 h-4 text-info shrink-0 mt-0.5" />
                  )}
                  <p className="text-2xs text-stone-200 leading-relaxed">{v.messageHebrew}</p>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="p-3 sm:p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Real-time CAD weights, measurements */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 overflow-x-auto no-scrollbar">
            <StatChip icon={Scale} label="משקל זהב משוער" value={`${design.calculations.estimatedMetalWeightGrams.toFixed(2)} גרם`} />
            <StatChip icon={Sparkles} label="משקל אבנים כולל" value={`${design.calculations.estimatedStoneWeightCarats.toFixed(3)} קראט`} />
            <StatChip icon={Sliders} label="מספר אבנים" value={`${design.calculations.stoneCount}`} className="hidden sm:flex" />
            <StatChip icon={Maximize2} label="מפרט מידות" value={`${design.measurements.width} x ${design.measurements.thickness} מ"מ`} className="hidden md:flex" />
          </div>

          {/* Validation console */}
          <button
            onClick={() => setValidationOpen((v) => !v)}
            className="flex-1 md:max-w-md bg-[#110E0C] hover:bg-[#171310] border border-[#3E3830] rounded-xl p-2.5 px-3.5 flex items-center gap-2.5 overflow-hidden leading-normal text-right cursor-pointer transition-colors"
          >
            {design.validation.length > 0 ? (
              <>
                {worstValidationLevel === "blocker" ? (
                  <AlertTriangle className="w-5 h-5 text-danger shrink-0" />
                ) : worstValidationLevel === "warning" ? (
                  <AlertTriangle className="w-5 h-5 text-primary shrink-0" />
                ) : (
                  <Info className="w-5 h-5 text-info shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <span className="text-3xs font-mono uppercase font-bold tracking-widest block text-stone-400">
                    בקרת ייצור (CAD) &middot; {design.validation.length} הערות
                  </span>
                  <p className="text-xs text-stone-200 truncate">
                    {design.validation[0].messageHebrew}
                  </p>
                </div>
                {validationOpen ? <ChevronDown className="w-4 h-4 text-stone-400 shrink-0" /> : <ChevronUp className="w-4 h-4 text-stone-400 shrink-0" />}
              </>
            ) : (
              <div className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-success" />
                <div className="text-right">
                  <span className="text-3xs font-mono uppercase block text-stone-400">בקרת ייצור</span>
                  <span className="text-xs text-stone-100">העיצוב תקין ומאושר לייצור!</span>
                </div>
              </div>
            )}
          </button>

          {/* Estimated Price & Quote trigger */}
          <div className="flex items-center gap-3 sm:gap-4 justify-between md:justify-end">
            <div className="text-left">
              <span className="text-3xs uppercase tracking-widest text-stone-400 block font-mono">מחיר משוער (כולל מע&quot;מ)</span>
              <span className="text-lg sm:text-xl font-bold text-primary font-mono">
                {design.calculations.totalPrice.toLocaleString()} ₪
              </span>
            </div>
            <button
              onClick={() => {
                showHUD("בקשתך להצעת מחיר התקבלה! נציג ES LEVIEV יחזור אלייך בהקדם.", "success");
              }}
              className="px-4 sm:px-5 py-2.5 sm:py-3 bg-primary hover:bg-primary-dark text-white rounded-xl text-xs font-bold shadow-lg transition-all cursor-pointer whitespace-nowrap"
            >
              בקשת הצעת מחיר
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ============================================================
// Small shared presentational helpers
// ============================================================

const selectClass = "w-full bg-surface border border-border-subtle rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none";

const tabMotionProps = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function FieldGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <label className="text-xs text-ink-secondary block mb-1.5">{label}</label>
      {children}
    </div>
  );
}

function SliderField({
  label,
  value,
  unit,
  min,
  max,
  step,
  onChange,
  onDragStart,
  onDragEnd,
}: {
  label: string;
  value: number;
  unit: string;
  min: number;
  max: number;
  step: number;
  onChange: (value: number) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
}) {
  return (
    <div>
      <div className="flex justify-between items-baseline text-xs mb-1.5">
        <span className="text-ink-secondary">{label}</span>
        <span className="font-mono text-ink-primary font-bold">{value} {unit}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onMouseDown={onDragStart}
        onTouchStart={onDragStart}
        onMouseUp={onDragEnd}
        onTouchEnd={onDragEnd}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full accent-primary cursor-pointer h-2"
      />
    </div>
  );
}

function ToolbarButton({
  onClick,
  label,
  icon: Icon,
  disabled,
  active,
  iconOnly,
  className = "",
}: {
  onClick: () => void;
  label: string;
  icon?: ComponentType<{ className?: string }>;
  disabled?: boolean;
  active?: boolean;
  iconOnly?: boolean;
  className?: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className={`${iconOnly ? "p-2" : "px-3 py-2"} inline-flex items-center gap-1.5 rounded-lg border text-xs font-medium shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed ${
        active
          ? "bg-primary text-white border-primary-dark"
          : "bg-surface hover:bg-primary-light/40 text-ink-primary border-border-subtle"
      } ${className}`}
    >
      {Icon && <Icon className="w-4 h-4" />}
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}

function StatChip({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-2.5 bg-[#2D2821]/80 p-2 rounded-xl border border-[#4E453A]/40 pr-3 pl-3 shrink-0 ${className}`}>
      <Icon className="w-4 h-4 text-primary shrink-0" />
      <div>
        <span className="text-3xs uppercase tracking-widest text-stone-400 block font-mono whitespace-nowrap">{label}</span>
        <span className="text-xs font-bold font-mono whitespace-nowrap">{value}</span>
      </div>
    </div>
  );
}
