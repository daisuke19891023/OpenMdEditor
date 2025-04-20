import React, { useRef, useEffect, useCallback } from 'react';
import { useUIStore } from '@/store/uiStore';
import { useAIStore } from '@/store/aiStore'; // chatMode のみ取得
import { useEditorStore } from '@/store/editorStore';
import { AISuggestion } from '@/types/ai'; // AISuggestion はプレビュー用
import { useChat, type Message } from 'ai/react'; // Vercel AI SDK フックと型をインポート
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
  // SheetTrigger, // FABで開閉を制御
  // SheetClose, // 必要なら閉じるボタン用
} from '@/components/ui/sheet';
import { Bot, Send, X, Loader2, RefreshCw } from 'lucide-react'; // アイコン
import { toast } from 'sonner'; // 通知用

export const AiChatPanel: React.FC = () => {
  // --- Zustand Store Hooks ---
  const { isChatOpen, setChatOpen, openPreviewDialog } = useUIStore();
  const { chatMode, setChatMode } = useAIStore();
  const { selectedText, markdown: currentMarkdown } = useEditorStore();

  // --- Refs ---
  const chatInputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // --- Vercel AI SDK useChat Hook ---
  const {
    messages,
    input,
    handleInputChange,
    handleSubmit,
    isLoading,
    append,
    reload,
    stop,
    setMessages,
  } = useChat({
    api: '/api/chat', // Backend API endpoint
    // Send additional data with the request body
    body: {
      mode: chatMode,
      originalContext: chatMode === 'edit' ? currentMarkdown : undefined,
      selectedText: chatMode === 'edit' ? selectedText : undefined,
    },
    // Handle successful AI response finish
    onFinish: (message) => {
      if (message.role === 'assistant' && message.content) {
        const suggestion: AISuggestion = {
          role: 'assistant',
          content: 'AIの提案です。', // Fixed title for the preview dialog
          markdown: message.content, // The actual AI response markdown
          type:
            chatMode === 'create'
              ? 'create'
              : selectedText
                ? 'edit_selection'
                : 'edit_full',
        };
        // Open the preview dialog using the Zustand action
        openPreviewDialog(suggestion, currentMarkdown);
      }
    },
    // Handle errors during AI communication
    onError: (error) => {
      console.error('Chat error:', error);
      toast.error(`AIとの通信中にエラーが発生しました: ${error.message}`);
    },
  });

  // --- Effects ---
  // Scroll chat history to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [messages]);

  // Focus chat input when the panel opens
  useEffect(() => {
    if (isChatOpen && chatInputRef.current) {
      // Timeout to allow sheet animation to complete before focusing
      const timer = setTimeout(() => chatInputRef.current?.focus(), 150);
      return () => clearTimeout(timer);
    }
  }, [isChatOpen]);

  // Clear chat history when the editor resets (e.g., new file)
  // This might be better handled by subscribing to editorStore changes if needed
  // Or called directly from the createNewFile action

  // --- Event Handlers ---
  // Switch chat mode to 'create'
  const handleSetChatModeCreate = useCallback(() => {
    setChatMode('create');
    toast.info('AIモード: 新規作成');
  }, [setChatMode]);

  // Switch chat mode to 'edit'
  const handleSetChatModeEdit = useCallback(() => {
    setChatMode('edit');
    toast.info('AIモード: 編集');
  }, [setChatMode]);

  // Wrapper for handleSubmit to include latest context in body (if needed, useChat body updates automatically now)
  const handleSendClick = (event?: React.FormEvent<HTMLFormElement>) => {
    const formEvent =
      event ||
      (new Event('submit', {
        cancelable: true,
      }) as unknown as React.FormEvent<HTMLFormElement>);
    handleSubmit(formEvent, {
      data: {
        mode: chatMode,
        originalContext: chatMode === 'edit' ? (currentMarkdown ?? '') : '',
        selectedText: chatMode === 'edit' ? (selectedText ?? '') : '',
      },
    });
  };

  // Handle Enter key press for sending, allowing Shift+Enter for newlines
  const handleChatKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>): void => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
        e.preventDefault();
        if (!isLoading && input.trim()) {
          handleSendClick();
        }
      }
    },
    [handleSendClick, isLoading, input]
  ); // Dependencies for the callback

  // Handle Sheet open/close state change
  const handleSheetOpenChange = (open: boolean) => {
    setChatOpen(open); // Update Zustand store
  };

  // --- Render ---
  return (
    <>
      {/* Floating Action Button (FAB) to toggle the chat panel */}
      <Button
        variant="default"
        size="icon"
        className="fixed bottom-5 right-5 z-40 w-14 h-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 ease-in-out transform hover:scale-110 data-[state=open]:rotate-45 data-[state=open]:bg-red-500 data-[state=open]:hover:bg-red-600"
        onClick={() => handleSheetOpenChange(!isChatOpen)}
        data-state={isChatOpen ? 'open' : 'closed'}
        title={isChatOpen ? 'AIチャットを閉じる' : 'AIアシスタントを開く'}
      >
        {isChatOpen ? <X className="h-6 w-6" /> : <Bot className="h-7 w-7" />}
      </Button>

      {/* AI Chat Panel using Shadcn UI Sheet */}
      <Sheet open={isChatOpen} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          className="w-[400px] sm:w-[540px] flex flex-col p-0 bg-background text-foreground"
          aria-describedby="ai-chat-panel-title"
        >
          {/* Panel Header */}
          <SheetHeader className="p-4 border-b">
            <SheetTitle
              id="ai-chat-panel-title"
              className="flex items-center justify-between"
            >
              <span className="text-lg font-semibold">AI アシスタント</span>
              {/* Mode Toggle Buttons */}
              <div className="flex bg-muted rounded-full p-0.5 text-xs">
                <Button
                  variant={chatMode === 'create' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={handleSetChatModeCreate}
                  className={`rounded-full px-3 ${chatMode === 'create' ? 'shadow-sm' : ''}`}
                >
                  新規作成
                </Button>
                <Button
                  variant={chatMode === 'edit' ? 'secondary' : 'ghost'}
                  size="xs"
                  onClick={handleSetChatModeEdit}
                  className={`rounded-full px-3 ${chatMode === 'edit' ? 'shadow-sm' : ''}`}
                >
                  編集
                </Button>
              </div>
            </SheetTitle>
          </SheetHeader>

          {/* Chat History Area */}
          <div
            ref={chatContainerRef}
            className="flex-grow overflow-y-auto p-4 space-y-4"
          >
            {/* Map through messages from useChat */}
            {messages.map(
              (
                msg: Message // Explicitly type msg as Message
              ) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] px-3 py-2 rounded-lg shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}
                  >
                    {/* Consider using a Markdown renderer for assistant messages */}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  </div>
                </div>
              )
            )}
            {/* Loading Indicator */}
            {isLoading && (
              <div className="flex justify-start">
                <div className="px-3 py-2 rounded-lg bg-muted text-muted-foreground flex items-center space-x-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <p className="text-sm">AIが応答を生成中...</p>
                  {/* Stop Button */}
                  <Button variant="ghost" size="xs" onClick={stop} title="停止">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
            {/* Regenerate Button */}
            {messages.length > 0 &&
              messages[messages.length - 1].role === 'assistant' &&
              !isLoading && (
                <div className="flex justify-start pt-2">
                  <Button
                    variant="outline"
                    size="xs"
                    onClick={() => reload()}
                    title="再生成"
                  >
                    <RefreshCw className="h-3 w-3 mr-1" /> 再生成
                  </Button>
                </div>
              )}
          </div>

          {/* Display selected text when in edit mode */}
          {chatMode === 'edit' && selectedText && (
            <div className="px-4 py-2 border-t bg-muted/50 flex-shrink-0">
              <p className="text-xs text-muted-foreground mb-1">
                編集対象のテキスト:
              </p>
              <p className="text-sm bg-background p-2 rounded max-h-20 overflow-y-auto whitespace-pre-wrap border">
                {selectedText.length > 100
                  ? `${selectedText.substring(0, 100)}...`
                  : selectedText}
              </p>
            </div>
          )}

          {/* Chat Input Area */}
          <SheetFooter className="p-3 border-t bg-muted/50 flex-shrink-0">
            {/* Form element for useChat's handleSubmit */}
            <form
              onSubmit={handleSendClick}
              className="flex items-center space-x-2 w-full"
            >
              <Textarea
                ref={chatInputRef}
                value={input} // Controlled input from useChat
                onChange={handleInputChange} // Input change handler from useChat
                onKeyDown={handleChatKeyDown} // Handle Enter/Cmd+Enter
                rows={2}
                className="flex-grow resize-none text-sm focus-visible:ring-1 focus-visible:ring-ring"
                placeholder={
                  chatMode === 'create'
                    ? '作成したい内容を指示...'
                    : selectedText
                      ? '選択範囲への指示...'
                      : '編集指示...'
                }
                disabled={isLoading} // Disable when AI is processing
              />
              <Button
                type="submit" // Submit the form
                size="icon"
                disabled={isLoading || !input.trim()} // Disable if loading or input is empty
                title="送信 (Enter)"
              >
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
};
