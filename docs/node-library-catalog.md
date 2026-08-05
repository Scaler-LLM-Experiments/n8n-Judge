# n8n node library catalog

Use this file when choosing nodes for a new case. Use the catalog `type` in the case build, dissection, flow, and `nodeSetup`; the descriptor supplies the real simulated settings screen. Current reviewed scope: **116 canonical nodes** (27 triggers, 24 app actions, 65 core/data/AI nodes) plus 10 compatibility aliases.

## How to choose

1. Pick one trigger for the event that starts the workflow.
2. Add the smallest core set needed to shape, filter, branch, wait, merge, or validate data.
3. Finish with one or more app/action nodes that create the side effect.
4. Prefer canonical types below. Compatibility aliases exist only for already-authored cases.

| Case shape | Recommended node set |
|---|---|
| Form intake | `form-trigger` → `edit-fields` / `filter` → `google-sheets` + `gmail` / `slack` |
| Email triage | `gmail-trigger` → AI/classification step → `switch` → `gmail` / `slack` / `notion` |
| Scheduled sync | `schedule` → source app read → `compare-datasets` / `remove-duplicates` → destination app |
| Incoming API | `webhook` → `code` / `edit-fields` / `if` → app action → `respond-to-webhook` |
| File pipeline | `google-drive-trigger` → `extract-from-file` / `convert-to-file` → storage or messaging app |
| Database changes | `postgres-trigger` → `filter` / `edit-fields` → notification or record action |
| App event routing | matching `*-trigger` → `switch` → one or more app actions |

## Trigger nodes (27)

| Node | Catalog type | Function |
|---|---|---|
| Chat Trigger | `chat-trigger` | Runs the workflow when an n8n generated webchat is submitted |
| Email Trigger (IMAP) | `email-trigger-imap` | Triggers the workflow when a new email is received |
| Error Trigger | `error-trigger` | Triggers the workflow when another workflow has an error |
| Evaluation Trigger | `evaluation-trigger` | Run a test dataset through your workflow to check performance |
| Execute Sub-workflow Trigger | `execute-subworkflow-trigger` | Helpers for calling other n8n workflows. Used for designing modular, microservice-like workflows. |
| Github Trigger | `github-trigger` | Starts the workflow when Github events occur |
| Gmail Trigger | `gmail-trigger` | Fetches emails from Gmail and starts the workflow on specified polling intervals. |
| Google Calendar Trigger | `google-calendar-trigger` | Starts the workflow when Google Calendar events occur |
| Google Drive Trigger | `google-drive-trigger` | Starts the workflow when Google Drive events occur |
| Google Sheets Trigger | `google-sheets-trigger` | Starts the workflow when Google Sheets events occur |
| Local File Trigger | `local-file-trigger` | Triggers a workflow on file system changes |
| Manual Trigger | `manual` | Runs the flow on clicking a button in n8n |
| MCP Server Trigger | `mcp-server-trigger` | Expose n8n tools as an MCP Server endpoint |
| Microsoft Agent 365 Trigger | `microsoft-agent-365-trigger` | Author a Microsoft Agent 365 trigger and its connected AI components |
| Microsoft Outlook Trigger | `microsoft-outlook-trigger` | Fetches emails from Microsoft Outlook and starts the workflow on specified polling intervals. |
| Microsoft Teams Trigger | `microsoft-teams-trigger` | Triggers workflows in n8n based on events from Microsoft Teams, such as new messages or team updates, using specified configurations. |
| n8n Form Trigger | `form-trigger` | Generate webforms in n8n and pass their responses to the workflow |
| n8n Trigger | `n8n-trigger` | Handle events and perform actions on your n8n instance |
| Notion Trigger | `notion-trigger` | Starts the workflow when Notion events occur |
| Postgres Trigger | `postgres-trigger` | Listens to Postgres messages |
| RSS Feed Trigger | `rss-feed-trigger` | Starts a workflow when an RSS feed is updated |
| Schedule Trigger | `schedule` | Triggers the workflow on a given schedule |
| Slack Trigger | `slack-trigger` | Handle Slack events via webhooks |
| SSE Trigger | `sse-trigger` | Triggers the workflow when Server-Sent Events occur |
| Stripe Trigger | `stripe-trigger` | Handle Stripe events via webhooks |
| Telegram Trigger | `telegram-trigger` | Starts the workflow on a Telegram update |
| Webhook | `webhook` | Starts the workflow when a webhook is called |

