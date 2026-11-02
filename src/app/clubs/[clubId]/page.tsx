import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/ui/components/states";
import { DashboardView } from "@/ui/views/dashboard-view";

export const metadata: Metadata = { title: "Dashboard · Club Insights" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <DashboardView />
    </Suspense>
  );
}
