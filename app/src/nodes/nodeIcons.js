import {
  Envelope,
  ChatCircle,
  Robot,
  BracketsCurly,
  ArrowsSplit,
  PaperPlaneTilt,
  ChatCircleDots,
  CalendarPlus,
  Note,
  MagnifyingGlass,
  FileText,
} from '@phosphor-icons/react';

export const nodeIcons = {
  trigger: Envelope,
  'chat-trigger': ChatCircle,
  classify: Robot,
  parse: BracketsCurly,
  switch: ArrowsSplit,
  action: PaperPlaneTilt,
  'slack-message': ChatCircleDots,
  'calendar-event': CalendarPlus,
  'notion-page': Note,
  'web-search': MagnifyingGlass,
  'google-docs': FileText,
};

export const categoryLabels = {
  trigger: 'Trigger',
  ai: 'AI',
  core: 'Core Node',
  action: 'Action',
};

