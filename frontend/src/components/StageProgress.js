import React from 'react';
import { CheckCircle2, AlertCircle, Clock } from "lucide-react";

const StageProgress = ({ stageHistory }) => {
  if (!stageHistory || stageHistory.length === 0) return null;

  const getLatestStageScore = (stage) => {
    const stageEntries = stageHistory.filter(entry => entry.stage === stage);
    return stageEntries[stageEntries.length - 1];
  };

  const stage1Latest = getLatestStageScore('stage1-understand-validate');
  const stage2Latest = getLatestStageScore('stage2-plan-validate');
  const stage3Latest = getLatestStageScore('stage3-agent-instructions');

  const getScoreColor = (score, type = 'clarity') => {
    if (type === 'clarity') {
      if (score >= 90) return 'text-green-500 dark:text-green-400';
      if (score >= 70) return 'text-blue-500 dark:text-blue-400';
      if (score >= 40) return 'text-yellow-500 dark:text-yellow-400';
      return 'text-red-500 dark:text-red-400';
    } else if (type === 'instruction') {
      if (score >= 90) return 'text-green-500 dark:text-green-400';
      if (score >= 70) return 'text-blue-500 dark:text-blue-400';
      if (score >= 40) return 'text-yellow-500 dark:text-yellow-400';
      return 'text-red-500 dark:text-red-400';
    } else {
      if (score >= 90) return 'text-green-500 dark:text-green-400';
      if (score >= 70) return 'text-yellow-500 dark:text-yellow-400';
      return 'text-red-500 dark:text-red-400';
    }
  };

  const getStageStatus = (stage) => {
    if (stage === 'stage1-understand-validate') {
      if (!stage1Latest) return 'not-started';
      return stage1Latest.clarityScore >= 90 ? 'complete' : 'in-progress';
    } else if (stage === 'stage2-plan-validate') {
      if (!stage1Latest || stage1Latest.clarityScore < 90) return 'locked';
      if (!stage2Latest) return 'not-started';
      return stage2Latest.feasibilityScore >= 90 ? 'complete' : 'in-progress';
    } else if (stage === 'stage3-agent-instructions') {
      if (!stage2Latest || stage2Latest.feasibilityScore < 90) return 'locked';
      if (!stage3Latest) return 'not-started';
      return stage3Latest.instructionQuality >= 90 ? 'complete' : 'in-progress';
    }
    return 'not-started';
  };

  return (
    <div className="border rounded-lg p-4 bg-white dark:bg-gray-800 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold mb-2">Progress</h3>
      
      {/* Stage 1 */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStageStatus('stage1-understand-validate') === 'complete' ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : getStageStatus('stage1-understand-validate') === 'in-progress' ? (
            <Clock className="text-blue-500" size={20} />
          ) : (
            <AlertCircle className="text-gray-400" size={20} />
          )}
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Understand & Validate</span>
            {stage1Latest && (
              <span className={`text-sm font-bold ${getScoreColor(stage1Latest.clarityScore, 'clarity')}`}>
                {stage1Latest.clarityScore}
              </span>
            )}
          </div>
          {stage1Latest?.summary?.understanding && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stage1Latest.summary.understanding}
            </p>
          )}
        </div>
      </div>

      {/* Stage 2 */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStageStatus('stage2-plan-validate') === 'complete' ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : getStageStatus('stage2-plan-validate') === 'in-progress' ? (
            <Clock className="text-blue-500" size={20} />
          ) : getStageStatus('stage2-plan-validate') === 'locked' ? (
            <AlertCircle className="text-gray-400" size={20} />
          ) : (
            <AlertCircle className="text-gray-400" size={20} />
          )}
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Plan & Validate</span>
            {stage2Latest && (
              <span className={`text-sm font-bold ${getScoreColor(stage2Latest.feasibilityScore, 'feasibility')}`}>
                {stage2Latest.feasibilityScore}
              </span>
            )}
          </div>
          {stage2Latest?.implementationPlan?.summary && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stage2Latest.implementationPlan.summary}
            </p>
          )}
        </div>
      </div>

      {/* Stage 3 */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {getStageStatus('stage3-agent-instructions') === 'complete' ? (
            <CheckCircle2 className="text-green-500" size={20} />
          ) : getStageStatus('stage3-agent-instructions') === 'in-progress' ? (
            <Clock className="text-blue-500" size={20} />
          ) : getStageStatus('stage3-agent-instructions') === 'locked' ? (
            <AlertCircle className="text-gray-400" size={20} />
          ) : (
            <AlertCircle className="text-gray-400" size={20} />
          )}
        </div>
        <div className="flex-grow">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Agent Instructions</span>
            {stage3Latest && (
              <span className={`text-sm font-bold ${getScoreColor(stage3Latest.instructionQuality, 'instruction')}`}>
                {stage3Latest.instructionQuality}
              </span>
            )}
          </div>
          {stage3Latest?.instructions?.objective && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {stage3Latest.instructions.objective}
            </p>
          )}
        </div>
      </div>

      {/* History Timeline */}
      <div className="mt-4 border-t pt-4">
        <h4 className="text-xs font-semibold mb-2">History</h4>
        <div className="space-y-2">
          {stageHistory.map((entry, index) => (
            <div key={index} className="flex items-start gap-2 text-xs">
              <div className="flex-shrink-0 w-20 text-gray-500">
                {new Date(entry.timestamp).toLocaleTimeString()}
              </div>
              <div>
                {entry.stage === 'stage1-understand-validate' && (
                  <span className={getScoreColor(entry.clarityScore, 'clarity')}>
                    Clarity Score: {entry.clarityScore}
                  </span>
                )}
                {entry.stage === 'stage2-plan-validate' && (
                  <span className={getScoreColor(entry.feasibilityScore, 'feasibility')}>
                    Feasibility Score: {entry.feasibilityScore}
                  </span>
                )}
                {entry.stage === 'stage3-agent-instructions' && (
                  <span className={getScoreColor(entry.instructionQuality, 'instruction')}>
                    Instruction Quality: {entry.instructionQuality}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StageProgress; 