"use client";

import React, { useEffect, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { Activity } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";

export function VitalsMonitor({ observations = [] }: { observations: any[] }) {
  const alertedIds = useRef<Set<string>>(new Set());

  // Parse FHIR observations into chart-friendly data
  const data = useMemo(() => {
    const timeMap = new Map<string, any>();

    observations.forEach((obs) => {
      if (obs.resourceType !== "Observation") return;
      
      const date = obs.effectiveDateTime || obs.issued;
      if (!date) return;
      
      const dateStr = format(new Date(date), "HH:mm:ss");
      const codeText = obs.code?.text?.toLowerCase() || obs.code?.coding?.[0]?.display?.toLowerCase() || "";
      
      if (!timeMap.has(dateStr)) {
        timeMap.set(dateStr, { time: dateStr, originalDate: date });
      }
      
      const entry = timeMap.get(dateStr);
      entry._id = obs.id || Math.random().toString(); // Ensure ID exists for alerts

      const valNum = (val: any) => val ? Number(val) : undefined;

      if (codeText.includes("heart rate") || codeText.includes("pulse") || codeText === "hr") {
        entry.heartRate = valNum(obs.valueString || obs.valueQuantity?.value);
      } else if (codeText.includes("oxygen") || codeText.includes("spo2")) {
        entry.spo2 = valNum(obs.valueString || obs.valueQuantity?.value);
      } else if (codeText.includes("blood pressure") || codeText === "bp") {
        if (obs.valueString && obs.valueString.includes('/')) {
            const parts = obs.valueString.split('/');
            entry.systolic = valNum(parts[0]);
            entry.diastolic = valNum(parts[1]);
        } else {
            obs.component?.forEach((comp: any) => {
              const compName = comp.code?.text?.toLowerCase() || comp.code?.coding?.[0]?.display?.toLowerCase() || "";
              if (compName.includes("systolic")) entry.systolic = valNum(comp.valueQuantity?.value || comp.valueString);
              if (compName.includes("diastolic")) entry.diastolic = valNum(comp.valueQuantity?.value || comp.valueString);
            });
            if (!entry.systolic && obs.valueQuantity) {
                entry.systolic = valNum(obs.valueQuantity.value);
            }
        }
      } else if (codeText.includes("respiratory") || codeText.includes("resp")) {
        entry.respiratoryRate = valNum(obs.valueString || obs.valueQuantity?.value);
      } else if (codeText.includes("temperature") || codeText === "temp") {
        entry.temperature = valNum(obs.valueString || obs.valueQuantity?.value);
      }
    });

    return Array.from(timeMap.values()).sort((a, b) => new Date(a.originalDate).getTime() - new Date(b.originalDate).getTime());
  }, [observations]);

  // Compute Pie Chart data for Heart Rate zones based on historical data
  const pieData = useMemo(() => {
    let low = 0, normal = 0, high = 0;
    data.forEach(d => {
      if (d.heartRate) {
        if (d.heartRate < 60) low++;
        else if (d.heartRate <= 100) normal++;
        else high++;
      }
    });
    return [
      { name: 'Low (<60)', value: low, color: '#3b82f6' },
      { name: 'Normal (60-100)', value: normal, color: '#10b981' },
      { name: 'High (>100)', value: high, color: '#ef4444' }
    ].filter(d => d.value > 0);
  }, [data]);

  useEffect(() => {
    if (data.length === 0) return;
    
    // Check the latest entries for alerts
    const latest = data[data.length - 1];
    
    if (latest._id && !alertedIds.current.has(latest._id)) {
      alertedIds.current.add(latest._id);
      
      if (latest.heartRate && (latest.heartRate < 60 || latest.heartRate > 100)) {
        toast.error(`Heart Rate Alert: ${latest.heartRate} bpm (Normal: 60-100)`);
      }
      if (latest.spo2 && (latest.spo2 < 96)) {
        toast.error(`Low SpO2 Alert: ${latest.spo2}% (Normal: 96-100%)`);
      }
      if (latest.systolic && (latest.systolic < 90 || latest.systolic > 120)) {
        toast.error(`Systolic BP Alert: ${latest.systolic} mmHg (Normal: 90-120)`);
      }
      if (latest.diastolic && (latest.diastolic < 60 || latest.diastolic > 80)) {
        toast.error(`Diastolic BP Alert: ${latest.diastolic} mmHg (Normal: 60-80)`);
      }
      if (latest.respiratoryRate && (latest.respiratoryRate < 12 || latest.respiratoryRate > 20)) {
        toast.error(`Respiratory Rate Alert: ${latest.respiratoryRate} bpm (Normal: 12-20)`);
      }
      if (latest.temperature && (latest.temperature < 97.8 || latest.temperature > 99.1)) {
        toast.warning(`Temperature Alert: ${latest.temperature}°F (Normal: 97.8-99.1)`);
      }
    }
  }, [data]);

  if (data.length === 0) return null;

  return (
    <div className="bg-card border rounded-lg p-6 shadow-sm space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="h-5 w-5 text-primary" />
        <h2 className="text-xl font-semibold">Real-Time Vitals Monitor</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {/* Heart Rate Line Chart */}
        <div className="h-64 border rounded-md p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">Heart Rate (bpm) - Line</h3>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" fontSize={12} tickMargin={10} />
              <YAxis domain={['auto', 'auto']} fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Line type="monotone" dataKey="heartRate" stroke="#ef4444" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} name="Heart Rate" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Blood Pressure Bar Chart */}
        <div className="h-64 border rounded-md p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">Blood Pressure (mmHg) - Bar</h3>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} />
              <XAxis dataKey="time" fontSize={12} tickMargin={10} />
              <YAxis domain={['auto', 'auto']} fontSize={12} />
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
              <Bar dataKey="systolic" fill="#8b5cf6" name="Systolic" radius={[4, 4, 0, 0]} />
              <Bar dataKey="diastolic" fill="#10b981" name="Diastolic" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Heart Rate Zones Pie Chart */}
        <div className="h-64 border rounded-md p-4 bg-muted/20">
          <h3 className="text-sm font-medium mb-4 text-muted-foreground">HR Zones Overview - Pie</h3>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={5}>
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
