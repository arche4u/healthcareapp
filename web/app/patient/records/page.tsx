
"use client";

import { useEffect, useState } from "react";
import {
  FileText, Pill, Activity, FlaskConical, Loader2, AlertCircle,
  ChevronDown, ChevronUp, Calendar, User
} from "lucide-react";
import { identityAPI, decodeJWT, getAccessToken } from "@/lib/api";
import { cn } from "@/lib/utils";

type Bundle = {
  patient?: any;
  encounters?: any[];
  observations?: any[];
  medications?: any[];
  diagnosticReports?: any[];
};

const TABS = [
  { id: "encounters", label: "Encounters", icon: Calendar },
  { id: "medications", label: "Medications", icon: Pill },
  { id: "observations", label: "Observations", icon: Activity },
  { id: "reports", label: "Reports", icon: FlaskConical },
] as const;

type TabId = typeof TABS[number]["id"];

function StatusBadge({ status }: { status?: string }) {
  if (!status) return null;
  const colors: Record<string, string> = {
    active: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300",
    final: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
    finished: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
    cancelled: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    planned: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
    "in-progress": "bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300",
    completed: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300",
    preliminary: "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
  };
  const cls = colors[status] || "bg-gray-100 text-gray-600";
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace("-", " ");
  return <span className={cn("text-xs font-semibold px-2 py-0.5 rounded-full", cls)}>{label}</span>;
}

