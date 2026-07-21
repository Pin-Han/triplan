# Travel Agent Orchestrator — 專案主索引

> **一句話定位**：用 Google A2A Protocol 打造的多 Agent 旅遊規劃系統，展示 Agent 如何依賴排序、跨協議協作。

---

## 系統架構總覽

```
使用者（React Web UI :5173）
      ↓ A2A JSON-RPC 2.0
Orchestrator Agent（:3000）
  ├── Agentic Loop（LLM tool use 驅動 dispatch）
  ├── 依序呼叫三個 Sub-agent（Attractions → Accommodation → Transportation）
  ├── 整合結果（LLM synthesis）
  └── Graceful degradation（Sub-agent 失敗時直接 LLM 回應）
      │
      ├──[A2A Protocol]──▶ Attractions Agent（:3001）
      │
      ├──[A2A Protocol]──▶ Accommodation Agent（:3002）
      │
      └──[A2A Protocol]──▶ Transportation Agent（:3003）
```

### 雙模式運作

每個 Sub-agent 支援兩種模式（環境變數切換）：
- `api` 模式（預設）：Orchestrator 直接用 LLM 處理，不需啟動獨立 Sub-agent process
- `a2a` 模式：啟動獨立 Sub-agent process，透過 A2A JSON-RPC 2.0 通訊

---

## 目前進度

| Phase | 內容 | 狀態 |
|-------|------|------|
| 0 | 基礎清理（移除 Metrio AI，換 Anthropic SDK，建 llmClient 抽象層） | ✅ 完成 |
| 1 | 真實 A2A Sub-agents（獨立 process，各有 agent-card、health endpoint） | ✅ 完成 |
| 2 | 網頁對話介面（React + Vite + Tailwind，Chat + Settings 頁面） | ✅ 完成 |
| 3 | Multi-provider 支援（Gemini + Anthropic，前端可選） | ✅ 完成 |
| 4 | MCP 工具整合（Tavily Search — Attractions + Accommodation + Transportation） | ✅ 完成 |
| 5 | Streaming 支援（SSE 串流，即時顯示 Agent 進度） | ✅ 完成 |
| 6 | Transportation Agent（:3003）+ 意圖確認（classifyRequest）+ Prompt 改為 .md 檔 | ✅ 完成 |
| 7 | 可靠性強化（LLM + A2A retry with exponential backoff；agentRegistry 改用 promptStore） | ✅ 完成 |
| 8 | Agentic Orchestrator（LLM tool use 驅動 dispatch；見 docs/08-agentic-orchestrator.md） | ✅ 完成 |
| 9 | Polish & 展示準備（前端 UX、錯誤訊息、README Mermaid 圖、Troubleshooting） | ✅ 完成 |
| 10 | Evaluator Agent（獨立 LLM 對草稿打分；score < 7 附 feedback 重新規劃，最多 2 輪；見 docs/10-evaluator-parallel.md） | ✅ 完成 |
| 11 | User Memory Agent（跨 session 偏好記憶；見 docs/11-user-memory.md） | ✅ 完成 |
| 12 | UX 優化（單行進度、耗時顯示、Log 頁面、獨立記憶萃取；見 docs/12-ux-optimization.md） | ✅ 完成 |
| 13 | Orchestrator 對話流程優化（Prompt-only；見 docs/14-product-evolution.md） | ✅ 完成 |
| 14 | 結構化輸出 + Schema Sensor（Agent 輸出 JSON；硬性驗證；地圖/匯出/精煉的基礎；見 docs/14-product-evolution.md） | ✅ 完成 |
| 15 | 預算計算（結構化費用明細；超出預算 Sensor；Budget Bar UI；見 docs/15-budget-calculation.md） | ✅ 完成 |
| 16 | 地圖視覺化 + 行程匯出（Mapbox 互動地圖、.ics 行事曆、PDF；見 docs/16-map-export.md） | ✅ 完成 |
| 17 | 多輪精煉（PlanState + 修改意圖分類；局部更新不重做全程；見 docs/17-plan-refinement.md） | ⬜ 未開始 |
| 18 | 情境感知（天氣/假日/簽證/安全警示；Context Agent parallel 執行；見 docs/18-context-awareness.md） | ⬜ 未開始 |
| 19 | 三輪確認對話流程（行程 → 住宿 → 交通分輪確認；Prompt-only；見 docs/19-conversation-flow.md） | ✅ 完成 |
| 20 | PDF 行程匯出（一鍵下載排版 PDF；jsPDF + html2canvas；見 docs/20-pdf-export.md） | ⬜ 未開始 |
| 21 | 多城市串聯行程（2–4 城市分段規劃 + 城市間交通；見 docs/21-multi-city.md） | ⬜ 未開始 |
| 22 | 旅途中即時輔助（即時模式偵測；導航/天氣/緊急查詢；見 docs/22-realtime-assistant.md） | ⬜ 未開始 |

