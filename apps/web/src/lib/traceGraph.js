// The canvas, reduced to what is worth recording.
//
// `graph_mutation` carries a full snapshot on every change, and that snapshot is
// two things at once: what an admin replays to watch someone build, and what a
// resumed learner's canvas is rebuilt from. The second is the demanding one, and
// it is why this exists as its own tested function rather than as a map inline in
// the Build screen — the mapping was written there twice, and the second copy
// silently dropped `position`:
//
//     const next = { nodes: nodes.map((n) => ({ id, type, data })) }   // <- no position
//     trace('graph_mutation', { graph: { nodes: next.nodes.map((n) => ({ …, position: n.position }))
//
// `n.position` was read from the already-stripped list, so every recorded graph
// had `position: undefined`. The endpoint refuses a graph whose nodes have no
// numeric position (React Flow reads `position.x` while seeding and throws), so
// resume silently handed back no canvas at all — 52 of the 60 mutations recorded
// locally had no positions, and the 8 that did were synthesised by a test.
//
// What is kept is what the learner DID: where they put each node, what they typed
// into it, and whether they had finished setting it up. What is left out is
// anything the catalog can say again on the way back in (`label`, `params`,
// sample `output`) and the per-render cue flags (`needsSetup`, `dimmed`, …),
// which describe a moment of rendering rather than a decision.
export function traceableGraph(nodes, edges) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      type: n.type,
      position: n.position,
      data: {
        configured: !!n.data?.configured,
        wrong: !!n.data?.wrong,
        // The field values and node settings, so a resumed node opens with the
        // answers the learner gave rather than blank inputs they have to retype.
        values: n.data?.values ?? {},
        settings: n.data?.settings ?? {},
      },
    })),
    edges: edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      // A branch IS an output handle, and the model wire IS a target handle, so
      // dropping these would lose the routing the learner built.
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
    })),
  };
}
