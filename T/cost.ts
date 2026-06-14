// LLM cost helper — ported from llm_service pricing (Sonnet 4.6).
// F13. Used by the Trigger.dev job to log cost; add a per-tenant cap in the job.
const INPUT_COST = 0.000003;
const OUTPUT_COST = 0.000015;

export function estimateCostUsd(inputTokens: number, outputTokens: number): number {
  return inputTokens * INPUT_COST + outputTokens * OUTPUT_COST;
}
