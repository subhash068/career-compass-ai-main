import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageCircle, X } from 'lucide-react';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { useChatbot } from '@/hooks/useChatbot';
import { useChat } from '@/contexts/ChatContext';

const suggestedPrompts = [
  "What skills should I focus on first?",
  "How can I close my biggest skill gaps?",
  "What learning resources do you recommend?",
  "Which career path suits me best?",
];

export function FloatingChatbot() {
  const [isOpen, setIsOpen] = useState(false);
  const { messages, sendMessage } = useChatbot();
  const { isLoading } = useChat();

  const handleSendSuggested = (prompt: string) => {
    sendMessage(prompt);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetTrigger asChild>
          <Button
            size="lg"
            className="h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 bg-gradient-accent hover:scale-110"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent
          side="right"
          className="w-full sm:w-[400px] p-0 flex flex-col"
        >
          <div className="flex flex-col h-full overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
                    <span className="text-primary-foreground font-bold">AI</span>
                  </div>
                  <div>
                    <h3 className="font-semibold">AI Career Assistant</h3>
                    <p className="text-sm text-muted-foreground">Powered by AI</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Messages Area with Suggestions */}
            <ScrollArea className="flex-1 p-4 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                    <span className="text-2xl">🤖</span>
                  </div>
                  <h3 className="text-lg font-semibold font-display mb-2">
                    How can I help you today?
                  </h3>
                  <p className="text-muted-foreground text-sm mb-6 max-w-sm">
                    I can analyze your skills, identify gaps, recommend careers,
                    and create personalized learning paths.
                  </p>
                  <div className="grid grid-cols-1 gap-2 w-full max-w-sm">
                    {suggestedPrompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSendSuggested(prompt)}
                        className="flex items-center gap-2 p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                      >
                        <span className="text-sm">{prompt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <ChatMessages messages={messages} isLoading={isLoading} />
              )}
            </ScrollArea>

            {/* Input Field */}
            <div className="shrink-0">
              <ChatInput />
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
