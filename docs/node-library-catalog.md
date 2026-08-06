# n8n node library catalog

Use this file when choosing nodes for a new case. Use the catalog `type` in the case build, dissection, flow, and `nodeSetup`; the descriptor supplies the real simulated settings screen. The catalog contains **200 registered types**: 185 current canonical nodes for new cases, five deprecated descriptors retained only for compatibility, and 10 compatibility aliases. Three additional live app triggers remain deferred.

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
| Execute Sub-workflow Trigger | `execute-subworkflow-trigger` | Starts a sub-workflow when another workflow calls it and defines the accepted input schema |
| Github Trigger | `github-trigger` | Starts the workflow when Github events occur |
| Gmail Trigger | `gmail-trigger` | Fetches emails from Gmail and starts the workflow on specified polling intervals. |
| Google Calendar Trigger | `google-calendar-trigger` | Starts the workflow when Google Calendar events occur |
| Google Drive Trigger | `google-drive-trigger` | Starts the workflow when Google Drive events occur |
| Google Sheets Trigger | `google-sheets-trigger` | Starts the workflow when Google Sheets events occur |
| Local File Trigger | `local-file-trigger` | Triggers a workflow on file system changes |
| Manual Trigger | `manual` | Runs the flow on clicking a button in n8n |
| MCP Server Trigger | `mcp-server-trigger` | Expose n8n tools as an MCP Server endpoint |
| Microsoft Agent 365 Trigger | `microsoft-agent-365-trigger` | Starts an AI workflow from Microsoft Agent 365 activity with connected models, tools, and optional structured output |
| Microsoft Outlook Trigger | `microsoft-outlook-trigger` | Fetches emails from Microsoft Outlook and starts the workflow on specified polling intervals. |
| Microsoft Teams Trigger | `microsoft-teams-trigger` | Triggers workflows in n8n based on events from Microsoft Teams, such as new messages or team updates, using specified configurations. |
| n8n Form Trigger | `form-trigger` | Generate webforms in n8n and pass their responses to the workflow |
| n8n Trigger | `n8n-trigger` | Starts the workflow when this n8n instance starts or when this workflow is published or updated |
| Notion Trigger | `notion-trigger` | Starts the workflow when Notion events occur |
| Postgres Trigger | `postgres-trigger` | Starts on selected Postgres table inserts, updates, or deletes, or notifications from an existing channel |
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
| Discord | `discord` | Creates and manages Discord channels, messages, reactions, and member roles |
| Dropbox | `dropbox` | Copies, moves, uploads, downloads, deletes, lists, and searches Dropbox files and folders |
| GitHub | `github` | Manages GitHub files, issues, pull requests, releases, reviews, repositories, users, organizations, and workflows |
| Gmail | `gmail` | Manages Gmail drafts, labels, messages, and threads, including sending and replying |
| Google Calendar | `google-calendar` | Checks availability and creates, retrieves, updates, or deletes Google Calendar events |
| Google Docs | `google-docs` | Creates, retrieves, and updates Google Docs documents |
| Google Drive | `google-drive` | Manages and searches Drive files, folders, and shared drives, including upload, download, move, and sharing |
| Google Gemini | `google-gemini` | Message Gemini, analyze documents and audio, generate images and video, and search files |
| Google Sheets | `google-sheets` | Read, update and write data to Google Sheets |
| Google Translate | `google-translate` | Translate data using Google Translate |
| Microsoft Excel (OneDrive) | `microsoft-excel` | Reads and manages OneDrive workbooks, worksheets, tables, rows, and columns |
| Microsoft OneDrive | `microsoft-onedrive` | Manages and searches OneDrive files and folders, including upload, download, move, rename, and sharing |
| Microsoft Outlook | `microsoft-outlook` | Manages Outlook calendars, contacts, drafts, events, folders, messages, and attachments |
| Microsoft Teams | `microsoft-teams` | Manages Teams channels, channel and chat messages, and tasks |
| Notion | `notion` | Manages Notion blocks, data sources, databases, pages, and users |
| OpenAI | `openai` | Message an assistant or GPT, analyze images, generate audio, etc. |
| PayPal | `paypal` | Creates and retrieves PayPal payouts, and retrieves or cancels payout items |
| Postgres | `postgres` | Selects, inserts, updates, upserts, deletes, or runs queries in Postgres |
| Slack | `slack` | Manages Slack channels, files, messages, reactions, stars, users, and user groups |
| Stripe | `stripe` | Manages Stripe balances, charges, coupons, customers, cards, meter events, sources, and tokens |
| Telegram | `telegram` | Manages Telegram chats and messages, sends media, answers callbacks, and retrieves files |
| Twilio | `twilio` | Send SMS and WhatsApp messages or make phone calls |
| YouTube | `youtube` | Manages YouTube channels, playlists, playlist items, videos, and video categories |
| Zoom | `zoom` | Creates, retrieves, lists, updates, and deletes Zoom meetings |

