import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/ui/components/states";
import { NoShowsView } from "@/ui/views/no-shows-view";

export const metadata: Metadata = { title: "No-shows · Club Insights" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <NoShowsView />
    </Suspense>
  );
}
