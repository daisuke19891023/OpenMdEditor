# 要件定義書 (AI Markdown Editor - v0.2)

**最終更新日:** 2025年4月20日

## 1. プロジェクト概要

本プロジェクトは、個人利用を主目的とした高機能Markdownエディタです。AIアシスタント機能（ドキュメント生成、編集支援）を統合し、効率的かつ快適なドキュメント作成体験を提供することを目指します。ローカル環境での動作を基本とし、下書きはローカルストレージに保存します。

## 2. 現状の技術スタック

* **フロントエンド:** React (v18+), TypeScript
* **ビルドツール:** Vite
* **UIライブラリ:** Shadcn UI (Radix UI + Tailwind CSS)
* **状態管理:** Zustand
* **エディタコア:** CodeMirror 6
* **Markdown処理:** marked, DOMPurify, highlight.js
* **差分表示:** diff
* **AI連携:** Vercel AI SDK (`ai/react`), OpenAI (GPT-4o mini想定)
* **ルーティング:** なし (単一ページアプリケーション)
* **テスト:** Vitest, React Testing Library, Cypress, Jest (API用オプション)
* **コード品質:** ESLint, Prettier
* **開発環境:** Vercel CLI (`vercel dev`) によるAPIルート含むローカル実行環境

## 3. 現在の主要機能 (v0.1.x 実装済み)

* **エディタ:** CodeMirrorベースのMarkdownエディタ（シンタックスハイライト、基本的なキーマップ、書式設定ショートカット/右クリック対応）
* **プレビュー:** リアルタイムHTMLプレビュー（`marked` + `DOMPurify` + `highlight.js`）、見出しへのID自動付与
* **レイアウト:** 分割表示モード（編集/分割/プレビュー）、リサイズ可能な目次パネル
* **ファイル操作:** ローカルストレージへの下書き管理
    * 手動保存 (`Cmd/Ctrl+S` 対応、ファイル名入力促進)
    * 自動保存 (編集後3秒)
    * 新規作成 (`Cmd/Ctrl+N` 対応)
    * 下書きリスト表示・読み込み（ツールバードロップダウン）
    * 下書き削除（確認ダイアログ付き）
    * 起動時の前回下書き自動読み込み
* **AI連携:**
    * AIチャットパネル (`useChat` フック、Shadcn `Sheet`、`Cmd/Ctrl+Enter` 送信)
    * モード切り替え（新規作成/編集）
    * バックエンドAPIルート (`/api/chat`) による連携（OpenAIまたはモック応答、ストリーミング対応）
    * AI提案プレビューダイアログ（Shadcn `Dialog`、差分表示切り替え、全体/選択範囲適用）
* **ナビゲーション:**
    * 目次表示（見出しレベルに応じたインデント、クリックでプレビューへスクロール）
    * スクロール同期（分割表示時、割合ベース）
* **UI/UX:**
    * 右クリックコンテキストメニュー（書式設定、AI編集、カット/コピー）
    * テーマ切り替え（ライト/ダーク/システム、`ThemeProvider`）
    * ステータスバー（単語数、文字数）
    * 通知機能（`sonner`）
* **開発基盤:**
    * TypeScriptによる型安全な開発
    * Viteによる高速な開発サーバーとビルド
    * ESLint/Prettierによるコード品質維持
    * Vitest/RTLによるユニット/コンポーネントテスト基盤
    * CypressによるE2Eテスト基盤
    * `vercel dev` によるAPIルート含むローカル開発環境

## 4. 今後の開発目標

* 個人利用における編集・管理・AI連携のさらなる効率化と快適性向上。
* コードの品質と保守性を維持・向上させる（テストカバレッジ向上含む）。
* 必要に応じて機能を追加し、より汎用的なMarkdownエディタとしての完成度を高める。

## 5. 追加・改善機能要件 (v0.2 以降)

以下に、Cursor Composeモードでの実装を想定した具体的な要件を記述します。

