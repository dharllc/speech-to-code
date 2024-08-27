import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './CopyButton';

const ConversationDisplay = ({ conversationHistory }) => {
  const renderCodeBlock = (code, language) => (
    <div className="relative my-1 rounded-md overflow-hidden">
      <div className="sticky top-0 z-10 bg-gray-700 p-1 flex justify-between items-center">
        <span className="text-white text-xs">{language}</span>
        <CopyButton
          textToCopy={code}
          className="bg-gray-600 text-white p-1 rounded text-xs hover:bg-gray-500 transition-colors duration-200"
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          className="p-2 text-xs rounded-md"
          customStyle={{margin: 0, background: '#1E1E1E'}}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );

  const renderMessage = (message) => {
    const codeBlockRegex = /```(\w+)?\n([\s\S]+?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      if (match.index > lastIndex) {
        parts.push(message.content.slice(lastIndex, match.index));
      }
      const [, language = 'plaintext', code] = match;
      parts.push(renderCodeBlock(code.trim(), language));
      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < message.content.length) {
      parts.push(message.content.slice(lastIndex));
    }

    return parts.map((part, index) =>
      typeof part === 'string' ? (
        <p key={index} className="my-0.5 whitespace-pre-wrap text-xs">{part}</p>
      ) : (
        React.cloneElement(part, { key: index })
      )
    );
  };

  return (
    <div className="mt-2">
      <h3 className="text-lg font-bold mb-1">Conversation:</h3>
      <div className="bg-gray-800 p-2 rounded-lg max-h-[calc(100vh-150px)] overflow-y-auto">
        {conversationHistory.map((message, index) => (
          <div key={index} className="mb-1">
            <div className={`p-1 rounded-lg ${
              message.role === 'user' ? 'bg-blue-800' : 'bg-green-800'
            }`}>
              <div className="flex justify-between items-center mb-0.5">
                <strong className="text-xs font-semibold">
                  {message.role === 'user' ? 'User:' : 'Assistant:'}
                </strong>
                <CopyButton
                  textToCopy={message.content}
                  className="bg-gray-700 text-white p-0.5 rounded text-xs hover:bg-gray-600 transition-colors duration-200"
                />
              </div>
              <div className={`text-xs ${message.role === 'user' ? 'max-h-20 overflow-y-auto' : ''}`}>
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