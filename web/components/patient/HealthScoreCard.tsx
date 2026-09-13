"use client";

import { useEffect, useRef } from "react";

interface HealthScoreCardProps {
  bundle?: any;
  observations?: any[]; // For consultation page direct use
  medications?: any[];
  encounters?: any[];
  compact?: boolean; // Compact mode for consultation left panel
}

function computeHealthScore(
  observations: any[],
  medications: any[],
  encounters: any[]
): { score: number; breakdown: { label: string; value: string; delta: number }[] } {
  let score = 100;
  const breakdown: { label: string; value: string; delta: number }[] = [];

  // ── Vitals from real FHIR observations ──
  const getObs = (keyword: string) => {
    const obs = observations.find((o: any) =>
      (o.code?.text || o.code?.coding?.[0]?.display || "")
        .toLowerCase()
        .includes(keyword.toLowerCase())
    );
    if (!obs) return null;
    return parseFloat(obs.valueString || obs.valueQuantity?.value || "0") || null;
  };

  const hr = getObs("heart rate") ?? getObs("pulse");
  const temp = getObs("temperature");
  const spo2 = getObs("oxygen") ?? getObs("spo2");
  const bpRaw = observations.find((o: any) =>
    (o.code?.text || o.code?.coding?.[0]?.display || "")
      .toLowerCase()
      .includes("blood pressure")
  );
  let systolic: number | null = null;
  let diastolic: number | null = null;
  if (bpRaw) {
    if (bpRaw.valueString?.includes("/")) {
      const parts = bpRaw.valueString.split("/");
      systolic = parseFloat(parts[0]) || null;
      diastolic = parseFloat(parts[1]) || null;
    }
    bpRaw.component?.forEach((c: any) => {
      const name = (c.code?.text || "").toLowerCase();
      if (name.includes("systolic")) systolic = parseFloat(c.valueQuantity?.value || c.valueString || "0") || null;
      if (name.includes("diastolic")) diastolic = parseFloat(c.valueQuantity?.value || c.valueString || "0") || null;
    });
  }

  // Heart Rate check (normal 60-100)
  if (hr !== null) {
    if (hr < 50 || hr > 110) {
      score -= 15;
      breakdown.push({ label: "Heart Rate", value: `${hr} bpm`, delta: -15 });
    } else if (hr < 60 || hr > 100) {
      score -= 8;
      breakdown.push({ label: "Heart Rate", value: `${hr} bpm`, delta: -8 });
    } else {
      breakdown.push({ label: "Heart Rate", value: `${hr} bpm ✓`, delta: 0 });
    }
  }

  // SpO2 check (normal >= 96%)
  if (spo2 !== null) {
    if (spo2 < 90) {
      score -= 20;
      breakdown.push({ label: "SpO2", value: `${spo2}%`, delta: -20 });
    } else if (spo2 < 96) {
      score -= 10;
      breakdown.push({ label: "SpO2", value: `${spo2}%`, delta: -10 });
    } else {
      breakdown.push({ label: "SpO2", value: `${spo2}% ✓`, delta: 0 });
    }
  }

  // Blood Pressure check (normal systolic 90-120, diastolic 60-80)
  if (systolic !== null) {
    if (systolic < 80 || systolic > 140) {
      score -= 15;
      breakdown.push({ label: "Blood Pressure (Systolic)", value: `${systolic} mmHg`, delta: -15 });
    } else if (systolic < 90 || systolic > 120) {
      score -= 8;
      breakdown.push({ label: "Blood Pressure (Systolic)", value: `${systolic} mmHg`, delta: -8 });
    } else {
      breakdown.push({ label: "Blood Pressure (Systolic)", value: `${systolic} mmHg ✓`, delta: 0 });
    }
  }

  // Temperature check (normal 97.8–99.1°F)
  if (temp !== null && temp > 0) {
    if (temp > 103 || temp < 95) {
      score -= 15;
      breakdown.push({ label: "Temperature", value: `${temp}°F`, delta: -15 });
    } else if (temp > 99.1 || temp < 97.8) {
      score -= 5;
      breakdown.push({ label: "Temperature", value: `${temp}°F`, delta: -5 });
    } else {
      breakdown.push({ label: "Temperature", value: `${temp}°F ✓`, delta: 0 });
    }
  }

  // Medication count (more active meds = worse health proxy)
  const medCount = medications.length;
  if (medCount >= 5) {
    score -= 10;
    breakdown.push({ label: "Active Medications", value: `${medCount} meds`, delta: -10 });
  } else if (medCount >= 3) {
    score -= 5;
    breakdown.push({ label: "Active Medications", value: `${medCount} meds`, delta: -5 });
  } else {
    breakdown.push({ label: "Active Medications", value: `${medCount} meds ✓`, delta: 0 });
  }

  // Visit gap: last encounter date
  const past = encounters
    .filter((e: any) => e.period?.start && new Date(e.period.start) < new Date())
    .sort((a: any, b: any) => new Date(b.period.start).getTime() - new Date(a.period.start).getTime());
  if (past.length > 0) {
    const daysSinceLastVisit = Math.floor(
      (Date.now() - new Date(past[0].period.start).getTime()) / 86400000
    );
    if (daysSinceLastVisit > 365) {
      score -= 10;
      breakdown.push({ label: "Last Visit", value: `${daysSinceLastVisit} days ago`, delta: -10 });
    } else if (daysSinceLastVisit > 180) {
      score -= 5;
      breakdown.push({ label: "Last Visit", value: `${daysSinceLastVisit} days ago`, delta: -5 });
    } else {
      breakdown.push({ label: "Last Visit", value: `${daysSinceLastVisit} days ago ✓`, delta: 0 });
    }
  }

  return { score: Math.max(0, Math.min(100, score)), breakdown };
}

