import React from 'react';
import { File, CheckCircle2, AlertCircle, List, Shield } from "lucide-react";
import { Card } from "./ui/card";

// Types for Stage 1
interface FileRequest {
  file: string;
  reason: string;
}

interface Summary {
  understanding: string;
  technicalScope: string;
  potentialChallenges?: string[];
}

// Types for Stage 2
interface FileChange {
  file: string;
  changes: string;
}

interface ImplementationPlan {
  summary: string;
  fileChanges?: FileChange[];
  dependencies?: string[];
  testingRequirements?: string[];
  rolloutSteps?: string[];
}

// Types for Stage 3
interface InstructionStep {
  description: string;
  files?: string[];
  validation?: string;
}

interface Instructions {
  steps: InstructionStep[];
}

interface SafetyCheck {
  check: string;
  mitigation: string;
}

// Combined stage data type
interface StageData {
  // Stage 1
  clarityScore?: number;
  fileRequests?: FileRequest[];
  questions?: string[];
  summary?: Summary;
  
  // Stage 2
  feasibilityScore?: number;
  additionalFileRequests?: FileRequest[];
  technicalQuestions?: string[];
  implementationPlan?: ImplementationPlan;
  
  // Stage 3
  agentInstructionsGenerated?: boolean;
  instructions?: Instructions;
  safetyChecks?: SafetyCheck[];
  refinementSuggestions?: string[];
}

type StageType = 'stage1-understand-validate' | 'stage2-plan-validate' | 'stage3-agent-instructions';

interface StageDisplayProps {
  stageData: StageData | null;
  stage: StageType;
}

