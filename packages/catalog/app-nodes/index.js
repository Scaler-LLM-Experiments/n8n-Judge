// Canonical progress list for the curated essential app-node library.
//
// This is intentionally not every n8n integration. The shortlist keeps broadly
// used communication, productivity, storage, AI, payments, and data apps. Each
// descriptor reproduces the current authoring surface only; no app API runs here.

import discord from './discord.js';
import dropbox from './dropbox.js';
import googleDrive from './google-drive.js';
import github from './github.js';
import googleDocs from './google-docs.js';
import googleGemini from './google-gemini.js';
import googleSheets from './google-sheets.js';
import googleTranslate from './google-translate.js';
import microsoftOneDrive from './microsoft-onedrive.js';
import microsoftExcel from './microsoft-excel.js';
import microsoftTeams from './microsoft-teams.js';
import openAi from './openai.js';

export const APP_SOURCE_COMMIT = '3d68c29b9281f14097aa9f15e01ac0777e538b11';

export const APP_NODE_INVENTORY = [
  { type: 'discord', docsSlug: 'n8n-nodes-base.discord', label: 'Discord', status: 'complete' },
  { type: 'dropbox', docsSlug: 'n8n-nodes-base.dropbox', label: 'Dropbox', status: 'complete' },
  { type: 'google-drive', docsSlug: 'n8n-nodes-base.googledrive', label: 'Google Drive', status: 'complete' },
  { type: 'github', docsSlug: 'n8n-nodes-base.github', label: 'GitHub', status: 'complete' },
  { type: 'google-docs', docsSlug: 'n8n-nodes-base.googledocs', label: 'Google Docs', status: 'complete' },
  { type: 'google-gemini', docsSlug: 'n8n-nodes-langchain.googlegemini', label: 'Google Gemini', status: 'complete' },
  { type: 'google-sheets', docsSlug: 'n8n-nodes-base.googlesheets', label: 'Google Sheets', status: 'complete' },
  { type: 'google-translate', docsSlug: 'n8n-nodes-base.googletranslate', label: 'Google Translate', status: 'complete' },
  { type: 'microsoft-onedrive', docsSlug: 'n8n-nodes-base.microsoftonedrive', label: 'Microsoft OneDrive', status: 'complete' },
  { type: 'microsoft-excel', docsSlug: 'n8n-nodes-base.microsoftexcel', label: 'Microsoft Excel 365', status: 'complete' },
  { type: 'microsoft-teams', docsSlug: 'n8n-nodes-base.microsoftteams', label: 'Microsoft Teams', status: 'complete' },
  { type: 'openai', docsSlug: 'n8n-nodes-langchain.openai', label: 'OpenAI', status: 'complete' },
  { type: 'paypal', docsSlug: 'n8n-nodes-base.paypal', label: 'PayPal', status: 'pending' },
  { type: 'postgres', docsSlug: 'n8n-nodes-base.postgres', label: 'Postgres', status: 'pending' },
  { type: 'twilio', docsSlug: 'n8n-nodes-base.twilio', label: 'Twilio', status: 'pending' },
  { type: 'zoom', docsSlug: 'n8n-nodes-base.zoom', label: 'Zoom', status: 'pending' },
  { type: 'youtube', docsSlug: 'n8n-nodes-base.youtube', label: 'YouTube', status: 'pending' },
  { type: 'gmail', docsSlug: 'n8n-nodes-base.gmail', label: 'Gmail', status: 'pending' },
  { type: 'slack', docsSlug: 'n8n-nodes-base.slack', label: 'Slack', status: 'pending' },
  { type: 'google-calendar', docsSlug: 'n8n-nodes-base.googlecalendar', label: 'Google Calendar', status: 'pending' },
  { type: 'microsoft-outlook', docsSlug: 'n8n-nodes-base.microsoftoutlook', label: 'Microsoft Outlook', status: 'pending' },
  { type: 'notion', docsSlug: 'n8n-nodes-base.notion', label: 'Notion', status: 'pending' },
  { type: 'telegram', docsSlug: 'n8n-nodes-base.telegram', label: 'Telegram', status: 'pending' },
  { type: 'stripe', docsSlug: 'n8n-nodes-base.stripe', label: 'Stripe', status: 'pending' },
];

// Descriptors are added here only after each three-node batch is reviewed.
export const APP_NODE_CATALOG = Object.fromEntries(
  [
    discord, dropbox, googleDrive,
    github, googleDocs, googleGemini,
    googleSheets, googleTranslate, microsoftOneDrive,
    microsoftExcel, microsoftTeams, openAi,
  ].map((node) => [node.type, node])
);

export const COMPLETE_APP_NODE_TYPES = APP_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);
