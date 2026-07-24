--- /dev/null
+++ ./artifacts/nodequest-interaction-patterns.md
@@ -0,0 +1,429 @@
+# Nodequest — How the interactions work
+
+A plain-language guide to what you can do in the game, how each action feels, and what actually matters when solving levels.
+
+---
+
+## What Nodequest is
+
+Nodequest is a browser puzzle game that teaches automation the way tools like n8n work: you build a flow by placing steps (nodes) and connecting them in order.
+
+Each level gives you a small story goal, like:
+
+- send a message
+- cook a recipe
+- water plants
+- feed a pet only if it’s hungry
+
+You win by building the right sequence of steps and linking them correctly, then pressing **Run**.
+
+---
+
+## The main play loop
+
+Almost every level follows the same rhythm:
+
+1. **Read the goal** at the top (what the automation should do).
+2. **Pick steps** from the left sidebar.
+3. **Place them** on the canvas.
+4. **Connect them** left-to-right with wires.
+5. **Run** the flow.
+6. Either get a **success celebration**, or a **clear error** telling you what’s missing.
+7. Move to the **next level**, or go back to the **level map**.
+
+That’s the core interaction. Everything else supports this loop.
+
+---
+
+## Core building interactions
+
+### 1. Add a step (node)
+
+**How**
+- Drag a card from the left panel onto the canvas, **or**
+- Click a card in the left panel to drop it.
+
+**What you see**
+- A rounded card appears on the board with an icon, name, and type label like “input”, “process”, “output”, or “delay”.
+
+**Notes**
+- Free levels only show a small set of steps relevant to that puzzle.
+- Later levels unlock more step types (decisions, loops, filters, and so on).
+
+### 2. Move a step
+
+**How**
+- Drag the body of a node around the canvas.
+
+**Why it matters**
+- Spacing makes wiring easier.
+- Overlapping nodes make connections harder to see and click.
+
+### 3. Connect steps with wires
+
+**How**
+- Drag from a small circle on the **right** of one node to a small circle on the **left** of another.
+
+**Meaning**
+- Right side = “output / next step”
+- Left side = “input / receive from previous step”
+- The wire means: “after this finishes, do that.”
+
+**Rules of thumb**
+- Start nodes (Trigger, Timer, Schedule) usually only have an outgoing side.
+- Finish nodes (Complete, Save) usually only have an incoming side.
+- Middle action nodes have both.
+
+### 4. Delete a step
+
+**How**
+- Select a node, then click the red **X**.
+
+**What happens**
+- The node disappears.
+- Any wires attached to it also disappear.
+
+### 5. Reset the board
+
+**How**
+- Click **Reset**.
+
+**What happens**
+- The canvas clears so you can start the level over.
+
+### 6. Undo / Redo
+
+**How**
+- Undo: **Ctrl+Z**
+- Redo: **Ctrl+Shift+Z**
+- Also available as toolbar buttons when enabled.
+
+Useful when a wire or node placement goes wrong.
+
+### 7. Zoom and fit view
+
+**How**
+- Zoom in / zoom out buttons
+- Fit view to show everything on screen
+- Minimap in the corner for orientation
+
+Helpful when the flow gets wide or nodes sit off-screen.
+
+---
+
+## Running and feedback
+
+### Run
+
+**How**
+- Click **Run** once you have at least some nodes placed.
+
+**What happens**
+- The game walks through your flow.
+- Nodes can light up in sequence.
+- Then you get either success or failure feedback.
+
+### Success
+
+You usually get:
+- a celebration message
+- stars based on speed
+- options like **Next Level** or **Levels**
+- sometimes an achievement unlock
+
+### Failure
+
+Errors are specific and practical, for example:
+- missing a required step
+- missing a required connection
+- no complete path from start to finish
+
+This is one of the best parts of the interaction: the game usually tells you *what* is wrong, not just “try again.”
+
+---
+
+## Hints
+
+**How**
+- Click **Hints**
+- Use **Get another hint** for more
+
+**How they work**
+- Hints come out step by step (not all at once).
+- Early hints are gentle (“start with a Timer”).
+- Later hints basically spell out the solution.
+
+**Tradeoff**
+- Hints help learning.
+- Completing a level without hints can unlock a “Solo Player” style achievement.
+
+---
+
+## Node properties (settings)
+
+Some nodes have a small **gear** icon.
+
+### What the gear does today
+
+- Opens a small expanded section on the node
+- Shows current settings as plain text
+  Example: `duration: 5s` or `interval: 1h`
+
+### Important limitation
+
+In the current free/playable experience, these settings are mostly **view-only**.
+
+That means:
+- nodes *have* properties under the hood
+- the gear *shows* them
+- you generally **cannot fully edit them** like a real n8n form yet
+- winning a level depends mainly on **which nodes you use and how you connect them**, not on fine-tuning those property values
+
+### Properties that exist in the game design
+
+Examples of settings the game knows about:
+
+| Step | Setting idea | Example values |
+|---|---|---|
+| Timer | How often it runs | 1 minute, 5 minutes, 1 hour, daily |
+| Wait | How long to pause | 1s, 5s, 30s, 1 minute |
+| Send Message | Message text | “Hello!” |
+| Transform | What change to apply | UPPERCASE, lowercase, reverse, count |
+| If/Else | What condition to check | hungry, raining, morning, in stock, etc. |
+| Repeat | How many times | 2, 3, 5, 10 |
+| Search | Search query | text field |
+| Notify | Title | text field |
+| Hub | What event triggers it | motion, door open, temperature |
+| Webhook | Path | `/alert` |
+| Combine | How to join data | comma, space, dash, new line |
+| Filter | What to keep | valid, urgent, correct, complete |
+
+**Practical takeaway:**
+Think of properties as “flavor + future depth + export details,” not the main free-demo puzzle mechanic.
+
+---
+
+## Different connection patterns (beyond a straight line)
+
+Free levels are mostly straight chains:
+
+> Start → Action → Action → Finish
+
+Later levels introduce richer patterns.
+
+### Branching (If/Else)
+
+Some nodes have **two exits**:
+- green path = “yes / true”
+- red path = “no / false”
+
+Example idea:
+- Check if pet is hungry
+- If yes → feed pet → complete
+- If no → complete directly
+
+This is the first big jump in interaction complexity.
+
+### Try / Catch (error recovery)
+
+Similar dual exits:
+- success path
+- error / backup path
+
+Teaches: “try this, and if it fails, do the backup plan.”
+
+### Broadcast (one-to-many)
+
+One step can send to multiple destinations at once (several outgoing points).
+
+Useful for “notify TV, phone, and archive all together” style puzzles.
+
+### Loops (Repeat)
+
+A step that means “do this several times.”
+
+Hints often say set it to 3 times for roller-coaster style levels.
+
+### Filters
+
+A step that only lets some results continue.
+
+---
+
+## Sidebar categories
+
+The left panel groups steps by role:
+
+- **Start Here** — what kicks off the automation (Trigger, Timer, Schedule, etc.)
+- **Actions** — the work (send message, cook, water plants, transform, and more)
+- **Decisions** — logic (If/Else, Filter, Broadcast, Try/Catch)
+- **Finish** — end points (Complete, Save)
+- **Timing** — waits / delays
+
+This category system is a big part of how the game teaches automation thinking.
+
+---
+
+## Level map and progression
+
+### Level select
+
+Shows:
+- level number and title
+- short description
+- difficulty (Beginner / Intermediate / Advanced)
+- completion checkmarks and stars
+- locked “Full Game” levels
+
+### Free demo vs full game
+
+- Free demo: first **3** story levels
+- Full game: all **28** story levels + Sandbox
+- Paywall appears after finishing free levels or when opening locked content
+
+### Stars
+
+Faster solutions earn better star ratings (gold / silver / bronze style thresholds).
+
+### Leaving a level
+
+If you try to leave mid-build, the game asks for confirmation so you don’t lose progress by accident.
+
+---
+
+## Supporting tools (not required to beat free levels)
+
+### Template Library
+
+- Browse ready-made example workflows
+- Search and filter by tags
+- Clicking a template loads it onto the canvas
+- Great for exploring patterns quickly
+
+### Save / Load
+
+- Save the current board with a name
+- Load previous saves
+- Auto-save exists, with restore
+- Shortcut: **Ctrl+S**
+
+### Import from n8n
+
+- Paste real n8n workflow JSON
+- Game tries to map it into Nodequest steps
+- Useful bridge from real automation tools into the game
+
+### Export to n8n
+
+- Turns your canvas into a downloadable n8n-style JSON file
+- Includes notes about how game actions map to real tools
+- Can unlock an “Exporter” achievement
+- This is where node settings matter more (they influence the exported details)
+
+### Sandbox mode (full game)
+
+- Free-build mode
+- Any node type
+- No required solution
+- Best place to experiment once unlocked
+

