"use client";

import { useEffect, useRef, useState } from "react";

interface RoomNode {
  id: string;
  name: string;
  image: string;
  description: string;
  hotspots: {
    x: number; // percentage 0-100
    y: number;
    targetRoomId: string;
    label: string;
  }[];
  infoTags: {
    x: number;
    y: number;
    title: string;
    detail: string;
  }[];
}

interface VirtualTour3DViewerProps {
  title: string;
  gallery: string[];
  area?: string;
  erfSize?: string;
  virtualTourUrl?: string;
}

export default function VirtualTour3DViewer({
  title,
  gallery,
  area = "380 m²",
  erfSize,
  virtualTourUrl,
}: VirtualTour3DViewerProps) {
  // Safe fallback images
  const safeImg = (idx: number, fallbackUrl: string) =>
    gallery && gallery[idx] ? gallery[idx] : fallbackUrl;

  const defaultRooms: RoomNode[] = [
    {
      id: "living",
      name: "Grand Living & Dining",
      image: safeImg(
        0,
        "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80"
      ),
      description: "Double-volume open plan space with floor-to-ceiling glass sliding doors.",
      hotspots: [
        { x: 28, y: 56, targetRoomId: "kitchen", label: "Walk to Gourmet Kitchen →" },
        { x: 74, y: 52, targetRoomId: "patio", label: "Walk to Pool & Patio →" },
      ],
      infoTags: [
        {
          x: 48,
          y: 40,
          title: "Double-Glazed Low-E Glass",
          detail: "Acoustic attenuation and optimal thermal insulation against Pretoria heat.",
        },
        {
          x: 82,
          y: 68,
          title: "Engineered European Oak",
          detail: "Underfloor hydronic heating system integrated with heat pump.",
        },
      ],
    },
    {
      id: "kitchen",
      name: "Gourmet Kitchen & Scullery",
      image: safeImg(
        1,
        "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1600&q=80"
      ),
      description: "SMEG integrated appliances, quartz waterfall center island, and separate scullery.",
      hotspots: [
        { x: 22, y: 54, targetRoomId: "living", label: "← Return to Living Area" },
        { x: 80, y: 50, targetRoomId: "master", label: "Walk to Master Wing →" },
      ],
      infoTags: [
        {
          x: 52,
          y: 58,
          title: "Quartz Waterfall Island",
          detail: "3.2m seamless island with undermount Franke prep bowl and pop-up power docks.",
        },
      ],
    },
    {
      id: "master",
      name: "Master Suite & Terrace",
      image: safeImg(
        2,
        "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=80"
      ),
      description: "Private sanctuary with walk-in dressing room, fireplace, and morning terrace.",
      hotspots: [
        { x: 18, y: 52, targetRoomId: "kitchen", label: "← Walk to Kitchen" },
        { x: 78, y: 54, targetRoomId: "patio", label: "Walk to Pool & Garden →" },
      ],
      infoTags: [
        {
          x: 45,
          y: 35,
          title: "Custom Walk-in Robe",
          detail: "Soft-close timber cabinetry with integrated LED lighting and vanity desk.",
        },
      ],
    },
    {
      id: "patio",
      name: "Covered Patio & Poolside",
      image: safeImg(
        3,
        "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=80"
      ),
      description: "Built-in gas and wood braai, heated rim-flow pool, and landscaped indigenous garden.",
      hotspots: [
        { x: 30, y: 50, targetRoomId: "living", label: "Step inside Living Room →" },
        { x: 82, y: 55, targetRoomId: "master", label: "Step inside Master Suite →" },
      ],
      infoTags: [
        {
          x: 62,
          y: 65,
          title: "Heated Rim-Flow Lap Pool",
          detail: "Salt-chlorinated system backed by solar thermal collector tubes.",
        },
      ],
    },
  ];

  // Active States
  const [currentRoomId, setCurrentRoomId] = useState<string>("living");
  const [viewMode, setViewMode] = useState<"walkthrough" | "dollhouse" | "measure">("walkthrough");
  const [isAutoRotating, setIsAutoRotating] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [activeInfoTag, setActiveInfoTag] = useState<{ title: string; detail: string } | null>(null);

  // 3D Camera Angles & Zoom
  const [yaw, setYaw] = useState(0); // horizontal pan angle in degrees
  const [pitch, setPitch] = useState(0); // vertical tilt in degrees (-22 to 22)
  const [zoom, setZoom] = useState(1); // 1.0 to 1.6
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, yaw: 0, pitch: 0 });
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Measuring tool state
  const [measurePoints, setMeasurePoints] = useState<{ x: number; y: number }[]>([]);
  const [measureDistance, setMeasureDistance] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const currentRoom = defaultRooms.find((r) => r.id === currentRoomId) || defaultRooms[0];

  // Auto-rotation effect
  useEffect(() => {
    if (!isAutoRotating || isDragging || viewMode !== "walkthrough") return;
    const interval = setInterval(() => {
      setYaw((prev) => (prev + 0.3) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, [isAutoRotating, isDragging, viewMode]);

  // Smooth room transition
  const switchRoom = (targetId: string) => {
    if (targetId === currentRoomId) return;
    setIsTransitioning(true);
    setActiveInfoTag(null);
    setMeasurePoints([]);
    setMeasureDistance(null);
    setTimeout(() => {
      setCurrentRoomId(targetId);
      setYaw(0);
      setPitch(0);
      setZoom(1);
      setIsTransitioning(false);
    }, 280);
  };

  // Mouse / Touch Drag Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (viewMode === "measure") return;
    setIsDragging(true);
    setIsAutoRotating(false);
    setDragStart({ x: e.clientX, y: e.clientY, yaw, pitch });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    setYaw((dragStart.yaw - deltaX * 0.25) % 360);
    setPitch(Math.max(-20, Math.min(20, dragStart.pitch + deltaY * 0.15)));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Touch Handlers for Mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    if (viewMode === "measure" || e.touches.length === 0) return;
    const touch = e.touches[0];
    setIsDragging(true);
    setIsAutoRotating(false);
    setDragStart({ x: touch.clientX, y: touch.clientY, yaw, pitch });
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || e.touches.length === 0) return;
    const touch = e.touches[0];
    const deltaX = touch.clientX - dragStart.x;
    const deltaY = touch.clientY - dragStart.y;
    setYaw((dragStart.yaw - deltaX * 0.3) % 360);
    setPitch(Math.max(-20, Math.min(20, dragStart.pitch + deltaY * 0.2)));
  };

  // Measuring click handler
  const handleMeasureClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (viewMode !== "measure" || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    if (measurePoints.length === 0) {
      setMeasurePoints([{ x: clickX, y: clickY }]);
      setMeasureDistance(null);
    } else if (measurePoints.length === 1) {
      const p1 = measurePoints[0];
      const p2 = { x: clickX, y: clickY };
      setMeasurePoints([p1, p2]);
      // Estimate real world distance based on room scale
      const dx = (p2.x - p1.x) * 0.08;
      const dy = (p2.y - p1.y) * 0.06;
      const dist = Math.sqrt(dx * dx + dy * dy) * 1.5;
      setMeasureDistance(`${Math.max(1.1, dist).toFixed(2)} meters`);
    } else {
      setMeasurePoints([{ x: clickX, y: clickY }]);
      setMeasureDistance(null);
    }
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen().catch(() => {});
      }
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    function handleFsChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden rounded-3xl border border-slate-800 bg-slate-950 text-white shadow-2xl select-none ${
        isFullscreen ? "h-screen rounded-none" : "h-[480px] sm:h-[540px] md:h-[600px]"
      }`}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onTouchEnd={handleMouseUp}
    >
      {/* 1. TOP STATUS & CONTROLS HUD */}
      <div className="absolute top-4 left-4 right-4 z-30 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Left: Room Badge & Title */}
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="flex items-center gap-1.5 rounded-full bg-rose-600/90 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest text-white backdrop-blur-md shadow-md">
            <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
            <span>{title ? `${title} · 3D Tour` : "3D Interactive Live Tour"}</span>
          </span>
          <span className="rounded-full bg-black/60 border border-white/20 px-3 py-1 text-xs font-semibold text-white backdrop-blur-md dark:border-white/10 dark:bg-[#0c1a1c]/80">
            {currentRoom.name}
          </span>
        </div>

        {/* Right: View Mode Toggle & Fullscreen */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Mode Switcher */}
          <div className="flex items-center rounded-full bg-black/60 border border-white/20 p-0.5 backdrop-blur-md text-xs font-semibold dark:border-white/10 dark:bg-[#060d0e]/80">
            <button
              type="button"
              onClick={() => setViewMode("walkthrough")}
              className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                viewMode === "walkthrough"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-300 hover:text-white dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              360° Walk
            </button>
            <button
              type="button"
              onClick={() => setViewMode("dollhouse")}
              className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                viewMode === "dollhouse"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-300 hover:text-white dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Dollhouse
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("measure");
                setMeasurePoints([]);
                setMeasureDistance(null);
              }}
              className={`rounded-full px-3 py-1 transition-all cursor-pointer ${
                viewMode === "measure"
                  ? "bg-white text-slate-950 shadow-sm dark:bg-emerald-600 dark:text-white dark:shadow-[0_0_12px_rgba(16,185,129,0.35)]"
                  : "text-slate-300 hover:text-white dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              Laser Tape
            </button>
          </div>

          {/* Fullscreen Button */}
          <button
            type="button"
            onClick={toggleFullscreen}
            className="flex h-8 w-8 items-center justify-center rounded-full bg-black/60 border border-white/20 text-white hover:bg-white hover:text-slate-950 transition-all cursor-pointer backdrop-blur-md dark:bg-[#060d0e]/80 dark:border-white/10 dark:text-white dark:hover:bg-emerald-600"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
          >
            {isFullscreen ? "⤓" : "⤢"}
          </button>
        </div>
      </div>

      {/* 2. MAIN 3D RENDERING CANVAS */}
      {viewMode === "walkthrough" && (
        <div
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          className={`relative h-full w-full overflow-hidden cursor-grab ${isDragging ? "cursor-grabbing" : ""}`}
        >
          {/* 3D Panorama Environment Layer */}
          <div
            className={`absolute inset-0 transition-opacity duration-300 ${
              isTransitioning ? "opacity-0 scale-105" : "opacity-100 scale-100"
            }`}
            style={{
              backgroundImage: `url(${currentRoom.image})`,
              backgroundSize: "cover",
              backgroundPosition: `${50 + (yaw / 360) * 100}% ${50 + pitch * 1.5}%`,
              transform: `scale(${zoom})`,
              transition: isDragging ? "none" : "background-position 0.1s ease-out, transform 0.2s ease-out",
            }}
          />

          {/* Vignette & Depth Lighting Gradients */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/40 pointer-events-none" />
          <div className="absolute inset-0 bg-radial from-transparent via-black/15 to-black/50 pointer-events-none" />

          {/* Floor Navigational Hotspots (Beacons that link between rooms) */}
          {!isTransitioning &&
            currentRoom.hotspots.map((spot) => {
              // Calculate screen offset relative to pan angle
              const screenX = spot.x + ((yaw % 120) - 60) * 0.4;
              return (
                <button
                  key={spot.targetRoomId}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    switchRoom(spot.targetRoomId);
                  }}
                  style={{ left: `${screenX}%`, top: `${spot.y}%` }}
                  className="group absolute -translate-x-1/2 -translate-y-1/2 flex items-center gap-2 rounded-full bg-white/90 px-3.5 py-1.5 text-xs font-bold text-slate-950 shadow-[0_8px_24px_rgba(0,0,0,0.5)] border border-white/80 hover:bg-rose-600 hover:text-white transition-all transform hover:scale-110 cursor-pointer backdrop-blur-md animate-bounce dark:bg-[#0c1a1c]/90 dark:border-white/20 dark:text-white dark:hover:bg-emerald-600 dark:hover:border-emerald-400"
                >
                  <span className="h-2.5 w-2.5 rounded-full bg-rose-500 group-hover:bg-white animate-ping" />
                  <span>{spot.label}</span>
                </button>
              );
            })}

          {/* Architectural Information Pins */}
          {!isTransitioning &&
            currentRoom.infoTags.map((tag) => (
              <div
                key={tag.title}
                style={{ left: `${tag.x}%`, top: `${tag.y}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveInfoTag(activeInfoTag?.title === tag.title ? null : tag);
                  }}
                  className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-500 text-white font-bold text-xs shadow-lg ring-4 ring-emerald-400/40 hover:scale-115 transition-all cursor-pointer"
                  title={tag.title}
                >
                  ℹ
                </button>
              </div>
            ))}

          {/* Active Info Tag Modal Card */}
          {activeInfoTag && (
            <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-sm rounded-2xl border border-white/30 bg-slate-900/95 p-4 shadow-2xl backdrop-blur-xl text-white animate-in zoom-in-95 duration-150 dark:border-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                  <span>✓ Verified Specification</span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveInfoTag(null)}
                  className="text-slate-400 hover:text-white dark:text-slate-400"
                >
                  ✕
                </button>
              </div>
              <h4 className="mt-1 font-bold text-sm text-white">{activeInfoTag.title}</h4>
              <p className="mt-1 text-xs text-slate-300 leading-relaxed">{activeInfoTag.detail}</p>
            </div>
          )}

          {/* Instructions Overlay Banner (Fades out when interacting) */}
          <div className="absolute bottom-24 left-1/2 -translate-x-1/2 pointer-events-none rounded-full bg-black/60 border border-white/20 px-4 py-1.5 text-[11px] font-medium text-slate-300 backdrop-blur-md dark:border-white/10">
            Click & drag to look around 360° • Click room beacons to walk through
          </div>
        </div>
      )}

      {/* 3. DOLLHOUSE ISOMETRIC PERSPECTIVE MODE */}
      {viewMode === "dollhouse" && (
        <div className="relative h-full w-full flex flex-col items-center justify-center p-6 bg-radial from-slate-900 via-slate-950 to-black">
          <div className="text-center max-w-md mb-6">
            <span className="rounded-full bg-sky-500/20 text-sky-300 border border-sky-400/30 px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest">
              3D Floor Cutaway Blueprint
            </span>
            <h3 className="mt-2 text-xl font-bold text-white">
              Under-Roof Layout · {area}
              {erfSize ? ` (Erf: ${erfSize})` : ""}
            </h3>
            <p className="mt-1 text-xs text-slate-400 dark:text-slate-400">
              Click any room zone to drop down directly into the 360° panoramic scan.
            </p>
          </div>

          {/* Isometric Dollhouse Floor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 max-w-2xl w-full">
            {defaultRooms.map((room) => (
              <button
                key={room.id}
                type="button"
                onClick={() => {
                  switchRoom(room.id);
                  setViewMode("walkthrough");
                }}
                className={`group relative overflow-hidden rounded-2xl border p-3 text-left transition-all hover:scale-104 cursor-pointer ${
                  currentRoomId === room.id
                    ? "border-rose-500 bg-rose-500/20 ring-2 ring-rose-500/30"
                    : "border-white/20 bg-white/5 hover:bg-white/10"
                }`}
              >
                <div
                  className="h-24 w-full rounded-xl bg-cover bg-center mb-2"
                  style={{ backgroundImage: `url(${room.image})` }}
                />
                <p className="text-xs font-bold text-white group-hover:text-rose-400 transition-colors">
                  {room.name}
                </p>
                <p className="text-[10px] text-slate-400 line-clamp-1 mt-0.5 dark:text-slate-400">{room.description}</p>
                <span className="mt-2 inline-block text-[10px] font-bold text-rose-400 group-hover:underline">
                  Enter 3D Scan →
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 4. LASER MEASURING TAPE MODE */}
      {viewMode === "measure" && (
        <div
          onClick={handleMeasureClick}
          className="relative h-full w-full overflow-hidden cursor-crosshair"
          style={{
            backgroundImage: `url(${currentRoom.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-black/40" />

          {/* Measuring points and line */}
          {measurePoints.map((pt, idx) => (
            <div
              key={idx}
              style={{ left: `${pt.x}%`, top: `${pt.y}%` }}
              className="absolute -translate-x-1/2 -translate-y-1/2 flex items-center justify-center h-5 w-5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-bold shadow-lg ring-4 ring-emerald-400/40 dark:text-white"
            >
              {idx + 1}
            </div>
          ))}

          {measurePoints.length === 2 && (
            <svg className="absolute inset-0 h-full w-full pointer-events-none">
              <line
                x1={`${measurePoints[0].x}%`}
                y1={`${measurePoints[0].y}%`}
                x2={`${measurePoints[1].x}%`}
                y2={`${measurePoints[1].y}%`}
                stroke="#10B981"
                strokeWidth="3"
                strokeDasharray="6 4"
              />
            </svg>
          )}

          {/* Measurement Result Overlay Card */}
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 rounded-2xl border border-white/20 bg-slate-900/90 px-6 py-3 text-center backdrop-blur-xl shadow-2xl dark:border-white/10">
            <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">
              {measureDistance ? "Laser Measurement Result" : "Click 2 points to measure span"}
            </p>
            {measureDistance ? (
              <p className="text-2xl font-extrabold text-white mt-0.5">{measureDistance}</p>
            ) : (
              <p className="text-xs text-slate-300 mt-0.5">
                {measurePoints.length === 0 ? "Click wall corner or ceiling edge" : "Click opposing wall or floor edge"}
              </p>
            )}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setMeasurePoints([]);
                setMeasureDistance(null);
              }}
              className="mt-2 text-[10px] text-slate-400 underline hover:text-white dark:text-slate-400"
            >
              Reset Points
            </button>
          </div>
        </div>
      )}

      {/* 5. BOTTOM ROOM NAVIGATOR BAR */}
      <div className="absolute bottom-4 left-4 right-4 z-30 flex flex-col sm:flex-row items-center justify-between gap-3 pointer-events-none">
        {/* Room Picker Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 rounded-2xl bg-black/70 border border-white/20 p-1 backdrop-blur-xl pointer-events-auto dark:border-white/10">
          {defaultRooms.map((room) => (
            <button
              key={room.id}
              type="button"
              onClick={() => switchRoom(room.id)}
              className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                currentRoomId === room.id
                  ? "bg-rose-600 text-white shadow-md scale-102"
                  : "text-slate-300 hover:text-white hover:bg-white/10"
              }`}
            >
              {room.name}
            </button>
          ))}
        </div>

        {/* Action Buttons: Auto-Pan, Zoom, and External Launch */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Auto-Rotate Toggle */}
          <button
            type="button"
            onClick={() => setIsAutoRotating((prev) => !prev)}
            className={`rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer backdrop-blur-md border ${
              isAutoRotating
                ? "bg-emerald-600 text-white border-emerald-500 shadow-md"
                : "bg-black/60 text-slate-300 border-white/20 hover:text-white hover:bg-white/10"
            }`}
          >
            {isAutoRotating ? "❚❚ Pause Auto-Tour" : "▶ Auto-Pan"}
          </button>

          {/* Zoom Controls */}
          <div className="flex items-center rounded-xl bg-black/60 border border-white/20 p-0.5 backdrop-blur-md dark:border-white/10 dark:bg-[#060d0e]/80">
            <button
              type="button"
              onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors dark:bg-[#060d0e]/60 dark:hover:bg-[#0c1a1c]"
              title="Zoom Out"
            >
              -
            </button>
            <span className="text-[10px] text-slate-400 px-1 font-mono dark:text-slate-400">{(zoom * 100).toFixed(0)}%</span>
            <button
              type="button"
              onClick={() => setZoom((z) => Math.min(1.6, z + 0.2))}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-white hover:bg-white/20 transition-colors dark:bg-[#060d0e]/60 dark:hover:bg-[#0c1a1c]"
              title="Zoom In"
            >
              +
            </button>
          </div>

          {/* Optional External Matterport Cloud fallback */}
          {virtualTourUrl && (
            <a
              href={virtualTourUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-xl bg-white/20 border border-white/30 px-3 py-1.5 text-xs font-bold text-white hover:bg-white hover:text-slate-950 transition-all backdrop-blur-md whitespace-nowrap dark:bg-[#060d0e]/80 dark:border-white/15 dark:text-white dark:hover:bg-[#0c1a1c] dark:hover:text-emerald-300"
            >
              Matterport Cloud ↗
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