function formatDate(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function EmptyState({ label }: { label: string }) {
  return (
    <div className="py-16 text-center text-muted-foreground">
      <FileText className="h-12 w-12 mx-auto mb-3 opacity-20" />
      <p className="font-medium">No {label} found</p>
      <p className="text-sm mt-1">Records will appear here once added by your care team.</p>
    </div>
  );
}

function EncounterCard({ enc }: { enc: any }) {
  const [open, setOpen] = useState(false);
  const reason = enc.reasonCode?.[0]?.text || "Visit";
  const start = enc.period?.start;
  return (
    <div className="rounded-xl border bg-card overflow-hidden hover:shadow-sm transition-shadow">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between p-5 text-left"
      >
        <div className="flex items-center gap-4">
          <div className="h-10 w-10 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Calendar className="h-5 w-5" />
          </div>
          <div>
            <p className="font-semibold">{reason}</p>
            <p className="text-sm text-muted-foreground">{formatDate(start)}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={enc.status} />
          {open ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
        </div>
      </button>
      {open && (
        <div className="px-5 pb-5 border-t pt-4 space-y-2 text-sm text-muted-foreground bg-muted/20">
          <p><span className="font-medium text-foreground">Encounter ID:</span> {enc.id}</p>
          {enc.type?.[0]?.text && <p><span className="font-medium text-foreground">Type:</span> {enc.type[0].text}</p>}
          {enc.period?.end && <p><span className="font-medium text-foreground">End:</span> {formatDate(enc.period.end)}</p>}
          {enc.participant?.[0]?.individual?.reference && (
            <p><span className="font-medium text-foreground">Practitioner:</span> {enc.participant[0].individual.reference}</p>
          )}
          {enc.diagnosis && enc.diagnosis.length > 0 && (
            <p><span className="font-medium text-foreground">Diagnosis:</span>{" "}
              {enc.diagnosis.map((d:any)=>d.condition?.display).filter(Boolean).join(', ')}
            </p>
          )}
          {enc.notes && (
            <div className="mt-4 p-3 bg-card rounded-lg border italic">
              "{enc.notes}"
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MedicationCard({ med }: { med: any }) {
  const name = med.medicationCodeableConcept?.text || med.medicationCodeableConcept?.coding?.[0]?.display || "Medication";
  const dosage = med.dosageInstruction?.[0]?.text || "See instructions";
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className="h-10 w-10 rounded-full bg-purple-500/10 text-purple-600 flex items-center justify-center shrink-0">
        <Pill className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-semibold">{name}</p>
          <StatusBadge status={med.status} />
        </div>
        <p className="text-sm text-muted-foreground">{dosage}</p>
        {med.authoredOn && (
          <p className="text-xs text-muted-foreground mt-1">Prescribed {formatDate(med.authoredOn)}</p>
        )}
      </div>
    </div>
  );
}

function ObservationCard({ obs }: { obs: any }) {
  const name = obs.code?.text || obs.code?.coding?.[0]?.display || "Observation";
  const value = obs.valueQuantity
    ? `${obs.valueQuantity.value} ${obs.valueQuantity.unit || ""}`.trim()
    : obs.valueString || obs.valueCodeableConcept?.text || "—";
  return (
    <div className="rounded-xl border bg-card p-5 flex items-center gap-4 hover:shadow-sm transition-shadow">
      <div className="h-10 w-10 rounded-full bg-green-500/10 text-green-600 flex items-center justify-center shrink-0">
        <Activity className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-0.5">
          <p className="font-semibold">{name}</p>
          <StatusBadge status={obs.status} />
        </div>
        <p className="text-sm font-medium text-primary">{value}</p>
        {obs.effectiveDateTime && (
          <p className="text-xs text-muted-foreground mt-0.5">{formatDate(obs.effectiveDateTime)}</p>
        )}
      </div>
    </div>
  );
}

function ReportCard({ report }: { report: any }) {
  const name = report.code?.text || report.code?.coding?.[0]?.display || "Report";
  return (
    <div className="rounded-xl border bg-card p-5 flex items-start gap-4 hover:shadow-sm transition-shadow">
      <div className="h-10 w-10 rounded-full bg-orange-500/10 text-orange-600 flex items-center justify-center shrink-0">
        <FlaskConical className="h-5 w-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <p className="font-semibold">{name}</p>
          <StatusBadge status={report.status} />
        </div>
        {report.conclusion && (
          <p className="text-sm text-muted-foreground">{report.conclusion}</p>
        )}
        {report.effectiveDateTime && (
          <p className="text-xs text-muted-foreground mt-1">{formatDate(report.effectiveDateTime)}</p>
        )}
      </div>
    </div>
  );
}

export default function HealthRecordsPage() {
  const [patientId, setPatientId] = useState<string | null>(null);
  const [bundle, setBundle] = useState<Bundle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeTab, setActiveTab] = useState<TabId>("encounters");

  useEffect(() => {
    const token = getAccessToken();
    if (!token) return;
    const payload = decodeJWT(token);
    if (payload?.patient_id) {
      setPatientId(payload.patient_id);
    } else if (payload?.sub) {
      setPatientId(payload.sub);
    }
  }, []);

  useEffect(() => {
    if (!patientId) return;

    const loadRecords = () => {
      setLoading(true);
      setError("");
      identityAPI.getPatientBundle(patientId)
        .then(setBundle)
        .catch(() => setError("Failed to load health records."))
        .finally(() => setLoading(false));
    };

    loadRecords();

    const eventSource = new EventSource('/api/events');
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'triage_updated' || data.type === 'encounter_updated' || data.type === 'encounter_booked' || data.type === 'medication_prescribed' || data.type === 'report_added') {
          // fetch silently to not show loading state for real-time updates
          identityAPI.getPatientBundle(patientId)
            .then(setBundle)
            .catch(console.error);
        }
      } catch (err) {
        console.error('SSE Error:', err);
      }
    };

    return () => eventSource.close();
  }, [patientId]);

  const counts = {
    encounters: bundle?.encounters?.length ?? 0,
    medications: bundle?.medications?.length ?? 0,
    observations: bundle?.observations?.length ?? 0,
    reports: bundle?.diagnosticReports?.length ?? 0,
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Health Records</h1>
        <p className="text-muted-foreground mt-1">Your complete clinical history, all in one place.</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Encounters", count: counts.encounters, color: "blue", icon: Calendar },
          { label: "Medications", count: counts.medications, color: "purple", icon: Pill },
          { label: "Observations", count: counts.observations, color: "green", icon: Activity },
          { label: "Reports", count: counts.reports, color: "orange", icon: FlaskConical },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="rounded-xl border bg-card p-4 flex items-center gap-3">
            <div className={`h-10 w-10 rounded-full bg-${color}-500/10 text-${color}-600 flex items-center justify-center`}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-2xl font-bold">{count}</p>
              <p className="text-xs text-muted-foreground">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted/50 p-1 rounded-xl w-fit flex-wrap">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
              activeTab === id
                ? "bg-background shadow-sm text-foreground"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="flex items-center gap-3 p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      ) : (
        <div className="space-y-3">
          {activeTab === "encounters" && (
            bundle?.encounters?.length
              ? bundle.encounters.map((e: any) => <EncounterCard key={e.id} enc={e} />)
              : <EmptyState label="encounters" />
          )}
          {activeTab === "medications" && (
            bundle?.medications?.length
              ? bundle.medications.map((m: any) => <MedicationCard key={m.id} med={m} />)
              : <EmptyState label="medications" />
          )}
          {activeTab === "observations" && (
            bundle?.observations?.length
              ? bundle.observations.map((o: any) => <ObservationCard key={o.id} obs={o} />)
              : <EmptyState label="observations" />
          )}
          {activeTab === "reports" && (
            bundle?.diagnosticReports?.length
              ? bundle.diagnosticReports.map((r: any) => <ReportCard key={r.id} report={r} />)
              : <EmptyState label="reports" />
          )}
        </div>
      )}
    </div>
  );
}
