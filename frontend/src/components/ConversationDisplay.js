import React from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { CheckCircle2 } from "lucide-react";
import CopyButton from './CopyButton';
import { format } from 'date-fns';
import { FiClock } from 'react-icons/fi';

// Import shadcn components
import { Card, CardContent, CardHeader } from "./ui/card";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";

const ConversationDisplay = ({ conversationHistory }) => {
  const renderCodeBlock = (code, language = 'javascript') => {
    return (
      <div className="relative rounded-md overflow-hidden my-2">
        <div className="absolute right-2 top-2 z-10">
          <CopyButton textToCopy={code} />
        </div>
        <SyntaxHighlighter
          language={language}
          style={vs2015}
          customStyle={{
            margin: 0,
            padding: '1rem',
            paddingRight: '3rem',
            background: 'rgb(30, 30, 30)',
            borderRadius: '0.375rem'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  const renderMessage = (message) => {
    const parts = [];
    let lastIndex = 0;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    let match;

    while ((match = codeBlockRegex.exec(message.content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push(
          <p key={`text-${lastIndex}`} className="whitespace-pre-wrap mb-4">
            {message.content.slice(lastIndex, match.index)}
          </p>
        );
      }

      // Add code block
      const language = match[1] || 'javascript';
      parts.push(
        <div key={`code-${match.index}`}>
          {renderCodeBlock(match[2], language)}
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Add remaining text after last code block
    if (lastIndex < message.content.length) {
      parts.push(
        <p key={`text-${lastIndex}`} className="whitespace-pre-wrap mb-4">
          {message.content.slice(lastIndex)}
        </p>
      );
    }

    return parts;
  };

  return (
    <Card className="h-full">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">
            {conversationHistory.length} messages
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-20rem)] px-4">
          <div className="space-y-4 py-4">
            {conversationHistory.map((message, index) => (
              <div
                key={index}
                className={`flex flex-col relative ${
                  message.role === 'assistant'
                    ? 'bg-gray-50 dark:bg-gray-900 rounded-lg p-4'
                    : 'p-4'
                }`}
              >
                {message.score !== undefined && (
                  <div className="absolute right-2 top-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs font-medium ${message.score > 90 ? 'text-green-500' : 'text-gray-400'}`}>
                        {message.score}
                      </span>
                      <CheckCircle2 
                        className={message.score > 90 ? 'text-green-500' : 'text-gray-400'} 
                        size={16}
                      />
                    </div>
                  </div>
                )}
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant={message.role === 'assistant' ? 'secondary' : 'default'}>
                    {message.role === 'assistant' ? 'Assistant' : 'You'}
                  </Badge>
                  {message.model && (
                    <Badge variant="outline" className="text-xs">
                      {message.model}
                    </Badge>
                  )}
                  {message.timestamp && (
                    <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                      <FiClock className="mr-1" size={12} />
                      <span>{format(new Date(message.timestamp), 'MMM d, h:mm a')}</span>
                    </div>
                  )}
                </div>
                <div className="relative">
                  {message.content && (
                    <div className="pr-8">
                      {renderMessage(message)}
                    </div>
                  )}
                  <div className="absolute top-0 right-0">
                    <CopyButton textToCopy={message.content} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;