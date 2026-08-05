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
import form from './form.js';
import ftp from './ftp.js';
import git from './git.js';
import graphql from './graphql.js';
import html from './html.js';
import httpRequest from './http-request.js';
import ifNode from './if.js';
import jwt from './jwt.js';
import ldap from './ldap.js';
import localFileTrigger from './local-file-trigger.js';
import manual from './manual.js';
import markdown from './markdown.js';
import merge from './merge.js';
import n8nTrigger from './n8n-trigger.js';
import n8n from './n8n.js';
import noop from './noop.js';
import readWriteFile from './read-write-file.js';
import removeDuplicates from './remove-duplicates.js';
import renameKeys from './rename-keys.js';
import respondToWebhook from './respond-to-webhook.js';
import rssFeedTrigger from './rss-feed-trigger.js';
import rssRead from './rss-read.js';
import schedule from './schedule.js';
import sendEmail from './send-email.js';
import editFields from './edit-fields.js';
import sort from './sort.js';
import loopOverItems from './loop-over-items.js';
import sseTrigger from './sse-trigger.js';
import ssh from './ssh.js';
import stopAndError from './stop-and-error.js';
import summarizeItems from './summarize-items.js';
import switchNode from './switch.js';
import totp from './totp.js';
import wait from './wait.js';
import webhook from './webhook.js';
import xml from './xml.js';
import chatTrigger from './chat-trigger.js';
import chat from './chat.js';
import guardrails from './guardrails.js';

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
  { type: 'form', docsSlug: 'n8n-nodes-base.form', label: 'n8n Form', status: 'complete' },
  { type: 'ftp', docsSlug: 'n8n-nodes-base.ftp', label: 'FTP', status: 'complete' },
  { type: 'git', docsSlug: 'n8n-nodes-base.git', label: 'Git', status: 'complete' },
  { type: 'graphql', docsSlug: 'n8n-nodes-base.graphql', label: 'GraphQL', status: 'complete' },
  { type: 'html', docsSlug: 'n8n-nodes-base.html', label: 'HTML', status: 'complete' },
  { type: 'http-request', docsSlug: 'n8n-nodes-base.httprequest', label: 'HTTP Request', status: 'complete' },
  { type: 'if', docsSlug: 'n8n-nodes-base.if', label: 'If', status: 'complete' },
  { type: 'jwt', docsSlug: 'n8n-nodes-base.jwt', label: 'JWT', status: 'complete' },
  { type: 'ldap', docsSlug: 'n8n-nodes-base.ldap', label: 'LDAP', status: 'complete' },
  { type: 'limit', docsSlug: 'n8n-nodes-base.limit', label: 'Limit', status: 'complete' },
  { type: 'local-file-trigger', docsSlug: 'n8n-nodes-base.localfiletrigger', label: 'Local File Trigger', status: 'complete' },
  { type: 'manual', docsSlug: 'n8n-nodes-base.manualworkflowtrigger', label: 'Manual Trigger', status: 'complete' },
  { type: 'markdown', docsSlug: 'n8n-nodes-base.markdown', label: 'Markdown', status: 'complete' },
  { type: 'merge', docsSlug: 'n8n-nodes-base.merge', label: 'Merge', status: 'complete' },
  { type: 'n8n-trigger', docsSlug: 'n8n-nodes-base.n8ntrigger', label: 'n8n Trigger', status: 'complete' },
  { type: 'n8n', docsSlug: 'n8n-nodes-base.n8n', label: 'n8n', status: 'complete' },
  { type: 'noop', docsSlug: 'n8n-nodes-base.noop', label: 'No Operation, do nothing', status: 'complete' },
  { type: 'read-write-file', docsSlug: 'n8n-nodes-base.readwritefile', label: 'Read/Write Files from Disk', status: 'complete' },
  { type: 'remove-duplicates', docsSlug: 'n8n-nodes-base.removeduplicates', label: 'Remove Duplicates', status: 'complete' },
  { type: 'rename-keys', docsSlug: 'n8n-nodes-base.renamekeys', label: 'Rename Keys', status: 'complete' },
  { type: 'respond-to-webhook', docsSlug: 'n8n-nodes-base.respondtowebhook', label: 'Respond to Webhook', status: 'complete' },
  { type: 'rss-feed-trigger', docsSlug: 'n8n-nodes-base.rssfeedreadtrigger', label: 'RSS Feed Trigger', status: 'complete' },
  { type: 'rss-read', docsSlug: 'n8n-nodes-base.rssfeedread', label: 'RSS Read', status: 'complete' },
  { type: 'schedule', docsSlug: 'n8n-nodes-base.scheduletrigger', label: 'Schedule Trigger', status: 'complete' },
  { type: 'send-email', docsSlug: 'n8n-nodes-base.sendemail', label: 'Send Email', status: 'complete' },
  { type: 'edit-fields', docsSlug: 'n8n-nodes-base.set', label: 'Edit Fields (Set)', status: 'complete' },
  { type: 'sort', docsSlug: 'n8n-nodes-base.sort', label: 'Sort', status: 'complete' },
  { type: 'loop-over-items', docsSlug: 'n8n-nodes-base.splitinbatches', label: 'Loop Over Items (Split in Batches)', status: 'complete' },
  { type: 'split-out', docsSlug: 'n8n-nodes-base.splitout', label: 'Split Out', status: 'complete' },
  { type: 'sse-trigger', docsSlug: 'n8n-nodes-base.ssetrigger', label: 'SSE Trigger', status: 'complete' },
  { type: 'ssh', docsSlug: 'n8n-nodes-base.ssh', label: 'SSH', status: 'complete' },
  { type: 'stop-and-error', docsSlug: 'n8n-nodes-base.stopanderror', label: 'Stop And Error', status: 'complete' },
  { type: 'summarize-items', docsSlug: 'n8n-nodes-base.summarize', label: 'Summarize', status: 'complete' },
  { type: 'switch', docsSlug: 'n8n-nodes-base.switch', label: 'Switch', status: 'complete' },
  { type: 'totp', docsSlug: 'n8n-nodes-base.totp', label: 'TOTP', status: 'complete' },
  { type: 'wait', docsSlug: 'n8n-nodes-base.wait', label: 'Wait', status: 'complete' },
  { type: 'webhook', docsSlug: 'n8n-nodes-base.webhook', label: 'Webhook', status: 'complete' },
  { type: 'workflow-trigger', docsSlug: 'n8n-nodes-base.workflowtrigger', label: 'Workflow Trigger', status: 'excluded-deprecated' },
  { type: 'xml', docsSlug: 'n8n-nodes-base.xml', label: 'XML', status: 'complete' },
  { type: 'chat-trigger', docsSlug: 'n8n-nodes-langchain.chattrigger', label: 'Chat Trigger', status: 'complete' },
  { type: 'chat', docsSlug: 'n8n-nodes-langchain.chat', label: 'Chat', status: 'complete' },
  { type: 'guardrails', docsSlug: 'n8n-nodes-langchain.guardrails', label: 'Guardrails', status: 'complete' },
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
    form, ftp, git,
    graphql, html, httpRequest,
    ifNode, jwt, ldap,
    localFileTrigger, manual, markdown,
    merge, n8nTrigger, n8n,
    noop, readWriteFile, removeDuplicates,
    renameKeys, respondToWebhook, rssFeedTrigger,
    rssRead, schedule, sendEmail,
    editFields, sort, loopOverItems,
    sseTrigger, ssh, stopAndError,
    summarizeItems, switchNode, totp,
    wait, webhook, xml,
    chatTrigger, chat, guardrails,
  ].map((node) => [node.type, node])
);

export const COMPLETE_CORE_NODE_TYPES = CORE_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);
