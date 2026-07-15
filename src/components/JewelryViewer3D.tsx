/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, Suspense, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Text, Environment } from "@react-three/drei";
import { JewelryDesign, StoneInstance } from "../types";
import { RingShankMesh } from "./RingShankMesh";
import { StoneMesh } from "./StoneMesh";
import { BraceletMesh } from "./BraceletMesh";

interface JewelryViewer3DProps {
  design: JewelryDesign;
  selectedStoneId: string | null;
  onSelectStone: (id: string | null) => void;
  showDimensions: boolean;
  viewPreset: "perspective" | "front" | "back" | "top" | "side";
}

// Internal scene component to access useThree if needed
const ShowroomScene: React.FC<{
  design: JewelryDesign;
  selectedStoneId: string | null;
  onSelectStone: (id: string | null) => void;
  showDimensions: boolean;
}> = ({ design, selectedStoneId, onSelectStone, showDimensions }) => {
  const { category, measurements, metal, finish, stones, engravings } = design;
  const { innerDiameter, thickness, width } = measurements;

  // Position of ground shadow based on ring radius, pendant offset, or bracelet size
  let shadowY = -innerDiameter / 2 - thickness - 0.2;
  if (category === "tennis_bracelet") {
    shadowY = -3.0;
  } else if (category === "pendant" || category === "necklace") {
    shadowY = -8.5; // Pendant hangs down to ~Y=-5, so -8.5 floating shadow looks incredibly premium!
  }

  return (
    <group position={[0, 0, 0]}>
      {/* 1. Base Jewelry Geometry */}
      {category === "tennis_bracelet" ? (
        // Tennis Bracelet Mode
        <BraceletMesh
          measurements={measurements}
          metal={metal}
          stones={stones}
          finish={finish}
          selectedStoneId={selectedStoneId}
          onSelectStone={onSelectStone}
        />
      ) : category === "pendant" || category === "necklace" ? (
        // Pendant & Necklace Mode
        <group>
          {/* Main Elegant Neckwire loop chain - positioned at Y = 35 so the bottom rests around Y = 0 */}
          <group position={[0, 35, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <RingShankMesh
              measurements={{
                innerDiameter: 70,
                width: 1.1,
                thickness: 1.1,
                profile: "oval",
              }}
              metal={metal}
              finish={finish}
              showDimensions={false}
            />
          </group>

          {/* Highly polished Gold bail (bale) loop right at the bottom of the wire connecting the chain to the pendant */}
          <mesh position={[0, 1.2, 0]} rotation={[0, 0, 0]} castShadow receiveShadow>
            <torusGeometry args={[1.2, 0.35, 8, 24]} />
            <meshPhysicalMaterial
              color={metal.color}
              metalness={Math.min(metal.metalness, 0.88)}
              roughness={metal.roughness}
              clearcoat={1.0}
            />
          </mesh>

          {/* Solid Gold Backing Plates for Pendants */}
          {design.templateId === "pendant_custom_letters" && (
            <group position={[0, -2.5, -0.2]}>
              {/* Polished nameplate base bar */}
              <mesh castShadow receiveShadow>
                <boxGeometry args={[17.0, 4.5, 0.6]} />
                <meshPhysicalMaterial
                  color={metal.color}
                  metalness={Math.min(metal.metalness, 0.88)}
                  roughness={metal.roughness}
                  clearcoat={1.0}
                />
              </mesh>
              {/* Elegant supporting border rim */}
              <mesh position={[0, 0, 0.3]} castShadow>
                <boxGeometry args={[17.2, 4.7, 0.1]} />
                <meshPhysicalMaterial
                  color={metal.color}
                  metalness={Math.min(metal.metalness, 0.88)}
                  roughness={metal.roughness}
                  clearcoat={1.0}
                />
              </mesh>
            </group>
          )}

          {design.templateId === "pendant_heart" && (
            <mesh position={[0, -2.4, -0.25]} rotation={[Math.PI / 2, 0, 0]} castShadow receiveShadow>
              {/* A beautiful polished plate supporting the heart stones */}
              <cylinderGeometry args={[4.2, 4.2, 0.4, 24]} />
              <meshPhysicalMaterial
                color={metal.color}
                metalness={Math.min(metal.metalness, 0.88)}
                roughness={metal.roughness}
                clearcoat={1.0}
              />
            </mesh>
          )}

          {/* Render all pendant/necklace stones */}
          {stones.map((stone, idx) => {
            const isSelected = selectedStoneId === stone.id;
            return (
              <StoneMesh
                key={stone.id || idx}
                stone={stone}
                metal={metal}
                isSelected={isSelected}
                onSelect={() => onSelectStone(stone.id)}
              />
            );
          })}
        </group>
      ) : (
        // Ring & Bangle Mode (Bangles behave like a large ring!)
        <group>
          <RingShankMesh
            measurements={measurements}
            metal={metal}
            finish={finish}
            showDimensions={showDimensions}
          />

          {/* Custom Letter Signet Plate for custom text rings */}
          {design.templateId === "ring_custom_letters" && (
            <mesh position={[0, innerDiameter / 2 + thickness + 0.1, 0]} castShadow receiveShadow>
              <boxGeometry args={[17.0, 0.5, 4.5]} />
              <meshPhysicalMaterial
                color={metal.color}
                metalness={Math.min(metal.metalness, 0.88)}
                roughness={metal.roughness}
                clearcoat={1.0}
              />
            </mesh>
          )}

          {/* Render all stones assigned to the ring or bangle */}
          {stones.map((stone, idx) => {
            const isSelected = selectedStoneId === stone.id;
            return (
              <StoneMesh
                key={stone.id || idx}
                stone={stone}
                metal={metal}
                isSelected={isSelected}
                onSelect={() => onSelectStone(stone.id)}
                ringOuterRadius={innerDiameter / 2 + thickness}
              />
            );
          })}

          {/* 3D Engraving Text inside the ring or bangle */}
          {engravings.length > 0 && engravings[0].text.trim() !== "" && (
            <group
              position={[0, -innerDiameter / 2 + 0.1, 0]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <Text
                color="#27272a" // engraved look
                fontSize={width * 0.45}
                maxWidth={innerDiameter * 1.5}
                anchorX="center"
                anchorY="middle"
                letterSpacing={0.15}
              >
                {engravings[0].text}
              </Text>
            </group>
          )}
        </group>
      )}

      {/* 2. Premium Contact Shadows (Soft ground shadow) */}
      <ContactShadows
        position={[0, shadowY, 0]}
        opacity={0.8}
        scale={45}
        blur={1.8}
        far={15}
      />
    </group>
  );
};

export const JewelryViewer3D: React.FC<JewelryViewer3DProps> = ({
  design,
  selectedStoneId,
  onSelectStone,
  showDimensions,
  viewPreset,
}) => {
  const controlsRef = useRef<any>(null);
  const [lowPerf, setLowPerf] = useState(false);

  // Map view preset to camera coordinates
  const getCameraPosition = (): [number, number, number] => {
    const cat = design.category;
    if (cat === "tennis_bracelet" || cat === "bangle" || cat === "pendant" || cat === "necklace") {
      // Much larger bounding sphere for bracelets, bangles, pendants, and necklaces
      const scaleFactor = (cat === "pendant" || cat === "necklace") ? 68 : 55;
      switch (viewPreset) {
        case "front":
          return [0, 0, scaleFactor];
        case "back":
          return [0, 0, -scaleFactor];
        case "top":
          return [0, scaleFactor, 0];
        case "side":
          return [scaleFactor, 0, 0];
        case "perspective":
        default:
          return [scaleFactor * 0.7, scaleFactor * 0.5, scaleFactor * 0.7];
      }
    } else {
      // Macro view for rings, sized to the current measurements so the whole
      // piece stays comfortably in frame instead of cropping at ring extremes.
      const { innerDiameter, thickness, width } = design.measurements;
      const boundingRadius = innerDiameter / 2 + thickness + width / 2 + 1.5;
      const halfFovRad = (45 * Math.PI) / 180 / 2;
      const fitDistance = (boundingRadius / Math.tan(halfFovRad)) * 1.2;

      switch (viewPreset) {
        case "front":
          return [0, 0, fitDistance];
        case "back":
          return [0, 0, -fitDistance];
        case "top":
          return [0, fitDistance, 0];
        case "side":
          return [fitDistance, 0, 0];
        case "perspective":
        default: {
          const p = fitDistance / Math.sqrt(3);
          return [p, p * 0.68, p];
        }
      }
    }
  };

  const cameraPos = getCameraPosition();

  return (
    <div className="relative w-full h-full bg-radial from-stone-50 to-stone-150 rounded-2xl overflow-hidden shadow-inner border border-stone-200">
      {/* 3D Canvas with Luxury Studio Lighting */}
      <Suspense
        fallback={
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-stone-50 text-stone-600 font-sans">
            <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin mb-4" />
            <p className="text-sm font-medium">טוען סטודיו תלת-ממד...</p>
          </div>
        }
      >
        <Canvas
          shadows
          camera={{ position: cameraPos, fov: 45 }}
          gl={{ antialias: true, preserveDrawingBuffer: true }} // required for screenshots
        >
           {/* Beautiful local procedural studio environment reflections map */}
          <Environment background={false}>
            {/* Multiple bright glowing studio softbox panels around the ring */}
            {/* Top Softbox */}
            <mesh position={[0, 15, 0]} rotation={[Math.PI / 2, 0, 0]}>
              <planeGeometry args={[25, 25]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Front-Right Softbox */}
            <mesh position={[12, 8, 12]} rotation={[0, -Math.PI / 4, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Front-Left Softbox */}
            <mesh position={[-12, 8, 12]} rotation={[0, Math.PI / 4, 0]}>
              <planeGeometry args={[20, 20]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Back-Light Highlight */}
            <mesh position={[0, 5, -15]} rotation={[0, 0, 0]}>
              <planeGeometry args={[30, 15]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            {/* Subtle bottom ground reflection card */}
            <mesh position={[0, -12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
              <planeGeometry args={[40, 40]} />
              <meshBasicMaterial color="#a8a29e" toneMapped={false} />
            </mesh>
          </Environment>

          {/* Key studio lighting setup */}
          <ambientLight intensity={0.55} />
          
          {/* Main Key Light */}
          <directionalLight
            position={[10, 15, 10]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[1024, 1024]}
            shadow-bias={-0.0001}
          />

          {/* Side Fill Light */}
          <directionalLight
            position={[-10, 5, -10]}
            intensity={0.9}
          />

          {/* Under Fill Light */}
          <directionalLight
            position={[0, -10, 0]}
            intensity={0.4}
          />

          {/* Overhead Spotlight for diamond sparkles */}
          <spotLight
            position={[0, 20, 0]}
            angle={0.4}
            penumbra={1}
            intensity={2.2}
            castShadow
          />

          <ShowroomScene
            design={design}
            selectedStoneId={selectedStoneId}
            onSelectStone={onSelectStone}
            showDimensions={showDimensions}
          />

          {/* Camera Orbit Controls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            dampingFactor={0.05}
            minDistance={design.category === "tennis_bracelet" ? 20 : 5}
            maxDistance={design.category === "tennis_bracelet" ? 150 : 40}
            makeDefault
          />
        </Canvas>
      </Suspense>

      {/* Contextual status HUD: what's selected, and whether the dimension grid is on */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 bg-stone-900/85 backdrop-blur text-white py-1.5 px-3 rounded-full shadow text-xs font-medium select-none max-w-[85%]">
        {selectedStoneId ? (
          <>
            <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
            <span className="truncate">
              עריכת אבן{(() => {
                const stone = design.stones.find((s) => s.id === selectedStoneId);
                return stone ? `: ${stone.familyHebrew}` : "";
              })()}
            </span>
          </>
        ) : (
          <>
            <span className="w-2 h-2 rounded-full bg-stone-500 shrink-0" />
            <span className="truncate">לחצו על אבן לעריכה</span>
          </>
        )}
        {showDimensions && (
          <>
            <span className="text-stone-500">|</span>
            <span className="text-amber-400 whitespace-nowrap">מידות פעילות</span>
          </>
        )}
      </div>
    </div>
  );
};
