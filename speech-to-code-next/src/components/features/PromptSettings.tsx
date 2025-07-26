import React from 'react';
import { Button } from '../ui/button';
import { Switch } from '../ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';
import { FiSearch, FiClipboard, FiLoader } from 'react-icons/fi';
import { BsRobot, BsMicFill } from 'react-icons/bs';
import { cn } from '@/lib/utils/cn';

interface PromptSettingsProps {
  isAutoAnalyzeEnabled: boolean;
  onToggleAutoAnalyze: () => void;
  autoAddEnabled: boolean;
  onToggleAutoAdd: () => void;
  enhancementDisabled: boolean;
  onToggleEnhancement: () => void;
  onManualAnalyze: () => void;
  isAnalyzing: boolean;
  promptLength: number;
  minPromptLength: number;
  autoCopyEnabled: boolean;
  onToggleAutoCopy: () => void;
}

const PromptSettings: React.FC<PromptSettingsProps> = ({
  isAutoAnalyzeEnabled,
  onToggleAutoAnalyze,
  autoAddEnabled,
  onToggleAutoAdd,
  enhancementDisabled,
  onToggleEnhancement,
  onManualAnalyze,
  isAnalyzing,
  promptLength,
  minPromptLength,
  autoCopyEnabled,
  onToggleAutoCopy,
}) => {
  const canAnalyze = promptLength >= minPromptLength;
  
  return (
    <TooltipProvider>
      <div className="flex items-center justify-between px-6 py-3 bg-background border-b border-border">
        <div className="flex items-center gap-6">
          {/* Auto-analyze toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 group cursor-pointer">
                <FiSearch className={cn(
                  "h-4 w-4 transition-colors",
                  isAutoAnalyzeEnabled 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
                <Switch
                  checked={isAutoAnalyzeEnabled}
                  onCheckedChange={onToggleAutoAnalyze}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-analyze prompts for files</p>
            </TooltipContent>
          </Tooltip>

          {/* Analyze button */}
          <Button
            variant="default"
            size="sm"
            onClick={onManualAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            className={cn(
              "text-xs font-semibold px-4 py-2 min-w-[80px] uppercase tracking-wide",
              "bg-primary hover:bg-primary/90 disabled:bg-muted",
              "transition-all duration-200"
            )}
          >
            {isAnalyzing ? (
              <div className="flex items-center gap-2">
                <FiLoader className="h-3 w-3 animate-spin" />
                <span>Analyzing</span>
              </div>
            ) : (
              "ANALYZE"
            )}
          </Button>

          {/* Auto-add transcriptions toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 group cursor-pointer">
                <BsMicFill className={cn(
                  "h-4 w-4 transition-colors",
                  autoAddEnabled 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
                <Switch
                  checked={autoAddEnabled}
                  onCheckedChange={onToggleAutoAdd}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-add transcriptions to prompt</p>
            </TooltipContent>
          </Tooltip>

          {/* AI enhancement toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 group cursor-pointer">
                <BsRobot className={cn(
                  "h-4 w-4 transition-colors",
                  !enhancementDisabled 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
                <Switch
                  checked={!enhancementDisabled}
                  onCheckedChange={onToggleEnhancement}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Enhanced readability of transcriptions using AI</p>
            </TooltipContent>
          </Tooltip>

          {/* Auto-copy toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="flex items-center gap-2 group cursor-pointer">
                <FiClipboard className={cn(
                  "h-4 w-4 transition-colors",
                  autoCopyEnabled 
                    ? "text-primary" 
                    : "text-muted-foreground group-hover:text-foreground"
                )} />
                <Switch
                  checked={autoCopyEnabled}
                  onCheckedChange={onToggleAutoCopy}
                  className="data-[state=checked]:bg-primary"
                />
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p>Auto-copy to clipboard when prompt is updated</p>
            </TooltipContent>
          </Tooltip>
        </div>
        
        {/* Character counter */}
        <div className={cn(
          "text-xs font-medium px-3 py-1.5 rounded-full transition-colors",
          "bg-muted text-muted-foreground",
          promptLength >= minPromptLength 
            ? "bg-primary/10 text-primary" 
            : "bg-muted text-muted-foreground"
        )}>
          {promptLength.toLocaleString()} / {minPromptLength.toLocaleString()} chars
        </div>
      </div>
    </TooltipProvider>
  );
};

export default PromptSettings;