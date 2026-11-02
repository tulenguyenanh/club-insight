import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/ui/components/states";
import { SessionDetailView } from "@/ui/views/session-detail-view";

export const metadata: Metadata = { title: "Session · Club Insights" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SessionDetailView />
    </Suspense>
  );
}
