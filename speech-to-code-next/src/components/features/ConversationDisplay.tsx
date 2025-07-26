import React, { useRef, type JSX } from 'react';
import { Light as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vs2015 } from 'react-syntax-highlighter/dist/esm/styles/hljs';
import { CheckCircle2, MessageSquare, Brain, Hash } from "lucide-react";
import CopyButton from './CopyButton';
import { format } from 'date-fns';
import { FiClock } from 'react-icons/fi';

// Import shadcn components
import { Card, CardContent, CardHeader } from "../ui/card";
import { Badge } from "../ui/badge";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  model?: string;
  tokens?: number;
  score?: number;
}

interface ConversationDisplayProps {
  conversationHistory: ConversationMessage[];
}

const ConversationDisplay: React.FC<ConversationDisplayProps> = ({ conversationHistory }) => {
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const scrollToMessage = (messageId: string) => {
    const element = messageRefs.current[messageId];
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const getMessageSummary = (message: ConversationMessage): string => {
    // Get first line of content or first 100 characters
    const firstLine = message.content.split('\n')[0] || '';
    return firstLine.length > 100 
      ? firstLine.substring(0, 100) + '...' 
      : firstLine;
  };

  const renderCodeBlock = (code: string, language: string = 'javascript') => {
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
            borderRadius: '0.375rem',
            fontSize: '0.875rem',
            lineHeight: '1.5'
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    );
  };

  const renderMessage = (message: ConversationMessage) => {
    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)\n```/g;
    let match: RegExpExecArray | null;

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
      const code = match[2] || '';
      parts.push(
        <div key={`code-${match.index}`}>
          {renderCodeBlock(code, language)}
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

  // Reverse the conversation history to show most recent messages on top
  const reversedHistory = [...conversationHistory].reverse();

  return (
    <Card className="h-full">
      <CardHeader className="py-2 px-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="h-4 w-4" />
            <span className="text-sm font-medium">
              {conversationHistory.length} messages
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex h-[calc(100vh-20rem)]">
          {/* Navigation Sidebar */}
          <div className="w-72 border-r flex-shrink-0">
            <ScrollArea className="h-full">
              <div className="space-y-1 p-2">
                {reversedHistory.map((message, index) => (
                  <Button
                    key={`nav-${index}`}
                    variant="ghost"
                    className="w-full justify-start text-left text-sm h-auto py-2 px-2"
                    onClick={() => scrollToMessage(`message-${index}`)}
                  >
                    <div className="flex flex-col items-start gap-1 w-full">
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <Badge variant={message.role === 'assistant' ? 'secondary' : 'default'} className="text-xs">
                            {message.role === 'assistant' ? 'Assistant' : 'You'}
                          </Badge>
                          {message.timestamp && (
                            <span className="text-xs text-gray-500">
                              {format(new Date(message.timestamp), 'h:mm a')}
                            </span>
                          )}
                        </div>
                        {message.score !== undefined && (
                          <Badge variant="outline" className="text-xs">
                            Score: {message.score}
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {message.model && (
                          <div className="flex items-center gap-1">
                            <Brain className="h-3 w-3" />
                            <span>{message.model}</span>
                          </div>
                        )}
                        {message.tokens && (
                          <div className="flex items-center gap-1">
                            <Hash className="h-3 w-3" />
                            <span>{message.tokens}t</span>
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                        {getMessageSummary(message)}
                      </span>
                    </div>
                  </Button>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Main Conversation */}
          <ScrollArea className="flex-1 px-4" type="always">
            <div className="space-y-4 py-4">
              {reversedHistory.map((message, index) => (
                <div
                  key={index}
                  ref={(el: HTMLDivElement | null) => {
                    messageRefs.current[`message-${index}`] = el;
                  }}
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
        </div>
      </CardContent>
    </Card>
  );
};

export default ConversationDisplay;