---

## 已完成功能細節

### Phase 0：基礎架構
- `src/services/llmClient.ts`：`AnthropicClient` / `GeminiClient` / `createLLMClient(provider?)` factory
- `src/services/promptStore.ts`：讀 `docs/prompts/*.md`，每次 call 重新讀檔（multi-process 共享）
- `.env.example`：`ANTHROPIC_API_KEY`、`GEMINI_API_KEY`、`LLM_PROVIDER`、`TAVILY_API_KEY`

### Phase 1：A2A Sub-agents
- `src/servers/attractionsServer.ts`：Express :3001，A2A routes + `/health`
- `src/servers/accommodationServer.ts`：Express :3002，A2A routes + `/health`
- `src/agents/attractionsAgent.ts` / `accommodationAgent.ts`：實作 `AgentExecutor`
- `src/agents/orchestratorExecutor.ts`：並行呼叫、健康檢查、graceful degradation
- `src/services/agentRegistry.ts`：`api` 模式走直接 LLM，`a2a` 模式走 JSON-RPC 2.0

### Phase 2：Web UI
- `web/` 獨立前端（React + Vite + Tailwind + React Router）
- `web/src/pages/ChatPage.tsx`：對話介面，讀 localStorage prompt + provider 一起送出
- `web/src/pages/SettingsPage.tsx`：Prompt 編輯 + AI 提供商選擇，存 localStorage
- `web/vite.config.ts`：Proxy `/api`, `/message` → `http://localhost:3000`

### Phase 3：Multi-provider
- `LLM_PROVIDER` 環境變數控制後端預設
- 前端設定頁選擇 provider → 隨請求 metadata 傳給後端 → 各 agent 用 `createLLMClient(provider)` 建 client
- A2A 模式下 provider 透過 message metadata 傳遞給 sub-agent

---

## 啟動指令

```bash
cp .env.example .env      # 填入 API key
npm install
cd web && npm install && cd ..

npm run dev:all    # 同時啟動 orchestrator(:3000) + agents(:3001,:3002) + web(:5173)
npm run dev:agents # 只啟動後端三個 process（不含前端）
npm run kill-ports # 清掉佔用 3000/3001/3002/5173 的 process
```

環境變數說明：
- `ATTRACTIONS_MODE=a2a` + `ACCOMMODATION_MODE=a2a` + `TRANSPORTATION_MODE=a2a`：啟用真實 A2A 協議模式
- 預設 `api` 模式，不需啟動 sub-agent process 也能跑
- `LLM_PROVIDER=gemini`：切換為 Gemini，需設定 `GEMINI_API_KEY`

---

## Phase 4：MCP 工具整合

- `src/services/tavilyMCPClient.ts`：Singleton MCP client，`StdioClientTransport` 啟動 `tavily-mcp` process
- Attractions Agent：`TavilyMCPClient.getInstance().search(destination + " top attractions")` 搜尋真實景點
- Accommodation Agent：`TavilyMCPClient.getInstance().search("hotels near " + attractionArea)` 搜尋住宿
- Transportation Agent：`TavilyMCPClient.getInstance().search("public transit guide " + attractionArea)` 搜尋交通資訊
- Graceful fallback：`TAVILY_API_KEY` 不存在或 MCP 失敗時直接走 LLM

