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
import paypal from './paypal.js';
import postgres from './postgres.js';
import twilio from './twilio.js';
import zoom from './zoom.js';
import youtube from './youtube.js';
import gmail from './gmail.js';
import slack from './slack.js';
import googleCalendar from './google-calendar.js';
import microsoftOutlook from './microsoft-outlook.js';
import notion from './notion.js';
import telegram from './telegram.js';
import stripe from './stripe.js';
import githubTrigger from './github-trigger.js';
import googleCalendarTrigger from './google-calendar-trigger.js';
import googleDriveTrigger from './google-drive-trigger.js';
import gmailTrigger from './gmail-trigger.js';
import googleSheetsTrigger from './google-sheets-trigger.js';
import slackTrigger from './slack-trigger.js';
import stripeTrigger from './stripe-trigger.js';
import microsoftOutlookTrigger from './microsoft-outlook-trigger.js';
import microsoftTeamsTrigger from './microsoft-teams-trigger.js';
import telegramTrigger from './telegram-trigger.js';
import notionTrigger from './notion-trigger.js';
import postgresTrigger from './postgres-trigger.js';

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
  { type: 'paypal', docsSlug: 'n8n-nodes-base.paypal', label: 'PayPal', status: 'complete' },
  { type: 'postgres', docsSlug: 'n8n-nodes-base.postgres', label: 'Postgres', status: 'complete' },
  { type: 'twilio', docsSlug: 'n8n-nodes-base.twilio', label: 'Twilio', status: 'complete' },
  { type: 'zoom', docsSlug: 'n8n-nodes-base.zoom', label: 'Zoom', status: 'complete' },
  { type: 'youtube', docsSlug: 'n8n-nodes-base.youtube', label: 'YouTube', status: 'complete' },
  { type: 'gmail', docsSlug: 'n8n-nodes-base.gmail', label: 'Gmail', status: 'complete' },
  { type: 'slack', docsSlug: 'n8n-nodes-base.slack', label: 'Slack', status: 'complete' },
  { type: 'google-calendar', docsSlug: 'n8n-nodes-base.googlecalendar', label: 'Google Calendar', status: 'complete' },
  { type: 'microsoft-outlook', docsSlug: 'n8n-nodes-base.microsoftoutlook', label: 'Microsoft Outlook', status: 'complete' },
  { type: 'notion', docsSlug: 'n8n-nodes-base.notion', label: 'Notion', status: 'complete' },
  { type: 'telegram', docsSlug: 'n8n-nodes-base.telegram', label: 'Telegram', status: 'complete' },
  { type: 'stripe', docsSlug: 'n8n-nodes-base.stripe', label: 'Stripe', status: 'complete' },
];

// Live app triggers whose corresponding action node is already in this library.
// The curated scope favors broadly useful workflow entry points; lower-priority
// live triggers stay recorded here so a later batch does not rediscover them.
export const APP_TRIGGER_NODE_INVENTORY = [
  { type: 'github-trigger', actionType: 'github', docsSlug: 'n8n-nodes-base.githubtrigger', label: 'GitHub Trigger', status: 'complete' },
  { type: 'google-calendar-trigger', actionType: 'google-calendar', docsSlug: 'n8n-nodes-base.googlecalendartrigger', label: 'Google Calendar Trigger', status: 'complete' },
  { type: 'google-drive-trigger', actionType: 'google-drive', docsSlug: 'n8n-nodes-base.googledrivetrigger', label: 'Google Drive Trigger', status: 'complete' },
  { type: 'gmail-trigger', actionType: 'gmail', docsSlug: 'n8n-nodes-base.gmailtrigger', label: 'Gmail Trigger', status: 'complete' },
  { type: 'google-sheets-trigger', actionType: 'google-sheets', docsSlug: 'n8n-nodes-base.googlesheetstrigger', label: 'Google Sheets Trigger', status: 'complete' },
  { type: 'slack-trigger', actionType: 'slack', docsSlug: 'n8n-nodes-base.slacktrigger', label: 'Slack Trigger', status: 'complete' },
  { type: 'stripe-trigger', actionType: 'stripe', docsSlug: 'n8n-nodes-base.stripetrigger', label: 'Stripe Trigger', status: 'complete' },
  { type: 'microsoft-outlook-trigger', actionType: 'microsoft-outlook', docsSlug: 'n8n-nodes-base.microsoftoutlooktrigger', label: 'Microsoft Outlook Trigger', status: 'complete' },
  { type: 'microsoft-teams-trigger', actionType: 'microsoft-teams', docsSlug: 'n8n-nodes-base.microsoftteamstrigger', label: 'Microsoft Teams Trigger', status: 'complete' },
  { type: 'telegram-trigger', actionType: 'telegram', docsSlug: 'n8n-nodes-base.telegramtrigger', label: 'Telegram Trigger', status: 'complete' },
  { type: 'notion-trigger', actionType: 'notion', docsSlug: 'n8n-nodes-base.notiontrigger', label: 'Notion Trigger', status: 'complete' },
  { type: 'postgres-trigger', actionType: 'postgres', docsSlug: 'n8n-nodes-base.postgrestrigger', label: 'Postgres Trigger', status: 'complete' },
  { type: 'microsoft-onedrive-trigger', actionType: 'microsoft-onedrive', docsSlug: 'n8n-nodes-base.microsoftonedrivetrigger', label: 'Microsoft OneDrive Trigger', status: 'deferred-low-priority' },
  { type: 'paypal-trigger', actionType: 'paypal', docsSlug: 'n8n-nodes-base.paypaltrigger', label: 'PayPal Trigger', status: 'deferred-low-priority' },
  { type: 'twilio-trigger', actionType: 'twilio', docsSlug: 'n8n-nodes-base.twiliotrigger', label: 'Twilio Trigger', status: 'deferred-low-priority' },
];

// Descriptors are added here only after each three-node batch is reviewed.
export const APP_NODE_CATALOG = Object.fromEntries(
  [
    discord, dropbox, googleDrive,
    github, googleDocs, googleGemini,
    googleSheets, googleTranslate, microsoftOneDrive,
    microsoftExcel, microsoftTeams, openAi,
    paypal, postgres, twilio,
    zoom, youtube, gmail,
    slack, googleCalendar, microsoftOutlook,
    notion, telegram, stripe,
    githubTrigger, googleCalendarTrigger, googleDriveTrigger,
    gmailTrigger, googleSheetsTrigger, slackTrigger,
    stripeTrigger, microsoftOutlookTrigger, microsoftTeamsTrigger,
    telegramTrigger, notionTrigger, postgresTrigger,
  ].map((node) => [node.type, node])
);

export const COMPLETE_APP_NODE_TYPES = APP_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);

export const COMPLETE_APP_TRIGGER_NODE_TYPES = APP_TRIGGER_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);
