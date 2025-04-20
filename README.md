# AI Markdown Editor (OpenMdEditor)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

個人利用向けのAI機能を搭載した高機能Markdownエディタです。

## 概要

このエディタは、効率的かつ快適なドキュメント作成体験を提供することを目指しています。AIアシスタント機能（ドキュメント生成、編集支援）を統合し、ローカル環境での動作を基本としています。下書きはブラウザのローカルストレージに保存されます。

## 主な機能

*   **高機能エディタ:**
    *   CodeMirror 6 ベースのMarkdownエディタ
    *   シンタックスハイライト
    *   基本的なキーマップとショートカット (書式設定、保存、新規作成など)
    *   右クリックコンテキストメニュー (書式設定、AI編集など)
*   **リアルタイムプレビュー:**
    *   `marked` を使用したHTMLプレビュー
    *   GitHub Flavored Markdown (GFM) 準拠の見出しID生成
    *   数式、コードブロックのハイライト
    *   スクロール同期 (エディタ ↔ プレビュー)
*   **レイアウト:**
    *   3つの表示モード (編集 / 分割 / プレビュー)
    *   リサイズ可能な目次パネル
    *   目次からのプレビュー箇所へのスクロール
*   **ファイル管理 (ローカルストレージ):**
    *   下書きの手動保存 (`Cmd/Ctrl+S`)
    *   自動保存 (編集中)
    *   新規作成 (`Cmd/Ctrl+N`)
    *   下書きリスト表示・読み込み・削除
    *   起動時の前回下書き自動読み込み
*   **AI連携:**
    *   AIチャットパネル (Vercel AI SDK `useChat` 使用)
    *   AIによる文章生成・編集支援
    *   差分表示付きのAI提案プレビュー
    *   バックエンドAPIルート (`/api/chat`) によるOpenAI連携 (ストリーミング対応)
*   **UI/UX:**
    *   ライト/ダーク/システム テーマ切り替え
    *   ステータスバー (文字数、単語数)
    *   トースト通知 (`sonner`)

## 技術スタック

*   **フロントエンド:** React 18+, TypeScript
*   **UIライブラリ:** Shadcn UI (Radix UI + Tailwind CSS)
*   **状態管理:** Zustand
*   **ビルドツール:** Vite
*   **エディタコア:** CodeMirror 6
*   **Markdownパーサー:** marked, DOMPurify, highlight.js
*   **AI SDK:** Vercel AI SDK (`ai/react`), OpenAI
*   **テスト:** Vitest, React Testing Library (ユニット/コンポーネント), Playwright (E2E), Jest (API)
*   **コード品質:** ESLint, Prettier
*   **開発環境:** Vercel CLI (`vercel dev`)

## キーボードショートカット

*   **ファイル操作:**
    *   保存: `Cmd/Ctrl + S`
    *   新規作成: `Cmd/Ctrl + N`
*   **テキスト編集 (選択範囲):**
    *   太字: `Cmd/Ctrl + B`
    *   斜体: `Cmd/Ctrl + I`
    *   インラインコード: `Cmd/Ctrl + E`
    *   取り消し線: `Cmd/Ctrl + Shift + X` (※ 環境により競合する場合あり)
    *   リンク挿入: `Cmd/Ctrl + K`
*   **ブロック編集:**
    *   箇条書きリスト切り替え: `Cmd/Ctrl + L`
    *   引用切り替え: `Cmd/Ctrl + '`
    *   コードブロック切り替え: `Cmd/Ctrl + Alt + C`
*   **UI:**
    *   AIチャットパネル開閉: `Cmd/Ctrl + .`
    *   表示モード切り替え (編集/分割/プレビュー): `Cmd/Ctrl + Alt + 1/2/3`

## 環境構築

1.  **Node.js:** v18以上をインストールしてください。
2.  **リポジトリのクローン:**
    ```bash
    git clone <repository-url> # TODO: 正しいURLに置き換えてください
    cd OpenMdEditor
    ```
3.  **依存関係のインストール:**
    ```bash
    npm install
    # または yarn install
    ```
4.  **Playwright用ブラウザのインストール:**
    E2Eテスト (`npm run test:e2e`) を実行するには、Playwrightが必要とするブラウザをインストールする必要があります。
    ```bash
    npx playwright install --with-deps
    # --with-deps はLinux環境等で必要な依存関係も一緒にインストールします
    ```
5.  **環境変数の設定:**
    *   プロジェクトルートにある `.env.example` をコピーして `.env` ファイルを作成します。
    *   `.env` ファイルを開き、必要な環境変数を設定します。最低限、OpenAI APIキー (`OPENAI_API_KEY`) が必要です。
    ```plaintext
    # .env
    OPENAI_API_KEY="sk-..."
    # OPENAI_API_MODEL="gpt-4o-mini" # オプション: 使用するモデルを指定
    ```
6.  **開発サーバーの起動:**
    *   **Vite開発サーバー (フロントエンドのみ):**
        ```bash
        npm run dev
        ```
        ブラウザで `http://localhost:5173` (デフォルト) を開きます。API機能は利用できません。
    *   **Vercel開発サーバー (フロントエンド + API):**
        ```bash
        npm run dev:vercel
        ```
        Vercel CLI がインストールされていない場合は、`npm install -g vercel` でインストールしてください。
        ブラウザで `http://localhost:3000` (デフォルト) を開きます。AI連携機能を含むすべての機能が利用可能です。

## 利用可能なスクリプト

*   `npm run dev`: Vite開発サーバーを起動します (HMR対応)。
*   `npm run dev:vercel`: Vercel開発サーバーを起動します (APIルート含む)。
*   `npm run build`: プロダクション用にプロジェクトをビルドします。
*   `npm run preview`: ビルドされたファイルをプレビューします。
*   `npm run lint`: ESLintでコードをチェックします。
*   `npm run lint:fix`: ESLintで修正可能な問題を自動修正します。
*   `npm run format`: Prettierでコードをフォーマットします。
*   `npm run test`: Vitestでユニット/コンポーネントテストを実行します。
*   `npm run test:watch`: Vitestをウォッチモードで実行します。
*   `npm run test:ui`: Vitest UIを起動します。
*   `npm run coverage`: テストカバレッジレポートを生成します。
*   `npm run test:api`: JestでAPIルートのテストを実行します (現状未使用の可能性あり)。
*   `npm run test:e2e`: PlaywrightでE2Eテストを実行します (事前に `npx playwright install --with-deps` が必要)。
*   `npm run test:e2e:ui`: Playwright UIモードを起動します (事前に `npx playwright install --with-deps` が必要)。

## ライセンス

[MIT](./LICENSE)