## Phase 5：Streaming 支援

- A2A SDK `capabilities.streaming: true` 已在 `agentCard.ts` 設定
- Frontend 改用 `method: "message/stream"` JSON-RPC
- `ChatPage.tsx` 讀 SSE 串流，每個 `status-update` 事件即時更新進度文字
- `artifact-update` 事件取得最終旅遊規劃內容並顯示
- Vite proxy `/message/stream` → `http://localhost:3000/`（無 timeout，支援 SSE）

## Phase 6：Transportation Agent + 意圖確認 + Prompt .md 化

- `src/servers/transportationServer.ts`：Express :3003，A2A routes + `/health`
- `src/agents/transportationAgent.ts`：實作 `AgentExecutor`，依序接收 attractionArea + accommodationArea
- `orchestratorExecutor.ts`：新增 `classifyRequest()` — 收到訊息先確認資訊齊全再規劃；三 Agent 依序呼叫（attractions → accommodation → transportation），每步萃取 area 資訊傳遞給下一步
- `src/services/promptStore.ts` 改為讀 `docs/prompts/*.md`（attractions / accommodation / transportation / orchestrator），Settings 頁可即時覆蓋；clarify section 受保護不被 UI 覆蓋
- `package.json`：新增 `dev:transportation`、更新 `dev:all` / `dev:agents` / `kill-ports`

## Phase 9：Polish & 展示準備

- `src/agents/orchestratorExecutor.ts`：錯誤訊息全面 sanitize — agent 失敗不暴露 URL/port；loop 上限不提 turn limit；最外層 catch 回傳用戶友善訊息；token breakdown label 改為人類可讀（`Orchestrator (turn 1)` / `attractions specialist`）
- `web/src/pages/ChatPage.tsx`：重寫 loading 體驗 — `status-update` SSE 事件改為更新單一 `ProgressIndicator` 元件（✓ 已完成步驟 / → 當前步驟），不再新增多個 status 泡泡；新增 `error` role 訊息（紅色背景 + 警告 icon）；每個 agent 回覆底部加 `CopyButton`（點後顯示 "Copied ✓"）；Token 顯示改為 `Input X · Output Y tokens`；Mobile `max-w-[85%]`
- `web/src/App.tsx`：Sidebar Mobile 響應式 — `w-14 sm:w-48`，小螢幕只顯示 emoji icon，`sm:` breakpoint 才顯示文字
- `README.md`：全面重寫 — 新增 Mermaid 架構圖（GitHub 原生渲染）、Quick Demo 段落（明確測試輸入）、Phase 8 Agentic Orchestrator 說明、完整 Troubleshooting（5 個常見問題）、更新 Roadmap 至 Phase 6

## Phase 8：Agentic Orchestrator

- `src/services/llmClient.ts`：新增 tool use 型別（`ToolDefinition`, `ToolUseBlock`, `TextBlock`, `LLMContentBlock`, `ToolResultContent`, `LLMMessage`）；`LLMClient` 介面加 `completeWithTools?()`；`AnthropicClient` + `GeminiClient` 各自實作（Gemini 自動轉換 `functionDeclarations` + `functionResponse` 格式）
- `src/agents/orchestratorExecutor.ts`：完全重寫為 Agentic Loop：
  - 移除：`classifyRequest`, `callMainAgents`, `callSingleAgent`, `integrateAgentResults`, `extractTravelInfo`, `extractAttractionArea`, `extractAccommodationArea`, `generateEnhancedSummary`, `generateFallbackResponse` 等所有舊方法
  - 新增：`runAgenticLoop()`（最多 10 輪，帶 token 累加）、`buildToolDefinitions()`（`ask_user` + `call_agent`，agent enum 從 registry 動態產生）、`buildSystemPrompt()`（從 promptStore 讀取 + 動態附加 agent 描述）、`buildLLMMessages()`（A2A history → LLM 格式）、`publishAskUser()` / `publishFinalPlan()` 等
  - LLM 自主決定：呼叫哪個 agent、順序、何時詢問使用者
