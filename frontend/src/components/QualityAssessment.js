import React, { useState, useEffect } from 'react';
import * as llmService from '../services/llmService';

const QualityAssessment = ({ isActive, onComplete, generatedCode, repository, prompt }) => {
  const [assessment, setAssessment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (isActive && generatedCode) {
      performQualityAssessment();
    }
  }, [isActive, generatedCode]);

  const performQualityAssessment = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await llmService.getQualityAssessment(prompt, generatedCode, repository);
      setAssessment(result);
      onComplete(result);
    } catch (err) {
      setError('Failed to perform quality assessment. Please try again.');
      console.error('Quality assessment error:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isActive) return null;

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
      <h3 className="text-xl font-semibold mb-4 text-gray-800 dark:text-gray-200">Quality Assessment</h3>
      {loading && <p className="text-gray-600 dark:text-gray-400">Performing quality assessment...</p>}
      {error && <p className="text-red-500">{error}</p>}
      {assessment && (
        <div>
          <p className="mb-2 text-gray-700 dark:text-gray-300">Score: {assessment.score}</p>
          <p className="mb-2 text-gray-700 dark:text-gray-300">Recommendation: {assessment.recommendation}</p>
          <h4 className="font-semibold mt-4 mb-2 text-gray-800 dark:text-gray-200">Assessment Details:</h4>
          <ul className="list-disc pl-5 text-gray-700 dark:text-gray-300">
            {assessment.details.map((detail, index) => (
              <li key={index}>{detail}</li>
            ))}
          </ul>
          {assessment.score < 75 && (
            <div className="mt-4">
              <p className="text-yellow-600 dark:text-yellow-400">The quality score is below the threshold. Please review the assessment and consider making improvements before proceeding.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default QualityAssessment;