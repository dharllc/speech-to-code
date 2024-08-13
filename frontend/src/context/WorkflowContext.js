import React, { createContext, useReducer } from 'react';

const initialState = {
  currentStage: 'intent_understanding',
  stageData: {
    intent_understanding: null,
    code_planning: null,
    code_generation: null,
    quality_assessment: null,
    file_modification: null,
    environment_management: null,
    light_verification: null,
  },
  feedbackLoop: false,
};

function workflowReducer(state, action) {
  switch (action.type) {
    case 'SET_CURRENT_STAGE':
      return { ...state, currentStage: action.stage };
    case 'UPDATE_STAGE_DATA':
      return {
        ...state,
        stageData: {
          ...state.stageData,
          [action.stage]: action.data,
        },
      };
    case 'SET_FEEDBACK_LOOP':
      return { ...state, feedbackLoop: action.value };
    case 'RESET_WORKFLOW':
      return initialState;
    default:
      return state;
  }
}

export const WorkflowContext = createContext();

export const WorkflowProvider = ({ children }) => {
  const [state, dispatch] = useReducer(workflowReducer, initialState);

  return (
    <WorkflowContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkflowContext.Provider>
  );
};

export const useWorkflow = () => {
  const context = React.useContext(WorkflowContext);
  if (context === undefined) {
    throw new Error('useWorkflow must be used within a WorkflowProvider');
  }
  return context;
};