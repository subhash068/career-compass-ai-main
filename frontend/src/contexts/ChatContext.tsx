import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ChatMessage } from '@/types';

interface ChatContextType {
  messages: ChatMessage[];
  sessionId: string | null;
  isLoading: boolean;
  addMessage: (message: ChatMessage) => void;
  setSessionId: (sessionId: string) => void;
  setLoading: (loading: boolean) => void;
  clearMessages: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};

interface ChatProviderProps {
  children: ReactNode;
}

export const ChatProvider: React.FC<ChatProviderProps> = ({ children }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sessionId, setSessionIdState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const addMessage = (message: ChatMessage) => {
    setMessages(prev => [...prev, message]);
  };

  const setSessionId = (sessionId: string) => {
    setSessionIdState(sessionId);
  };

  const setLoading = (loading: boolean) => {
    setIsLoading(loading);
  };

  const clearMessages = () => {
    setMessages([]);
    setSessionIdState(null);
  };

  const value: ChatContextType = {
    messages,
    sessionId,
    isLoading,
    addMessage,
    setSessionId,
    setLoading,
    clearMessages,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