const StageDisplay: React.FC<StageDisplayProps> = ({ stageData, stage }) => {
  if (!stageData) return null;

  const getScoreColor = (score: number, type: 'clarity' | 'instruction' | 'feasibility' = 'clarity'): string => {
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
      // feasibility score colors
      if (score >= 90) return 'text-green-500 dark:text-green-400';
      if (score >= 70) return 'text-yellow-500 dark:text-yellow-400';
      return 'text-red-500 dark:text-red-400';
    }
  };

  const FileRequestList: React.FC<{ files?: FileRequest[]; title: string }> = ({ files, title }) => {
    if (!files || files.length === 0) return null;
    return (
      <div className="mt-2">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <File className="inline" size={14} />
          {title}:
        </h4>
        <ul className="list-none space-y-1 mt-1">
          {files.map((file, index) => (
            <li key={index} className="text-xs pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <span className="font-mono text-blue-600 dark:text-blue-400">{file.file}</span>
              <p className="text-gray-600 dark:text-gray-400 ml-4">{file.reason}</p>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const QuestionList: React.FC<{ questions?: string[]; title?: string }> = ({ questions, title = "Questions" }) => {
    if (!questions || questions.length === 0) return null;
    return (
      <div className="mt-2">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <AlertCircle className="inline" size={14} />
          {title}:
        </h4>
        <ul className="list-disc pl-5 mt-1">
          {questions.map((question, index) => (
            <li key={index} className="text-xs">{question}</li>
          ))}
        </ul>
      </div>
    );
  };

  const Summary: React.FC<{ summary?: Summary }> = ({ summary }) => {
    if (!summary) return null;
    return (
      <div className="mt-3 space-y-2">
        <div>
          <h4 className="text-sm font-semibold">Understanding:</h4>
          <p className="text-xs text-gray-700 dark:text-gray-300">{summary.understanding}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold">Technical Scope:</h4>
          <p className="text-xs text-gray-700 dark:text-gray-300">{summary.technicalScope}</p>
        </div>
        {summary.potentialChallenges && summary.potentialChallenges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">Potential Challenges:</h4>
            <ul className="list-disc pl-5">
              {summary.potentialChallenges.map((challenge, index) => (
                <li key={index} className="text-xs text-gray-700 dark:text-gray-300">{challenge}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const ImplementationPlan: React.FC<{ plan?: ImplementationPlan }> = ({ plan }) => {
    if (!plan) return null;
    return (
      <div className="mt-3 space-y-2">
        <div>
          <h4 className="text-sm font-semibold">Implementation Summary:</h4>
          <p className="text-xs text-gray-700 dark:text-gray-300">{plan.summary}</p>
        </div>
        {plan.fileChanges && plan.fileChanges.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">File Changes:</h4>
            <ul className="list-none space-y-1">
              {plan.fileChanges.map((change, index) => (
                <li key={index} className="text-xs pl-4 border-l-2 border-gray-200 dark:border-gray-700">
                  <span className="font-mono text-blue-600 dark:text-blue-400">{change.file}</span>
                  <p className="text-gray-600 dark:text-gray-400 ml-4">{change.changes}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
        {plan.dependencies && plan.dependencies.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">Dependencies:</h4>
            <ul className="list-disc pl-5">
              {plan.dependencies.map((dep, index) => (
                <li key={index} className="text-xs text-gray-700 dark:text-gray-300">{dep}</li>
              ))}
            </ul>
          </div>
        )}
        {plan.testingRequirements && plan.testingRequirements.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">Testing Requirements:</h4>
            <ul className="list-disc pl-5">
              {plan.testingRequirements.map((req, index) => (
                <li key={index} className="text-xs text-gray-700 dark:text-gray-300">{req}</li>
              ))}
            </ul>
          </div>
        )}
        {plan.rolloutSteps && plan.rolloutSteps.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold">Rollout Steps:</h4>
            <ul className="list-decimal pl-5">
              {plan.rolloutSteps.map((step, index) => (
                <li key={index} className="text-xs text-gray-700 dark:text-gray-300">{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  const InstructionSteps: React.FC<{ steps?: InstructionStep[] }> = ({ steps }) => {
    if (!steps || steps.length === 0) return null;
    return (
      <div className="mt-3">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <List className="inline" size={14} />
          Implementation Steps:
        </h4>
        <ul className="list-none space-y-2 mt-2">
          {steps.map((step, index) => (
            <li key={index} className="text-xs pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="font-medium">{step.description}</div>
              {step.files && step.files.length > 0 && (
                <div className="mt-1 text-blue-600 dark:text-blue-400 font-mono">
                  Files: {step.files.join(', ')}
                </div>
              )}
              {step.validation && (
                <div className="mt-1 text-gray-600 dark:text-gray-400">
                  Validation: {step.validation}
                </div>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const SafetyChecks: React.FC<{ checks?: SafetyCheck[] }> = ({ checks }) => {
    if (!checks || checks.length === 0) return null;
    return (
      <div className="mt-3">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <Shield className="inline" size={14} />
          Safety Checks:
        </h4>
        <ul className="list-none space-y-2 mt-2">
          {checks.map((check, index) => (
            <li key={index} className="text-xs pl-4 border-l-2 border-gray-200 dark:border-gray-700">
              <div className="font-medium">{check.check}</div>
              <div className="mt-1 text-gray-600 dark:text-gray-400">
                Mitigation: {check.mitigation}
              </div>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const RefinementSuggestions: React.FC<{ suggestions?: string[] }> = ({ suggestions }) => {
    if (!suggestions || suggestions.length === 0) return null;
    return (
      <div className="mt-3">
        <h4 className="text-sm font-semibold">Refinement Suggestions:</h4>
        <ul className="list-disc pl-5 mt-1">
          {suggestions.map((suggestion, index) => (
            <li key={index} className="text-xs text-gray-700 dark:text-gray-300">{suggestion}</li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm space-y-2">
      {/* Stage 1: Understand & Validate */}
      {stage === 'stage1-understand-validate' && stageData.clarityScore !== undefined && (
        <>
          <div className="flex items-center gap-2">
            <File className="text-blue-500" size={16} />
            <span className="text-sm font-semibold">Clarity Score:</span>
            <span className={`font-bold ${getScoreColor(stageData.clarityScore, 'clarity')}`}>
              {stageData.clarityScore}
            </span>
          </div>
          <FileRequestList files={stageData.fileRequests || []} title="Requested Files" />
          <QuestionList questions={stageData.questions || []} />
          {stageData.summary && <Summary summary={stageData.summary} />}
        </>
      )}

      {/* Stage 2: Plan & Validate */}
      {stage === 'stage2-plan-validate' && stageData.feasibilityScore !== undefined && (
        <>
          <div className="flex items-center gap-2">
            <File className="text-blue-500" size={16} />
            <span className="text-sm font-semibold">Feasibility Score:</span>
            <span className={`font-bold ${getScoreColor(stageData.feasibilityScore, 'feasibility')}`}>
              {stageData.feasibilityScore}
            </span>
          </div>
          <FileRequestList files={stageData.additionalFileRequests || []} title="Additional Files Needed" />
          <QuestionList questions={stageData.technicalQuestions || []} title="Technical Questions" />
          {stageData.implementationPlan && <ImplementationPlan plan={stageData.implementationPlan} />}
        </>
      )}

      {/* Stage 3: Agent Instructions */}
      {stage === 'stage3-agent-instructions' && (
        <>
          {/* Instructions Ready Banner */}
          <Card className="bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 p-4 mb-4">
            <div className="flex items-center gap-2">
              {stageData.agentInstructionsGenerated ? (
                <CheckCircle2 className="text-green-500" size={16} />
              ) : (
                <AlertCircle className="text-gray-400" size={16} />
              )}
              <span className="text-sm font-semibold">Agent Instructions Status</span>
            </div>
          </Card>
          <InstructionSteps steps={stageData.instructions?.steps || []} />
          <SafetyChecks checks={stageData.safetyChecks || []} />
          <RefinementSuggestions suggestions={stageData.refinementSuggestions || []} />
        </>
      )}
    </div>
  );
};

export default StageDisplay;