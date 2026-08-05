// Canonical progress list for the simulated n8n core-node library.
//
// Scope comes from the official core-node docs sitemap, checked against each
// page's Markdown deprecation warning and the source at SOURCE_COMMIT. A node is
// `complete` only after its current editor metadata, active icon, picker entry,
// and descriptor tests have been reviewed. Runtime execution is deliberately
// out of scope: these definitions reproduce the authoring experience only.

import aiTransform from './ai-transform.js';
import aiAgent from './ai-agent.js';
import aiAgentTool from './ai-agent-tool.js';
import autoFixingOutputParser from './auto-fixing-output-parser.js';
import anthropicChatModel from './anthropic-chat-model.js';
import awsBedrockChatModel from './aws-bedrock-chat-model.js';
import azureAiSearchVectorStore from './azure-ai-search-vector-store.js';
import azureOpenAiChatModel from './azure-openai-chat-model.js';
import basicLlmChain from './basic-llm-chain.js';
import calculator from './calculator.js';
import code from './code.js';
import chatMemoryManager from './chat-memory-manager.js';
import characterTextSplitter from './character-text-splitter.js';
import chromaVectorStore from './chroma-vector-store.js';
import cohereChatModel from './cohere-chat-model.js';
import cohereModel from './cohere-model.js';
import compareDatasets from './compare-datasets.js';
import compression from './compression.js';
import convertToFile from './convert-to-file.js';
import contextualCompressionRetriever from './contextual-compression-retriever.js';
import crypto from './crypto.js';
import customCodeTool from './custom-code-tool.js';
import dataTable from './data-table.js';
import defaultDataLoader from './default-data-loader.js';
import dateTime from './date-time.js';
import debugHelper from './debug-helper.js';
import deepSeekChatModel from './deepseek-chat-model.js';
import editImage from './edit-image.js';
import emailTriggerImap from './email-trigger-imap.js';
import embeddingsAwsBedrock from './embeddings-aws-bedrock.js';
import embeddingsAzureOpenAi from './embeddings-azure-openai.js';
import embeddingsCohere from './embeddings-cohere.js';
import embeddingsGoogleGemini from './embeddings-google-gemini.js';
import embeddingsGoogleVertex from './embeddings-google-vertex.js';
import embeddingsHuggingFaceInference from './embeddings-huggingface-inference.js';
import embeddingsLemonade from './embeddings-lemonade.js';
import embeddingsMistralCloud from './embeddings-mistral-cloud.js';
import embeddingsOllama from './embeddings-ollama.js';
import embeddingsOpenAi from './embeddings-openai.js';
import embeddingsOracleDatabase from './embeddings-oracle-database.js';
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
import githubDocumentLoader from './github-document-loader.js';
import graphql from './graphql.js';
import googleGeminiChatModel from './google-gemini-chat-model.js';
import googleVertexChatModel from './google-vertex-chat-model.js';
import groqChatModel from './groq-chat-model.js';
import html from './html.js';
import huggingFaceInferenceModel from './huggingface-inference-model.js';
import httpRequest from './http-request.js';
import ifNode from './if.js';
import informationExtractor from './information-extractor.js';
import itemListOutputParser from './item-list-output-parser.js';
import jwt from './jwt.js';
import langchainCode from './langchain-code.js';
import ldap from './ldap.js';
import lemonadeChatModel from './lemonade-chat-model.js';
import lemonadeModel from './lemonade-model.js';
import localFileTrigger from './local-file-trigger.js';
import manual from './manual.js';
import markdown from './markdown.js';
import merge from './merge.js';
import microsoftAgent365Trigger from './microsoft-agent-365-trigger.js';
import milvusVectorStore from './milvus-vector-store.js';
import minimaxChatModel from './minimax-chat-model.js';
import mistralCloudChatModel from './mistral-cloud-chat-model.js';
import mongodbAtlasVectorStore from './mongodb-atlas-vector-store.js';
import multiQueryRetriever from './multi-query-retriever.js';
import moonshotChatModel from './moonshot-chat-model.js';
import mongodbChatMemory from './mongodb-chat-memory.js';
import motorhead from './motorhead.js';
import n8nTrigger from './n8n-trigger.js';
import n8n from './n8n.js';
import noop from './noop.js';
import nvidiaNemotronChatModel from './nvidia-nemotron-chat-model.js';
import ollamaChatModel from './ollama-chat-model.js';
import ollamaModel from './ollama-model.js';
import openAiChatModel from './openai-chat-model.js';
import openRouterChatModel from './openrouter-chat-model.js';
import oracleDatabaseVectorStore from './oracle-database-vector-store.js';
import pgvectorVectorStore from './pgvector-vector-store.js';
import pineconeVectorStore from './pinecone-vector-store.js';
import postgresChatMemory from './postgres-chat-memory.js';
import qdrantVectorStore from './qdrant-vector-store.js';
import qwenCloudChatModel from './qwen-cloud-chat-model.js';
import redisVectorStore from './redis-vector-store.js';
import redisChatMemory from './redis-chat-memory.js';
import recursiveCharacterTextSplitter from './recursive-character-text-splitter.js';
import readWriteFile from './read-write-file.js';
import questionAnswerChain from './question-answer-chain.js';
import removeDuplicates from './remove-duplicates.js';
import renameKeys from './rename-keys.js';
import respondToWebhook from './respond-to-webhook.js';
import rssFeedTrigger from './rss-feed-trigger.js';
import rssRead from './rss-read.js';
import schedule from './schedule.js';
import sendEmail from './send-email.js';
import searXngTool from './searxng-tool.js';
import serpApiTool from './serpapi-tool.js';
import sentimentAnalysis from './sentiment-analysis.js';
import simpleMemory from './simple-memory.js';
import simpleVectorStore from './simple-vector-store.js';
import supabaseVectorStore from './supabase-vector-store.js';
import editFields from './edit-fields.js';
import sort from './sort.js';
import loopOverItems from './loop-over-items.js';
import sseTrigger from './sse-trigger.js';
import ssh from './ssh.js';
import stopAndError from './stop-and-error.js';
import structuredOutputParser from './structured-output-parser.js';
import summarizationChain from './summarization-chain.js';
import summarizeItems from './summarize-items.js';
import switchNode from './switch.js';
import textClassifier from './text-classifier.js';
import thinkTool from './think-tool.js';
import tokenSplitter from './token-splitter.js';
import totp from './totp.js';
import vercelAiGatewayChatModel from './vercel-ai-gateway-chat-model.js';
import vectorStoreRetriever from './vector-store-retriever.js';
import vectorStoreQuestionAnswerTool from './vector-store-question-answer-tool.js';
import wait from './wait.js';
import webhook from './webhook.js';
import weaviateVectorStore from './weaviate-vector-store.js';
import workflowRetriever from './workflow-retriever.js';
import xml from './xml.js';
import xAiGrokChatModel from './xai-grok-chat-model.js';
import xataMemory from './xata-memory.js';
import zepMemory from './zep-memory.js';
import zepVectorStore from './zep-vector-store.js';
import chatTrigger from './chat-trigger.js';
import chat from './chat.js';
import guardrails from './guardrails.js';
import mcpClient from './mcp-client.js';
import mcpClientTool from './mcp-client-tool.js';
import mcpServerTrigger from './mcp-server-trigger.js';

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
  { type: 'mcp-client', docsSlug: 'n8n-nodes-langchain.mcpclient', label: 'MCP Client', status: 'complete' },
  { type: 'mcp-server-trigger', docsSlug: 'n8n-nodes-langchain.mcptrigger', label: 'MCP Server Trigger', status: 'complete' },
];

