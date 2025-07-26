import React from 'react';
import { Switch, Tooltip, Button } from '@mui/material';
import { FiSearch, FiClipboard, FiLoader } from 'react-icons/fi';
import { BsRobot, BsMicFill } from 'react-icons/bs';

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
    <div className="flex items-center justify-between px-4 py-2">
      <div className="flex items-center gap-4">
        {/* Search icon and switch */}
        <Tooltip title="Auto-analyze prompts for files" placement="top">
          <div className="flex items-center gap-1">
            <FiSearch className="text-gray-500 dark:text-gray-400" />
            <Switch
              size="small"
              checked={isAutoAnalyzeEnabled}
              onChange={onToggleAutoAnalyze}
            />
          </div>
        </Tooltip>

        {/* Analyze button */}
        <Button
          variant="contained"
          size="small"
          onClick={onManualAnalyze}
          disabled={!canAnalyze || isAnalyzing}
          className="text-xs px-3 py-1 min-w-0"
          sx={{
            backgroundColor: 'rgb(67, 70, 148)',
            borderRadius: '6px',
            textTransform: 'uppercase',
            '&:hover': {
              backgroundColor: 'rgb(79, 82, 221)',
            },
            '&.Mui-disabled': {
              backgroundColor: 'rgba(67, 70, 148, 0.6)',
              color: 'rgba(255, 255, 255, 0.8)',
            },
          }}
        >
          {isAnalyzing ? (
            <div className="flex items-center gap-2">
              <FiLoader className="animate-spin" />
              <span>Analyzing</span>
            </div>
          ) : (
            "ANALYZE"
          )}
        </Button>

        {/* Mic icon and switch */}
        <Tooltip title="Auto-add transcriptions to prompt" placement="top">
          <div className="flex items-center gap-1">
            <BsMicFill className="text-gray-500 dark:text-gray-400" />
            <Switch
              size="small"
              checked={autoAddEnabled}
              onChange={onToggleAutoAdd}
            />
          </div>
        </Tooltip>

        {/* Robot icon and switch */}
        <Tooltip title="Enhanced readability of transcriptions using AI" placement="top">
          <div className="flex items-center gap-1">
            <BsRobot className="text-gray-500 dark:text-gray-400" />
            <Switch
              size="small"
              checked={!enhancementDisabled}
              onChange={onToggleEnhancement}
            />
          </div>
        </Tooltip>

        {/* Clipboard icon and switch */}
        <Tooltip title="Auto-copy to clipboard when prompt is updated" placement="top">
          <div className="flex items-center gap-1">
            <FiClipboard className="text-gray-500 dark:text-gray-400" />
            <Switch
              size="small"
              checked={autoCopyEnabled}
              onChange={onToggleAutoCopy}
            />
          </div>
        </Tooltip>
      </div>
      
      {/* Char counter */}
      <div className="text-xs text-gray-500 dark:text-gray-400 bg-gray-600/20 dark:bg-gray-700 px-3 py-1 rounded-full">
        {promptLength} / {minPromptLength} chars
      </div>
    </div>
  );
};

export default PromptSettings;