// File: api/chat/route.ts
// Description: API endpoint handling chat interactions. Can use OpenAI or return mock responses.

import OpenAI from 'openai';
import { Message as VercelChatMessage } from 'ai';
import {
  experimental_StreamingTextResponse as StreamingTextResponse,
  experimental_OpenAIStream as OpenAIStream,
} from 'ai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

// Initialize OpenAI client (only used if not in mock mode)
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

export const runtime = 'edge';

/**
 * Generates a system prompt based on the requested chat mode and context.
 * (Implementation remains the same as before)
 */
const getSystemPrompt = (
  mode: 'create' | 'edit_full' | 'edit_selection' | undefined,
  originalContext?: string,
  selectedText?: string
): string => {
  // ... (previous implementation) ...
  const maxContextLength = 1500;
  const maxSelectedLength = 500;
  const truncatedContext =
    originalContext?.substring(0, maxContextLength) ?? '';
  const truncatedSelected = selectedText?.substring(0, maxSelectedLength) ?? '';
  const contextSuffix =
    originalContext && originalContext.length > maxContextLength ? '...' : '';
  const selectedSuffix =
    selectedText && selectedText.length > maxSelectedLength ? '...' : '';

  switch (mode) {
    case 'create':
      return 'あなたはMarkdownドキュメント作成の専門家です...'; // 省略
    case 'edit_full':
      return `あなたはMarkdownドキュメント編集の専門家です...元のドキュメント(冒頭部分):\n\`\`\`markdown\n${truncatedContext}${contextSuffix}\n\`\`\``; // 省略
    case 'edit_selection':
      return `あなたはMarkdownドキュメントの一部を編集する専門家です...編集対象の選択テキスト:\n\`\`\`markdown\n${truncatedSelected}${selectedSuffix}\n\`\`\`\n\n(参考) ドキュメント全体の冒頭:\n\`\`\`markdown\n${truncatedContext.substring(0, 500)}${truncatedContext.length > 500 ? '...' : ''}\n\`\`\``; // 省略
    default:
      return 'あなたは役立つAIアシスタントです...'; // 省略
  }
};

/**
 * Generates a mock streaming response.
 * @param messages - The incoming messages (to potentially use in the mock response).
 * @param mode - The requested chat mode.
 * @returns A StreamingTextResponse containing the mock data stream.
 */
async function getMockResponse(
  messages: VercelChatMessage[],
  mode: 'create' | 'edit_full' | 'edit_selection' | undefined
): Promise<StreamingTextResponse> {
  const lastUserMessage =
    messages.filter((m) => m.role === 'user').pop()?.content || 'no input';
  let mockContent = '';

  // Generate different mock content based on the mode
  switch (mode) {
    case 'create':
      mockContent = `## モック応答 (作成モード)\n\n「${lastUserMessage}」に基づいて作成されたダミーのMarkdownコンテンツです。\n\n- リスト項目1\n- リスト項目2\n\n\`\`\`\n// モックコード\nfunction mock() { return "${mode}"; }\n\`\`\``;
      break;
    case 'edit_full':
      mockContent = `\n\n元のコンテンツ全体が「${lastUserMessage}」という指示で**編集**されたかのようなダミーテキストです。\n\n${messages.find((m) => m.role === 'system')?.content?.substring(0, 100) ?? ''}... (元のコンテキスト参照)`; // システムプロンプトの一部を引用
      break;
    case 'edit_selection':
      mockContent = `**編集された選択範囲 (モック)**\n\n元の選択範囲が「${lastUserMessage}」という指示で編集された結果のダミーテキストです。`;
      break;
    default:
      mockContent = `**モック応答:** こんにちは！「${lastUserMessage}」についてダミーの応答を返します。これはローカルのモックサーバーからのメッセージです。`;
      break;
  }

  // Simulate streaming by splitting the content and adding delays
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const chunks = mockContent.split(/(?<=\s)/); // Split by space, keeping space

      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 50)); // 50ms delay per chunk
      }
      controller.close();
    },
  });

  return new StreamingTextResponse(stream);
}

/**
 * Handles POST requests to the /api/chat endpoint.
 * Checks MOCK_AI_RESPONSE env var to decide between OpenAI call and mock response.
 */
export async function POST(req: Request) {
  // --- Check for Mock Mode ---
  if (process.env.MOCK_AI_RESPONSE === 'true') {
    console.log('[API /api/chat] Running in MOCK mode.');
    const { messages, body: additionalData } = await req.json();
    const mode = additionalData?.mode as
      | 'create'
      | 'edit_full'
      | 'edit_selection'
      | undefined;
    // Return the mock response stream
    return getMockResponse(messages, mode);
  }

  // --- OpenAI API Call Logic (Original) ---
  try {
    const {
      messages,
      body: additionalData,
    }: { messages: VercelChatMessage[]; body: any } = await req.json();
    const mode = additionalData?.mode as
      | 'create'
      | 'edit_full'
      | 'edit_selection'
      | undefined;
    const originalContext = additionalData?.originalContext as
      | string
      | undefined;
    const selectedText = additionalData?.selectedText as string | undefined;

    console.log(
      `[API /api/chat] Received request - Mode: ${mode} (Using OpenAI)`
    );

    const systemPrompt = getSystemPrompt(mode, originalContext, selectedText);

    const chatMessages: ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt } as ChatCompletionMessageParam,
      ...(messages.map((m) => ({
        role: m.role === 'data' ? 'assistant' : m.role,
        content: m.content,
      })) as ChatCompletionMessageParam[]),
    ];

    // Ensure API key is available before making the call
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        'OpenAI API key is not configured in environment variables.'
      );
    }

    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
      stream: true,
      messages: chatMessages,
      temperature: mode === 'edit_selection' ? 0.5 : 0.7,
    });

    const stream = OpenAIStream(response);
    return new StreamingTextResponse(stream);
  } catch (error: unknown) {
    console.error('[API /api/chat] OpenAI Error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'An unknown error occurred';
    // Check for specific OpenAI errors (e.g., authentication)
    if (errorMessage.includes('Incorrect API key')) {
      return new Response(
        JSON.stringify({
          error: 'OpenAI API Key Error',
          details: '無効なAPIキーが設定されているか、設定されていません。',
        }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }
    return new Response(
      JSON.stringify({ error: 'Internal Server Error', details: errorMessage }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
}
