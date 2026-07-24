# n8n Node Catalog, AI/LangChain Nodes & Teaching Patterns — Research Report

> Produced 2026-07-24 by a research subagent for "n8n Judge" curriculum design: the realistic
> space of nodes, parameters, and workflow patterns for authoring many unique problem
> statements. Primary source: the n8n-io/n8n-docs GitHub source; template discovery via web
> search. Citations point to canonical docs.n8n.io / n8n.io URLs.

---

## 1. Node catalog breadth

n8n groups nodes into four architectural categories (matching the docs source tree: `trigger-nodes/`, `app-nodes/`, `core-nodes/`, `cluster-nodes/` split into `root-nodes/` + `sub-nodes/`):

| Category | What it is | Breadth |
|---|---|---|
| **Trigger nodes** | Start a workflow; no input connection. | ~130+ (app-specific + generic: Schedule, Webhook, Chat, Form, Manual) |
| **App / Action nodes** | Integrate a specific external service, structured around **Resource + Operation**. | 230+ integrations |
| **Core nodes** | Generic logic: data transformation and flow control. | ~55 (HTTP Request, Set/Edit Fields, Code, IF, Switch, Merge, Filter, Aggregate, Split Out, Split In Batches, Sort, Remove Duplicates, Wait, Execute Workflow, Respond to Webhook, Send Email, Extract From File, Convert to File…) |
| **Cluster nodes** | AI/LangChain building blocks: a **root node** + **sub-nodes** via special connectors. | ~20 root + ~55 sub |

### ~30 most commonly used nodes for a curriculum

**Triggers**: Manual Trigger; Schedule Trigger (interval/cron); Webhook (test vs production URL); Chat Trigger (powers the built-in chat UI; must connect to an Agent/Chain); Gmail Trigger (polls with filters); Form Trigger (shareable web form); Airtable/Google Sheets/Notion Triggers.

**App/action**: Gmail (Message/Draft/Label/Thread ops); Slack (messages, send-and-wait approval); Telegram/WhatsApp/Discord; Google Sheets (lightweight "database"); Google Drive/Docs/Calendar; Airtable/Notion/Baserow; Postgres/MySQL/MongoDB; HubSpot/Salesforce/Pipedrive; Jira/Trello/Asana/ClickUp.

**Core**: HTTP Request ("most versatile node"); Webhook + Respond to Webhook; Set (Edit Fields); Code (JS/Python); IF; Switch; Merge; Filter; Split In Batches / Split Out; Aggregate; Extract From File / Convert to File; Send Email (generic SMTP); Wait.

