import { nodeByName } from '@judge/workflow';

// Structural matcher for a problem's `requiredEdges` checks, against the
// canonical n8n workflow.
//
// Replaces the old edgeMatches(), which compared React Flow edge fields
// (sourceHandle / targetHandle). Those are rendering details. Here a branch is
// an OUTPUT INDEX — which is what n8n actually stores — and a sub-node
// attachment is a typed connector, not a handle string on the target.
//
// Authored requirements still speak the old vocabulary (`branch: 'bug_report'`,
// `targetHandle: 'ai_model'`) because that is what reads naturally when writing
// a problem; the translation happens here.

/** The editor's handle names, mapped to the real n8n connector names. */
const HANDLE_TO_CONNECTOR = {
  ai_model: 'ai_languageModel',
  ai_languageModel: 'ai_languageModel',
  ai_memory: 'ai_memory',
  ai_tool: 'ai_tool',
  ai_outputParser: 'ai_outputParser',
};

/**
 * Does any connection in `wf` satisfy `req`?
 *
 * @param wf         canonical workflow
 * @param req        { sourceType, sourceCategory, targetType, branch, targetHandle }
 * @param typeCategory  node type → palette category
 * @param branches   problem branch list; its order defines output indices
 */
export function hasConnection(wf, req, typeCategory, branches = []) {
  const wantConnector = req.targetHandle ? (HANDLE_TO_CONNECTOR[req.targetHandle] ?? req.targetHandle) : 'main';

  for (const [fromName, byType] of Object.entries(wf.connections ?? {})) {
    const sourceNode = nodeByName(wf, fromName);
    if (!sourceNode) continue;
    if (req.sourceType && sourceNode.type !== req.sourceType) continue;
    if (req.sourceCategory && typeCategory[sourceNode.type] !== req.sourceCategory) continue;

    const outputs = byType?.[wantConnector] ?? [];

    // A branch requirement pins the connection to one specific output index.
    // That index comes from the problem's branch order — the same ordering the
    // canvas uses to lay out a router's ports.
    let indices;
    if (req.branch) {
      const i = branches.findIndex((b) => b.id === req.branch);
      if (i < 0) continue; // requirement names a branch this problem doesn't declare
      indices = [i];
    } else {
      indices = outputs.map((_, i) => i);
    }

    for (const i of indices) {
      for (const conn of outputs[i] ?? []) {
        const targetNode = nodeByName(wf, conn.node);
        if (!targetNode) continue;
        if (req.targetType && targetNode.type !== req.targetType) continue;
        return true;
      }
    }
  }

  return false;
}