- `docs/prompts/orchestrator.md`：`## system` 全面改寫，描述 tool use 工作流程和輸出格式；`integration`/`fallback`/`clarify` sections 保留但不再使用
- `src/services/promptStore.ts`：`OrchestratorPrompt` 的 `integration`/`fallback`/`clarify` 改為 optional（backward compat）
- `web/src/pages/SettingsPage.tsx`：`HIDDEN_FIELDS` 加入 `integration` / `fallback`，Settings UI 只顯示 orchestrator system prompt

## Phase 7：可靠性強化

- `src/services/llmClient.ts`：新增 `withRetry()` helper（最多 3 次，指數退避），包住 Anthropic 和 Gemini 的 API call；4xx 錯誤（auth / bad request）不重試
- `src/services/agentRegistry.ts`：新增 `fetchWithRetry()` 包住 A2A HTTP 請求（5xx 和網路錯誤重試，AbortError 不重試）；移除三個 LLM function 裡的硬編碼 prompt，改從 `promptStore.getPrompts()` 讀取，徹底消除雙 prompt 系統

## Phase 11：User Memory Agent

- `src/services/memoryService.ts`：`readMemory()` / `updateMemory()` / `clearMemory()`；JSON 儲存於 `data/memory/{userId}.json`；atomic write（tmp file + rename）；insights 上限 20 條、visitedPlaces 上限 50 筆
- `src/agents/orchestratorExecutor.ts`：注入 `MemoryService`；新增 `read_memory` tool（loop 第一步自動讀取偏好）；工具結果回傳給 LLM 作為 context
- `src/index.ts`：新增 `GET /api/memory`（讀取）/ `DELETE /api/memory`（清除）
- `web/src/pages/SettingsPage.tsx`：Memory 區塊，含「Clear my memory」按鈕
- `docs/prompts/orchestrator.md`：補充 Memory Tools 使用指引
- `data/memory/` 加入 `.gitignore`

## Phase 12：UX 優化 + 獨立記憶萃取

- `web/src/pages/ChatPage.tsx`：移除 `progressSteps[]` 堆疊，改為單行 `currentStatus` 原地替換（Claude Code 風格）；訊息底部顯示耗時（`X.Xs · Input X · Output X tokens`）；每次請求建立 `LogEntry` 存入 `localStorage["agent-logs"]`（最多 50 筆）
- `web/src/pages/LogsPage.tsx`（新建）：列出所有請求記錄（最新在前），可展開查看每步驟時間軸，含 Clear logs 按鈕
- `web/src/App.tsx`：新增 `/logs` 路由和 sidebar 📋 Logs 連結
- `docs/prompts/memory-extractor.md`（新建）：記憶萃取專屬 prompt，強調只記使用者明確說出的偏好，不推測
- `src/agents/orchestratorExecutor.ts`：移除 `update_memory` tool；新增 `extractAndSaveMemory()` 私有方法（類 Evaluator 模式，計劃完成後獨立 LLM call 萃取記憶，try/catch 失敗不影響主流程）
- `src/services/promptStore.ts`：新增 `getMemoryExtractorSystemPrompt()`

## Phase 14：結構化輸出 + Schema Sensor

