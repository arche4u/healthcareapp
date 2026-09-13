"use client";

import Link from "next/link";
import { WifiOff, RefreshCw } from "lucide-react";

export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <WifiOff className="h-10 w-10 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold mb-2">You're Offline</h1>
          <p className="text-muted-foreground max-w-md">
            It looks like you've lost your internet connection. The page you were
            viewing may not be available offline.
          </p>
        </div>
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={() => window.location.reload()}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-border hover:bg-accent transition-colors"
          >
            Go Home
          </Link>
        </div>
      </div>
    </div>
  );
}