## Current core, data, and AI building blocks (134)

AI cluster nodes have two placement roles. **Root nodes** sit on the main workflow canvas; **sub-nodes** attach to a root through model, memory, tool, parser, retriever, embedding, document, or reranker ports.

- **AI roots (21):** `ai-agent`, `basic-llm-chain`, `question-answer-chain`, `summarization-chain`, `information-extractor`, `text-classifier`, `sentiment-analysis`, `langchain-code`, `microsoft-agent-365-trigger`, `azure-ai-search-vector-store`, `simple-vector-store`, `milvus-vector-store`, `mongodb-atlas-vector-store`, `pgvector-vector-store`, `oracle-database-vector-store`, `chroma-vector-store`, `pinecone-vector-store`, `qdrant-vector-store`, `redis-vector-store`, `supabase-vector-store`, `weaviate-vector-store`.
- **AI sub-nodes (63):** `default-data-loader`, `github-document-loader`, `embeddings-aws-bedrock`, `embeddings-azure-openai`, `embeddings-cohere`, `embeddings-google-gemini`, `embeddings-google-vertex`, `embeddings-huggingface-inference`, `embeddings-lemonade`, `embeddings-mistral-cloud`, `embeddings-ollama`, `embeddings-openai`, `embeddings-oracle-database`, `qwen-cloud-chat-model`, `anthropic-chat-model`, `aws-bedrock-chat-model`, `azure-openai-chat-model`, `cohere-chat-model`, `deepseek-chat-model`, `google-gemini-chat-model`, `google-vertex-chat-model`, `groq-chat-model`, `lemonade-chat-model`, `minimax-chat-model`, `mistral-cloud-chat-model`, `moonshot-chat-model`, `nvidia-nemotron-chat-model`, `ollama-chat-model`, `openai-chat-model`, `openrouter-chat-model`, `vercel-ai-gateway-chat-model`, `xai-grok-chat-model`, `cohere-model`, `lemonade-model`, `ollama-model`, `huggingface-inference-model`, `chat-memory-manager`, `simple-memory`, `mongodb-chat-memory`, `redis-chat-memory`, `postgres-chat-memory`, `xata-memory`, `item-list-output-parser`, `structured-output-parser`, `contextual-compression-retriever`, `multi-query-retriever`, `vector-store-retriever`, `workflow-retriever`, `character-text-splitter`, `recursive-character-text-splitter`, `token-splitter`, `ai-agent-tool`, `calculator`, `custom-code-tool`, `mcp-client-tool`, `searxng-tool`, `think-tool`, `vector-store-question-answer-tool`, `wikipedia-tool`, `wolfram-alpha-tool`, `call-n8n-workflow-tool`, `reranker-cohere`, `model-selector`.

`ai-transform`, `langchain-code`, and `github-document-loader` are current but hidden upstream; choose them only when a case explicitly needs that source-matching surface.