- `src/services/schemaValidator.ts`（新建）：`validateAttractions()` / `validateAccommodation()` / `validateTransportation()` 各自對應 JSON schema；驗證失敗 → 重試一次（附「你的上次輸出缺少 X 欄位」feedback）；二次仍失敗 → graceful degradation（保留自由文字，log warning）
- `src/services/agentRegistry.ts`：agent API 呼叫後接 schema validation；驗證通過才回傳 `structured` 欄位；失敗時回傳 `structured: null` + 原始文字
- `docs/prompts/attractions.md`：新增 JSON schema 輸出要求（`area_summary`, `attractions[]`, `suggested_day_groupings[]`）；每個景點必填 `name`, `area`, `category`, `recommended_duration_hours`, `estimated_cost_usd`, `best_time`, `notes`
- `docs/prompts/accommodation.md`：新增 JSON schema 輸出要求（`area_summary`, `recommendations[]`）；每筆住宿必填 `name`, `area`, `price_range_usd_per_night.min/max`, `distance_to_attractions`, `booking_tip`
- `docs/prompts/transportation.md`：新增 JSON schema 輸出要求（`primary_transit`, `recommended_pass`, `key_routes[]`, `airport_transfer`）；路線必填 `from`, `to`, `method`, `duration_min`, `cost_usd`
- `docs/prompts/orchestrator.md`：說明如何用三個 agent 的結構化輸出（`structured` 欄位）合成最終規劃；包含 `map_data` 輸出格式要求（`center`, `zoom`, `markers[]`, `routes[]`）

## Phase 13：Orchestrator 對話流程優化（Prompt-only）

- `docs/prompts/orchestrator.md`：將單次完整輸出改為**三輪確認流程**
  - **Phase 1（行程確認）**：call attractions agent → 呈現 Day-by-Day 表格 → `ask_user("行程 OK？")` → 停止等待
  - **Phase 2（住宿確認）**：call accommodation agent → 呈現住宿比較表 → `ask_user("住宿選好？")` → 停止等待
  - **Phase 3（交通 + 預算）**：call transportation agent → 呈現交通路線 + 預算表格 + 實用提示 → 不再 ask_user
  - 每輪格式改用 emoji 標題（📅 🏨 🚌 💰）+ 表格為主，減少段落文字
  - LLM 透過讀對話記錄中 agent 結果是否已呈現 + 用戶是否已確認來判斷當前階段
- `README.md`：更新 "How a request flows" 為三輪流程圖，更新 Quick Demo 說明

## Phase 15：預算計算

- `src/services/budgetCalculator.ts`（新建）：
  - `calculateBudgetBreakdown(input: BudgetCalculationInput)` — 四項費用分別計算：景點門票（`estimated_cost_usd × travelers`）、住宿（取最便宜推薦選項 × `duration_days`）、餐飲（`mealCostPerPersonPerDay × travelers × duration_days`；預設 `mid-range: $45`）、市區交通（`key_routes + recommended_pass`）
  - `checkBudgetCompliance(breakdown, userBudget?)` — **硬性數字 Sensor**：超出 0-20% → `severity: "warning"`（黃色 block + 調整建議）；超出 20%+ → `severity: "error"`（紅色 block + 具體建議）；未超出 → `severity: "none"`（顯示 ✅ 符合預算）
  - 精準度三層 fallback：Phase 14 結構化欄位 → LLM 估算 → 熱門城市經驗值表
- `src/agents/orchestratorExecutor.ts`：`runAgenticLoop()` 回傳 `structuredResults` map；`publishFinalPlan()` 前呼叫 `calculateAndAppendBudget()`；`try/catch` 保護，失敗不中斷主流程
- 兩種 warning 都**不阻擋回傳**，用戶知情後自行決定是否調整

## Phase 16：地圖視覺化 + 行程匯出

- `web/src/components/MapPanel.tsx`：Leaflet + OpenStreetMap 地圖元件；接收 `MapData` props；景點用 📍（藍色 marker）、住宿用 🏨（橘色 marker）；點擊 marker 顯示 popup（名稱、費用、區域）；routes 用虛線連接景點
- `web/src/components/ExportMenu.tsx`：下拉選單 — `.ics` 行事曆匯出（`generateICS()` + `downloadFile()`）、JSON 複製（`navigator.clipboard`）
- `web/src/pages/ChatPage.tsx`：解析 `artifact.metadata.mapData`；有 `mapData` 時在右側 40% 顯示 `MapPanel`（桌面）或頂部 Chat/Map 切換按鈕（手機）；無 `mapData` fallback 純文字
- `src/agents/orchestratorExecutor.ts`：`buildMapData()` 從 `structuredResults` 抽取 lat/lng 建 markers，座標驗證（超出範圍跳過 + console.warn），自動計算 center/zoom
- 使用 Leaflet + OpenStreetMap（完全免費，無需 API key），不使用 Mapbox

