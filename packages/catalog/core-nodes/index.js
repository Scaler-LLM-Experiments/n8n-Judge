// Canonical progress list for the simulated n8n core-node library.
//
// Scope comes from the official core-node docs sitemap, checked against each
// page's Markdown deprecation warning and the source at SOURCE_COMMIT. A node is
// `complete` only after its current editor metadata, active icon, picker entry,
// and descriptor tests have been reviewed. Runtime execution is deliberately
// out of scope: these definitions reproduce the authoring experience only.

import aiTransform from './ai-transform.js';
import code from './code.js';
import compareDatasets from './compare-datasets.js';
import compression from './compression.js';
import convertToFile from './convert-to-file.js';
import crypto from './crypto.js';
import dataTable from './data-table.js';
import dateTime from './date-time.js';
import debugHelper from './debug-helper.js';
import editImage from './edit-image.js';
import emailTriggerImap from './email-trigger-imap.js';
import errorTrigger from './error-trigger.js';
import evaluationTrigger from './evaluation-trigger.js';
import evaluation from './evaluation.js';
import executeCommand from './execute-command.js';
import executeSubworkflowTrigger from './execute-subworkflow-trigger.js';
import executeSubworkflow from './execute-subworkflow.js';
import executionData from './execution-data.js';
import extractFromFile from './extract-from-file.js';
import filter from './filter.js';
import formTrigger from './form-trigger.js';

export const SOURCE_COMMIT = '3d68c29b9281f14097aa9f15e01ac0777e538b11';