### 5.1. スクロール同期の精度向上

* **目的:** 分割ビューでのエディタとプレビュー間のスクロール追従精度を高め、ズレを軽減する。
* **動作:**
    1.  ユーザーがエディタまたはプレビューをスクロールする。
    2.  ビューポート上端（または中央）に最も近いエディタ行とプレビュー要素（特に見出し `<hN id="...">`）を特定する。
    3.  `editorStore` の `headings` 情報を活用し、エディタ行とプレビュー見出し要素のマッピングを試みる。
    4.  特定した対応要素が、もう一方のペインのビューポート上端に来るようにスクロールを実行する (`scrollIntoView()` または `scrollTop` 設定)。
    5.  スムーズスクロールを適用する。
    6.  同期ループ防止機構は維持する。
* **実装ヒント:**
    * 修正対象: `src/components/EditorLayoutContent.tsx` の同期ロジック。
    * `IntersectionObserver` を `PreviewPane` で使用し、ビューポート内の見出しを検知する。
    * CodeMirror API (`view.lineBlockAtHeight`, `view.coordsAtPos`) を利用して行とピクセル位置を相互変換する。
    * 見出しIDをキーとしてエディタ行番号とプレビュー要素を対応付けるデータ構造を検討する。
    * 割合ベースのマッピングは削除またはフォールバックとする。
* **考慮事項:** 見出し以外の要素とのマッピング精度、パフォーマンス。

### 5.2. AIプロンプトテンプレート機能

* **目的:** 定型的なAIへの指示を素早く入力する。
* **動作:**
    1.  `AiChatPanel.tsx` のチャット入力欄付近にテンプレート選択ボタン（例: Shadcn `DropdownMenu`）を追加。
    2.  クリックで定義済みテンプレートリスト（例: "校正して:", "要約して:", "翻訳して (英語):"）を表示。
    3.  選択するとテンプレートテキストが入力欄に挿入される（既存内容は上書き）。
    4.  (v0.3) テンプレートの追加・編集・削除機能。
* **実装ヒント:**
    * 修正対象: `src/components/AiChatPanel.tsx`。
    * テンプレートデータ: `src/lib/promptTemplates.ts` に定数配列として定義。将来的には `localStorage` (`storageService`) で管理。
    * UI: Shadcn `Button`, `DropdownMenu`。
    * 挿入: `useChat` の `setInput` 関数を使用。
* **考慮事項:** テンプレート管理UIの実装。

### 5.3. AIモデル/パラメータ選択・設定

* **目的:** 利用するAIモデルや生成パラメータを調整可能にする。
* **動作:**
    1.  `AiChatPanel.tsx` または設定画面にモデル選択UI（例: Shadcn `Select`）とTemperature調整UI（例: Shadcn `Slider`）を追加。
    2.  選択値はZustandストア (`aiStore` または新規ストア) に保存。
    3.  `useChat` の `body` オプション経由で選択されたモデル名・パラメータをAPIルート (`/api/chat`) に送信。
    4.  APIルート側で受け取った値を使用しOpenAI APIを呼び出す。
    5.  (v0.3) APIキーを設定画面で入力・管理できるようにする（セキュリティに十分配慮）。
* **実装ヒント:**
    * 修正対象: `src/components/AiChatPanel.tsx`, `src/store/aiStore.ts`, `api/chat/route.ts`。
    * UI: Shadcn `Select`, `Slider`。
    * 状態管理: `aiStore` に `selectedModel: string`, `temperature: number` 等を追加。
* **考慮事項:** 利用可能モデルリストの管理、APIキーの安全な管理方法。

### 5.4. ファイルを開く機能のUI改善

* **目的:** 下書きリストの視認性・操作性を向上させる。
* **動作:**
    1.  ツールバーの「開く」ボタンでモーダル (Shadcn `Dialog`) またはサイドシート (Shadcn `Sheet`) を表示。
    2.  内部に下書き一覧（ファイル名、更新日時、プレビュー）を最終更新日時順に表示。
    3.  検索/フィルター入力欄を設ける。
    4.  各項目に「読み込む」「削除（確認付き）」ボタンを配置。
    5.  「読み込む」で `editorStore.loadDraft` を実行。
