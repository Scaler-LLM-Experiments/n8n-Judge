import { TriggerNode } from './TriggerNode.jsx';
import { ProcessNode } from './ProcessNode.jsx';
import { SwitchNode } from './SwitchNode.jsx';
import { ActionNode } from './ActionNode.jsx';

export const nodeTypes = {
  trigger: TriggerNode,
  'chat-trigger': TriggerNode,
  classify: ProcessNode,
  parse: ProcessNode,
  'web-search': ProcessNode,
  switch: SwitchNode,
  action: ActionNode,
  'slack-message': ActionNode,
  'calendar-event': ActionNode,
  'notion-page': ActionNode,
  'google-docs': ActionNode,
};