| Node | Catalog type | Function |
|---|---|---|
| Aggregate | `aggregate` | Combine a field from many items into a list in a single item |
| AI Agent | `ai-agent` | Configure a tool-using AI agent with model, memory, tools, and optional structured output |
| AI Agent Tool | `ai-agent-tool` | Lets a parent AI Agent call another specialized AI Agent as a tool |
| AI Transform | `ai-transform` | Modify data based on instructions written in plain english |
| Anthropic Chat Model | `anthropic-chat-model` | Configure an Anthropic Claude chat model and current thinking controls |
| AWS Bedrock Chat Model | `aws-bedrock-chat-model` | Configure an AWS Bedrock chat model, inference profile, and guardrails |
| Azure AI Search Vector Store | `azure-ai-search-vector-store` | Configure Azure AI Search insertion, search, retrieval, tool, and update modes |
| Azure OpenAI Chat Model | `azure-openai-chat-model` | Configure an Azure OpenAI chat deployment and completion controls |
| Basic LLM Chain | `basic-llm-chain` | Prompt a language model with optional messages, fallback model, and output parser |
| Calculator | `calculator` | Gives an AI Agent reliable arithmetic calculations |
| Call n8n Workflow Tool | `call-n8n-workflow-tool` | Configure another n8n workflow and mapped trigger inputs as an AI tool |
| Character Text Splitter | `character-text-splitter` | Configure character-based document chunks, separator, size, and overlap |
| Chat | `chat` | Sends a chat message or sends one and waits for a response |
| Chat Memory Manager | `chat-memory-manager` | Retrieve, insert, replace, or delete messages in connected chat memory |
| Chroma Vector Store | `chroma-vector-store` | Configure Chroma insertion, search, retrieval, and tool modes |
| Code | `code` | Run custom JavaScript or Python code |
| Cohere Chat Model | `cohere-chat-model` | Configure a Cohere Command chat model and request controls |
| Cohere Model | `cohere-model` | Configure a Cohere text-completion model and generation controls |
| Compare Datasets | `compare-datasets` | Compare two inputs for changes |
| Compression | `compression` | Compress and decompress files |
| Convert to File | `convert-to-file` | Convert JSON data to binary data |
| Contextual Compression Retriever | `contextual-compression-retriever` | Reduces retrieved documents to query-relevant context before passing them to a chain or agent |
| Crypto | `crypto` | Provide cryptographic utilities |
| Custom Code Tool | `custom-code-tool` | Author inert JavaScript or Python tool code with an optional input schema |
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
| Evaluation | `evaluation` | Sets evaluation inputs, outputs, and metrics, or checks whether evaluation is active |
| Execute Command | `execute-command` | Executes a command on the host |
| Execute Sub-workflow | `execute-subworkflow` | Execute another workflow |
| Execution Data | `execution-data` | Add execution data for search |
| Extract from File | `extract-from-file` | Convert binary data to JSON |
| Filter | `filter` | Keep only items matching a condition |
| FTP | `ftp` | Transfer files via FTP or SFTP |
| Git | `git` | Clones and manages Git repositories, commits, branches, remotes, tags, status, and configuration |
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
| Item List Output Parser | `item-list-output-parser` | Configure how model text would be split into a limited list of items |
| JWT | `jwt` | Signs, verifies, or decodes JSON Web Tokens |
| LangChain Code | `langchain-code` | Provides custom LangChain JavaScript logic or connection shapes not covered by standard AI nodes |
| Ldap | `ldap` | Interact with LDAP servers |
| Lemonade Chat Model | `lemonade-chat-model` | Configure a Lemonade chat model and completion controls |
| Lemonade Model | `lemonade-model` | Configure a Lemonade text-completion model and generation controls |
| Limit | `limit` | Restrict the number of items |
| Loop Over Items (Split in Batches) | `loop-over-items` | Split data into batches and iterate over each batch |
| Markdown | `markdown` | Convert data between Markdown and HTML |
| MCP Client | `mcp-client` | Calls a selected tool on an external MCP server as a workflow step |
| MCP Client Tool | `mcp-client-tool` | Configure an MCP endpoint, authentication, and exposed tool filters |
| Merge | `merge` | Merges data of multiple streams once data from both is available |
| Milvus Vector Store | `milvus-vector-store` | Configure Milvus insertion, search, retrieval, and tool modes |
| MiniMax Chat Model | `minimax-chat-model` | Configure a MiniMax M2 chat model and reasoning controls |
| Mistral Cloud Chat Model | `mistral-cloud-chat-model` | Configure a Mistral Cloud chat model and completion controls |
| Model Selector | `model-selector` | Chooses the first connected language model whose authored condition matches the request |
| MongoDB Atlas Vector Store | `mongodb-atlas-vector-store` | Configure MongoDB Atlas vector insertion, search, retrieval, tool, and update modes |
| MongoDB Chat Memory | `mongodb-chat-memory` | Configure MongoDB-backed chat history and session controls |
| Moonshot Kimi Chat Model | `moonshot-chat-model` | Configure a Moonshot Kimi chat model and completion controls |
| MultiQuery Retriever | `multi-query-retriever` | Improves retrieval recall by generating several variants of the user's question |
| n8n | `n8n` | Generates audits and manages n8n credentials, executions, and workflows |
| n8n Form | `form` | Shows the next page or ending of a multi-step n8n form and waits for submission |
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
| Recursive Character Text Splitter | `recursive-character-text-splitter` | Configure recursive and language-aware document chunking |
| Reranker Cohere | `reranker-cohere` | Reorders retrieved documents by query relevance and limits the returned results |
| Redis Chat Memory | `redis-chat-memory` | Configure Redis-backed chat history, sessions, and expiry |
| Redis Vector Store | `redis-vector-store` | Configure Redis vector-index insertion, search, retrieval, tool, and update modes |
| Remove Duplicates | `remove-duplicates` | Delete items with matching field values |
| Rename Keys | `rename-keys` | Update item field names |
| Respond to Webhook | `respond-to-webhook` | Returns data for Webhook |
| RSS Read | `rss-read` | Reads data from an RSS Feed |
| Send Email | `send-email` | Sends an email using SMTP protocol |
| SearXNG Tool | `searxng-tool` | Gives an AI Agent web search through a configured SearXNG instance |
| Sentiment Analysis | `sentiment-analysis` | Configure sentiment categories with one authored output branch per label |
| Simple Memory | `simple-memory` | Configure a local window of recent chat interactions for one session |
| Simple Vector Store | `simple-vector-store` | Configure an experimental in-memory vector store without external setup |
| Sort | `sort` | Change items order |
| Split Out | `split-out` | Turn a list inside item(s) into separate items |
| SSH | `ssh` | Execute commands via SSH |
| Stop and Error | `stop-and-error` | Throw an error in the workflow |
| Structured Output Parser | `structured-output-parser` | Configure JSON output structure and optional model-assisted retry metadata |
| Supabase Vector Store | `supabase-vector-store` | Configure Supabase insertion, search, retrieval, tool, and update modes |
| Summarization Chain | `summarization-chain` | Summarize JSON, binary, or loaded documents with configurable chunking and prompts |
| Summarize | `summarize-items` | Sum, count, max, etc. across items |
| Switch | `switch` | Route items depending on defined expression or rules |
| Text Classifier | `text-classifier` | Classify text into authored category output branches |
| Think Tool | `think-tool` | Configure a description that invites an AI Agent to externalize a thought |
| Token Splitter | `token-splitter` | Configure token-based document chunk size and overlap |
| TOTP | `totp` | Generate a time-based one-time password |
| Vercel AI Gateway Chat Model | `vercel-ai-gateway-chat-model` | Configure a Vercel AI Gateway chat model and completion controls |
| Vector Store Retriever | `vector-store-retriever` | Configure a vector store as a retriever with a result limit |
| Vector Store Question Answer Tool | `vector-store-question-answer-tool` | Configure vector-store question answering with a data description and result limit |
| Wait | `wait` | Wait before continue with execution |
| Weaviate Vector Store | `weaviate-vector-store` | Configure Weaviate insertion, search, retrieval, and tool modes |
| Wikipedia | `wikipedia-tool` | Gives an AI Agent Wikipedia search for general encyclopedia lookups |
| Wolfram\|Alpha tool | `wolfram-alpha-tool` | Gives an AI Agent Wolfram Alpha for computational, mathematical, and factual queries |
| Workflow Retriever | `workflow-retriever` | Configure an n8n workflow and typed values as a retriever source |
| Xata | `xata-memory` | Configure Xata-backed chat history and session controls |
| XML | `xml` | Convert data from and to XML |
| xAI Grok Chat Model | `xai-grok-chat-model` | Configure an xAI Grok chat model, priority, and reasoning controls |