// Canonical scope from the official cluster root/sub-node indexes, filtered
// against SOURCE_COMMIT. Rows become complete only after their descriptor and
// exact icon are reviewed; docs-only retired nodes remain explicit exclusions.
export const CLUSTER_NODE_INVENTORY = [
  { type: 'ai-agent', docsSlug: 'n8n-nodes-langchain.agent', label: 'AI Agent', clusterRole: 'root', status: 'complete' },
  { type: 'basic-llm-chain', docsSlug: 'n8n-nodes-langchain.chainllm', label: 'Basic LLM Chain', clusterRole: 'root', status: 'complete' },
  { type: 'question-answer-chain', docsSlug: 'n8n-nodes-langchain.chainretrievalqa', label: 'Question and Answer Chain', clusterRole: 'root', status: 'complete' },
  { type: 'summarization-chain', docsSlug: 'n8n-nodes-langchain.chainsummarization', label: 'Summarization Chain', clusterRole: 'root', status: 'complete' },
  { type: 'information-extractor', docsSlug: 'n8n-nodes-langchain.information-extractor', label: 'Information Extractor', clusterRole: 'root', status: 'complete' },
  { type: 'text-classifier', docsSlug: 'n8n-nodes-langchain.text-classifier', label: 'Text Classifier', clusterRole: 'root', status: 'complete' },
  { type: 'sentiment-analysis', docsSlug: 'n8n-nodes-langchain.sentimentanalysis', label: 'Sentiment Analysis', clusterRole: 'root', status: 'complete' },
  { type: 'langchain-code', docsSlug: 'n8n-nodes-langchain.code', label: 'LangChain Code', clusterRole: 'root', status: 'complete' },
  { type: 'microsoft-agent-365-trigger', docsSlug: 'n8n-nodes-langchain.microsoftagent365trigger', label: 'Microsoft Agent 365 Trigger', clusterRole: 'root', status: 'complete' },
  { type: 'azure-ai-search-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoreazureaisearch', label: 'Azure AI Search Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'simple-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoreinmemory', label: 'Simple Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'milvus-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoremilvus', label: 'Milvus Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'mongodb-atlas-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoremongodbatlas', label: 'MongoDB Atlas Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'pgvector-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstorepgvector', label: 'Postgres PGVector Store', clusterRole: 'root', status: 'complete' },
  { type: 'oracle-database-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoreoracledb', label: 'Oracle Database Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'chroma-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstorechroma', label: 'Chroma Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'pinecone-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstorepinecone', label: 'Pinecone Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'qdrant-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoreqdrant', label: 'Qdrant Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'redis-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoreredis', label: 'Redis Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'supabase-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoresupabase', label: 'Supabase Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'weaviate-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstoreweaviate', label: 'Weaviate Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'zep-vector-store', docsSlug: 'n8n-nodes-langchain.vectorstorezep', label: 'Zep Vector Store', clusterRole: 'root', status: 'complete' },
  { type: 'default-data-loader', docsSlug: 'n8n-nodes-langchain.documentdefaultdataloader', label: 'Default Data Loader', clusterRole: 'sub', status: 'complete' },
  { type: 'github-document-loader', docsSlug: 'n8n-nodes-langchain.documentgithubloader', label: 'GitHub Document Loader', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-aws-bedrock', docsSlug: 'n8n-nodes-langchain.embeddingsawsbedrock', label: 'Embeddings AWS Bedrock', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-azure-openai', docsSlug: 'n8n-nodes-langchain.embeddingsazureopenai', label: 'Embeddings Azure OpenAI', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-cohere', docsSlug: 'n8n-nodes-langchain.embeddingscohere', label: 'Embeddings Cohere', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-google-gemini', docsSlug: 'n8n-nodes-langchain.embeddingsgooglegemini', label: 'Embeddings Google Gemini', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-google-palm', docsSlug: 'n8n-nodes-langchain.embeddingsgooglepalm', label: 'Embeddings Google PaLM', clusterRole: 'sub', status: 'excluded-deprecated' },
  { type: 'embeddings-google-vertex', docsSlug: 'n8n-nodes-langchain.embeddingsgooglevertex', label: 'Embeddings Google Vertex', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-huggingface-inference', docsSlug: 'n8n-nodes-langchain.embeddingshuggingfaceinference', label: 'Embeddings HuggingFace Inference', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-lemonade', docsSlug: 'n8n-nodes-langchain.embeddingslemonade', label: 'Embeddings Lemonade', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-mistral-cloud', docsSlug: 'n8n-nodes-langchain.embeddingsmistralcloud', label: 'Embeddings Mistral Cloud', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-ollama', docsSlug: 'n8n-nodes-langchain.embeddingsollama', label: 'Embeddings Ollama', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-openai', docsSlug: 'n8n-nodes-langchain.embeddingsopenai', label: 'Embeddings OpenAI', clusterRole: 'sub', status: 'complete' },
  { type: 'embeddings-oracle-database', docsSlug: 'n8n-nodes-langchain.embeddingsoracledb', label: 'Embeddings Oracle Database', clusterRole: 'sub', status: 'complete' },
  { type: 'qwen-cloud-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatalibabacloud', label: 'Qwen Cloud Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'anthropic-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatanthropic', label: 'Anthropic Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'aws-bedrock-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatawsbedrock', label: 'AWS Bedrock Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'azure-openai-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatazureopenai', label: 'Azure OpenAI Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'cohere-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatcohere', label: 'Cohere Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'deepseek-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatdeepseek', label: 'DeepSeek Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'google-gemini-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatgooglegemini', label: 'Google Gemini Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'google-vertex-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatgooglevertex', label: 'Google Vertex Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'groq-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatgroq', label: 'Groq Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'lemonade-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatlemonade', label: 'Lemonade Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'minimax-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatminimax', label: 'MiniMax Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'mistral-cloud-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatmistralcloud', label: 'Mistral Cloud Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'moonshot-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatmoonshot', label: 'Moonshot Kimi Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'nvidia-nemotron-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatnvidia', label: 'NVIDIA Nemotron Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'ollama-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatollama', label: 'Ollama Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'openai-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatopenai', label: 'OpenAI Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'openrouter-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatopenrouter', label: 'OpenRouter Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'vercel-ai-gateway-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatvercel', label: 'Vercel AI Gateway Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'xai-grok-chat-model', docsSlug: 'n8n-nodes-langchain.lmchatxaigrok', label: 'xAI Grok Chat Model', clusterRole: 'sub', status: 'complete' },
  { type: 'cohere-model', docsSlug: 'n8n-nodes-langchain.lmcohere', label: 'Cohere Model', clusterRole: 'sub', status: 'complete' },
  { type: 'lemonade-model', docsSlug: 'n8n-nodes-langchain.lmlemonade', label: 'Lemonade Model', clusterRole: 'sub', status: 'complete' },
  { type: 'ollama-model', docsSlug: 'n8n-nodes-langchain.lmollama', label: 'Ollama Model', clusterRole: 'sub', status: 'complete' },
  { type: 'huggingface-inference-model', docsSlug: 'n8n-nodes-langchain.lmopenhuggingfaceinference', label: 'Hugging Face Inference Model', clusterRole: 'sub', status: 'complete' },
  { type: 'chat-memory-manager', docsSlug: 'n8n-nodes-langchain.memorymanager', label: 'Chat Memory Manager', clusterRole: 'sub', status: 'complete' },
  { type: 'simple-memory', docsSlug: 'n8n-nodes-langchain.memorybufferwindow', label: 'Simple Memory', clusterRole: 'sub', status: 'complete' },
  { type: 'motorhead', docsSlug: 'n8n-nodes-langchain.memorymotorhead', label: 'Motorhead', clusterRole: 'sub', status: 'complete' },
  { type: 'mongodb-chat-memory', docsSlug: 'n8n-nodes-langchain.memorymongochat', label: 'MongoDB Chat Memory', clusterRole: 'sub', status: 'complete' },
  { type: 'redis-chat-memory', docsSlug: 'n8n-nodes-langchain.memoryredischat', label: 'Redis Chat Memory', clusterRole: 'sub', status: 'complete' },
  { type: 'postgres-chat-memory', docsSlug: 'n8n-nodes-langchain.memorypostgreschat', label: 'Postgres Chat Memory', clusterRole: 'sub', status: 'complete' },
  { type: 'xata-memory', docsSlug: 'n8n-nodes-langchain.memoryxata', label: 'Xata', clusterRole: 'sub', status: 'complete' },
  { type: 'zep-memory', docsSlug: 'n8n-nodes-langchain.memoryzep', label: 'Zep', clusterRole: 'sub', status: 'complete' },
  { type: 'auto-fixing-output-parser', docsSlug: 'n8n-nodes-langchain.outputparserautofixing', label: 'Auto-fixing Output Parser', clusterRole: 'sub', status: 'complete' },
  { type: 'item-list-output-parser', docsSlug: 'n8n-nodes-langchain.outputparseritemlist', label: 'Item List Output Parser', clusterRole: 'sub', status: 'complete' },
  { type: 'structured-output-parser', docsSlug: 'n8n-nodes-langchain.outputparserstructured', label: 'Structured Output Parser', clusterRole: 'sub', status: 'complete' },
  { type: 'contextual-compression-retriever', docsSlug: 'n8n-nodes-langchain.retrievercontextualcompression', label: 'Contextual Compression Retriever', clusterRole: 'sub', status: 'complete' },
  { type: 'multi-query-retriever', docsSlug: 'n8n-nodes-langchain.retrievermultiquery', label: 'MultiQuery Retriever', clusterRole: 'sub', status: 'complete' },
  { type: 'vector-store-retriever', docsSlug: 'n8n-nodes-langchain.retrievervectorstore', label: 'Vector Store Retriever', clusterRole: 'sub', status: 'complete' },
  { type: 'workflow-retriever', docsSlug: 'n8n-nodes-langchain.retrieverworkflow', label: 'Workflow Retriever', clusterRole: 'sub', status: 'complete' },
  { type: 'character-text-splitter', docsSlug: 'n8n-nodes-langchain.textsplittercharactertextsplitter', label: 'Character Text Splitter', clusterRole: 'sub', status: 'complete' },
  { type: 'recursive-character-text-splitter', docsSlug: 'n8n-nodes-langchain.textsplitterrecursivecharactertextsplitter', label: 'Recursive Character Text Splitter', clusterRole: 'sub', status: 'complete' },
  { type: 'token-splitter', docsSlug: 'n8n-nodes-langchain.textsplittertokensplitter', label: 'Token Splitter', clusterRole: 'sub', status: 'complete' },
  { type: 'ai-agent-tool', docsSlug: 'n8n-nodes-langchain.toolaiagent', label: 'AI Agent Tool', clusterRole: 'sub', status: 'complete' },
  { type: 'calculator', docsSlug: 'n8n-nodes-langchain.toolcalculator', label: 'Calculator', clusterRole: 'sub', status: 'complete' },
  { type: 'custom-code-tool', docsSlug: 'n8n-nodes-langchain.toolcode', label: 'Custom Code Tool', clusterRole: 'sub', status: 'complete' },
  { type: 'mcp-client-tool', docsSlug: 'n8n-nodes-langchain.toolmcp', label: 'MCP Client Tool', clusterRole: 'sub', status: 'complete' },
  { type: 'searxng-tool', docsSlug: 'n8n-nodes-langchain.toolsearxng', label: 'SearXNG Tool', clusterRole: 'sub', status: 'complete' },
  { type: 'serpapi-tool', docsSlug: 'n8n-nodes-langchain.toolserpapi', label: 'SerpApi (Google Search)', clusterRole: 'sub', status: 'complete' },
  { type: 'think-tool', docsSlug: 'n8n-nodes-langchain.toolthink', label: 'Think Tool', clusterRole: 'sub', status: 'complete' },
  { type: 'vector-store-question-answer-tool', docsSlug: 'n8n-nodes-langchain.toolvectorstore', label: 'Vector Store Question Answer Tool', clusterRole: 'sub', status: 'complete' },
  { type: 'wikipedia-tool', docsSlug: 'n8n-nodes-langchain.toolwikipedia', label: 'Wikipedia', clusterRole: 'sub', status: 'pending' },
  { type: 'wolfram-alpha-tool', docsSlug: 'n8n-nodes-langchain.toolwolframalpha', label: 'Wolfram|Alpha tool', clusterRole: 'sub', status: 'pending' },
  { type: 'call-n8n-workflow-tool', docsSlug: 'n8n-nodes-langchain.toolworkflow', label: 'Call n8n Workflow Tool', clusterRole: 'sub', status: 'pending' },
  { type: 'reranker-cohere', docsSlug: 'n8n-nodes-langchain.rerankercohere', label: 'Reranker Cohere', clusterRole: 'sub', status: 'pending' },
  { type: 'model-selector', docsSlug: 'n8n-nodes-langchain.modelselector', label: 'Model Selector', clusterRole: 'sub', status: 'pending' },
];

// Descriptors are imported here after each three-node batch is reviewed. Keeping
// each node in its own file lets research agents work in parallel without sharing
// or rewriting the catalog monolith.
export const CORE_NODE_CATALOG = Object.fromEntries(
  [
    aiAgent, basicLlmChain, questionAnswerChain,
    summarizationChain, informationExtractor, textClassifier,
    sentimentAnalysis, langchainCode, microsoftAgent365Trigger,
    azureAiSearchVectorStore, simpleVectorStore, milvusVectorStore,
    mongodbAtlasVectorStore, pgvectorVectorStore, oracleDatabaseVectorStore,
    chromaVectorStore, pineconeVectorStore, qdrantVectorStore,
    redisVectorStore, supabaseVectorStore, weaviateVectorStore,
    zepVectorStore, defaultDataLoader, githubDocumentLoader,
    embeddingsAwsBedrock, embeddingsAzureOpenAi, embeddingsCohere,
    embeddingsGoogleGemini, embeddingsGoogleVertex, embeddingsHuggingFaceInference,
    embeddingsLemonade, embeddingsMistralCloud, embeddingsOllama,
    embeddingsOpenAi, embeddingsOracleDatabase, qwenCloudChatModel,
    anthropicChatModel, awsBedrockChatModel, azureOpenAiChatModel,
    cohereChatModel, deepSeekChatModel, googleGeminiChatModel,
    googleVertexChatModel, groqChatModel, lemonadeChatModel,
    minimaxChatModel, mistralCloudChatModel, moonshotChatModel,
    nvidiaNemotronChatModel, ollamaChatModel, openAiChatModel,
    openRouterChatModel, vercelAiGatewayChatModel, xAiGrokChatModel,
    cohereModel, lemonadeModel, ollamaModel,
    huggingFaceInferenceModel, chatMemoryManager, simpleMemory,
    motorhead, mongodbChatMemory, redisChatMemory,
    postgresChatMemory, xataMemory, zepMemory,
    autoFixingOutputParser, itemListOutputParser, structuredOutputParser,
    contextualCompressionRetriever, multiQueryRetriever, vectorStoreRetriever,
    workflowRetriever, characterTextSplitter, recursiveCharacterTextSplitter,
    tokenSplitter, aiAgentTool, calculator,
    customCodeTool, mcpClientTool, searXngTool,
    serpApiTool, thinkTool, vectorStoreQuestionAnswerTool,
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
    mcpClient, mcpServerTrigger,
  ].map((node) => [node.type, node])
);

export const COMPLETE_CORE_NODE_TYPES = CORE_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);

export const COMPLETE_CLUSTER_NODE_TYPES = CLUSTER_NODE_INVENTORY
  .filter((node) => node.status === 'complete')
  .map((node) => node.type);
