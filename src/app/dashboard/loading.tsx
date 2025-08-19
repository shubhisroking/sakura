"use client";

import { LoaderIcon } from "lucide-react";

export default function DashboardLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6">
      <LoaderIcon className="animate-spin h-10 w-10 text-primary" />
      <p className="mt-4 text-lg">Loading Dashboard...</p>
    </div>
  );
}