## Phase 17：多輪精煉

- `src/services/planStateService.ts`（新建）：`PlanState` 完整型別（`id`, `version`, `destination`, `duration_days`, `travelers`, `budget_usd`, `start_date`, `days[]`, `accommodation`, `transportation`, `total_estimated_cost`, `map_data`, `modification_history[]`）；`planStates: Map<string, PlanState>` per-context 儲存；`rebuildMapData()` helper（住宿/景點改變時重算 map markers）
- `src/agents/orchestratorExecutor.ts`：`runAgenticLoop()` 前先呼叫 `classifyModificationIntent()`（一次輕量 LLM call，輸出 `ModificationIntent` JSON）；六種 case 分支：`new_plan`（完整三 agent 流程）/ `modify_accommodation` / `modify_attractions` / `modify_transportation`（只呼叫對應 agent，傳入現有 PlanState）/ `full_replan`（清除 State，重走完整流程）/ `question`（直接 LLM 回答，不呼叫 agent）
- `docs/prompts/orchestrator.md`：修改意圖識別規則（觸發詞對應 case）；修改回覆格式（只說「什麼改了、什麼沒變」，不重複整份行程）
- `docs/prompts/accommodation.md`：新增修改模式（`modification: true`）說明 — 只輸出住宿，不重複景點
- `docs/prompts/attractions.md`：同上，修改模式下只輸出景點，不重複其他部分
- Sensor（`PlanConsistencyValidator`）：修改後驗證 `days.length === duration_days`、每天至少一個景點、住宿欄位非 null；違反只 log warning，不阻擋回傳

## Phase 18：情境感知

- `src/services/contextAgent.ts`（新建）：
  - `ContextAgent.gather(destination, travelDates, travelers)` — `Promise.allSettled` 並行執行五個 fetch；8 秒整體 timeout（abort all，主流程繼續）
  - `fetchWeather()` — Nominatim geocoding（免費 OpenStreetMap）取得 lat/lng，呼叫 Open-Meteo API（完全免費，無 API key）；日期超過 16 天預報範圍改用 LLM 描述月份氣候
  - `fetchHolidays(countryCode)` — Nager.Date API（完全免費）；日本黃金週特殊處理（`04-29, 05-03~05-05`）；不支援的國家靜默略過
  - `fetchVisaInfo()` — Tavily 搜尋（現有 key）；LLM 從搜尋結果萃取 `{requirement, duration_days, notes}`；免簽資訊 in-memory 快取 24 小時
  - `fetchSafetyAlert()` — Tavily 搜尋台灣外交部旅遊警示；LLM 萃取警示等級 1-4
  - `resolveCountryCode()` — 目的地城市名 → ISO country code（LLM 判斷）
- `src/agents/orchestratorExecutor.ts`：`processCoordination()` 收到完整旅遊資訊後，`contextAgent.gather()` 與其他準備工作 parallel 執行；結果以 `## Current Travel Context` 區塊注入 orchestrator system prompt；`warnings[]` 非空時，最終規劃最上方顯示 ⚠️ 注意事項區塊
- Hard-coded Sensors（不走 LLM）：安全等級 4 → `⛔ 外交部建議不宜前往` 強烈警示；日本黃金週 → `⚠️ 飯店住宿費用通常為平日 2-3 倍` 警示
- `docs/prompts/orchestrator.md`：說明如何使用 `Travel Context` 區塊調整推薦（考慮天氣/假日/簽證）

---

