/**
 * The component currently being built, shown only while the registry is empty
 * (docs/implementation-plan.md, Phase 1C). Once a component is published the
 * catalog renders real entries and this is no longer used.
 */
export const upcoming = {
  name: "Animated Button",
  category: "buttons",
  summary: "A button with press feedback and built-in loading, success and failure states.",
  states: ["Press feedback", "Loading", "Success", "Failure"],
} as const;
