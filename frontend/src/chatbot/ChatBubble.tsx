import React from 'react';
import { ChatMessage } from '@/types';
import { User, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  return (
    <div
      className={cn(
        "flex gap-3",
        message.role === 'user' ? "flex-row-reverse" : "flex-row"
      )}
    >
      <div className={cn(
        "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
        message.role === 'user'
          ? "bg-primary text-primary-foreground"
          : "bg-gradient-accent text-primary-foreground"
      )}>
        {message.role === 'user' ? (
          <User className="w-4 h-4" />
        ) : (
          <Sparkles className="w-4 h-4" />
        )}
      </div>
      <div className={cn(
        "max-w-[85%] rounded-2xl px-4 py-3",
        message.role === 'user'
          ? "bg-primary text-primary-foreground rounded-tr-sm"
          : "bg-muted rounded-tl-sm"
      )}>
        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
        <p className={cn(
          "text-xs mt-2",
          message.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
        )}>
          {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </p>
      </div>
    </div>
  );
};