## 關鍵設計決策

| 決策 | 原因 |
|------|------|
| `promptStore` 每次重讀 `.md` 檔 | Multi-process 架構下四個 server 共享同一份設定，避免 cache 不同步 |
| Health check 只驗 env key 存在 | 避免每次健康檢查都打真實 API（省費用） |
| `api` 模式作預設 | 只需一個 process 就能跑，降低入門門檻；`a2a` 模式用於展示完整協議流程 |
| provider 從前端 metadata 傳遞 | 讓使用者可在 UI 切換 AI 提供商，不需重啟 server |
| Settings 頁 prompt 存 localStorage | 每個使用者有獨立設定，不影響 server 上的 `.md` 預設值 |
| Retry 不重試 4xx（除 429） | Auth / bad-request 是程式錯誤，重試沒意義；429 是 rate limit 值得等 |
| CLAUDE.md 加入 .gitignore | 此檔為 AI 輔助開發用的內部索引，不對外公開 |
| Memory 用 JSON 檔案不用資料庫 | 零依賴，方便 demo 時直接看 JSON 驗證；atomic write 防止寫入中斷 |
| 記憶萃取改為獨立 LLM call（非 tool） | Orchestrator 自己決定要存什麼不穩定；獨立萃取有自己的 prompt，只記明確陳述的偏好 |
| Log 存 localStorage 不存後端 | 純前端零架構成本；重啟不影響 server；使用者可自行清除 |
| Schema validation 用自訂 checker 不用 JSON Schema library | 零額外依賴；required-field checking 已足夠；避免 schema drift |
| Validation 失敗只 retry 一次 | 兩次失敗表示 prompt 或 LLM 能力問題，繼續 retry 無意義；graceful degradation 確保不中斷主流程 |
| PlanState 存 in-memory Map 不存資料庫 | Demo 場景下 per-context 生命週期已足夠；server 重啟視為 new_plan（安全降級） |
| Budget compliance 用硬性數字比較不用 LLM 判斷 | LLM 說「符合預算」不可靠；數字計算有明確閾值（0-20% warning，>20% error），可重現且不受幻覺影響 |
| `structuredResults` 在 loop 內收集後傳出 | 各 agent 的 structuredData 在 agentRegistry 驗證後即可用，需在 call_agent 處理時側錄到 Map，迴圈結束後才能做預算計算 |
| Context Agent 8 秒 timeout + Promise.allSettled | 外部免費 API 可能慢；超時不能拖延主流程；allSettled 確保部分失敗不影響其他情境資料 |
| 情境 API 優先選免費無 key 方案 | 降低新用戶設定門檻；Open-Meteo + Nager.Date 零成本，Tavily 使用現有 key |
| Mapbox 而非 Google Maps Embed | Embed API 不支援多標記；Mapbox 免費額度（50k loads/月）對 demo 足夠；`VITE_MAPBOX_TOKEN` 未設定時 fallback 純文字，不 break 現有功能 |
| Leaflet + OpenStreetMap 而非 Mapbox | 完全免費，無需 API key；OpenStreetMap tiles 無使用限制 |
| Rate limit 用 `contextId` + `taskId` 去重 | contextId 已存在 localStorage；taskId 確保一次三 agent 呼叫只計為一次規劃 |
| Rate limit 用 in-memory Map | 零依賴；Render 重啟清空計數對 demo 無害（等同免費重置） |

## 部署（Render）

- 單一 Web Service 部署：Express 同時 serve API + `web/dist/` 靜態檔
- `render.yaml` 定義 build/start 指令和環境變數
- `src/services/rateLimiter.ts`：in-memory rate limiter，每人每天 3 次完整規劃（`DAILY_PLAN_LIMIT`）
- Rate limit 以 `contextId`（localStorage）識別用戶，以 `taskId` 去重同一次規劃的多個 `call_agent`
- Render 免費方案：閒置 15 分鐘後休眠，冷啟動 ~30 秒；無執行時間限制