export const CORE_NODE_INVENTORY = [
  { type: 'activation-trigger', docsSlug: 'n8n-nodes-base.activationtrigger', label: 'Activation Trigger', status: 'excluded-deprecated' },
  { type: 'aggregate', docsSlug: 'n8n-nodes-base.aggregate', label: 'Aggregate', status: 'complete' },
  { type: 'ai-transform', docsSlug: 'n8n-nodes-base.aitransform', label: 'AI Transform', status: 'complete' },
  { type: 'code', docsSlug: 'n8n-nodes-base.code', label: 'Code', status: 'complete' },
  { type: 'compare-datasets', docsSlug: 'n8n-nodes-base.comparedatasets', label: 'Compare Datasets', status: 'complete' },
  { type: 'compression', docsSlug: 'n8n-nodes-base.compression', label: 'Compression', status: 'complete' },
  { type: 'convert-to-file', docsSlug: 'n8n-nodes-base.converttofile', label: 'Convert to File', status: 'complete' },
  { type: 'crypto', docsSlug: 'n8n-nodes-base.crypto', label: 'Crypto', status: 'complete' },
  { type: 'data-table', docsSlug: 'n8n-nodes-base.datatable', label: 'Data Table', status: 'complete' },
  { type: 'date-time', docsSlug: 'n8n-nodes-base.datetime', label: 'Date & Time', status: 'complete' },
  { type: 'debug-helper', docsSlug: 'n8n-nodes-base.debughelper', label: 'Debug Helper', status: 'complete' },
  { type: 'edit-image', docsSlug: 'n8n-nodes-base.editimage', label: 'Edit Image', status: 'complete' },
  { type: 'email-trigger-imap', docsSlug: 'n8n-nodes-base.emailimap', label: 'Email Trigger (IMAP)', status: 'complete' },
  { type: 'error-trigger', docsSlug: 'n8n-nodes-base.errortrigger', label: 'Error Trigger', status: 'complete' },
  { type: 'evaluation-trigger', docsSlug: 'n8n-nodes-base.evaluationtrigger', label: 'Evaluation Trigger', status: 'complete' },
  { type: 'evaluation', docsSlug: 'n8n-nodes-base.evaluation', label: 'Evaluation', status: 'complete' },
  { type: 'execute-command', docsSlug: 'n8n-nodes-base.executecommand', label: 'Execute Command', status: 'complete' },
  { type: 'execute-subworkflow-trigger', docsSlug: 'n8n-nodes-base.executeworkflowtrigger', label: 'Execute Sub-workflow Trigger', status: 'complete' },
  { type: 'execute-subworkflow', docsSlug: 'n8n-nodes-base.executeworkflow', label: 'Execute Sub-workflow', status: 'complete' },
  { type: 'execution-data', docsSlug: 'n8n-nodes-base.executiondata', label: 'Execution Data', status: 'complete' },
  { type: 'extract-from-file', docsSlug: 'n8n-nodes-base.extractfromfile', label: 'Extract From File', status: 'complete' },
  { type: 'filter', docsSlug: 'n8n-nodes-base.filter', label: 'Filter', status: 'complete' },
  { type: 'form-trigger', docsSlug: 'n8n-nodes-base.formtrigger', label: 'n8n Form Trigger', status: 'complete' },
  { type: 'form', docsSlug: 'n8n-nodes-base.form', label: 'n8n Form', status: 'pending' },
  { type: 'ftp', docsSlug: 'n8n-nodes-base.ftp', label: 'FTP', status: 'pending' },
  { type: 'git', docsSlug: 'n8n-nodes-base.git', label: 'Git', status: 'pending' },
  { type: 'graphql', docsSlug: 'n8n-nodes-base.graphql', label: 'GraphQL', status: 'pending' },
  { type: 'html', docsSlug: 'n8n-nodes-base.html', label: 'HTML', status: 'pending' },
  { type: 'http-request', docsSlug: 'n8n-nodes-base.httprequest', label: 'HTTP Request', status: 'pending' },
  { type: 'if', docsSlug: 'n8n-nodes-base.if', label: 'If', status: 'pending' },
  { type: 'jwt', docsSlug: 'n8n-nodes-base.jwt', label: 'JWT', status: 'pending' },
  { type: 'ldap', docsSlug: 'n8n-nodes-base.ldap', label: 'LDAP', status: 'pending' },
  { type: 'limit', docsSlug: 'n8n-nodes-base.limit', label: 'Limit', status: 'complete' },
  { type: 'local-file-trigger', docsSlug: 'n8n-nodes-base.localfiletrigger', label: 'Local File Trigger', status: 'pending' },
  { type: 'manual', docsSlug: 'n8n-nodes-base.manualworkflowtrigger', label: 'Manual Trigger', status: 'pending' },
  { type: 'markdown', docsSlug: 'n8n-nodes-base.markdown', label: 'Markdown', status: 'pending' },
  { type: 'merge', docsSlug: 'n8n-nodes-base.merge', label: 'Merge', status: 'pending' },
  { type: 'n8n-trigger', docsSlug: 'n8n-nodes-base.n8ntrigger', label: 'n8n Trigger', status: 'pending' },
  { type: 'n8n', docsSlug: 'n8n-nodes-base.n8n', label: 'n8n', status: 'pending' },
  { type: 'noop', docsSlug: 'n8n-nodes-base.noop', label: 'No Operation, do nothing', status: 'pending' },
  { type: 'read-write-file', docsSlug: 'n8n-nodes-base.readwritefile', label: 'Read/Write Files from Disk', status: 'pending' },
  { type: 'remove-duplicates', docsSlug: 'n8n-nodes-base.removeduplicates', label: 'Remove Duplicates', status: 'pending' },
  { type: 'rename-keys', docsSlug: 'n8n-nodes-base.renamekeys', label: 'Rename Keys', status: 'pending' },
  { type: 'respond-to-webhook', docsSlug: 'n8n-nodes-base.respondtowebhook', label: 'Respond to Webhook', status: 'pending' },
  { type: 'rss-feed-trigger', docsSlug: 'n8n-nodes-base.rssfeedreadtrigger', label: 'RSS Feed Trigger', status: 'pending' },
  { type: 'rss-read', docsSlug: 'n8n-nodes-base.rssfeedread', label: 'RSS Read', status: 'pending' },
  { type: 'schedule', docsSlug: 'n8n-nodes-base.scheduletrigger', label: 'Schedule Trigger', status: 'pending' },
  { type: 'send-email', docsSlug: 'n8n-nodes-base.sendemail', label: 'Send Email', status: 'pending' },
  { type: 'edit-fields', docsSlug: 'n8n-nodes-base.set', label: 'Edit Fields (Set)', status: 'pending' },
  { type: 'sort', docsSlug: 'n8n-nodes-base.sort', label: 'Sort', status: 'pending' },
  { type: 'loop-over-items', docsSlug: 'n8n-nodes-base.splitinbatches', label: 'Loop Over Items (Split in Batches)', status: 'pending' },
  { type: 'split-out', docsSlug: 'n8n-nodes-base.splitout', label: 'Split Out', status: 'complete' },
  { type: 'sse-trigger', docsSlug: 'n8n-nodes-base.ssetrigger', label: 'SSE Trigger', status: 'pending' },
  { type: 'ssh', docsSlug: 'n8n-nodes-base.ssh', label: 'SSH', status: 'pending' },
  { type: 'stop-and-error', docsSlug: 'n8n-nodes-base.stopanderror', label: 'Stop And Error', status: 'pending' },
  { type: 'summarize-items', docsSlug: 'n8n-nodes-base.summarize', label: 'Summarize', status: 'pending' },
  { type: 'switch', docsSlug: 'n8n-nodes-base.switch', label: 'Switch', status: 'pending' },
  { type: 'totp', docsSlug: 'n8n-nodes-base.totp', label: 'TOTP', status: 'pending' },
  { type: 'wait', docsSlug: 'n8n-nodes-base.wait', label: 'Wait', status: 'pending' },
  { type: 'webhook', docsSlug: 'n8n-nodes-base.webhook', label: 'Webhook', status: 'pending' },
  { type: 'workflow-trigger', docsSlug: 'n8n-nodes-base.workflowtrigger', label: 'Workflow Trigger', status: 'excluded-deprecated' },
  { type: 'xml', docsSlug: 'n8n-nodes-base.xml', label: 'XML', status: 'pending' },
  { type: 'chat-trigger', docsSlug: 'n8n-nodes-langchain.chattrigger', label: 'Chat Trigger', status: 'pending' },
  { type: 'chat', docsSlug: 'n8n-nodes-langchain.chat', label: 'Chat', status: 'pending' },
  { type: 'guardrails', docsSlug: 'n8n-nodes-langchain.guardrails', label: 'Guardrails', status: 'pending' },
  { type: 'mcp-client', docsSlug: 'n8n-nodes-langchain.mcpclient', label: 'MCP Client', status: 'pending' },
  { type: 'mcp-server-trigger', docsSlug: 'n8n-nodes-langchain.mcptrigger', label: 'MCP Server Trigger', status: 'pending' },
];

// Descriptors are imported here after each three-node batch is reviewed. Keeping
// each node in its own file lets research agents work in parallel without sharing
// or rewriting the catalog monolith.
export const CORE_NODE_CATALOG = Object.fromEntries(
  [
    aiTransform, code, compareDatasets,
    compression, convertToFile, crypto,
    dataTable, dateTime, debugHelper,
    editImage, emailTriggerImap, errorTrigger,
    evaluationTrigger, evaluation, executeCommand,
    executeSubworkflowTrigger, executeSubworkflow, executionData,
    extractFromFile, filter, formTrigger,
  ].map((node) => [node.type, node])
);

export const COMPLETE_CORE_NODE_TYPES = CORE_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);
