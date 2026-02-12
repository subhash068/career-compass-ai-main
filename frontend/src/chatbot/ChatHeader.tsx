import React from 'react';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

interface ChatHeaderProps {
  onClose: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ onClose }) => {
  return (
    <div className="p-4 border-b">
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
          onClick={onClose}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
