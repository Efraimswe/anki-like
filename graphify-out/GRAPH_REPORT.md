# Graph Report - /home/skaylet/dev/anki-like  (2026-07-09)

## Corpus Check
- 308 files · ~209,954 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 722 nodes · 1069 edges · 85 communities (46 shown, 39 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 66 edges (avg confidence: 0.9)
- Token cost: 506,633 input · 0 output

## Community Hubs (Navigation)
- Deck & Card Pages (Frontend)
- Review API Route Handlers
- Auth Refresh & TanStack Query
- CRUD API Route Handlers
- App Dependencies
- Manual Onboarding Flow
- Speckit Agent Context Scripts
- Skill Map Zod Schemas
- TypeScript Config
- Root Layout & Providers
- Constitution Principles
- Vendor Server Tests
- Prisma Migration & Data Integrity
- Speckit Shell Helpers
- Auth Pages & App Layout
- JWT Auth Data Model
- Database Tables Schema
- Frontend Spec & Statistics
- Learning Steps & SM-2
- Vendor Test Helpers
- Backend REST Contracts
- Version Bump Script
- Graph Render Script
- Windows Lifecycle Tests
- Token Usage Analyzer
- Create Feature Script
- Vendor Package Config
- WS Protocol Tests
- Auth & Settings Spec
- Next.js Migration Decisions
- Vendor Setup Script
- Leo Mascot Branding
- Interval Hints & Review API
- JWT Security Patterns
- Superpowers Plugin
- Vendor Package Manifest
- Monorepo Restructure
- Learning Steps Spec Set
- ESLint Config
- MCP Config
- Session Start Hook
- Query Key Factory
- Next.js Middleware
- Start Server Script
- Stop Server Script
- Find Polluter Script
- Skill Tests Runner
- Doc Review Test
- Subagent Dev Test
- Subagent Integration Test
- Run All Tests
- SDD Description Test
- Extended Multiturn Test
- Haiku Test
- Multiturn Test
- Run Test Script
- Run Tests Script
- Plugin Loading Test
- Priority Test
- Tools Test
- Run All Script
- Run Test Runner
- Scaffold Script
- Test Runner Script
- Scaffold Helper
- Next.js Config
- Next Env Types
- PostCSS Config
- Reset Onboarding Script
- Prerequisites Check Script
- Setup Plan Script
- Optimistic Mutations
- LLM Tool Definitions
- Card Query Keys
- Migration Quickstart
- Migration Research
- Retention Default
- Max Interval Default

## God Nodes (most connected - your core abstractions)
1. `requireAuth()` - 24 edges
2. `jsonError()` - 23 edges
3. `compilerOptions` - 16 edges
4. `Feature Spec: Spaced Repetition Backend Service` - 14 edges
5. `fetchApi()` - 13 edges
6. `getNow()` - 12 edges
7. `Data Model: Spaced Repetition Backend` - 11 edges
8. `Skill Map (FigJam-style Hub Canvas)` - 11 edges
9. `log_info()` - 10 edges
10. `main()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `SM-2 Review Flow (US2)` --implements--> `Principle I: Algorithm Correctness (SM-2)`  [INFERRED]
  specs/001-nestjs-backend/spec.md → .specify/memory/constitution.md
- `Anki-Like README (Monorepo Overview)` --references--> `Backend/Frontend Monorepo Restructure (US1, P0)`  [INFERRED]
  README.md → specs/003-vite-react-frontend/spec.md
- `Implementation Plan: Prisma Migration` --references--> `Anki-Like Spaced Repetition System Constitution`  [EXTRACTED]
  specs/002-prisma-migration/plan.md → .specify/memory/constitution.md
- `Tasks: Spaced Repetition Backend Service` --cites--> `Principle III: Test-First`  [EXTRACTED]
  specs/001-nestjs-backend/tasks.md → .specify/memory/constitution.md
- `Decision R5: Interactive Transactions for Review Submission` --implements--> `Principle IV: Data Integrity`  [INFERRED]
  specs/002-prisma-migration/research.md → .specify/memory/constitution.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **SM-2 Spaced Repetition Scheduling Pipeline** — _specify_memory_constitution_algorithm_correctness_sm2, specs_001_nestjs_backend_research_sm2_implementation, specs_001_nestjs_backend_spec_review_flow, specs_001_nestjs_backend_data_model_card_states_table [EXTRACTED 1.00]
- **Six-Table PostgreSQL Schema (Raw SQL and Prisma Representations)** — specs_001_nestjs_backend_data_model_decks_table, specs_001_nestjs_backend_data_model_cards_table, specs_001_nestjs_backend_data_model_card_states_table, specs_001_nestjs_backend_data_model_review_logs_table, specs_001_nestjs_backend_data_model_daily_limits_table, specs_001_nestjs_backend_data_model_daily_counters_table, specs_002_prisma_migration_data_model_prisma_schema [EXTRACTED 1.00]
- **Card Lifecycle State Machine (New/Learning/Review/Relearning)** — specs_001_nestjs_backend_spec_card_lifecycle, specs_001_nestjs_backend_research_lifecycle_transitions, specs_001_nestjs_backend_data_model_card_lifecycle_state_machine [EXTRACTED 1.00]
- **SM-2 Learning Steps Scheduling Flow** — specs_004_anki_learning_steps_spec_learning_steps, specs_004_anki_learning_steps_data_model_cardstate, specs_004_anki_learning_steps_data_model_learning_steps_config, specs_004_anki_learning_steps_plan_sm2_service, specs_004_anki_learning_steps_spec_interval_hints [INFERRED 0.85]
- **JWT Auth Token Lifecycle (cookies, CSRF, sessions)** — specs_005_jwt_auth_settings_spec_jwt_authentication, specs_005_jwt_auth_settings_research_httponly_cookie_tokens, specs_005_jwt_auth_settings_research_csrf_double_submit, specs_005_jwt_auth_settings_data_model_session [INFERRED 0.85]
- **NestJS-to-Next.js Migration Technology Stack** — specs_006_nextjs_fullstack_migration_spec_nextjs_fullstack_migration, specs_006_nextjs_fullstack_migration_research_route_handlers, specs_006_nextjs_fullstack_migration_research_jose_jwt, specs_006_nextjs_fullstack_migration_research_zod_validation, specs_006_nextjs_fullstack_migration_research_prisma_singleton, specs_006_nextjs_fullstack_migration_research_vitest_playwright [INFERRED 0.85]
- **Silent Auth Refresh Mechanism** — specs_007_tanstack_query_auth_migration_research_refresh_lock, specs_007_tanstack_query_auth_migration_research_proactive_refresh_timer, specs_007_tanstack_query_auth_migration_research_token_expiry_cookie, specs_007_tanstack_query_auth_migration_plan_middleware_inline_refresh, specs_007_tanstack_query_auth_migration_contracts_query_api_auth_refresh_contract [EXTRACTED 1.00]
- **AI Onboarding Chat Flow (Steps 2-3)** — specs_008_onboarding_flow_spec_onboarding_flow, specs_008_onboarding_flow_contracts_onboarding_api_assesslevel_tool, specs_008_onboarding_flow_contracts_onboarding_api_extractgoals_tool, specs_008_onboarding_flow_research_streaming_chat_route_pattern, specs_008_onboarding_flow_research_usechat_hook_pattern [INFERRED 0.85]
- **Custom LLM Engine Stack** — specs_009_custom_llm_toolcall_tasks_llm_client_module, specs_009_custom_llm_toolcall_research_sse_streaming_openai_compatible, specs_009_custom_llm_toolcall_research_server_side_tool_call_loop, specs_009_custom_llm_toolcall_research_plain_text_streaming, specs_009_custom_llm_toolcall_research_usellmchat_hook [EXTRACTED 1.00]
- **Manual Onboarding Four-Step Flow (localStorage draft to single commit)** — specs_010_manual_onboarding_llm_spec_cefr_level_scale, specs_010_manual_onboarding_llm_spec_goals_payload, specs_010_manual_onboarding_llm_plan_onboarding_draft, specs_010_manual_onboarding_llm_plan_atomic_complete_endpoint [INFERRED 0.85]
- **Skill Map Autosave Persistence Pipeline (reducer to debounced PUT to Prisma)** — specs_011_skill_map_canvas_data_model_doc_reducer, specs_011_skill_map_canvas_research_autosave_debounce, specs_011_skill_map_canvas_contracts_api_map_api_map_contract, specs_011_skill_map_canvas_data_model_skillmap_model [INFERRED 0.85]

## Communities (85 total, 39 thin omitted)

### Community 0 - "Deck & Card Pages (Frontend)"
Cohesion: 0.07
Nodes (44): DeckDetailPage(), DeckWithCards, DeckData, DeckListPage(), NODE_ICONS, OFFSETS, RING_COLOR, VARIANTS (+36 more)

### Community 1 - "Review API Route Handlers"
Cohesion: 0.09
Nodes (39): cardSelect, GET(), POST(), RATING_MAP, addMinutes(), dayKey(), endOfDay(), startOfDay() (+31 more)

### Community 2 - "Auth Refresh & TanStack Query"
Cohesion: 0.05
Nodes (45): Auth Refresh Contract (attemptRefresh / getTokenExpiry), Proactive Refresh Timer Contract, Auth Client Module (src/lib/auth-client.ts), Middleware Inline Refresh, TanStack Query Migration + Silent Auth Refresh Plan, TanStack Query Migration Quickstart, Proactive Refresh at 80% Token Lifetime, QueryClient isServer Singleton Pattern (+37 more)

### Community 3 - "CRUD API Route Handlers"
Cohesion: 0.13
Nodes (33): DELETE(), PATCH(), POST(), DELETE(), GET(), PATCH(), GET(), POST() (+25 more)

### Community 4 - "App Dependencies"
Cohesion: 0.05
Nodes (40): dependencies, @clerk/nextjs, gsap, lucide-react, next, @prisma/client, react, react-dom (+32 more)

### Community 5 - "Manual Onboarding Flow"
Cohesion: 0.08
Nodes (36): POST /api/onboarding/complete Atomic Commit, i18n Short-Circuit to English on /onboarding/*, localStorage-First Onboarding with Single HTTP Commit, Onboarding Draft (readDraft/writeDraft/clearDraft), 13-Item CEFR Level Scale (LevelChoice), Dead-Code Cleanup of LLM Chat Stack, GoalsPayload, Manual Onboarding (no LLM) (+28 more)

### Community 6 - "Speckit Agent Context Scripts"
Cohesion: 0.23
Nodes (15): create_new_agent_file(), log_error(), log_info(), log_success(), log_warning(), main(), parse_plan_data(), print_summary() (+7 more)

### Community 7 - "Skill Map Zod Schemas"
Cohesion: 0.09
Nodes (21): BaseNode, EdgeSchema, finite, GetMapResponseSchema, NodeSchema, nonNegFinite, PutMapResponseSchema, SHAPE_FILL (+13 more)

### Community 8 - "TypeScript Config"
Cohesion: 0.10
Nodes (19): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+11 more)

### Community 9 - "Root Layout & Providers"
Cohesion: 0.13
Nodes (14): metadata, nunito, getQueryClient(), makeQueryClient(), Providers(), ACCENT, ICONS, ToastContext (+6 more)

### Community 10 - "Constitution Principles"
Cohesion: 0.17
Nodes (17): Principle I: Algorithm Correctness (SM-2), Anki-Like Spaced Repetition System Constitution, Principle V: Critical Path UX, Principle II: Offline-First, Principle VI: Simplicity, Principle III: Test-First, Spec Quality Checklist: 001 Backend, Card Lifecycle State Machine (+9 more)

### Community 11 - "Vendor Server Tests"
Cohesion: 0.18
Nodes (15): assert, cleanup(), CONTENT_DIR, fetch(), fs, http, path, runTests() (+7 more)

### Community 12 - "Prisma Migration & Data Integrity"
Cohesion: 0.16
Nodes (14): Principle IV: Data Integrity, anki-like Development Guidelines (CLAUDE.md), Spec Quality Checklist: 002 Prisma Migration, Prisma Schema (6 models, 1:1 with existing tables), Implementation Plan: Prisma Migration, Decision R5: Interactive Transactions for Review Submission, Decision R3: Introspect Existing DB (prisma db pull), Decision R4: Preserving PostgreSQL-Specific Features (+6 more)

### Community 13 - "Speckit Shell Helpers"
Cohesion: 0.15
Nodes (3): get_feature_paths(), has_git(), common.sh script

### Community 14 - "Auth Pages & App Layout"
Cohesion: 0.19
Nodes (4): NAV_ITEMS, Props, Owl(), OwlProps

### Community 15 - "JWT Auth Data Model"
Cohesion: 0.19
Nodes (13): REST API Contract: Auth, Users & Sessions, Data Model: JWT Auth, Settings & Navigation, Session Entity, User Entity, User Data Scoping via Deck, Implementation Plan: JWT Auth, Settings & Navigation, Destructive Auth Migration, Research: JWT Auth, Settings & Navigation (+5 more)

### Community 16 - "Database Tables Schema"
Cohesion: 0.23
Nodes (12): card_states table, cards table, daily_counters table, daily_limits table, Data Model: Spaced Repetition Backend, decks table, SQL Migration Strategy (numbered files + schema_migrations), review_logs table (+4 more)

### Community 17 - "Frontend Spec & Statistics"
Cohesion: 0.17
Nodes (12): Decision R7: Statistics Time Range, SM-2 Review Flow (US2), Study Statistics (US5), Spec Quality Checklist: 003 Frontend, Plan 003 (Unfilled speckit Template), Quickstart: Vite React Frontend, Decision R2: Vite 6 + React 19 + React Router 7 + TailwindCSS 4, Deck Management UI (US2) (+4 more)

### Community 18 - "Learning Steps & SM-2"
Cohesion: 0.24
Nodes (11): CardState (extended with learningStep), Data Model: Learning Steps, Learning Steps Config, ReviewsService (backend/src/reviews/reviews.service.ts), SM-2 Spaced Repetition Algorithm, SM2Service (backend/src/reviews/sm2.service.ts), Graduating Interval Defaults, Minute-Based Interval Storage (+3 more)

### Community 20 - "Backend REST Contracts"
Cohesion: 0.24
Nodes (10): REST API Contracts (/api/v1), Quickstart: Spaced Repetition Backend, Decision R2: Raw SQL with node-postgres (pg), Decision R5: Reverse Card Strategy, Card (Entity), Deck (Entity), Quickstart: Prisma Migration Validation, Frontend API TypeScript Interfaces (+2 more)

### Community 21 - "Version Bump Script"
Cohesion: 0.39
Nodes (5): cmd_audit(), cmd_bump(), cmd_check(), bump-version.sh script, write_json_field()

### Community 22 - "Graph Render Script"
Cohesion: 0.33
Nodes (8): combineGraphs(), { execSync }, extractDotBlocks(), extractGraphBody(), fs, main(), path, renderToSvg()

### Community 23 - "Windows Lifecycle Tests"
Cohesion: 0.36
Nodes (6): fail(), http_check(), pass(), windows-lifecycle.test.sh script, skip(), wait_for_server_info()

### Community 24 - "Token Usage Analyzer"
Cohesion: 0.36
Nodes (7): analyze_main_session(), calculate_cost(), format_tokens(), main(), Analyze a session file and return token usage broken down by agent., Format token count with thousands separators., Calculate estimated cost in dollars.

### Community 26 - "Vendor Package Config"
Cohesion: 0.29
Nodes (6): dependencies, ws, name, scripts, test, version

### Community 27 - "WS Protocol Tests"
Cohesion: 0.33
Nodes (6): assert, crypto, path, runTests(), SERVER_PATH, RFC-6455

### Community 28 - "Auth & Settings Spec"
Cohesion: 0.29
Nodes (7): Spec Quality Checklist: JWT Auth, Settings & Navigation, Server-Stored Theme Preference, Cards Section (global card list), Feature Specification: JWT Auth, Settings & Navigation, Persistent Navigation Bar, Session Management (view/revoke), Settings: Profile and Theme

### Community 29 - "Next.js Migration Decisions"
Cohesion: 0.29
Nodes (7): Spec Quality Checklist: Next.js Fullstack Migration, Prisma Client Singleton Pattern, Route Handlers Replace NestJS Controllers, Vitest + Playwright Testing Strategy, Zod Request Validation, Feature Specification: Migrate to Next.js Fullstack App, Next.js Fullstack Migration

### Community 30 - "Vendor Setup Script"
Cohesion: 0.33
Nodes (4): HOME, OPENCODE_CONFIG_DIR, setup.sh script, XDG_CONFIG_HOME

### Community 31 - "Leo Mascot Branding"
Cohesion: 0.40
Nodes (6): Character Neutral Smile Variant (public/characterneutralsmile.png), English Learning App Branding, Fluffy Yellow Creature Design, Friendly Childlike Storybook Art Style, Leo Mascot Illustration, Onboarding UI Mascot Usage

### Community 32 - "Interval Hints & Review API"
Cohesion: 0.33
Nodes (6): API Contract: Review Endpoints (Learning Steps), Quickstart: Testing Learning Steps, Server-Side Interval Hint Calculation, Interval Hints, Implementation Plan: Migrate to Next.js Fullstack App, Tasks: Migrate to Next.js Fullstack App

### Community 33 - "JWT Security Patterns"
Cohesion: 0.47
Nodes (6): Quickstart: JWT Auth, Settings & Navigation, bcrypt Password Hashing (cost 12), CSRF Double-Submit Cookie Pattern, HttpOnly Cookie Token Storage, JWT Authentication (email/password), jose JWT + Next.js Middleware Auth

### Community 34 - "Superpowers Plugin"
Cohesion: 0.60
Nodes (4): __dirname, extractAndStripFrontmatter(), normalizePath(), SuperpowersPlugin()

### Community 35 - "Vendor Package Manifest"
Cohesion: 0.40
Nodes (4): main, name, type, version

### Community 36 - "Monorepo Restructure"
Cohesion: 0.40
Nodes (5): Anki-Like README (Monorepo Overview), Decision R5: Backend CORS for Frontend Dev Origin, Decision R4: git mv Backend Restructure, Decision R1: Two Independent package.json (No Monorepo Tool), Backend/Frontend Monorepo Restructure (US1, P0)

### Community 37 - "Learning Steps Spec Set"
Cohesion: 0.60
Nodes (5): Spec Quality Checklist: Anki-Like Learning Steps & Interval Hints, Implementation Plan: Anki-Like Learning Steps & Interval Hints, Research: Anki-Like Learning Steps, Feature Specification: Anki-Like Learning Steps & Interval Hints, Tasks: Anki-Like Learning Steps & Interval Hints

### Community 39 - "ESLint Config"
Cohesion: 0.50
Nodes (3): compat, __dirname, __filename

### Community 40 - "MCP Config"
Cohesion: 0.50
Nodes (3): npx, playwright, @playwright/mcp

### Community 43 - "Query Key Factory"
Cohesion: 0.67
Nodes (3): Standard Query Options Contract, Query Key Taxonomy, Query Key Factory Pattern

## Ambiguous Edges - Review These
- `009 Plan (Unfilled Template)` → `Custom LLM Engine Tasks`  [AMBIGUOUS]
  specs/009-custom-llm-toolcall/tasks.md · relation: references
- `Dead-Code Cleanup of LLM Chat Stack` → `streamLLMCompletion SSE Helper`  [AMBIGUOUS]
  specs/012-fairy-tales/plan.md · relation: conceptually_related_to
- `Leo Mascot Illustration` → `Character Neutral Smile Variant (public/characterneutralsmile.png)`  [AMBIGUOUS]
  public/leo.png · relation: variant_of

## Knowledge Gaps
- **220 isolated node(s):** `__dirname`, `name`, `version`, `type`, `main` (+215 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **39 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `009 Plan (Unfilled Template)` and `Custom LLM Engine Tasks`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `Dead-Code Cleanup of LLM Chat Stack` and `streamLLMCompletion SSE Helper`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Leo Mascot Illustration` and `Character Neutral Smile Variant (public/characterneutralsmile.png)`?**
  _Edge tagged AMBIGUOUS (relation: variant_of) - confidence is low._
- **Why does `prisma` connect `App Dependencies` to `CRUD API Route Handlers`?**
  _High betweenness centrality (0.030) - this node is a cross-community bridge._
- **What connects `__dirname`, `name`, `version` to the rest of the system?**
  _260 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Deck & Card Pages (Frontend)` be split into smaller, more focused modules?**
  _Cohesion score 0.06768905341089371 - nodes in this community are weakly interconnected._
- **Should `Review API Route Handlers` be split into smaller, more focused modules?**
  _Cohesion score 0.09071117561683599 - nodes in this community are weakly interconnected._