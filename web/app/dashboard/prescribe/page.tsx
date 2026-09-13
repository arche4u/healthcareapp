"use client";

import { useState } from "react";
import { Plus, Search, FileText } from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function PrescriptionsPage() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Prescriptions</h1>
          <p className="text-muted-foreground text-sm">Manage and issue new prescriptions</p>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="search"
              placeholder="Search prescriptions..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all text-sm"
            />
          </div>
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">New Prescription</span>
          </Button>
        </div>
      </div>

      <div className="text-center p-16 border border-dashed rounded-lg bg-card/50">
        <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-3 opacity-50" />
        <h3 className="text-lg font-medium">No prescriptions found</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
          You haven't issued any prescriptions yet. Click "New Prescription" to start prescribing medication to your patients.
        </p>
        <Button className="mt-6 flex items-center gap-2 mx-auto" variant="outline">
          <Plus className="h-4 w-4" />
          Create First Prescription
        </Button>
      </div>
    </div>
  );
}