## App/action nodes (24)

| Node | Catalog type | Function |
|---|---|---|
| Discord | `discord` | Sends data to Discord |
| Dropbox | `dropbox` | Access data on Dropbox |
| GitHub | `github` | Consume GitHub API |
| Gmail | `gmail` | Consume the Gmail API |
| Google Calendar | `google-calendar` | Consume Google Calendar API |
| Google Docs | `google-docs` | Consume Google Docs API. |
| Google Drive | `google-drive` | Access data on Google Drive |
| Google Gemini | `google-gemini` | Message Gemini, analyze documents and audio, generate images and video, and search files |
| Google Sheets | `google-sheets` | Read, update and write data to Google Sheets |
| Google Translate | `google-translate` | Translate data using Google Translate |
| Microsoft Excel (OneDrive) | `microsoft-excel` | Consume the Microsoft Excel API for workbooks stored in OneDrive |
| Microsoft OneDrive | `microsoft-onedrive` | Consume Microsoft OneDrive API |
| Microsoft Outlook | `microsoft-outlook` | Consume Microsoft Outlook API |
| Microsoft Teams | `microsoft-teams` | Consume Microsoft Teams API |
| Notion | `notion` | Consume Notion API |
| OpenAI | `openai` | Message an assistant or GPT, analyze images, generate audio, etc. |
| PayPal | `paypal` | Consume PayPal API |
| Postgres | `postgres` | Get, add and update data in Postgres |
| Slack | `slack` | Consume Slack API |
| Stripe | `stripe` | Consume the Stripe API |
| Telegram | `telegram` | Sends data to Telegram |
| Twilio | `twilio` | Send SMS and WhatsApp messages or make phone calls |
| YouTube | `youtube` | Consume YouTube API |
| Zoom | `zoom` | Consume Zoom API |

## Core, data, and AI building blocks (65)

