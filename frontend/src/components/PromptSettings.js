import React from 'react';
import { Switch, Tooltip, Button } from '@mui/material';
import { FiSearch, FiClipboard } from 'react-icons/fi';
import { BsRobot, BsMicFill } from 'react-icons/bs';

const PromptSettings = ({
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
    <div className="flex items-center justify-between px-3 py-2 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm rounded-lg shadow-sm">
      <div className="flex items-center gap-3">
        {/* Analysis Group */}
        <div className="flex items-center gap-2 pr-3 border-r border-gray-200 dark:border-gray-700">
          <Tooltip title="Auto-analyze prompts for files">
            <div className="flex items-center gap-1">
              <FiSearch className="text-gray-500 dark:text-gray-400" size={14} />
              <Switch
                size="small"
                checked={isAutoAnalyzeEnabled}
                onChange={onToggleAutoAnalyze}
              />
            </div>
          </Tooltip>
          <Tooltip title={canAnalyze ? "Analyze prompt now" : "Prompt too short to analyze"}>
            <span>
              <Button
                variant="contained"
                size="small"
                onClick={onManualAnalyze}
                disabled={!canAnalyze || isAnalyzing}
                className="min-w-0 px-3 py-1 text-xs"
                sx={{
                  backgroundColor: 'rgb(99, 102, 241)',
                  '&:hover': {
                    backgroundColor: 'rgb(79, 82, 221)',
                  },
                  '&.Mui-disabled': {
                    backgroundColor: 'rgba(99, 102, 241, 0.4)',
                    color: 'rgba(255, 255, 255, 0.8)',
                  },
                }}
              >
                {isAnalyzing ? "Analyzing..." : "Analyze"}
              </Button>
            </span>
          </Tooltip>
        </div>

        {/* Transcription Group */}
        <div className="flex items-center gap-3 pr-3 border-r border-gray-200 dark:border-gray-700">
          <Tooltip title="Auto-add transcriptions to prompt">
            <div className="flex items-center gap-1">
              <BsMicFill className="text-gray-500 dark:text-gray-400" size={14} />
              <Switch
                size="small"
                checked={autoAddEnabled}
                onChange={onToggleAutoAdd}
              />
            </div>
          </Tooltip>

          <Tooltip title="Enhanced readability of transcriptions using AI">
            <div className="flex items-center gap-1">
              <BsRobot className="text-gray-500 dark:text-gray-400" size={14} />
              <Switch
                size="small"
                checked={!enhancementDisabled}
                onChange={onToggleEnhancement}
              />
            </div>
          </Tooltip>
        </div>

        {/* Auto-copy Group */}
        <div className="flex items-center">
          <Tooltip title="Auto-copy to clipboard when prompt is updated">
            <div className="flex items-center gap-1">
              <FiClipboard className="text-gray-500 dark:text-gray-400" size={14} />
              <Switch
                size="small"
                checked={autoCopyEnabled}
                onChange={onToggleAutoCopy}
              />
            </div>
          </Tooltip>
        </div>
      </div>
    </div>
  );
};

export default PromptSettings; 