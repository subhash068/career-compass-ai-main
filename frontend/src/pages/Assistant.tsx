import React, { useState, useEffect, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
  RotateCcw,
  Lightbulb,
  Target,
  TrendingUp,
  GraduationCap,
  Sparkles,
  User,
  Loader2,
  Send
} from 'lucide-react';
import { useChat } from '@/contexts/ChatContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';
import { ChatMessage } from '@/types';

const suggestedPrompts = [
  {
    icon: Target,
    text: "What skills should I focus on first?",
    color: "text-primary bg-primary/10"
  },
  {
    icon: TrendingUp,
    text: "How can I close my biggest skill gaps?",
    color: "text-warning bg-warning/10"
  },
  {
    icon: GraduationCap,
    text: "What learning resources do you recommend?",
    color: "text-success bg-success/10"
  },
  {
    icon: Lightbulb,
    text: "Which career path suits me best?",
    color: "text-accent bg-accent/10"
  },
];

// Mock AI response generator (replace with actual API call)
function generateAIResponse(message: string, context: any): string {
  const { userSkills, careerMatches, allGaps } = context;
  
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('skill') && lowerMessage.includes('focus')) {
    const topGaps = allGaps.slice(0, 3);
    if (topGaps.length > 0) {
      return `Based on your assessment, I recommend focusing on these skills first:\n\n${topGaps.map((g: any, i: number) => 
        `${i + 1}. **${g.skill.name}** - ${g.severity} priority gap (${g.currentScore}% → ${g.requiredScore}%)`
      ).join('\n')}\n\nThese skills have the highest impact on your target career paths. Start with ${topGaps[0].skill.name} as it appears most frequently in your matched roles.`;
    }
    return "Complete your skill assessment first so I can provide personalized recommendations!";
  }
  
  if (lowerMessage.includes('gap')) {
    const highGaps = allGaps.filter((g: any) => g.severity === 'high');
    if (highGaps.length > 0) {
      return `You have ${highGaps.length} high-priority skill gaps:\n\n${highGaps.slice(0, 4).map((g: any) => 
        `• **${g.skill.name}**: Need to improve by ${g.gapScore} points`
      ).join('\n')}\n\n**Strategy:** Dedicate 2-3 focused hours weekly to each skill. Use hands-on projects alongside courses for faster retention.`;
    }
    return "Great news! You don't have any critical skill gaps. Focus on refining your existing strengths.";
  }
  
  if (lowerMessage.includes('career') || lowerMessage.includes('path')) {
    const topMatch = careerMatches[0];
    if (topMatch) {
      return `Based on your skills, **${topMatch.role.title}** is your best match at ${topMatch.matchScore}%!\n\n**Why this fits you:**\n${topMatch.reasoning}\n\n**Salary range:** $${Math.round(topMatch.role.averageSalary.min/1000)}k - $${Math.round(topMatch.role.averageSalary.max/1000)}k\n**Growth rate:** +${topMatch.role.growthRate}%\n\n${topMatch.gaps.length > 0 ? `You'll need to close ${topMatch.gaps.length} skill gaps first.` : "You're already well-prepared for this role!"}`;
    }
    return "Complete your assessment to get personalized career recommendations!";
  }
  
  if (lowerMessage.includes('learn') || lowerMessage.includes('resource')) {
    return `Here's my recommended learning approach:\n\n1. **Start with fundamentals** - Build a solid foundation before advanced topics\n2. **Project-based learning** - Apply skills immediately through real projects\n3. **Spaced repetition** - Review concepts regularly for long-term retention\n4. **Community engagement** - Join developer communities for support and networking\n\nFor your specific gaps, I recommend:\n• Udemy and Coursera for structured courses\n• FreeCodeCamp for hands-on practice\n• YouTube tutorials for quick concept reviews\n• GitHub for real-world project exposure`;
  }
  
  return `I'm your AI Career Assistant, here to help you navigate your professional development!\n\nI can help you with:\n• **Skill prioritization** - Which skills to develop first\n• **Gap analysis** - Understanding your improvement areas\n• **Career guidance** - Matching you with suitable roles\n• **Learning strategies** - Effective ways to build new skills\n\nWhat would you like to explore?`;
}

export default function Assistant() {
  const { chatMessages, addChatMessage, clearChat, userSkills, careerMatches, allGaps } = useApp();
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatMessages]);

  const handleSend = async (message?: string) => {
    const text = message || input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    
    addChatMessage(userMessage);
    setInput('');
    setIsLoading(true);

    // Simulate AI response delay
    setTimeout(() => {
      const response = generateAIResponse(text, { userSkills, careerMatches, allGaps });
      const assistantMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response,
        timestamp: new Date(),
      };
      addChatMessage(assistantMessage);
      setIsLoading(false);
    }, 1000 + Math.random() * 1000);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="h-[calc(100vh-6rem)] flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-accent flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold font-display">AI Career Assistant</h1>
            <p className="text-sm text-muted-foreground">Powered by AI to guide your career journey</p>
          </div>
        </div>
        <Button variant="outline" size="sm" onClick={clearChat}>
          <RotateCcw className="w-4 h-4 mr-2" />
          Clear Chat
        </Button>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <ScrollArea className="flex-1 p-4" ref={scrollRef}>
          {chatMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Sparkles className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-lg font-semibold font-display mb-2">
                How can I help you today?
              </h3>
              <p className="text-muted-foreground max-w-md mb-6">
                I can analyze your skills, identify gaps, recommend careers, 
                and create personalized learning paths.
              </p>
              
              <div className="grid grid-cols-2 gap-3 max-w-lg">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    onClick={() => handleSend(prompt.text)}
                    className="flex items-center gap-2 p-3 rounded-lg border text-left hover:bg-muted/50 transition-colors"
                  >
                    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", prompt.color)}>
                      <prompt.icon className="w-4 h-4" />
                    </div>
                    <span className="text-sm">{prompt.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
                  className={cn(
                    "flex gap-3",
                    msg.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  <div className={cn(
                    "w-8 h-8 rounded-lg flex-shrink-0 flex items-center justify-center",
                    msg.role === 'user' 
                      ? "bg-primary text-primary-foreground" 
                      : "bg-gradient-accent text-primary-foreground"
                  )}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>
                  <div className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-3",
                    msg.role === 'user'
                      ? "bg-primary text-primary-foreground rounded-tr-sm"
                      : "bg-muted rounded-tl-sm"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p className={cn(
                      "text-xs mt-2",
                      msg.role === 'user' ? "text-primary-foreground/70" : "text-muted-foreground"
                    )}>
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              ))}
              
              {isLoading && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-accent flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-primary-foreground" />
                  </div>
                  <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input Area */}
        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about skills, careers, or learning paths..."
              className="min-h-[44px] max-h-[120px] resize-none"
              rows={1}
            />
            <Button 
              onClick={() => handleSend()} 
              disabled={!input.trim() || isLoading}
              className="px-4"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
