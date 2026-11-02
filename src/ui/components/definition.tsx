import type { MetricDefinitionDto } from "@/contracts/api";

/** The one-line definition, with the exact counting rules one click away. */
export function Definition({ definition }: { definition: MetricDefinitionDto }) {
  return (
    <div className="text-sm text-ink-2">
      <p>{definition.summary}</p>
      <details className="group mt-1">
        <summary className="cursor-pointer list-none text-xs font-medium text-accent-ink hover:underline">
          <span className="group-open:hidden">How is this counted?</span>
          <span className="hidden group-open:inline">Hide counting rules</span>
        </summary>
        <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-relaxed">
          {definition.rules.map((rule) => (
            <li key={rule}>{rule}</li>
          ))}
        </ul>
      </details>
    </div>
  );
}
