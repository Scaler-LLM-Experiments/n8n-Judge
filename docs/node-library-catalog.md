# n8n node library catalog

Use this file when choosing nodes for a new case. Use the catalog `type` in the case build, dissection, flow, and `nodeSetup`; the descriptor supplies the real simulated settings screen. Current reviewed scope: **167 canonical nodes** (27 triggers, 24 app actions, 116 core/data/AI nodes) plus 10 compatibility aliases.

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

## Core, data, and AI building blocks (101)

| Node | Catalog type | Function |
|---|---|---|
| Aggregate | `aggregate` | Combine a field from many items into a list in a single item |
| AI Agent | `ai-agent` | Configure a tool-using AI agent with model, memory, tools, and optional structured output |
| AI Transform | `ai-transform` | Modify data based on instructions written in plain english |
| Anthropic Chat Model | `anthropic-chat-model` | Configure an Anthropic Claude chat model and current thinking controls |
| AWS Bedrock Chat Model | `aws-bedrock-chat-model` | Configure an AWS Bedrock chat model, inference profile, and guardrails |
| Azure AI Search Vector Store | `azure-ai-search-vector-store` | Configure Azure AI Search insertion, search, retrieval, tool, and update modes |
| Azure OpenAI Chat Model | `azure-openai-chat-model` | Configure an Azure OpenAI chat deployment and completion controls |
| Basic LLM Chain | `basic-llm-chain` | Prompt a language model with optional messages, fallback model, and output parser |
| Chat | `chat` | Send a message into the chat |
| Chat Memory Manager | `chat-memory-manager` | Retrieve, insert, replace, or delete messages in connected chat memory |
| Chroma Vector Store | `chroma-vector-store` | Configure Chroma insertion, search, retrieval, and tool modes |
| Code | `code` | Run custom JavaScript or Python code |
| Cohere Chat Model | `cohere-chat-model` | Configure a Cohere Command chat model and request controls |
| Cohere Model | `cohere-model` | Configure a Cohere text-completion model and generation controls |
| Compare Datasets | `compare-datasets` | Compare two inputs for changes |
| Compression | `compression` | Compress and decompress files |
| Convert to File | `convert-to-file` | Convert JSON data to binary data |
| Crypto | `crypto` | Provide cryptographic utilities |
| Data table | `data-table` | Permanently save data across workflow executions in a table |
| Date & Time | `date-time` | Manipulate date and time values |
| Default Data Loader | `default-data-loader` | Configure JSON or binary document loading with simple or custom text splitting |
| DebugHelper | `debug-helper` | Causes problems intentionally and generates useful data for debugging |
| DeepSeek Chat Model | `deepseek-chat-model` | Configure a DeepSeek chat model and completion controls |
| Edit Fields (Set) | `edit-fields` | Modify, add, or remove item fields |
| Edit Image | `edit-image` | Edits an image like blur, resize or adding border and text |
| Embeddings AWS Bedrock | `embeddings-aws-bedrock` | Configure an AWS Bedrock embedding model and request options |
| Embeddings Azure OpenAI | `embeddings-azure-openai` | Configure an Azure OpenAI embedding deployment and request options |
| Embeddings Cohere | `embeddings-cohere` | Choose a Cohere embedding model for an AI vector workflow |
| Embeddings Google Gemini | `embeddings-google-gemini` | Configure a locked Google Gemini embedding model selection |
| Embeddings Google Vertex | `embeddings-google-vertex` | Configure a Google Cloud project, Vertex model, and location |
| Embeddings Hugging Face Inference | `embeddings-huggingface-inference` | Configure a Hugging Face embedding model, provider, and optional endpoint |
| Embeddings Lemonade | `embeddings-lemonade` | Configure a model discovered from a Lemonade server |
| Embeddings Mistral Cloud | `embeddings-mistral-cloud` | Configure a Mistral embedding model and batching options |
| Embeddings Ollama | `embeddings-ollama` | Configure an embedding model discovered from an Ollama server |
| Embeddings OpenAI | `embeddings-openai` | Configure a current OpenAI embedding model and request options |
| Embeddings Oracle Database | `embeddings-oracle-database` | Configure an Oracle Database ONNX embedding model |
| Evaluation | `evaluation` | Runs an evaluation |
| Execute Command | `execute-command` | Executes a command on the host |
| Execute Sub-workflow | `execute-subworkflow` | Execute another workflow |
| Execution Data | `execution-data` | Add execution data for search |
| Extract from File | `extract-from-file` | Convert binary data to JSON |
| Filter | `filter` | Keep only items matching a condition |
| FTP | `ftp` | Transfer files via FTP or SFTP |
| Git | `git` | Control git. |
| GitHub Document Loader | `github-document-loader` | Configure GitHub repository documents and text splitting for AI workflows |
| Google Gemini Chat Model | `google-gemini-chat-model` | Configure a Google Gemini chat model and safety settings |
| Google Vertex Chat Model | `google-vertex-chat-model` | Configure a Gemini chat model on Google Vertex AI |
| GraphQL | `graphql` | Makes a GraphQL request and returns the received data |
| Groq Chat Model | `groq-chat-model` | Configure a Groq-hosted chat model and completion controls |
| Guardrails | `guardrails` | Safeguard AI models from malicious input or prevent them from generating undesirable responses |
| HTML | `html` | Work with HTML |
| HTTP Request | `http-request` | Makes an HTTP request and returns the response data |
| Hugging Face Inference Model | `huggingface-inference-model` | Configure a Hugging Face text-generation model and inference controls |
| If | `if` | Route items to different branches (true/false) |
| Information Extractor | `information-extractor` | Extract structured information from text using a connected language model |
| JWT | `jwt` | JWT |
| LangChain Code | `langchain-code` | Author inert JavaScript text and custom LangChain connection shapes |
| Ldap | `ldap` | Interact with LDAP servers |
| Lemonade Chat Model | `lemonade-chat-model` | Configure a Lemonade chat model and completion controls |
| Lemonade Model | `lemonade-model` | Configure a Lemonade text-completion model and generation controls |
| Limit | `limit` | Restrict the number of items |
| Loop Over Items (Split in Batches) | `loop-over-items` | Split data into batches and iterate over each batch |
| Markdown | `markdown` | Convert data between Markdown and HTML |
| MCP Client | `mcp-client` | Standalone MCP Client |
| Merge | `merge` | Merges data of multiple streams once data from both is available |
| Milvus Vector Store | `milvus-vector-store` | Configure Milvus insertion, search, retrieval, and tool modes |
| MiniMax Chat Model | `minimax-chat-model` | Configure a MiniMax M2 chat model and reasoning controls |
| Mistral Cloud Chat Model | `mistral-cloud-chat-model` | Configure a Mistral Cloud chat model and completion controls |
| MongoDB Atlas Vector Store | `mongodb-atlas-vector-store` | Configure MongoDB Atlas vector insertion, search, retrieval, tool, and update modes |
| MongoDB Chat Memory | `mongodb-chat-memory` | Configure MongoDB-backed chat history and session controls |
| Moonshot Kimi Chat Model | `moonshot-chat-model` | Configure a Moonshot Kimi chat model and completion controls |
| Motorhead | `motorhead` | Configure the hidden deprecated Motorhead chat memory surface |
| n8n | `n8n` | Handle events and perform actions on your n8n instance |
| n8n Form | `form` | Generate webforms in n8n and pass their responses to the workflow |
| No Operation, do nothing | `noop` | No Operation |
| NVIDIA Nemotron Chat Model | `nvidia-nemotron-chat-model` | Configure an NVIDIA Nemotron chat model and completion controls |
| Ollama Chat Model | `ollama-chat-model` | Configure a local Ollama chat model and runtime options |
| Ollama Model | `ollama-model` | Configure a local Ollama text-completion model and runtime options |
| OpenAI Chat Model | `openai-chat-model` | Configure OpenAI chat completions, Responses API, and built-in tools |
| OpenRouter Chat Model | `openrouter-chat-model` | Configure an OpenRouter chat model and completion controls |
| Oracle Database Vector Store | `oracle-database-vector-store` | Configure Oracle Database vector insertion, search, retrieval, and tool modes |
| Pinecone Vector Store | `pinecone-vector-store` | Configure Pinecone insertion, search, retrieval, tool, and update modes |
| Postgres Chat Memory | `postgres-chat-memory` | Configure Postgres-backed chat history and session controls |
| Postgres PGVector Store | `pgvector-vector-store` | Configure PostgreSQL PGVector insertion, search, retrieval, and tool modes |
| Qdrant Vector Store | `qdrant-vector-store` | Configure Qdrant insertion, search, retrieval, and tool modes |
| Question and Answer Chain | `question-answer-chain` | Answer questions using a connected retriever and language model |
| Qwen Cloud Chat Model | `qwen-cloud-chat-model` | Configure a Qwen Cloud language model and completion controls |
| Read/Write Files from Disk | `read-write-file` | Read or write files from the computer that runs n8n |
| Redis Chat Memory | `redis-chat-memory` | Configure Redis-backed chat history, sessions, and expiry |
| Redis Vector Store | `redis-vector-store` | Configure Redis vector-index insertion, search, retrieval, tool, and update modes |
| Remove Duplicates | `remove-duplicates` | Delete items with matching field values |
| Rename Keys | `rename-keys` | Update item field names |
| Respond to Webhook | `respond-to-webhook` | Returns data for Webhook |
| RSS Read | `rss-read` | Reads data from an RSS Feed |
| Send Email | `send-email` | Sends an email using SMTP protocol |
| Sentiment Analysis | `sentiment-analysis` | Configure sentiment categories with one authored output branch per label |
| Simple Memory | `simple-memory` | Configure a local window of recent chat interactions for one session |
| Simple Vector Store | `simple-vector-store` | Configure an experimental in-memory vector store without external setup |
| Sort | `sort` | Change items order |
| Split Out | `split-out` | Turn a list inside item(s) into separate items |
| SSH | `ssh` | Execute commands via SSH |
| Stop and Error | `stop-and-error` | Throw an error in the workflow |
| Supabase Vector Store | `supabase-vector-store` | Configure Supabase insertion, search, retrieval, tool, and update modes |
| Summarization Chain | `summarization-chain` | Summarize JSON, binary, or loaded documents with configurable chunking and prompts |
| Summarize | `summarize-items` | Sum, count, max, etc. across items |
| Switch | `switch` | Route items depending on defined expression or rules |
| Text Classifier | `text-classifier` | Classify text into authored category output branches |
| TOTP | `totp` | Generate a time-based one-time password |
| Vercel AI Gateway Chat Model | `vercel-ai-gateway-chat-model` | Configure a Vercel AI Gateway chat model and completion controls |
| Wait | `wait` | Wait before continue with execution |
| Weaviate Vector Store | `weaviate-vector-store` | Configure Weaviate insertion, search, retrieval, and tool modes |
| Xata | `xata-memory` | Configure Xata-backed chat history and session controls |
| XML | `xml` | Convert data from and to XML |
| xAI Grok Chat Model | `xai-grok-chat-model` | Configure an xAI Grok chat model, priority, and reasoning controls |
| Zep | `zep-memory` | Configure the hidden deprecated Zep chat memory surface |
| Zep Vector Store | `zep-vector-store` | Configure the hidden deprecated Zep insertion, search, retrieval, and tool modes |

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