Sources: [Node types](https://docs.n8n.io/integrations/builtin/node-types), [Core nodes](https://docs.n8n.io/integrations/builtin/core-nodes/), [Integrations](https://n8n.io/integrations/)

---

## 2. AI / LangChain nodes in depth

### The "cluster node" concept

A cluster node = **one root node** + **sub-nodes** connected via special typed connectors (not the grey "main" connector). Root nodes: **AI Agent**, **Basic LLM Chain**, **Text Classifier**, **Sentiment Analysis**, **Information Extractor**, **Question and Answer (Retrieval QA) Chain**, **Summarization Chain**, **Vector Store** nodes (Simple/In-Memory, Pinecone, Qdrant, Supabase, PGVector, Chroma, MongoDB Atlas, Milvus, Weaviate, Redis, Zep…).

Sub-node connector types (visible in exported workflow JSON):
- `ai_languageModel` — Chat Model sub-nodes
- `ai_memory` — Memory sub-nodes
- `ai_tool` — Tool sub-nodes
- `ai_outputParser` — Output Parser sub-nodes
- `ai_embedding`, `ai_document`, `ai_textSplitter`, `ai_retriever` — RAG internals

Example from n8n's own docs workflow JSON:
```json
"OpenAI Chat Model": { "ai_languageModel": [[{ "node": "AI Agent", "type": "ai_languageModel", "index": 0 }]] },
"Simple Memory":     { "ai_memory":        [[{ "node": "AI Agent", "type": "ai_memory",        "index": 0 }]] },
"Wikipedia":         { "ai_tool":          [[{ "node": "AI Agent", "type": "ai_tool",          "index": 0 }]] }
```

### AI Agent node

The "Tools Agent" (the only agent type since v1.82.0). **Requires a Chat Model sub-node** (else: *"A Chat Model sub-node must be connected"*) **and at least one Tool sub-node**.

Parameters: **Prompt (Source)** — *Take from previous node automatically* (expects `chatInput`, typically from Chat Trigger) vs *Define below*; **Require Specific Output Format** toggle → exposes an Output Parser connector.
Options: **System Message** (fixed instructions, default "You are a helpful assistant"), **Max Iterations**, **Return Intermediate Steps**, Tracing Metadata, Binary-image passthrough, **Enable Streaming**, **Human review for tool calls** (gate risky tools behind Chat/Slack/Telegram approval).

Chat models: OpenAI, Anthropic, Google Gemini, Groq, Mistral, Azure OpenAI, AWS Bedrock, Ollama, DeepSeek, xAI Grok, OpenRouter, Vertex…
Tools: dozens of app nodes as tools (Gmail, Slack, Sheets, Notion, Jira, GitHub, Postgres…) plus dedicated tool sub-nodes: **Calculator**, **Custom Code Tool**, **Call n8n Workflow Tool**, **Vector Store (Q&A) Tool**, **Wikipedia**, **Wolfram|Alpha**, **SerpApi**, **SearXNG**, **MCP Tool**, **Think**, and **AI Agent Tool** (nested sub-agents — multi-agent orchestration).

### Basic LLM Chain vs. AI Agent

A **chain** sends one prompt, gets one response — **no memory, no tools**. An **agent** wraps the LLM in a reasoning loop that can call tools and iterate. The docs ship an "Agents vs chains" template teaching exactly this — prime probe/quiz material. Chain params: Prompt (same source choice), Require Specific Output Format, Chat Messages (system/user samples incl. vision inputs).

### Chat Model sub-nodes (key params)

- **OpenAI Chat Model**: Model; Use Responses API toggle (built-in Web Search/File Search/Code Interpreter tools, Agent-only); Temperature, Max Tokens, Frequency/Presence Penalty, Top P, Timeout, Max Retries.
- **Anthropic Chat Model**: Model (Claude family); Max Tokens, Temperature, Top K, Top P.
- **Google Gemini Chat Model**: Model; Max Tokens, Temperature, Top K, Top P, **Safety Settings**.

### Memory sub-nodes

**Simple Memory** (formerly Window Buffer Memory): **Session Key** + **Context Window Length**. Warning: unreliable in queue-mode production. Alternatives: Postgres/Redis/MongoDB Chat Memory, Motorhead, Xata, Zep; Chat Memory Manager for advanced ops. **Chains cannot use memory — only Agents.**

### Tool sub-nodes

- **Custom Code Tool** (JS/Python; input arrives via `query`; needs a **Description** so the agent knows when to use it).
- **Call n8n Workflow Tool** (Source: Database or Define Below; inputs fixed, expression-mapped, or model-filled via `$fromAI()`).
- **HTTP Request as tool** — gains **Optimize Response** (JSON field selection / HTML stripping / text truncation) to cut tokens.
- **Vector Store Q&A Tool** — Description of Data + Limit; auto-generated tool description embeds the node name (special characters in the name break it at runtime).

### Output Parsers

**Structured Output Parser** (JSON Schema contract; attach via Require Specific Output Format), Auto-fixing Output Parser, Item List Output Parser. Documented caveats (great gotcha material): structured parsing is **often unreliable attached directly to an Agent** — n8n recommends piping agent output into a separate Basic LLM Chain to parse; and **sub-node expressions always resolve to the first item** even with many input items.

### Vector Store / embeddings / RAG

RAG = Vector Store root node + **Embeddings sub-node** (OpenAI, Cohere, Gemini, Bedrock, Mistral, HuggingFace, Ollama…) + **Default Data Loader** + **Text Splitter** (Character / **Recursive Character** [recommended] / Token). Patterns: **Insert Documents** pipeline vs **Query** (Vector Store as Agent tool with Description+Limit, or Q&A Tool pre-filter, or direct Get Many). Also Retrieval QA Chain + Retriever sub-nodes for non-agent RAG.

### Classification/extraction root nodes (perfect for branching problems)

- **Text Classifier** — categories (name + description), **Allow Multiple Classes**, **When No Clear Match** (Discard vs extra "Other" branch — maps directly to Judge's `branch:null` fall-through concept), System Prompt Template (`{categories}` placeholder), Enable Auto-Fixing. Emits one output per category.
- **Sentiment Analysis** — default Positive/Neutral/Negative (customizable); Include Detailed Results (confidence); docs recommend **Temperature ≈ 0**; per-category outputs (Switch-free branching).
- **Information Extractor** — structured fields from free text; schema via attribute descriptions / JSON example / JSON Schema.

Sources: [Cluster nodes](https://docs.n8n.io/integrations/builtin/cluster-nodes), [AI Agent](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent), [Agents vs chains](https://docs.n8n.io/build/integrate-ai/understand-ai-components/agents-vs-chains), [Basic LLM Chain](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.chainllm), [Simple Memory](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.memorybufferwindow), [Structured Output Parser](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured), [Text Classifier](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.text-classifier), [Sentiment Analysis](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.sentimentanalysis), [Information Extractor](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.information-extractor), [RAG in n8n](https://docs.n8n.io/build/integrate-ai/understand-ai-components/retrieve-relevant-context)

---

## 3. Key parameters for teaching-critical nodes

**Gmail Trigger**: Poll Times (every minute/hour/day/week/custom cron); Simplify (default on); Max Emails per Poll (default 10, max 50); Filters — Include Spam and Trash, Label Names or IDs, Search (Gmail syntax `from:`), **Read Status** (Unread only [default] / Read / Both), Sender.

**Gmail Send** (Resource: Message, Operation: Send): To, Subject, Email Type (Text/HTML), Message; options: Attachments, CC/BCC, Sender Name, Send Replies To, Reply to Sender Only, Append n8n attribution toggle. Also **Send and Wait for Approval** (human-in-the-loop pause).

**Switch**: Mode (Rules vs Expression), Routing Rule per output, **Rename Output**, Fallback Output (None/Extra/Output 0), Ignore Case, Less Strict Type Validation, Send data to all matching outputs.

**HTTP Request**: Method, URL, Authentication (Predefined Credential Type recommended vs Generic Basic/Digest/Header/Query/OAuth1/OAuth2/Custom), Send Query Params/Headers/Body toggles (Fields vs JSON), Body Content Type; options: Pagination, Batching, Ignore SSL Issues, Timeout, Response format; **Import cURL**.

**Set / Edit Fields**: Mode (Manual Mapping drag-and-drop vs JSON Output), Fields to Set, Keep Only Set Fields, Include in Output; options: Include Binary Data, Ignore Type Conversion Errors, Support Dot Notation.

**Structured Output Parser**: JSON Schema (or generate from example); only after enabling Require Specific Output Format; item-1-only expression caveat; prefer Chains over Agents for reliable parsing.

**Text Classifier** (confirmed root node): Input Prompt (defaults to `text`), Categories (name+description), Allow Multiple Classes, When No Clear Match (Discard vs "Other" branch), System Prompt Template, Enable Auto-Fixing.

---

## 4. Workflow pattern ideas (20, across SE / AI-ML / DSML)

| # | Title | Scenario | Node chain | Difficulty | Program |
|---|---|---|---|---|---|
| 1 | Inbox Email Triage | Auto-label and route incoming support/sales email. | Gmail Trigger → Text Classifier → Switch → Gmail per branch | Beginner | SWE |
| 2 | AI Support Ticket Triage | Webhook tickets get severity + team before Jira filing. | Webhook → AI Agent → Structured Output Parser → Switch → Jira/Slack | Intermediate | SWE |
| 3 | Lead Scoring & Routing | Score form leads for ICP fit, route to sales channel. | Webhook → HTTP Request (enrich) → AI Agent (score) → Switch → HubSpot + Slack/Email | Intermediate | DSML |
| 4 | Resume/CV Screening | Rank a shortlist from incoming resumes. | Gmail/Form Trigger → Extract From File → Information Extractor → AI Agent (score vs JD) → Sheets → Switch → Gmail | Intermediate | AI/ML, DSML |
| 5 | Content Moderation Gate | Check UGC for policy violations pre-publish. | Webhook → Text Classifier (safe/flagged/nsfw) → Switch → publish vs Slack Send-and-Wait review | Intermediate | SWE |
| 6 | Invoice/Expense Approval | Extract PDF invoices, categorize, approval above threshold. | Trigger → Extract From File → Information Extractor → IF (amount) → Send-and-Wait → Sheets/API | Advanced | SWE, DSML |
| 7 | Meeting Notes Summarizer | Auto-write notes + action items after a call. | Webhook (Zoom) → Set → Basic LLM Chain → Google Docs → Slack | Beginner | SWE |
| 8 | RAG FAQ Bot | Chatbot answers only from internal docs. | (Ingest) Drive Trigger → Data Loader → Embeddings → Vector Store; (Query) Chat Trigger → AI Agent + Vector Store Tool | Advanced | AI/ML |
| 9 | Data Quality Alerting | Daily metrics get anomaly checks with tiered alerts. | Schedule → Sheets/Postgres → Code or AI Agent → Switch (severity) → Slack/Email | Intermediate | DSML |
| 10 | Social Listening Router | Brand mentions get sentiment tags + escalation. | RSS/HTTP → Sentiment Analysis → Switch → Slack (negative only) | Beginner | DSML |
| 11 | Feedback Sentiment Router | Survey responses trigger sentiment-based follow-ups. | Webhook → Sentiment Analysis → Switch → CS alert / thank-you Gmail | Beginner | AI/ML |
| 12 | Research Assistant Agent | Chat assistant with lookup + math tools. | Chat Trigger → AI Agent + Chat Model + Simple Memory + Wikipedia + Calculator | Beginner | AI/ML |
| 13 | Multi-Agent Support Supervisor | Supervisor delegates to billing/tech sub-agents. | Chat Trigger → Supervisor Agent → AI Agent Tools (Billing, Tech) | Advanced | AI/ML, SWE |
| 14 | Tailored Application Generator | JD URL + profile → tailored cover letter. | Webhook/Form → HTTP Request (fetch JD) → AI Agent → Google Docs | Intermediate | DSML |
| 15 | Weekly Report Generator | Summarize a week's data, email stakeholders. | Schedule → Sheets/Postgres → Aggregate → LLM Chain → Send Email | Beginner | DSML |
| 16 | Human-in-the-Loop Tool Approval | Agent's risky actions need human sign-off. | Chat Trigger → AI Agent (Gmail tool gated behind Slack approval) | Advanced | SWE |
| 17 | Calendar Scheduling Assistant | NL chatbot checks availability, books meetings. | Chat Trigger → AI Agent + Google Calendar Tool + Simple Memory | Intermediate | SWE |
| 18 | Product Review Classifier | Reviews bucketed into bug/praise/question. | Airtable Trigger/Webhook → Text Classifier → Switch → Jira/Slack/Gmail | Beg/Int | DSML |
| 19 | Data Enrichment & CRM Sync | Enrich + classify raw leads before CRM sync. | Schedule → Sheets → HTTP Request → AI Agent → Switch → HubSpot / flag | Intermediate | DSML |
| 20 | AI-Personalized Onboarding | New signups get a personalized welcome sequence. | Webhook → AI Agent (personalize) → Set → Gmail → Wait → next step | Intermediate | SWE, DSML |

Template evidence: n8n.io/workflows #6552 (email triage GPT-4/Gmail/Trello), #11854 (ticket triage), #10150 (lead routing), #8646 (CV screening), #13154 (moderation), #11911 (invoice processing), #8057 (meeting notes), #5010 (RAG starter), #13139 (data integrity alerts), #7912 (GA4 anomaly detection), plus docs' "Agents vs chains" example.

---

## 5. Common learner mistakes / misconceptions (distractor & probe material)

**Agent wiring**: forgetting the Chat Model sub-node (*"A Chat Model sub-node must be connected"* — the most common first-run error); forgetting a Tool sub-node; wrong Prompt source (auto-from-Chat-Trigger with no Chat Trigger upstream → *"No prompt specified"*); null values reaching the Prompt (broken expression); stale Window Buffer Memory copied from old templates.

**Classification/branching** (core to this curriculum): feeding raw free-text LLM output into Switch string rules instead of parsing/constraining first (Structured Output Parser / Information Extractor / Text Classifier); attaching Structured Output Parser directly to an Agent (docs: often unreliable — use a downstream Chain); IF vs Switch confusion (IF = 2 branches only); not realizing Switch's default fallback **silently drops** unmatched items; classification temperature not ≈0 (non-deterministic runs); vague tool descriptions ("handles data" vs "looks up customer orders by order ID or email").

**Expressions/hardcoding**: hardcoding literal emails/URLs/IDs instead of `{{ $json.email }}`; hardcoding API keys in parameters instead of Credentials; writing `$json.name` without the `{{ }}` wrapper; sub-node expressions resolving to item 1 only ("why does it only use the first row?").

**Trigger/infrastructure**: Test URL vs Production URL confusion (test listens 120s after "Listen for test event"; production requires publish); Schedule Trigger timezone assumptions + changes needing republish; Chat Trigger and Agent not sharing the same memory sub-node (session desync).

**Code node**: returning raw values instead of `[{ json: {...} }]`; `this.getCredentials is not a function` (credentials inaccessible by design); `import`/`export` instead of `require`.

**Conceptual**: Agent vs Chain conflation (cost/latency vs silent loss of memory/tools); conflating the fixed System Message with the per-turn User prompt (the "single prompt box" ChatGPT mental model).

Sources: [AI Agent common issues](https://docs.n8n.io/integrations/builtin/cluster-nodes/root-nodes/n8n-nodes-langchain.agent/common-issues), [Structured Output Parser common issues](https://docs.n8n.io/integrations/builtin/cluster-nodes/sub-nodes/n8n-nodes-langchain.outputparserstructured/common-issues), [Code node common issues](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.code/common-issues), [Webhook common issues](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.webhook/common-issues), [Schedule Trigger common issues](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.scheduletrigger/common-issues), [Fix common issues (AI workflows)](https://docs.n8n.io/build/integrate-ai/test-and-improve-ai-workflows/fix-common-issues), n8n community forum threads.