| Node | Catalog type | Function |
|---|---|---|
| Aggregate | `aggregate` | Combine a field from many items into a list in a single item |
| AI Agent | `ai-agent` | Configure a tool-using AI agent with model, memory, tools, and optional structured output |
| AI Transform | `ai-transform` | Modify data based on instructions written in plain english |
| Azure AI Search Vector Store | `azure-ai-search-vector-store` | Configure Azure AI Search insertion, search, retrieval, tool, and update modes |
| Basic LLM Chain | `basic-llm-chain` | Prompt a language model with optional messages, fallback model, and output parser |
| Chat | `chat` | Send a message into the chat |
| Code | `code` | Run custom JavaScript or Python code |
| Compare Datasets | `compare-datasets` | Compare two inputs for changes |
| Compression | `compression` | Compress and decompress files |
| Convert to File | `convert-to-file` | Convert JSON data to binary data |
| Crypto | `crypto` | Provide cryptographic utilities |
| Data table | `data-table` | Permanently save data across workflow executions in a table |
| Date & Time | `date-time` | Manipulate date and time values |
| DebugHelper | `debug-helper` | Causes problems intentionally and generates useful data for debugging |
| Edit Fields (Set) | `edit-fields` | Modify, add, or remove item fields |
| Edit Image | `edit-image` | Edits an image like blur, resize or adding border and text |
| Evaluation | `evaluation` | Runs an evaluation |
| Execute Command | `execute-command` | Executes a command on the host |
| Execute Sub-workflow | `execute-subworkflow` | Execute another workflow |
| Execution Data | `execution-data` | Add execution data for search |
| Extract from File | `extract-from-file` | Convert binary data to JSON |
| Filter | `filter` | Keep only items matching a condition |
| FTP | `ftp` | Transfer files via FTP or SFTP |
| Git | `git` | Control git. |
| GraphQL | `graphql` | Makes a GraphQL request and returns the received data |
| Guardrails | `guardrails` | Safeguard AI models from malicious input or prevent them from generating undesirable responses |
| HTML | `html` | Work with HTML |
| HTTP Request | `http-request` | Makes an HTTP request and returns the response data |
| If | `if` | Route items to different branches (true/false) |
| Information Extractor | `information-extractor` | Extract structured information from text using a connected language model |
| JWT | `jwt` | JWT |
| LangChain Code | `langchain-code` | Author inert JavaScript text and custom LangChain connection shapes |
| Ldap | `ldap` | Interact with LDAP servers |
| Limit | `limit` | Restrict the number of items |
| Loop Over Items (Split in Batches) | `loop-over-items` | Split data into batches and iterate over each batch |
| Markdown | `markdown` | Convert data between Markdown and HTML |
| MCP Client | `mcp-client` | Standalone MCP Client |
| Merge | `merge` | Merges data of multiple streams once data from both is available |
| Milvus Vector Store | `milvus-vector-store` | Configure Milvus insertion, search, retrieval, and tool modes |
| MongoDB Atlas Vector Store | `mongodb-atlas-vector-store` | Configure MongoDB Atlas vector insertion, search, retrieval, tool, and update modes |
| n8n | `n8n` | Handle events and perform actions on your n8n instance |
| n8n Form | `form` | Generate webforms in n8n and pass their responses to the workflow |
| No Operation, do nothing | `noop` | No Operation |
| Oracle Database Vector Store | `oracle-database-vector-store` | Configure Oracle Database vector insertion, search, retrieval, and tool modes |
| Postgres PGVector Store | `pgvector-vector-store` | Configure PostgreSQL PGVector insertion, search, retrieval, and tool modes |
| Question and Answer Chain | `question-answer-chain` | Answer questions using a connected retriever and language model |
| Read/Write Files from Disk | `read-write-file` | Read or write files from the computer that runs n8n |
| Remove Duplicates | `remove-duplicates` | Delete items with matching field values |
| Rename Keys | `rename-keys` | Update item field names |
| Respond to Webhook | `respond-to-webhook` | Returns data for Webhook |
| RSS Read | `rss-read` | Reads data from an RSS Feed |
| Send Email | `send-email` | Sends an email using SMTP protocol |
| Sentiment Analysis | `sentiment-analysis` | Configure sentiment categories with one authored output branch per label |
| Simple Vector Store | `simple-vector-store` | Configure an experimental in-memory vector store without external setup |
| Sort | `sort` | Change items order |
| Split Out | `split-out` | Turn a list inside item(s) into separate items |
| SSH | `ssh` | Execute commands via SSH |
| Stop and Error | `stop-and-error` | Throw an error in the workflow |
| Summarization Chain | `summarization-chain` | Summarize JSON, binary, or loaded documents with configurable chunking and prompts |
| Summarize | `summarize-items` | Sum, count, max, etc. across items |
| Switch | `switch` | Route items depending on defined expression or rules |
| Text Classifier | `text-classifier` | Classify text into authored category output branches |
| TOTP | `totp` | Generate a time-based one-time password |
| Wait | `wait` | Wait before continue with execution |
| XML | `xml` | Convert data from and to XML |

## Compatibility-only aliases (10)

Do not select these for a new case when a canonical equivalent exists. They remain to avoid breaking current cases.

| Node | Catalog type | Function |
|---|---|---|
| Classify with AI | `classify` | AI Agent |
| Gemini Chat Model | `chat-gemini` | Language Model |
| Google Calendar — Create Event | `calendar-event` | Google Calendar |
| New Email | `trigger` | Runs the flow the moment a new email arrives in the inbox |
| Notion — Create Page | `notion-page` | Notion |
| Parse Result | `parse` | Edit Fields |
| Send Reply | `action` | Gmail — Send |
| Slack — Send Message | `slack-message` | Slack |
| Summarize with AI | `summarize` | Basic LLM Chain |
| Web Search | `web-search` | Search the web |

## Deferred live app triggers

These exist in n8n and have matching app nodes here, but were intentionally left for a later lower-priority batch.

| Trigger | Matching action | Status |
|---|---|---|
| Microsoft OneDrive Trigger | `microsoft-onedrive` | deferred-low-priority |
| PayPal Trigger | `paypal` | deferred-low-priority |
| Twilio Trigger | `twilio` | deferred-low-priority |

Update rule: every new descriptor must add or update exactly one row through the relevant inventory and must keep this catalog in sync. Node settings are simulation-only; case-specific grading and voice remain in the case authoring files.
