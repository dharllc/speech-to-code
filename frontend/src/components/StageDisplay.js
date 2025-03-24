import React from 'react';
import { FiFile, FiCheckCircle, FiAlertCircle } from 'react-icons/fi';

const StageDisplay = ({ stageData, stage }) => {
  if (!stageData) return null;

  const getScoreColor = (score, type = 'clarity') => {
    if (type === 'clarity') {
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

  const FileRequestList = ({ files, title }) => {
    if (!files || files.length === 0) return null;
    return (
      <div className="mt-2">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <FiFile className="inline" size={14} />
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

  const QuestionList = ({ questions, title = "Questions" }) => {
    if (!questions || questions.length === 0) return null;
    return (
      <div className="mt-2">
        <h4 className="text-sm font-semibold flex items-center gap-1">
          <FiAlertCircle className="inline" size={14} />
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

  const Summary = ({ summary }) => {
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

  const ImplementationPlan = ({ plan }) => {
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

  return (
    <div className="border rounded-lg p-3 bg-white dark:bg-gray-800 shadow-sm space-y-2">
      {/* Stage 1: Understand & Validate */}
      {stage === 'stage1-understand-validate' && stageData.clarityScore !== undefined && (
        <>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-blue-500" size={16} />
            <span className="text-sm font-semibold">Clarity Score:</span>
            <span className={`font-bold ${getScoreColor(stageData.clarityScore, 'clarity')}`}>
              {stageData.clarityScore}
            </span>
          </div>
          <FileRequestList files={stageData.fileRequests} title="Requested Files" />
          <QuestionList questions={stageData.questions} />
          <Summary summary={stageData.summary} />
        </>
      )}

      {/* Stage 2: Plan & Validate */}
      {stage === 'stage2-plan-validate' && stageData.feasibilityScore !== undefined && (
        <>
          <div className="flex items-center gap-2">
            <FiCheckCircle className="text-blue-500" size={16} />
            <span className="text-sm font-semibold">Feasibility Score:</span>
            <span className={`font-bold ${getScoreColor(stageData.feasibilityScore, 'feasibility')}`}>
              {stageData.feasibilityScore}
            </span>
          </div>
          <FileRequestList files={stageData.additionalFileRequests} title="Additional Files Needed" />
          <QuestionList questions={stageData.technicalQuestions} title="Technical Questions" />
          <ImplementationPlan plan={stageData.implementationPlan} />
        </>
      )}
    </div>
  );
};

export default StageDisplay; 