+## Feedback and game feel systems
+
+These don’t change the core puzzle rules, but they shape the experience:
+
+- **Fox coach** gives friendly guidance under the board
+- **Achievements** reward first clear, speed, no-hints, exporting, building lots of nodes, etc.
+- **Mute** toggles sound
+- **Run animation** makes the flow feel alive
+- **Confetti / success modal** makes wins satisfying
+- **Progress tracking** remembers completed levels and stars

+
+## What actually matters to win a level
+
+In practice, the game checks roughly this:
+
+1. Do you have the required step types?
+2. Are the required connections present (including the correct branch path when needed)?
+3. Is there a path from a start step to a finish step?
+
+It does **not** currently behave like full real-world automation where every property value must be perfect to pass free puzzles.
+
+So the winning skill is:
+
+> choose the right steps → put them in the right order → connect the right paths → run
+

+## Interaction pattern cheat sheet
+
+| Goal | Interaction |
+|---|---|
+| Add a step | Drag or click from left panel |
+| Move a step | Drag the card |
+| Connect steps | Drag right handle → left handle |
+| Branch yes/no | Use green/red exits on decision nodes |
+| Remove a step | Select node → red X |
+| Inspect settings | Gear icon (mostly view-only today) |
+| Test solution | Run |
+| Get help | Hints |
+| Start over | Reset |
+| Keep work | Save / Load |
+| Explore examples | Template Library |
+| Bring in real n8n | Import |
+| Take out to real n8n | Export |
+| Free practice | Sandbox (full game) |
+

