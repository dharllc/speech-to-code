// File: frontend/src/components/PromptPreview.js
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_URL } from '../config/api';

/**
 * We'll only treat certain lines as structured tags if they match
 * one of the following patterns exactly:
 *   <user_request>
 *   </user_request>
 *   <repository_structure>
 *   </repository_structure>
 *   <file path="SOMEPATH">
 *   </file>
 */
const structuredTagRegex = new RegExp(
  [
    '^<user_request>$',
    '^</user_request>$',
    '^<repository_structure>$',
    '^</repository_structure>$',
    '^<file\\s+path="[^"]+">$',
    '^</file>$'
  ].join('|')
);

/**
 * Matches <file path="SOMEPATH">
 * and captures "SOMEPATH".
 */
const filePathOpenTagRegex = /^<file\s+path="([^"]+)">$/;

/**
 * Calls your /count_tokens endpoint to count tokens in a block of text.
 */
async function fetchTokenCount(text) {
  try {
    if (!text.trim()) return 0;
    const resp = await axios.post(`${API_URL}/count_tokens`, {
      text,
      model: 'gpt-3.5-turbo'
    });
    return resp.data.count || 0;
  } catch (err) {
    console.error('Failed to count tokens for preview:', err);
    // fallback: approximate by splitting on whitespace
    return text.split(/\s+/).length;
  }
}

/**
 * Checks if an array of lines is all blank/whitespace.
 */
function isAllWhitespace(lines) {
  return lines.every(line => !line.trim());
}

/**
 * parseStructuredPrompt():
 * - Splits the entire prompt by line.
 * - For each line:
 *   - If it matches one of our recognized tags,
 *       => flush any buffered content
 *       => add a tag segment
 *   - Otherwise => accumulate lines in a buffer
 * - After looping, flush any leftover content.
 *
 * Additionally, we track <file path="..."> in a stack so that when we see
 * `</file>`, we can rewrite it as `</file path="theSamePath">`.
 */
function parseStructuredPrompt(structuredPrompt) {
  const lines = structuredPrompt.split('\n');
  const segments = [];

  let buffer = [];
  const filePathStack = [];

  const flushBufferAsContent = () => {
    // Only add a content segment if it's NOT all blank lines
    if (buffer.length > 0 && !isAllWhitespace(buffer)) {
      segments.push({ type: 'content', lines: buffer });
    }
    buffer = [];
  };

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check if this line is a recognized tag
    if (structuredTagRegex.test(trimmedLine)) {
      // Flush any buffered content first
      flushBufferAsContent();

      // Now handle the tag line
      if (filePathOpenTagRegex.test(trimmedLine)) {
        // It's an opening file tag
        const match = trimmedLine.match(filePathOpenTagRegex);
        const path = match[1];
        filePathStack.push(path);

        segments.push({
          type: 'tag',
          text: `<file path="${path}">`
        });
      } else if (trimmedLine === '</file>') {
        // It's a closing file tag
        const path = filePathStack.pop() || ''; // pop or fallback
        segments.push({
          type: 'tag',
          text: `</file path="${path}">`
        });
      } else {
        // It's some other recognized tag (user_request, repository_structure, etc.)
        segments.push({
          type: 'tag',
          text: trimmedLine
        });
      }
    } else {
      // It's normal content, accumulate
      buffer.push(line);
    }
  }

  // After finishing all lines, flush any leftover content
  flushBufferAsContent();

  return segments;
}

const PromptPreview = ({ structuredPrompt }) => {
  const [segments, setSegments] = useState([]);
  const [tokenCounts, setTokenCounts] = useState({}); // index -> token count

  useEffect(() => {
    // 1) Parse into segments
    const segs = parseStructuredPrompt(structuredPrompt);
    setSegments(segs);

    // 2) For each content segment, call /count_tokens
    (async () => {
      const newCounts = {};
      for (let i = 0; i < segs.length; i++) {
        if (segs[i].type === 'content') {
          const contentText = segs[i].lines.join('\n');
          const count = await fetchTokenCount(contentText);
          newCounts[i] = count;
        }
      }
      setTokenCounts(newCounts);
    })();
  }, [structuredPrompt]);

  const tagStyle = "font-bold text-green-600 dark:text-green-300 px-2 py-0.5";
  const contentStyle = "text-blue-600 dark:text-blue-300 italic px-2 py-1 my-1 bg-gray-100/30 dark:bg-gray-700/30 rounded";

  return (
    <div className="bg-gray-50 dark:bg-gray-800 rounded-md overflow-hidden border border-gray-200 dark:border-gray-700">
      <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Prompt Preview
        </h3>
      </div>
      
      <div className="p-4">
        <div className="h-64 overflow-y-auto text-xs text-gray-800 dark:text-gray-100 whitespace-pre-wrap rounded-md border border-gray-200 dark:border-gray-700 bg-white/50 dark:bg-gray-900/50 px-3 py-2">
          {segments.length === 0 ? (
            <div className="text-gray-400 dark:text-gray-500 italic flex items-center justify-center h-full">
              No content to preview
            </div>
          ) : (
            segments.map((seg, index) => {
              if (seg.type === 'tag') {
                // Show the tag line in green
                return (
                  <div key={index} className={tagStyle}>
                    {seg.text}
                  </div>
                );
              } else if (seg.type === 'content') {
                // Show a placeholder for content
                const count = tokenCounts[index] || 0;
                return (
                  <div key={index} className={contentStyle}>
                    [ {count} tokens ]
                  </div>
                );
              }
              return null;
            })
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptPreview;