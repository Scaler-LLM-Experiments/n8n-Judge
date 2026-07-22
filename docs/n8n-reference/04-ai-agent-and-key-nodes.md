# AI Agent Cluster Node & Key Nodes for Email Triage

Synthesised from n8n's official docs (docs.n8n.io) for the purpose of cloning node behaviour in a React + React Flow teaching prototype. Not verbatim — summarised and reorganised.

---

## 1. Cluster nodes: root nodes + sub-nodes

n8n's AI features (`@n8n/n8n-nodes-langchain`) are built as **cluster nodes**: a group of nodes that cooperate to deliver one capability, instead of one node doing everything.

- **Root node** — the node that appears as the "main" step in the workflow (e.g. **AI Agent**, **Text Classifier**, **Basic LLM Chain**). It has a normal main input (left) and main output (right), like any other node.
- **Sub-nodes** — smaller special-purpose nodes (a Chat Model, a Memory, a Tool, an Output Parser) that don't sit in the main data flow at all. Instead they plug **into the bottom of the root node** via short special connections, configuring how the root node behaves. A sub-node has no main input/output of its own — its only connector is the one that attaches upward to a root node.
- One root node can have **one or more sub-nodes** attached, each of a specific connection type. The Chat Model port only accepts a Chat Model sub-node; the Tool port only accepts Tool sub-nodes, etc. — types aren't interchangeable.

### Connection types
n8n defines special (non-main) connection types for this, prefixed `ai_`: `ai_languageModel`, `ai_memory`, `ai_tool`, `ai_outputParser`, plus others used by different cluster nodes (`ai_embedding`, `ai_retriever`, `ai_textSplitter`, `ai_vectorStore`, `ai_document`, `ai_agent`, `ai_chain`). Each is visually distinct from the plain main-data connection (which is a solid line between left/right handles); sub-node connections run from the **bottom** of the root node downward to the sub-node.

### Canvas representation
On the root node, each supported sub-node type shows as a small labelled **port with a "+" icon** beneath the node (e.g. "Chat Model +", "Memory +", "Tool +"). Clicking "+" opens a picker of that type's available sub-nodes to create/connect. Once connected, the sub-node renders below the root node with a line running up into that port. A port that is mandatory but unfilled is flagged — in the AI Agent's case, the Chat Model port shows a **red asterisk** and the node displays a "set me up" warning badge until something is connected.

---

## 2. AI Agent node (root node)

Path: `n8n-nodes-langchain.agent`.

- **Main input (left)** / **main output (right)**: standard data flow, like any node — the item(s) it receives typically carry the user's message/prompt; its output is the agent's final response (plus, optionally, intermediate steps).
- **Bottom sub-node ports**, each a diamond-shaped connector with a "+":
  - **Chat Model** — `ai_languageModel`. **Required.** Shown with a red asterisk; the node won't execute without one, and the canvas surfaces "A Chat Model sub-node must be connected" until it's wired up. You attach it by clicking the **+ Chat Model** button under the node (or the connector on the collapsed node) and picking a model (e.g. OpenAI Chat Model, Google Gemini Chat Model, Anthropic Chat Model).
  - **Memory** — `ai_memory`. **Optional.** Adds conversational memory (e.g. Simple Memory / buffer window) so the agent can recall prior turns.
  - **Tool** — `ai_tool`. Lets the agent call out to other systems (HTTP Request Tool, Vector Store Tool, Workflow Tool, another AI Agent as a tool, etc.) as part of reasoning.
    - Docs note: since agent-type unification (n8n ≥ 1.82, all AI Agent nodes run as a "Tools Agent"), the current docs actually describe Tool as needing **at least one connection**. Most tutorials and the classic three-port diagram still teach it as optional with a plain "+" (no asterisk) — see §6 for how we're modelling it.
- **Agent type**: pre-1.82 versions exposed a dropdown (Tools Agent, Conversational Agent, OpenAI Functions Agent, ReAct Agent, Plan & Execute Agent, SQL Agent); current versions collapse all of these into the Tools Agent behaviour, kept as a hidden setting only for backward compatibility with older workflows.
- **Key parameters**: Prompt source (`Take from previous node automatically` / `Define below`), the Prompt/text itself, System Message, and advanced options (max iterations, return intermediate steps).

### "Set me up" / missing-sub-node behaviour
When a required sub-node is absent, the root node renders in an unconfigured state with a warning triangle and inline "Set me up" / "+" affordance at the missing port. Attempting to execute throws a explicit connection error rather than silently failing.

---

## 3. Chat Model sub-nodes

Sub-nodes under the `ai_languageModel` connection type (path prefix `n8n-nodes-langchain.lmChat*`). Two common ones:

**Google Gemini Chat Model** (`lmChatGoogleGemini`)
- **Model** — dropdown, dynamically populated from the Gemini API for the connected credential.
- **Credential** — Google Gemini(PaLM) API credential (API key from Google AI Studio; default host `https://generativelanguage.googleapis.com`).
- **Options**: Sampling Temperature (randomness/creativity), Maximum Number of Tokens, Top K, Top P, Safety Settings.

**OpenAI Chat Model** (`lmChatOpenAi`)
- **Model** — dropdown, dynamically populated per the connected OpenAI-compatible credential.
- **Credential** — OpenAI API credential.
- **Options**: Temperature, Maximum Number of Tokens, Frequency/Presence Penalty, Response Format (Text/JSON), API URL Override.

Both are single-purpose: no main input/output, just the one upward `ai_languageModel` connector into whichever root node (AI Agent, Text Classifier, Basic LLM Chain, etc.) they're attached to.

---

## 4. Other nodes needed for an email-triage flow