## Deprecated descriptors — do not choose for new cases (5)

These remain registered only so existing workflows and source comparisons do not break.

| Node | Catalog type | Function |
|---|---|---|
| Auto-fixing Output Parser | `auto-fixing-output-parser` | Deprecated parser wrapper retained for compatibility; use `structured-output-parser` |
| Motorhead | `motorhead` | Hidden legacy Motorhead chat memory retained only for existing workflows |
| SerpApi (Google Search) | `serpapi-tool` | Hidden deprecated Google search tool retained only for existing workflows; prefer `searxng-tool` |
| Zep | `zep-memory` | Hidden deprecated Zep chat memory retained only for existing workflows |
| Zep Vector Store | `zep-vector-store` | Hidden deprecated Zep vector store retained only for existing workflows |

## Compatibility-only aliases (10)

Do not select these for a new case when a canonical equivalent exists. They remain to avoid breaking current cases.

| Node | Catalog type | Function |
|---|---|---|
| Classify with AI | `classify` | Legacy simplified Text Classifier used by existing cases |
| Gemini Chat Model | `chat-gemini` | Legacy Google Gemini Chat Model used by existing cases |
| Google Calendar — Create Event | `calendar-event` | Legacy Google Calendar create-event action |
| New Email | `trigger` | Legacy simplified Gmail Trigger for an incoming email |
| Notion — Create Page | `notion-page` | Legacy Notion create-page action |
| Parse Result | `parse` | Legacy simplified Edit Fields step for mapping parsed AI output |
| Send Reply | `action` | Legacy simplified Gmail send-or-reply action |
| Slack — Send Message | `slack-message` | Legacy Slack send-message action |
| Summarize with AI | `summarize` | Legacy simplified Basic LLM Chain used by existing cases |
| Web Search | `web-search` | Legacy simulated web-search action used by existing cases |

## Deferred live app triggers

These exist in n8n and have matching app nodes here, but were intentionally left for a later lower-priority batch.

| Trigger | Matching action | Status |
|---|---|---|
| Microsoft OneDrive Trigger | Microsoft OneDrive | deferred-low-priority |
| PayPal Trigger | PayPal | deferred-low-priority |
| Twilio Trigger | Twilio | deferred-low-priority |

## Excluded retired nodes

| Node | Former catalog type | Why unavailable |
|---|---|---|
| Embeddings Google PaLM | `embeddings-google-palm` | Retired upstream and not registered; use `embeddings-google-gemini` instead |

Update rule: every new descriptor must add or update exactly one row through the relevant inventory and must keep this catalog in sync. Node settings are simulation-only; case-specific grading and voice remain in the case authoring files.
