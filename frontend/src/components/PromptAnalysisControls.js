// Filename: frontend/src/components/PromptAnalysisControls.js
import React, { useState, useEffect, useRef } from 'react';
import { FiSearch, FiLoader, FiSettings } from 'react-icons/fi';
import { createPortal } from 'react-dom';

const Toggle = ({ enabled, onToggle, label, description }) => (
  <div className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
    <div className="flex items-center gap-4">
      <div className="flex-1 min-w-0">
        <span className="block text-sm font-medium text-gray-900 dark:text-gray-100 break-words">{label}</span>
        <span className="block text-xs text-gray-500 dark:text-gray-400 break-words">{description}</span>
      </div>
      <div className="flex-shrink-0">
        <button
          onClick={onToggle}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            enabled ? 'bg-blue-500' : 'bg-gray-200 dark:bg-gray-600'
          }`}
        >
          <span
            className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform duration-300 ${
              enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  </div>
);

const SettingsPanel = ({ 
  show, 
  onClose, 
  buttonRef,
  isAutoAnalyzeEnabled,
  onToggleAutoAnalyze,
  isAutoCopyEnabled,
  onToggleAutoCopy,
  isEnhancementEnabled,
  onToggleEnhancement,
  isAutoAddEnabled,
  onToggleAutoAdd,
}) => {
  if (!show) return null;

  const buttonRect = buttonRef.current?.getBoundingClientRect();
  const top = buttonRect ? buttonRect.bottom + 8 : 0;
  const right = buttonRect ? window.innerWidth - buttonRect.right : 0;

  return createPortal(
    <div 
      className="fixed inset-0" 
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div 
        className="fixed bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-700 w-80"
        style={{ 
          top: `${top}px`, 
          right: `${right + 12}px`,
          zIndex: 99999
        }}
        onClick={e => e.stopPropagation()}
      >
        <Toggle
          enabled={isAutoAddEnabled}
          onToggle={onToggleAutoAdd}
          label="Auto-add transcriptions"
          description="Automatically add new transcriptions to the prompt text"
        />
        <Toggle
          enabled={isAutoCopyEnabled}
          onToggle={onToggleAutoCopy}
          label="Auto-copy prompt"
          description="Copy the prompt to your clipboard every time it's updated"
        />
        <Toggle
          enabled={isAutoAnalyzeEnabled}
          onToggle={onToggleAutoAnalyze}
          label="Auto-analyze prompt"
          description="Search for files in the selected repository that are relevant to your prompt"
        />
        <Toggle
          enabled={isEnhancementEnabled}
          onToggle={onToggleEnhancement}
          label="Enhance transcriptions"
          description="Improve the readability of transcriptions"
        />
      </div>
    </div>,
    document.body
  );
};

const PromptAnalysisControls = ({ 
  promptLength, 
  minLength = 25,
  isAnalyzing, 
  isAutoAnalyzeEnabled,
  onToggleAutoAnalyze,
  isAutoCopyEnabled,
  onToggleAutoCopy,
  isEnhancementEnabled,
  onToggleEnhancement,
  isAutoAddEnabled,
  onToggleAutoAdd,
  onManualAnalyze,
  disabled
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const settingsButtonRef = useRef(null);
  const progress = Math.min((promptLength / minLength) * 100, 100);
  const showProgress = promptLength < minLength;

  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setShowSettings(false);
      }
    };

    if (showSettings) {
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
    };
  }, [showSettings]);

  return (
    <div className="relative mb-4">
      <div className="relative h-12 px-3 bg-white dark:bg-gray-800 backdrop-blur-sm rounded-lg shadow-sm">
        {/* Progress bar with gradient */}
        {showProgress && (
          <div className="absolute inset-0 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all duration-300 ease-in-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {/* Content */}
        <div className="relative h-full flex items-center justify-between">
          {/* Left side - Progress text and Analyze button */}
          <div className="flex items-center gap-2">
            {showProgress && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {minLength - promptLength} characters needed
              </div>
            )}
            {!isAutoAnalyzeEnabled && promptLength >= minLength && (
              <button
                onClick={onManualAnalyze}
                disabled={isAnalyzing}
                className="flex items-center space-x-1 px-3 py-1.5 text-sm font-medium text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-full transition-colors"
              >
                {isAnalyzing ? (
                  <>
                    <FiLoader className="w-4 h-4 animate-spin" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <FiSearch className="w-4 h-4" />
                    <span>Analyze</span>
                  </>
                )}
              </button>
            )}
          </div>

          {/* Right side - Settings */}
          <div className="relative" ref={settingsButtonRef}>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              aria-label="Settings"
            >
              <FiSettings 
                className={`w-5 h-5 text-gray-600 dark:text-gray-300 transition-transform duration-200 ${showSettings ? 'rotate-180' : ''}`} 
              />
            </button>
          </div>
        </div>
      </div>

      <SettingsPanel
        show={showSettings}
        onClose={() => setShowSettings(false)}
        buttonRef={settingsButtonRef}
        isAutoAnalyzeEnabled={isAutoAnalyzeEnabled}
        onToggleAutoAnalyze={onToggleAutoAnalyze}
        isAutoCopyEnabled={isAutoCopyEnabled}
        onToggleAutoCopy={onToggleAutoCopy}
        isEnhancementEnabled={isEnhancementEnabled}
        onToggleEnhancement={onToggleEnhancement}
        isAutoAddEnabled={isAutoAddEnabled}
        onToggleAutoAdd={onToggleAutoAdd}
      />
    </div>
  );
};

export default PromptAnalysisControls;