### Gmail Trigger (`n8n-nodes-base.gmailTrigger`)
Starts the workflow when mail arrives.
- **Event**: fixed to `Message Received` — fires per Poll Time.
- **Poll Times** — polling mode/frequency (e.g. every minute/hour, custom cron).
- **Simplify** — toggle for a cleaned-up message shape vs raw Gmail API payload (on by default).
- **Filters**: Label Names/IDs, Sender, Search (raw Gmail query string), Read Status (unread/read/both), Include Spam/Trash.
- **Max Emails per Poll** — cap per cycle (default 10, up to 50).
- Credential: Gmail OAuth2 / Google credential.

### Classification — two viable approaches
1. **AI Agent** with a System Message instructing it to output a category, paired with a downstream **Switch**/Set to parse the category out of its text response. Flexible but the output format needs enforcing (or an Output Parser sub-node).
2. **Text Classifier** (`n8n-nodes-langchain.textClassifier`) — purpose-built root node for this exact job, also needs a **Chat Model** sub-node attached (`ai_languageModel`), no Memory/Tool ports.
   - **Input Prompt** — expression pointing at the text to classify (e.g. email body/subject).
   - **Categories** — list of `{ name, description }` pairs; the description is fed to the model so it knows what each label means.
   - **Output on Extra "Other" Branch** — adds a fallback output for unmatched items.
   - **Enable Auto-Fixing** — reprompts the model to correct malformed output against the expected schema.
   - Produces **one output branch per category** directly — no separate Switch node needed downstream, unlike the AI Agent approach.

For an email-triage teaching example, **Text Classifier** is the cleaner match: it's a cluster/root node with the same "Chat Model required" pattern as AI Agent, but its multi-output branching doubles as the routing step.

### Edit Fields / Set (`n8n-nodes-base.set`)
Reshapes item data.
- **Mode**: Manual Mapping (add Name/Type/Value rows, each value can be a fixed value or an expression) or JSON (write a JSON object merged into the item).
- **Keep Only Set Fields** — discard everything else vs. **Include in Output = All Input Fields** — keep original data alongside the new fields.
- Supports dot-notation field names to build nested objects.

### Switch (`n8n-nodes-base.switch`)
Routes items to one of several named branches.
- **Mode**: **Rules** (declarative conditions, used here) or Expression (custom code returning an output index).
- **Rules mode**: define N rules, each with a comparison (string/number/date/boolean/etc.) against a field (e.g. `{{$json.category}}`), and each rule maps to its own **named output**.
- **Output naming** — rename each output for clarity (e.g. "Urgent", "Newsletter", "Spam").
- **Fallback Output** — what happens to items matching no rule: ignore (default), route to a dedicated fallback output, or send to output 0.
- **Send data to all matching outputs** — first-match-only vs. broadcast to every matching rule.

### Gmail — Send (`n8n-nodes-base.gmail`, operation "Send a message")
Sends the reply.
- **To** — recipient address(es).
- **Subject**.
- **Message** — body content; **Email Type** toggle for Text vs HTML.
- Optional: CC, BCC, Attachments, Sender Name, Reply-To, "Append n8n attribution" footer toggle.
- Credential: same Gmail OAuth2/Google credential type as the trigger.

---

## 5. Putting it together (typical shape)

```
Gmail Trigger ──▶ Text Classifier ──▶ (per-category output) ──▶ Edit Fields ──▶ Gmail (Send)
                       ▲
                       │ ai_languageModel
                  Chat Model (Gemini/OpenAI)
```
or, using AI Agent + Switch instead of Text Classifier:
```
Gmail Trigger ──▶ AI Agent ──▶ Switch (Rules, by category field) ──▶ Edit Fields ──▶ Gmail (Send)
                     ▲
                     │ ai_languageModel
                Chat Model
```

---

## 6. What matters for our simulator

- **Model the classify node as a root node with a required sub-node port.** Whichever label we use (AI Agent or Text Classifier), render it with a bottom "Chat Model" diamond port that:
  - Shows a **red asterisk** / warning state when nothing is attached.
  - Accepts only a "Chat Model" sub-node type (don't let learners wire a Tool sub-node into it).
  - Flips to a normal/connected state once a Chat Model sub-node is dropped onto it — that's the core "aha" of cluster nodes worth teaching.
- **Keep Memory and Tool ports present but optional** (plain "+", no asterisk) for the AI Agent variant, matching the classic three-port diagram most learners will have seen — even though current n8n technically also requires a Tool now, that nuance isn't the teaching point here.
- **Sub-node = no main input/output.** In React Flow terms, give Chat Model (and Memory/Tool) nodes zero left/right handles — only a single bottom/top handle that connects upward into the root node's port. This is the clearest way to visually distinguish sub-nodes from the main pipeline.
- **Per-node params to expose (minimal set):**
  - *Gmail Trigger*: Event (fixed), Poll Time, Simplify (on/off), one filter field (e.g. label or search query).
  - *Chat Model sub-node*: Model (dropdown), Temperature. Credential field pre-filled/locked to **"Scaler API"** (no real credential UI needed).
  - *Classify node* (AI Agent or Text Classifier): Categories list (name + description) if Text Classifier; or Prompt/System Message if AI Agent.
  - *Switch* (if used): Rules list mapping a field value → named output.
  - *Edit Fields*: a couple of Name/Value rows, Keep-Only-Set toggle.
  - *Gmail Send*: To, Subject, Message.
- **Credentials are pre-connected everywhere** — every credentialed node (Gmail Trigger, Gmail Send, Chat Model) just shows a read-only "Scaler API" chip; no OAuth/API-key flow needs simulating.
- **Missing-required-subnode is a teachable error state** — wire the simulator's "Run" / validation step to specifically flag "Chat Model sub-node not connected" if that port is empty, mirroring n8n's real execution error, rather than a generic "invalid workflow" message.
