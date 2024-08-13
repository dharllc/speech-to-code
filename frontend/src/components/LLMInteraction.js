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

  useEffect(() => {
    loadPrompts();
  }, []);

  const loadPrompts = async () => {
    try {
      const fetchedPrompts = await promptService.getPrompts();
      setPrompts(fetchedPrompts);
    } catch (error) {
      console.error('Failed to load prompts:', error);
    }
  };

  const handleStageComplete = async (stage, data) => {
    dispatch({ type: 'UPDATE_STAGE_DATA', stage, data });
    
    if (stage === 'quality_assessment') {
      if (data.score >= 75) {
        moveToNextStage(stage);
      } else {
        dispatch({ type: 'SET_FEEDBACK_LOOP', value: true });
      }
    } else {
      moveToNextStage(stage);
    }
  };

  const moveToNextStage = (currentStage) => {
    const currentIndex = stages.indexOf(currentStage);
    if (currentIndex < stages.length - 1) {
      dispatch({ type: 'SET_CURRENT_STAGE', stage: stages[currentIndex + 1] });
    }
  };

  const handleFeedback = (feedback) => {
    dispatch({ type: 'UPDATE_STAGE_DATA', stage: state.currentStage, data: { ...state.stageData[state.currentStage], feedback } });
    dispatch({ type: 'SET_FEEDBACK_LOOP', value: false });
  };

  return (
    <div className="container mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-200">LLM Interaction</h2>
      <div className="space-y-4">
        <IntentUnderstanding
          isActive={state.currentStage === 'intent_understanding'}
          onComplete={(data) => handleStageComplete('intent_understanding', data)}
          repository={selectedRepository}
          prompt={prompts.intent_understanding}
          feedbackLoop={state.feedbackLoop}
          onFeedback={handleFeedback}
          previousData={state.stageData.intent_understanding}
        />
        <CodePlanning
          isActive={state.currentStage === 'code_planning'}
          onComplete={(data) => handleStageComplete('code_planning', data)}
          intentData={state.stageData.intent_understanding}
          repository={selectedRepository}
          prompt={prompts.code_planning}
        />
        <CodeGeneration
          isActive={state.currentStage === 'code_generation'}
          onComplete={(data) => handleStageComplete('code_generation', data)}
          planningData={state.stageData.code_planning}
          repository={selectedRepository}
          prompt={prompts.code_generation}
        />
        <QualityAssessment
          isActive={state.currentStage === 'quality_assessment'}
          onComplete={(data) => handleStageComplete('quality_assessment', data)}
          generatedCode={state.stageData.code_generation}
          repository={selectedRepository}
          prompt={prompts.quality_assessment}
        />
        <FileModification
          isActive={state.currentStage === 'file_modification'}
          onComplete={(data) => handleStageComplete('file_modification', data)}
          modificationPlan={state.stageData.quality_assessment}
          repository={selectedRepository}
        />
        <EnvironmentManagement
          isActive={state.currentStage === 'environment_management'}
          onComplete={(data) => handleStageComplete('environment_management', data)}
          modificationResults={state.stageData.file_modification}
          repository={selectedRepository}
        />
        <LightVerification
          isActive={state.currentStage === 'light_verification'}
          onComplete={(data) => handleStageComplete('light_verification', data)}
          environmentResults={state.stageData.environment_management}
          repository={selectedRepository}
        />
      </div>
    </div>
  );
};

export default LLMInteraction;