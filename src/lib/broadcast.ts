// BroadcastChannel-based sync between audience display and presenter view.
// Both windows join the same channel keyed by presentation ID.

export type BroadcastMessage =
  | { type: "GOTO"; index: number }       // presenter → audience: jump to slide
  | { type: "STATE"; index: number }      // audience → presenter: current index changed
  | { type: "PING" }                      // presenter → audience: are you there?
  | { type: "PONG"; index: number };      // audience → presenter: yes, here's my index

export function getPresentationChannel(id: string): BroadcastChannel {
  return new BroadcastChannel(`smart-presenter-${id}`);
}
