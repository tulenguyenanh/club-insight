import type { Metadata } from "next";
import { Suspense } from "react";
import { LoadingState } from "@/ui/components/states";
import { HomeView } from "@/ui/views/home-view";

export const metadata: Metadata = { title: "Choose a club · Club Insights" };

export default function Page() {
  return (
    <Suspense fallback={<LoadingState />}>
      <HomeView />
    </Suspense>
  );
}
