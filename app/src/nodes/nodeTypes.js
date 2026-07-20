import { TriggerNode } from './TriggerNode.jsx';
import { ProcessNode } from './ProcessNode.jsx';
import { RouteNode } from './RouteNode.jsx';
import { ActionNode } from './ActionNode.jsx';
import { CompleteNode } from './CompleteNode.jsx';
import { GhostNode } from './GhostNode.jsx';

export const nodeTypes = {
  trigger: TriggerNode,
  'chat-trigger': TriggerNode,
  classify: ProcessNode,
  parse: ProcessNode,
  'web-search': ProcessNode,
  route: RouteNode,
  action: ActionNode,
  'slack-message': ActionNode,
  'calendar-event': ActionNode,
  'notion-page': ActionNode,
  'google-docs': ActionNode,
  complete: CompleteNode,
  ghost: GhostNode,
};
