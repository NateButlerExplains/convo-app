# Visual Direction

## 1. Overall Design Concept

Barcelona Move Map should feel like a calm family planning table: part map, part notebook, part timeline, part shared decision journal. The design should help Nate and his wife sit together, understand the current state of the move, and decide what deserves attention next without feeling buried in tasks.

The interface should avoid the posture of a corporate admin dashboard. It should feel personal, warm, practical, and grounded in the real journey from Malden, Missouri to Barcelona around January 2027. The app is not trying to make the move look easy; it is trying to make a complex family decision feel visible, discussable, and manageable.

Core design metaphor: **a family move atlas**.

This means the product can borrow from:
- Maps: routes, landmarks, pins, distance, neighborhoods, wayfinding.
- Travel journals: dated notes, saved snapshots, reflections, questions.
- Family planning boards: next steps, shared decisions, gentle reminders.
- Financial worksheets: ranges, assumptions, confidence, source dates.

The first prototype should establish a visual system that says: "We do not know everything yet, but we can see what we know, what we are leaning toward, and what needs a conversation."

## 2. Visual Mood And Emotional Tone

The mood should be warm, calm, optimistic, and serious enough for real planning.

Desired emotional qualities:
- **Reassuring:** uncertainty is present, but organized.
- **Family-centered:** childcare, healthcare, stability, and daily life are visibly important.
- **Conversational:** sections should invite discussion, not just data entry.
- **Grounded:** budget, visas, documents, and risks should feel practical and honest.
- **Hopeful:** Barcelona should feel like a possible future home, not just a project endpoint.

Avoid:
- Generic SaaS admin aesthetics.
- Sterile white cards with blue buttons everywhere.
- Overly playful travel-app styling that trivializes immigration, money, or school decisions.
- Anxiety-inducing red-heavy risk dashboards.
- Dense spreadsheet layouts as the default experience.

The emotional center is "planning a family landing," not "managing a business migration."

## 3. Color Direction

Use a soft Mediterranean palette with enough contrast for readability and enough warmth to feel personal.

Recommended palette direction:
- **Warm paper base:** ivory, parchment, soft sand, or warm off-white for the main background.
- **Mediterranean blue:** deep muted blue for navigation, route lines, active states, and primary actions.
- **Terracotta / clay:** accents for important milestones, Barcelona warmth, and human detail.
- **Olive / sage:** confidence, readiness, completed work, family stability, healthcare/schooling cues.
- **Sea glass / pale teal:** open questions, research, and exploratory options.
- **Soft amber:** caution, needs discussion, budget uncertainty, upcoming deadlines.
- **Muted coral:** high-risk or blocked states, used sparingly.

Suggested semantic usage:
- **Ready / decided:** sage or deep green, never neon.
- **Leaning / promising:** Mediterranean blue or sea glass.
- **Needs discussion:** amber.
- **Uncertain / low confidence:** pale gray-blue with dotted borders.
- **High risk / blocked:** muted coral with calm language and mitigation nearby.
- **Archived / exported:** warm gray or ink gray.

The product should not rely on color alone. Every colored status should also have a label, icon, pattern, or short phrase.

## 4. Typography Direction

Typography should feel more editorial and personal than a default app template.

Recommended direction:
- Use a warm serif or humanist display face for major page titles and section headers.
- Pair it with a highly readable sans-serif for body text, tables, labels, and controls.
- Avoid default stacks such as Arial, Roboto, Inter, or system-only typography unless an existing implementation constraint requires them.

Good personality targets:
- Page titles should feel like chapter headings in a family planning notebook.
- Data labels should remain crisp, compact, and scannable.
- Notes, rationales, and conversation prompts should be comfortable to read aloud.

Suggested pairing style:
- **Display/header:** a literary serif or friendly slab serif with warmth.
- **Body/UI:** a humanist sans with open counters and strong numerals.
- **Numbers:** use tabular numerals for budgets, dates, and countdowns.

Typographic hierarchy should make discussion easy:
- Large plain-language page title.
- One-sentence page purpose below the title.
- Card titles written as family-relevant prompts where appropriate.
- Small metadata for confidence, date checked, source, and related items.

## 5. Layout Approach For Desktop And Mobile

### Desktop

Desktop should support side-by-side conversation. Assume Nate and his wife may be looking at the same screen together.

Recommended desktop layout:
- A stable left navigation rail or slim route sidebar.
- A warm overview header showing origin, destination, target timing, and last updated date.
- A main content area with spacious cards and clear grouping.
- A right-side "Conversation Focus" or "This Week" panel on the home page.
- Wide views such as roadmap, budget, and options should use horizontal space without becoming spreadsheets.

Desktop should prioritize:
- Comparison: options, neighborhoods, visa paths, school choices.
- Timelines: quarter-by-quarter roadmap to January 2027.
- Decision readiness: what is decided, leaning, blocked, or needs a conversation.
- Export/print review: layouts that naturally convert into family discussion snapshots.

### Mobile