* **実装ヒント:**
    * 修正対象: `src/components/EditorToolbar.tsx`。新規コンポーネント `DraftListDialog.tsx`。
    * UI: Shadcn `Dialog`/`Sheet`, `Input`, `Button`, `ScrollArea`, `AlertDialog`。
    * データ取得: `storageService.getAllDrafts()`。
    * 状態管理: ダイアログ表示状態は `uiStore`、検索キーワードはローカル状態。
* **考慮事項:** 下書き数増加時のパフォーマンス。

### 5.5. クリップボードからのMarkdown貼り付け処理改善

* **目的:** コピー元の書式（特にMarkdown）を維持してエディタに貼り付けられるようにする。
* **動作:**
    1.  エディタへのペーストイベントを捕捉。
    2.  クリップボードの内容を取得 (`navigator.clipboard.readText()` / `read()`)。
    3.  内容がHTMLの場合、`turndown` 等のライブラリを使ってMarkdownに変換してからCodeMirrorに挿入する。
    4.  内容がプレーンテキストの場合、Markdown記号が含まれていればそのまま挿入、そうでなければデフォルトのペースト処理。
* **実装ヒント:**
    * 修正対象: `src/components/CodeMirrorEditor.tsx`。
    * CodeMirror の `paste` イベントハンドラまたは `EditorView.domEventHandlers`。
    * HTML to Markdown 変換ライブラリ (`turndown`, `showdown` など) の導入検討。
* **考慮事項:** HTML変換の精度、ライブラリ導入コスト。

### 5.6. 設定画面の実装

* **目的:** 各種カスタマイズ設定を集約する。
* **動作:**
    1.  ヘッダー等に設定ボタンを追加し、クリックで設定用モーダル (Dialog) を表示。
    2.  設定項目: エディタ設定 (フォントサイズ等)、テーマ、AI設定 (APIキー、モデル、Temperature)、プロンプトテンプレート管理。
    3.  設定値はローカルストレージまたはZustandストアに保存。
* **実装ヒント:**
    * 新規コンポーネント `SettingsDialog.tsx`。
    * UI: Shadcn `Dialog`, `Input`, `Select`, `Switch`, `Slider`。
    * 状態管理: 専用の `settingsStore` または既存ストアを拡張。
* **考慮事項:** APIキーの安全な保存方法（推奨しないが、個人利用なら注意喚起の上ローカルストレージも可）。

## 6. コーディング規約・スタイル

* **フォーマット:** Prettier (`.prettierrc.json` 準拠)。
* **静的解析:** ESLint (`.eslintrc.cjs` 準拠)。TypeScript `strict` モード維持。`any` 型回避。
* **命名規則:** コンポーネント: `PascalCase`, 関数/変数: `camelCase`, 型/インターフェース: `PascalCase`, 定数: `UPPER_SNAKE_CASE`。
* **インポート:** `@/` エイリアス使用。`import type` 使用。
* **コンポーネント:** 関数コンポーネント、Propsはインターフェース定義、状態管理はZustand優先、UIはShadcn UI基本。
* **コメント:** JSDoc形式推奨、`TODO:` コメント活用。

## 7. テスト要件

* **ユニットテスト (Vitest):** 新規追加/修正されるユーティリティ、ストア、フック、コンポーネントにはテストを追加・更新する。外部依存はモック化。カバレッジ向上を目指す。
* **E2Eテスト (Cypress):** 新規追加された主要なユーザーフロー（例: プロンプトテンプレート使用、改善されたファイル読み込み、設定変更）に対するテストを追加する。API応答は `cy.intercept()` でモック化する。

---
この要件定義書を基に、Cursor Composeモードで各機能の実装を進めてください。不明点があれば都度確認します。