function getScoreLabel(score: number): { label: string; color: string; trackColor: string } {
  if (score >= 80) return { label: "Excellent", color: "#10B981", trackColor: "#D1FAE5" };
  if (score >= 60) return { label: "Good", color: "#3B82F6", trackColor: "#DBEAFE" };
  if (score >= 40) return { label: "Fair", color: "#F59E0B", trackColor: "#FEF3C7" };
  return { label: "Poor", color: "#EF4444", trackColor: "#FEE2E2" };
}

// Animated circular SVG gauge
function ScoreGauge({ score, size = 120 }: { score: number; size?: number }) {
  const circleRef = useRef<SVGCircleElement>(null);
  const radius = (size - 16) / 2;
  const circumference = 2 * Math.PI * radius;
  const { color, trackColor } = getScoreLabel(score);
  const progress = (score / 100) * circumference;

  useEffect(() => {
    if (!circleRef.current) return;
    circleRef.current.style.strokeDashoffset = String(circumference);
    const raf = requestAnimationFrame(() => {
      setTimeout(() => {
        if (circleRef.current) {
          circleRef.current.style.transition = "stroke-dashoffset 1.2s cubic-bezier(0.4,0,0.2,1)";
          circleRef.current.style.strokeDashoffset = String(circumference - progress);
        }
      }, 100);
    });
    return () => cancelAnimationFrame(raf);
  }, [score, circumference, progress]);

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Background track */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={trackColor}
        strokeWidth={10}
      />
      {/* Progress arc */}
      <circle
        ref={circleRef}
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={10}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={circumference}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
      />
      {/* Score text */}
      <text
        x="50%"
        y="44%"
        textAnchor="middle"
        dy=".3em"
        fontSize={size > 100 ? "22" : "14"}
        fontWeight="700"
        fill={color}
      >
        {score}
      </text>
      <text
        x="50%"
        y="66%"
        textAnchor="middle"
        fontSize={size > 100 ? "9" : "7"}
        fill="#6B7280"
      >
        / 100
      </text>
    </svg>
  );
}

export function HealthScoreCard({
  bundle,
  observations: directObs,
  medications: directMeds,
  encounters: directEncs,
  compact = false,
}: HealthScoreCardProps) {
  const observations = directObs ?? bundle?.observations ?? [];
  const medications = directMeds ?? bundle?.medications ?? [];
  const encounters = directEncs ?? bundle?.encounters ?? [];

  // Only compute if we have at least some data
  const hasData = observations.length > 0 || medications.length > 0 || encounters.length > 0;
  if (!hasData) return null;

  const { score, breakdown } = computeHealthScore(observations, medications, encounters);
  const { label, color } = getScoreLabel(score);

  if (compact) {
    // Compact badge for consultation page left panel
    return (
      <div
        className="flex items-center gap-3 bg-muted/30 rounded-xl p-3 border"
        style={{ borderColor: `${color}30` }}
      >
        <ScoreGauge score={score} size={64} />
        <div>
          <div className="text-xs text-muted-foreground font-medium">Health Score</div>
          <div className="text-lg font-bold" style={{ color }}>
            {label}
          </div>
          <div className="text-xs text-muted-foreground">
            Based on {observations.length} vitals
          </div>
        </div>
      </div>
    );
  }

  // Full card for patient portal
  return (
    <div
      className="p-6 rounded-xl border bg-card hover:shadow-sm transition-shadow relative overflow-hidden group"
      style={{ borderColor: `${color}40` }}
    >
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
        style={{
          background: `radial-gradient(ellipse at top right, ${color}10, transparent 60%)`,
        }}
      />

      <div className="flex items-center justify-between mb-4 relative">
        <div>
          <h3 className="font-semibold text-lg">Health Score</h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Computed from your real vitals & history
          </p>
        </div>
        <div
          className="h-10 w-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
          style={{ backgroundColor: color }}
        >
          ❤
        </div>
      </div>

      <div className="flex items-center gap-5 relative">
        <ScoreGauge score={score} size={110} />
        <div className="flex-1 space-y-1.5">
          <div className="text-2xl font-bold" style={{ color }}>
            {label}
          </div>
          {breakdown.slice(0, 4).map((b, i) => (
            <div key={i} className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground truncate max-w-[120px]">{b.label}</span>
              <span
                className={`font-medium ${
                  b.delta < 0 ? "text-red-500" : "text-green-600"
                }`}
              >
                {b.value}
              </span>
            </div>
          ))}
          {breakdown.length > 4 && (
            <p className="text-[10px] text-muted-foreground">
              +{breakdown.length - 4} more factors
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