Mobile should be a review and quick-reference experience, not a dense editing surface.

Recommended mobile layout:
- Top app bar with current section and quick access to the home overview.
- Bottom navigation for the most-used sections if implementation allows.
- Cards stacked vertically with strong section labels.
- Timeline becomes a vertical route.
- Tables become grouped cards with the most important fields first.
- Comparison views become swipeable option cards or collapsible sections.

Mobile should prioritize:
- Checking the next task or document.
- Reviewing a budget range.
- Reading open questions before a conversation.
- Capturing or reviewing an idea.
- Looking up decision rationale.

Do not make mobile feel like a shrunken desktop dashboard. It should feel like a pocket move notebook.

## 6. Navigation Model

Use a navigation model based on the journey and the planning objects.

Recommended primary sections:
- **Home:** current move readiness and conversation focus.
- **Roadmap:** route from now to January 2027.
- **Budget:** estimated, planned, actual, and confidence ranges.
- **Decisions:** what has been proposed, leaned toward, decided, or needs revisiting.
- **Options:** visas, neighborhoods, housing, schools, insurance, travel approaches.
- **Tasks:** practical next steps grouped by planning track.
- **Risks:** uncertainties, warning signs, mitigations, professional-advice flags.
- **Documents:** paperwork, due dates, expiration windows, apostille/translation needs.
- **Ideas:** conversation prompts, loose questions, family preferences.
- **Snapshots:** exports, print packets, dated planning state.

Navigation should make the sections feel connected rather than isolated. Each object card should include small related links where useful:
- A budget item can link to a risk or source.
- A decision can link to compared options and revisit date.
- A task can link to a document or milestone.
- A risk can link to mitigation tasks and professional-advice flags.
- A snapshot can show which decisions, budget assumptions, and open questions were captured.

Use labels that are plain enough for family conversation. Prefer "Snapshots" over "Reports" and "Ideas" over "Backlog" in user-facing navigation.

## 7. Key Dashboard Cards Or Sections

The home page should be a calm briefing, not a wall of metrics.

Recommended home cards:

### Move At A Glance

Shows:
- Malden, Missouri to Barcelona, Spain.
- Target timing: January 2027.
- Household: Nate, wife, three-year-old child.
- Last updated date.
- Latest snapshot date.

Visual idea: a simple route line from "Malden" to "Barcelona" with January 2027 as the destination marker.

### Readiness By Track

Shows planning tracks such as visa, budget, housing, healthcare, childcare/schooling, documents, travel, and arrival setup.

Each track should show:
- Readiness status.
- Confidence level.
- Open decisions count.
- Next action.

This should not imply false precision. Use bands like "early research," "taking shape," "ready to decide," and "decided for now" instead of numerical scores unless the logic is transparent.

### Conversation Focus

A short curated list of the best discussion prompts for the next family conversation.

Examples:
- "Which visa path should we research first with professional help?"
- "What monthly rent range would feel safe for our family?"
- "What matters most in a Barcelona neighborhood with a young child?"

This is one of the most important cards for making the app feel family-oriented.

### Top Open Decisions

Shows the decisions most in need of attention.

Each item should include:
- Status: proposed, leaning, decided, revisiting.
- Who needs to agree.
- Revisit date if applicable.
- Related options.

### Budget Range Snapshot

Shows budget as ranges and assumptions rather than single overconfident numbers.

Include:
- One-time move cost range.
- Monthly living cost range.
- Emergency buffer target.
- Low-confidence categories.
- Last date checked.

### Next Practical Steps

Shows a short list of near-term tasks grouped by owner or planning track.

Keep this small. The home page should answer "what should we do next?" not display every task.

### Key Risks With Mitigations

Shows the highest-priority risks with calm mitigation language.

Example display pattern:
- Risk: "Visa path may not match income/work model."
- Why it matters: "Could affect timeline and budget."
- Next calming action: "List income assumptions and ask an immigration professional."

### Document Timing Watch

Shows document deadlines, issue/expiration windows, apostille/translation needs, and owner.

This card should make paperwork feel scheduled rather than scattered.

### Latest Snapshot

Shows the latest exported planning state and a button to create or print the next snapshot.

The snapshot card reinforces that the plan can change over time and those changes can be preserved.

## 8. Showing Uncertainty, Confidence, And Decision Readiness

Uncertainty should be visible, calm, and actionable.

### Confidence

Represent confidence as a combination of label, color, and texture:
- **Low confidence:** dotted outline, pale blue-gray, label "early estimate" or "needs source."
- **Medium confidence:** dashed or partial fill, sea glass or amber, label "some research."
- **High confidence:** solid outline, sage, label "source checked" or "ready for planning."

For budgets, show ranges first. A low/high estimate communicates uncertainty better than a single number.

### Decision Readiness

Use a readiness ladder:
- **Open question:** needs framing.
- **Options listed:** choices exist but are not compared.
- **Comparing:** pros, cons, cost, and risks are visible.
- **Leaning:** likely choice, still needs agreement or validation.
- **Decided for now:** chosen with rationale and revisit date.
- **Revisit:** decision may need updating.

