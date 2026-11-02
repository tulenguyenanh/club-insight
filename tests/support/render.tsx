import { render } from "@testing-library/react";
import type { ReactElement } from "react";
import { SWRConfig } from "swr";

/** Renders with an empty SWR cache, so no test sees another test's responses. */
export function renderScreen(ui: ReactElement) {
  return render(<SWRConfig value={{ provider: () => new Map(), dedupingInterval: 0 }}>{ui}</SWRConfig>);
}
