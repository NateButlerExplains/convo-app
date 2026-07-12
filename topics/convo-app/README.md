# Convo App

Topic type: product-building
Status: active, primary focus

## Current goal

Convo App is the main active project. It starts from an existing working app with a specific purpose, then becomes a general-purpose product that can be monetized for a specific audience.

Current focus:
- Understand the existing working app.
- Identify reusable core capabilities.
- Generalize the app into a broader conversation-led productivity/product platform.
- Define the monetizable audience and positioning.
- Convert planning/build conversations into structured context, tasks, skills, and useful recurring loops.

## Origin story

Convo App started as a tool for Nate and his wife to have structured conversations that move them toward their Barcelona relocation goal. It helps turn messy, emotional, practical conversations into clarity, tasks, decisions, and follow-through.

## First monetizable audience

Primary audience: couples working toward big shared life goals, especially couples planning major life transitions.

Examples:
- Moving abroad or relocating
- Buying a home
- Starting a family
- Changing careers
- Rebuilding finances
- Planning long trips
- Navigating shared goals

Possible business wedge: couples therapists, coaches, and counselors who work with couples. They could use Convo App as a between-session tool for guided conversations, shared decisions, action items, and progress tracking.

Positioning direction: Convo App helps couples turn important conversations into shared clarity and action.

## Core/reusable pieces from current app

1. Goal setup / goal page
   The app should start with a couple setting a big shared goal. AI can help generate the first version of that goal, clarify it, and break it into starter roadmap areas.

2. Goal dashboard
   After setup, they land on a dashboard for that specific goal. The dashboard shows widgets that map to the rest of the app: progress, tasks, decisions, risks, ideas, money/planning areas, documents, and next conversations.

3. Roadmap / route map
   The Barcelona route map can become a general goal roadmap. AI helps build phases, milestones, blockers, questions, risks, and next actions based on the couples goal.

4. Navigation structure
   Nate likes the existing nav menu structure. It should generalize:
   - Core: Dashboard, Conversation, Tasks, Decisions
   - Planning: goal-specific planning pages / widgets
   - Reference: Timeline, Options, Ideas, Risks, Documents, Snapshots

5. Conversation flow
   Conversation is the heart. The app records important conversations, shows a live waveform, transcribes locally, parses with AI, then archives the session.

6. Conversation-to-action
   AI turns conversations into tasks, decisions, ideas, risks, unresolved questions, notes, and follow-up prompts. Those items get routed into the right app sections automatically.

7. AI-assisted planning with guardrails
   AI can help fill out roadmap sections and planning pages, but with guardrails. It should ask clarifying questions, respect the couples stated goal/values/constraints, and avoid making life decisions for them.

8. Tracking inside the app
   Everything stays inside Convo App and remains visible/tracked: roadmap progress, tasks, decisions, risks, ideas, documents, notes, snapshots, and conversation history.

## Generalized product idea

Convo App starts with a shared goal, helps AI-generate a roadmap, gives the couple a dashboard and nav structure for the goal, then uses guided conversations to keep turning discussion into shared clarity and action.

## First generalized product slice

First slice should be an onboarding wizard: AI provider setup + shared goal setup + AI-generated dashboard/roadmap.

Wizard steps:

1. Welcome
   Explain what Convo App helps with.

2. AI setup
   Connect OpenAI and explain privacy/data use.

3. Goal intake
   Ask what couple is trying to accomplish together.

4. Context intake
   Capture who is involved, timeline, constraints, and stakes.

5. Values/priorities
   Capture what matters most to each partner.

6. AI-generated starter structure
   AI generates:
   - Goal summary
   - Roadmap phases
   - Starter planning sections
   - First conversation prompts
   - Starter tasks
   - Starter decisions
   - Starter risks
   - Starter ideas/questions

7. Review and confirm
   Couple reviews and confirms before anything becomes active.

8. Dashboard creation
   User lands in a generated dashboard for that goal, with widgets mapped to nav sections.

Existing navigation generalized:
- Core: Dashboard, Conversation, Tasks, Decisions
- Planning: AI-generated planning areas
- Reference: Timeline, Options, Ideas, Risks, Documents, Snapshots

Important guardrail: AI setup should be explicit and user-controlled. Users should know what provider they are using, where their key is stored, and what data is sent to the LLM. Start OpenAI-first, then design provider abstraction for future local/open-source/other hosted LLMs.

## Onboarding wizard UX feel

Onboarding should feel like productized coach intake.

Not dry setup checklist. Not open-ended chat.

It should feel warm, structured, and purposeful, like a good coach guiding a couple through the first intake session.

Style:
- Friendly and calm
- One focused question at a time
- Clear progress through steps
- Practical enough to finish quickly
- Emotionally aware, but not pretending to be therapy

Positioning: coach intake that creates a working plan, not a form and not a chatbot.

Guardrail: when therapists/coaches use it, this intake could become their client onboarding flow. For direct-to-couples, it should still feel safe and structured.

## Onboarding output tiers

Onboarding should create all major object types, but in compact tiers so it does not feel overwhelming.

Tier 1: required before dashboard:
- Goal
- Roadmap
- Dashboard widgets
- First conversation prompts

Tier 2: small starter planning sets:
- Tasks: 3-5 starter tasks
- Decisions: 2-3 key decisions to make
- Risks: 2-3 obvious risks/blockers
- Ideas/questions: 3-5 open ideas or questions

Tier 3: after first real conversation:
- More tasks
- More decisions
- More risks
- Notes
- Documents
- Timeline details
- Follow-up prompts

Important product rule: onboarding generates a useful first draft, not a complete plan. Couple reviews, edits, and approves before generated items become active.

Suggested first dashboard after onboarding:
- Goal summary
- Roadmap progress
- Next conversation prompt
- Starter tasks
- Key decisions
- Top risks
- Open questions/ideas

## Open questions

- What exact data model should onboarding generate for goal, roadmap, dashboard widgets, and nav sections?
- How should generated draft objects be stored before couple approval?