This ladder should appear consistently in decisions, options, roadmap milestones, and home summary cards.

### Risk

Risks should never appear without mitigation or next action. A risk card should include:
- Likelihood.
- Impact.
- Trigger or warning sign.
- Mitigation.
- Owner.
- Professional-advice flag if needed.

Use coral sparingly. Most risk states can be amber, clay, or muted neutral unless something is blocked or urgent.

### Source And Date Confidence

For research-heavy areas, show:
- Source type: official, professional, community, unknown.
- Date checked.
- Professional advice required.
- Confidence label.

This is especially important for visas, healthcare, school enrollment, housing, and budgets.

## 9. Connecting Roadmap, Budget, Decisions, Options, Risks, Documents, And Exports

The app should feel like one connected planning map, not separate tabs.

Use a shared object relationship pattern:
- **Roadmap milestones** show related tasks, documents, risks, and decisions.
- **Budget items** show related assumptions, risks, source dates, and roadmap phase.
- **Decisions** show related options, rationale, approvers, and revisit dates.
- **Options** show related decision, budget impact, confidence, and risks.
- **Risks** show mitigation tasks, warning signs, related documents, and professional-advice needs.
- **Documents** show the milestone, visa path, school process, or healthcare step they support.
- **Snapshots** package the current roadmap, budget assumptions, decisions, open questions, and risks into a printable family planning artifact.

Design convention: every detailed card should have a small "Connected to" row. This row can display compact chips such as:
- Roadmap: Visa preparation.
- Decision: Choose first visa path to investigate.
- Risk: Document timing.
- Budget: Legal/visa fees.
- Snapshot: January planning review.

This makes the app feel like a web of family planning knowledge without requiring a complex graph UI in the first prototype.

## 10. Distinctive UI Ideas

### 1. The Family Route Line

A horizontal or vertical route from Malden to Barcelona anchors the home page and roadmap. Instead of a generic progress bar, the route has planning landmarks:
- Research.
- Visa path.
- Budget confidence.
- Documents.
- Housing/schools.
- Travel.
- Arrival.
- Stabilization.

Each landmark can show a readiness state. This gives the product an identity and makes progress feel like movement along a family journey.

### 2. Conversation Cards

Create cards specifically designed to be read aloud together. These are not tasks. They are prompts for Nate and his wife.

Card structure:
- Prompt.
- Why it matters for our family.
- Related options or risks.
- Decision readiness.
- Space for outcome or follow-up.

This turns the dashboard into a planning companion rather than a data repository.

### 3. Decision Postcards

Important decisions can look like saved postcards in a family move journal.

Each decision postcard includes:
- The decision title.
- Current status.
- Rationale.
- What we considered.
- Who agreed.
- Revisit date.
- Related snapshot.

The visual treatment can be warm paper, small route stamp, and subtle date mark. This makes decisions feel remembered and revisitable, not buried in a table.

## 11. First Prototype Design Acceptance Criteria

The first prototype design is acceptable when it meets these criteria:

- The home page immediately communicates that this is a private family move planner from Malden to Barcelona for January 2027.
- The visual tone feels warm, calm, and practical rather than like a generic admin dashboard.
- The app clearly supports Nate and his wife having planning conversations together.
- Roadmap, budget, decisions, options, tasks, risks, documents, ideas, and snapshots are all represented in the navigation or home overview.
- Uncertainty is visible through ranges, confidence labels, source/date metadata, and decision-readiness states.
- Risks are shown with mitigations or next actions, not as fear-inducing warnings alone.
- Budget values are shown as estimates or ranges where confidence is not high.
- Family-stability topics such as childcare, schooling, healthcare, neighborhood safety, and arrival transition are visually prominent.
- Desktop layout supports side-by-side review and comparison during shared planning conversations.
- Mobile layout supports quick review with stacked cards, vertical roadmap, and readable details.
- The design includes at least one distinctive relocation-specific element, such as the family route line, conversation cards, or decision postcards.
- Export/snapshot functionality is presented as a way to preserve the current family planning state over time.
- The design does not imply legal, visa, medical, school, tax, or financial certainty where the research is only preliminary.
- The first prototype remains local-first and does not suggest cloud accounts, public sharing, or external integrations.
- No implementation work is started as part of this design direction.

## Durable Design Conventions To Carry Forward

- Treat the product as a family move atlas, not an admin dashboard.
- Use warm, readable, print-friendly surfaces.
- Prefer plain family language over project-management jargon.
- Show confidence and source dates anywhere research or estimates could become stale.
- Show every major risk with a calming next action or mitigation.
- Keep the home page focused on conversation readiness and next practical steps.
- Make snapshots feel like dated family planning artifacts, not just technical exports.
- Preserve privacy and localhost assumptions in the interface language.
- Make child-related planning visible as a first-class concern, not a sub-note under logistics.
- Connect objects with lightweight related-item chips before introducing complex visual graphs.
