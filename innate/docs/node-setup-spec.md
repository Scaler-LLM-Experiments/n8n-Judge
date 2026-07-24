# Node setup & grading spec — Email Triage

How the node bottom-sheet teaches *and* grades, node by node. Content for review
before wiring. All copy is placeholder-quality — tune freely.

## Interaction model (recap)
- A node's sheet is split into **sections**; the learner confirms a **section** to advance (not every field).
- Inside a section, candidate fields/values are **clickable — right and wrong both shown**. Clicking any one reveals a one-line **"why"** in Iris's voice.
- Selecting/mapping the **correct** field confirms the section. Wrong picks are never blocked — they're a learning click, but they're recorded.
- When all sections pass, the node's ⚠ clears and "Complete setup" enables.

## Grading model (light, understanding-focused)
Each node has one or more **decision points** (a clickable right/wrong choice, or a node-pick).
- **First-try correct** → full credit for that decision (the signal we actually grade: "they knew it").
- **Correct after exploring a wrong option** → partial credit; the "why" they read is the learning.
- Attempts + which wrong options they clicked are stored → the Report shows an **Understanding score** (% of decisions right first try) and can call out *which misconceptions* they hit.
- Node-drop MCQ probes (below) feed the same score.

---

## Per-node decision points

### 1. New Email — *Gmail Trigger*
**Section: "The data this trigger gives you."** (No input to map — this orients them.)
> Iris: "Every email that comes in looks like this. Which field holds the message you'll actually classify?"

| Field | | Why (on click) |
|---|---|---|
| `body` | ✓ | The full text of the email — this is what you judge intent on. |
| `subject` | ✗ | Just the title. Often too little to tell a bug from a complaint. |
| `from` | ✗ | The sender's address — identity, not content. |
| `receivedAt` | ✗ | A timestamp. Says nothing about what the email is about. |

**Confirm:** click `body`.

---

### 2. Classify with AI — *AI Agent (cluster node)*
**Section A: "Give it a brain."**
> Iris: "An AI node can't think on its own. What does it need plugged into it?"

| Option | | Why |
|---|---|---|
| Chat Model | ✓ | The language model is the brain — without it the node can't classify. It's required. |
| Memory | ✗ | Lets it remember past turns — useful for chatbots, not one-shot classification. |
| Tool | ✗ | Lets an agent call other systems — not needed just to label an email. |
| Nothing | ✗ | It literally won't run — n8n flags "connect a Chat Model." |

**Confirm:** attach a Chat Model to the bottom port.

**Section B: "What it reads."**
> Iris: "Now point the AI at the actual email. Which field should its Text input read?"

| Field (from Input) | | Why |
|---|---|---|
| `body` | ✓ | The message itself — classify on this. |
| `subject` | ✗ | Only the title; the AI would miss most of the signal. |
| `from` | ✗ | The sender, not the content. |

**Confirm:** map `body` → **Text** (`{{ $json.body }}`).

---

### 3. Parse Result — *Edit Fields*
**Section: "Turn the AI's answer into fields."**
> Iris: "The AI handed back one blob of text. Which input do you parse into clean fields?"

| Field (from Input) | | Why |
|---|---|---|
| `text` (AI output) | ✓ | The AI's raw answer — parse this into `category` + `urgency`. |
| `body` | ✗ | That's the *original email*, not the AI's answer. |
| `subject` | ✗ | The email title — nothing to parse here. |

**Confirm:** map `text` → **Source**. (Output preview then shows `{ category, urgency }`.)

---

### 4. Switch — *route by rules*
**Section: "Route on the right field."**
> Iris: "You've got `category` and `urgency` now. Which one decides the branch?"

| Field (from Input) | | Why |
|---|---|---|
| `category` | ✓ | The label the AI assigned — Bug Report / Feature Request / Complaint. Route on this. |
| `urgency` | ✗ | *How* urgent, not *what type*. A secondary signal, not the split. |
| `body` | ✗ | Raw text — the Switch needs a clean, predictable value. |

**Confirm:** map `category` → **Value to route on**; then glance at the 3 branch rules.

---

### 5. Send Reply — *Gmail Send*
**Section: "Reply to the right person."**
> Iris: "Last step — the reply has to reach the customer. Which field is the recipient?"

| Field (from Input) | | Why |
|---|---|---|
| `from` | ✓ | The person who emailed in — the reply goes back to them. |
| `subject` | ✗ | The email's title, not an address. |
| `to` | ✗ | That was *your* inbox — replying here emails yourself. |

**Confirm:** map `from` → **To**.

---

## Wrong-node-drop probes (misconception MCQs)
Fired only for **plausible** wrong nodes (the confusers). Obvious mis-drops get a light "not for this step" and return to the sidebar.

### Chat Trigger dropped on the trigger step
> Iris: "Hmm — why Chat Trigger?"
- "Emails and chats both bring in a message" → *Close, but Chat Trigger only listens for chatbot messages, not an inbox. A support inbox needs an email trigger.*
- "Any trigger starts the flow, so it's fine" → *Triggers aren't interchangeable — each fires on one specific event. You need the one that fires on a new email.*
- "Added it by mistake" → *No worries — popping it back.*

Node animates back to the sidebar either way.

### Schedule dropped on the trigger step
> Iris: "Why a Schedule trigger?"
- "It can check the inbox on a timer" → *It can, but that polls on a clock and adds delay. You want to react the instant an email lands — an event trigger.*
- "Added it by mistake" → *All good — back it goes.*

### If dropped where Switch belongs
> Iris: "Why If here?"
- "It branches, and I need branches" → *If only splits two ways (true/false). You have three categories — that's what Switch is for.*
- "Added it by mistake" → *Back to the sidebar.*

### Code / Web Search dropped for classification
> Iris: "Why Code (or Web Search)?"
- "I can write rules to detect the category" → *Brittle — emails are free text and phrased a thousand ways. Let an AI read it instead.*
- "Added it by mistake" → *Back it goes.*

---

## What flows to the Report
- **Dissection** decisions (Understand stage) + **node-pick** decisions + **field** decisions all contribute to one **Understanding score** (first-try correct %).
- The Report can surface *specific misconceptions hit* (e.g. "treated Chat Trigger as an email trigger", "tried to route on urgency instead of category") — richer than a pass/fail.
