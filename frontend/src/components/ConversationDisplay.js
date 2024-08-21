// Filename: frontend/src/components/ConversationDisplay.js
import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './CopyButton';

const ConversationDisplay = ({ conversationHistory }) => {
  const renderCodeBlock = (code, filename) => (
    <div className="relative my-2 rounded-md overflow-hidden">
      <div className="sticky top-0 z-10 bg-gray-700 p-2 flex justify-between items-center">
        <span className="text-white text-xs">{filename}</span>
        <CopyButton
          textToCopy={code}
          className="bg-gray-600 text-white p-1 rounded text-xs hover:bg-gray-500 transition-colors duration-200"
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        <SyntaxHighlighter
          language={filename.split('.').pop()}
          style={vscDarkPlus}
          className="p-4 text-sm rounded-md"
          customStyle={{margin: 0, background: '#1E1E1E'}}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  const renderMessage = (message) => {
    const codeBlockRegex = /<code filename="(.+?)">([\s\S]+?)<\/code>/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(message.content.slice(lastIndex, match.index));
      }
      const [, filename, code] = match;
      parts.push(renderCodeBlock(code.trim(), filename));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push(message.content.slice(lastIndex));
    }

    return parts.map((part, index) =>
      typeof part === 'string' ? (
        <p key={index} className="my-1 whitespace-pre-wrap text-sm">{part}</p>
      ) : (
        React.cloneElement(part, { key: index })
      )
    );
  };

  return (
    <div className="mt-4">
      <h3 className="text-xl font-bold mb-2">Conversation:</h3>
      <div className="bg-gray-800 p-4 rounded-lg max-h-[calc(100vh-200px)] overflow-y-auto">
        {conversationHistory.map((message, index) => (
          <div key={index} className="mb-2">
            <div className={`p-2 rounded-lg ${
              message.role === 'user' ? 'bg-blue-800' : 'bg-green-800'
            }`}>
              <div className="flex justify-between items-center mb-1">
                <strong className="text-xs font-semibold">
                  {message.role === 'user' ? 'User:' : 'Assistant:'}
                </strong>
                <CopyButton
                  textToCopy={message.content}
                  className="bg-gray-700 text-white p-1 rounded text-xs hover:bg-gray-600 transition-colors duration-200"
                />
              </div>
              <div className="text-sm">
                {renderMessage(message)}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationDisplay;