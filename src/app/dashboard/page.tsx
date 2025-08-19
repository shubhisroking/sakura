import { redirect } from "next/navigation";
import DashboardContent from "./dashboard-content";
import { authClient } from "@/lib/auth-client";

export default async function DashboardPage() {
  // Auth check will be handled on the client side in the DashboardContent component
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
      <DashboardContent />
    </main>
  );
}