+## Learning path by interaction type
+
+### Free levels (1–3)
+- Place nodes
+- Make straight-line connections
+- Read errors
+- Use hints
+- Learn start → action → finish thinking
+
+### Mid levels
+- Branching decisions
+- “Only do this if…” logic
+- Multiple valid-looking paths, but only one correct structure
+
+### Later levels
+- Loops
+- Multi-destination broadcast
+- Error recovery
+- Combining and filtering data
+- Bigger multi-step systems

+## Honest summary
+
+**Strong interactions**
+- Drag/drop building is clear
+- Wiring is easy to understand
+- Run + error messages are excellent teaching tools
+- Hints, stars, and achievements keep it playful
+- Save / import / export create a bridge toward real n8n
+
+**Weaker / incomplete interactions**
+- Free demo is short (3 levels)
+- Node settings look important but are mostly not editable yet
+- Later advanced patterns are locked behind purchase
+- Free levels are more “assemble the correct flow” than “repair a broken one”
+
+## One-sentence takeaway
+
+Nodequest’s core interaction is **build a flowchart of automation steps and wire them in the right order**; the deeper interactions (branches, loops, multi-outputs, imports/exports) expand that idea, while node property editing is present more as display/export detail than as the main puzzle control today.
+
+---
+
+*Based on hands-on play of the free demo plus inspection of the full level/node design. Full-game levels follow the same interaction language with more advanced node types and connection patterns.*