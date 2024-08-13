import React, { useState, useEffect, useContext } from 'react';
import * as promptService from '../services/promptService';
import * as llmService from '../services/llmService';
import IntentUnderstanding from './IntentUnderstanding';
import CodePlanning from './CodePlanning';
import CodeGeneration from './CodeGeneration';
import QualityAssessment from './QualityAssessment';
import FileModification from './FileModification';
import EnvironmentManagement from './EnvironmentManagement';
import LightVerification from './LightVerification';
import { WorkflowContext } from '../context/WorkflowContext';

const stages = [
  'intent_understanding',
  'code_planning',
  'code_generation',
  'quality_assessment',
  'file_modification',
  'environment_management',
  'light_verification'
];

const LLMInteraction = ({ selectedRepository }) => {
  const { state, dispatch } = useContext(WorkflowContext);
  const [prompts, setPrompts] = useState({});
  const [currentStageIndex, setCurrentStageIndex] = useState(0);

  useEffect(() => {
    loadPrompts();
  }, []);
  
  useEffect(() => {
    console.log('Current state:', state);
    console.log('Loaded prompts:', prompts);
  }, [state, prompts]);

  const loadPrompts = async () => {
    try {
      const fetchedPrompts = await promptService.getPrompts();
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const handleStageComplete = async (stage, data) => {
    console.log(`Stage ${stage} completed with data:`, data);
    dispatch({ type: 'UPDATE_STAGE_DATA', stage, data });
    console.log(`Updated state after ${stage}:`, state);
  };

  const moveToNextStage = () => {
    if (currentStageIndex < stages.length - 1) {
      setCurrentStageIndex(currentStageIndex + 1);
      dispatch({ type: 'SET_CURRENT_STAGE', stage: stages[currentStageIndex + 1] });
    }
  };

  const handleFeedback = (feedback) => {
    dispatch({ type: 'UPDATE_STAGE_DATA', stage: state.currentStage, data: { ...state.stageData[state.currentStage], feedback } });
    dispatch({ type: 'SET_FEEDBACK_LOOP', value: false });
  };

  const renderStage = (stageName) => {
    const isActive = state.currentStage === stageName;
    const commonProps = {
      isActive,
      onComplete: (data) => handleStageComplete(stageName, data),
      repository: selectedRepository,
      prompt: prompts[stageName],
      moveToNextStage,
    };

    switch (stageName) {
      case 'intent_understanding':
        return (
          <IntentUnderstanding
            {...commonProps}
            feedbackLoop={state.feedbackLoop}
            onFeedback={handleFeedback}
            previousData={state.stageData.intent_understanding}
          />
        );
      case 'code_planning':
        return (
          <CodePlanning
            {...commonProps}
            intentData={state.stageData.intent_understanding}
          />
        );
      case 'code_generation':
        return (
          <CodeGeneration
            {...commonProps}
            planningData={state.stageData.code_planning}
          />
        );
      case 'quality_assessment':
        return (
          <QualityAssessment
            {...commonProps}
            generatedCode={state.stageData.code_generation}
          />
        );
      case 'file_modification':
        return (
          <FileModification
            {...commonProps}
            modificationPlan={state.stageData.quality_assessment}
          />
        );
      case 'environment_management':
        return (
          <EnvironmentManagement
            {...commonProps}
            modificationResults={state.stageData.file_modification}
          />
        );
      case 'light_verification':
        return (
          <LightVerification
            {...commonProps}
            environmentResults={state.stageData.environment_management}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">LLM Interaction</h2>
      <div className="space-y-4">
        {stages.map((stage, index) => (
          <div key={stage} className={`${index === currentStageIndex ? '' : 'opacity-50'}`}>
            {renderStage(stage)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default LLMInteraction;