import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/ui/components/states";
import { ActivePlayersView } from "@/ui/views/active-players-view";

export const metadata: Metadata = { title: "Active players · Club Insights" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <ActivePlayersView />
    </Suspense>
  );
}
