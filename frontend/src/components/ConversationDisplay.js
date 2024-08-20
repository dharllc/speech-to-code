import React, { useRef, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './CopyButton';

const ConversationDisplay = ({ conversationHistory }) => {
  const conversationRef = useRef(null);

  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop = 0;
    }
  }, [conversationHistory]);

  const renderCodeBlock = (code, filename) => {
    const language = filename.split('.').pop();
    return (
      <div className="relative my-2 rounded-md overflow-hidden">
        <div className="absolute top-2 right-2 z-10">
          <CopyButton
            textToCopy={code}
            className="bg-gray-700 text-white p-1 rounded text-xs hover:bg-gray-600 transition-colors duration-200"
          />
        </div>
        <div className="bg-gray-700 text-white text-xs p-2">{filename}</div>
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          className="p-4 text-sm rounded-md"
          customStyle={{
            margin: 0,
            background: '#1E1E1E',
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

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
        <p key={index} className="my-1 whitespace-pre-wrap">{part}</p>
      ) : (
        React.cloneElement(part, { key: index })
      )
    );
  };

  return (
    <div className="mt-6">
      <h3 className="text-2xl font-bold mb-4">Conversation:</h3>
      <div
        ref={conversationRef}
        className="bg-gray-800 p-6 rounded-lg h-[600px] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-gray-800"
      >
        {conversationHistory.map((message, index) => (
          <div
            key={index}
            className={`mb-4 p-4 rounded-lg ${message.role === 'user' ? 'bg-blue-800' : 'bg-green-800'}`}
          >
            <div className="flex justify-between items-start">
              <strong className="text-sm font-semibold">
                {message.role === 'user' ? 'User:' : 'Assistant:'}
              </strong>
              {message.role === 'assistant' && (
                <CopyButton
                  textToCopy={message.content}
                  className="bg-gray-700 text-white p-1 rounded text-xs hover:bg-gray-600 transition-colors duration-200"
                />
              )}
            </div>
            <div className="text-sm mt-2">{renderMessage(message)}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ConversationDisplay;