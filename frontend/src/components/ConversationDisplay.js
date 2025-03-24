import React from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import CopyButton from './CopyButton';
import { Card, CardContent } from "./ui/card";
import { Bot, User } from 'lucide-react';

const ConversationDisplay = ({ conversationHistory }) => {
  const renderCodeBlock = (code, language) => (
    <div className="relative my-1 rounded-md overflow-hidden border border-gray-200 dark:border-gray-800">
      <div className="sticky top-0 z-10 bg-gray-100/50 dark:bg-gray-800/50 backdrop-blur-sm p-1 flex justify-between items-center border-b border-gray-200 dark:border-gray-800">
        <span className="text-gray-600 dark:text-gray-300 text-xs">{language}</span>
        <CopyButton
          textToCopy={code}
          className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 p-1 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
        />
      </div>
      <div className="max-h-80 overflow-y-auto">
        <SyntaxHighlighter
          language={language}
          style={vscDarkPlus}
          className="p-2 text-xs rounded-md"
          customStyle={{margin: 0, background: 'rgb(30, 30, 30)'}}
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
        <p key={index} className="my-0.5 whitespace-pre-wrap text-xs text-gray-900 dark:text-gray-100">{part}</p>
      ) : (
        React.cloneElement(part, { key: index })
      )
    );
  };

  // Reverse the conversation history to show newest messages at the top
  const reversedHistory = [...conversationHistory].reverse();

  return (
    <Card className="mt-4">
      <CardContent className="p-6">
        <div className="flex items-center justify-between py-4 mb-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-base font-medium text-gray-900 dark:text-gray-100">Chat</h3>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {conversationHistory.length} message{conversationHistory.length !== 1 ? 's' : ''}
          </div>
        </div>
        <div className="h-[calc(100vh-400px)] overflow-y-auto">
          <div className="space-y-4">
            {reversedHistory.map((message, index) => (
              <div 
                key={index} 
                className={`rounded-lg p-4 transition-colors ${
                  message.role === 'user' 
                    ? "bg-blue-50 hover:bg-blue-100 dark:bg-blue-900/20 dark:hover:bg-blue-900/30" 
                    : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800/50 dark:hover:bg-gray-800/70"
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <div className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 ${
                      message.role === 'user'
                        ? "bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300"
                        : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                    }`}>
                      {message.role === 'user' ? (
                        <>
                          <User size={12} />
                          <span>User</span>
                        </>
                      ) : (
                        <>
                          <Bot size={12} />
                          <span>{message.model || 'Assistant'}</span>
                        </>
                      )}
                    </div>
                    {message.role === 'assistant' && message.tokenCount && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {message.tokenCount} tokens
                      </span>
                    )}
                  </div>
                  <CopyButton
                    textToCopy={message.content}
                    className="bg-white dark:bg-gray-900 text-gray-600 dark:text-gray-300 p-1.5 rounded text-xs hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
                  />
                </div>
                <div className={`text-sm leading-relaxed ${message.role === 'user' ? "max-h-20 overflow-y-auto" : ""}`}>
                  {renderMessage(message)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;