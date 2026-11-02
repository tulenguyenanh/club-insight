import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/ui/components/states";
import { SessionsView } from "@/ui/views/sessions-view";

export const metadata: Metadata = { title: "Sessions · Club Insights" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <SessionsView />
    </Suspense>
  );
}
