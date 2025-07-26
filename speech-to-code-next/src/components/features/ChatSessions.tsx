import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiMessageSquare, FiClock } from 'react-icons/fi';
import { CheckCircle2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import * as chatSessionService from '@/lib/services/chatSessionService';
import { ChatSession } from '@/types/chat';

// Import shadcn components
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../ui/alert-dialog";

interface ChatSessionsProps {
  onSessionSelect: (session: ChatSession | null) => void;
  activeSessionId?: string | null;
}

const ChatSessions: React.FC<ChatSessionsProps> = ({ onSessionSelect, activeSessionId }) => {
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [newTitle, setNewTitle] = useState('');
  const [editingSession, setEditingSession] = useState<ChatSession | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingSession, setDeletingSession] = useState<ChatSession | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await chatSessionService.listChatSessions();
      console.log('Chat sessions:', data); // Debug log
      // Sort sessions by most recent message timestamp
      const sortedSessions = data.sort((a, b) => {
        const aTimestamp = getLastMessageTimestamp(a);
        const bTimestamp = getLastMessageTimestamp(b);
        return bTimestamp - aTimestamp;
      });
      setSessions(sortedSessions);
    } catch (error) {
      console.error('Failed to load sessions:', error);
    }
  };

  const getLastMessageTimestamp = (session: ChatSession): number => {
    if (!session.conversation_history || session.conversation_history.length === 0) {
      return new Date(session.created_at).getTime();
    }
    const lastMessage = session.conversation_history[session.conversation_history.length - 1];
    return new Date(lastMessage?.timestamp || session.created_at).getTime();
  };

  const formatTimestamp = (session: ChatSession): string => {
    const timestamp = getLastMessageTimestamp(session);
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const handleCreateSession = async () => {
    try {
      const title = newTitle.trim() || 'New Chat';
      const session = await chatSessionService.createChatSession(title);
      setSessions(prev => [session, ...prev]);
      setNewTitle('');
      onSessionSelect(session);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;

    try {
      const updatedSession: ChatSession = {
        ...editingSession,
        title: editingTitle.trim()
      };

      await chatSessionService.updateChatSession(editingSession.id, updatedSession);
      setSessions(prev => prev.map(s => s.id === editingSession.id ? updatedSession : s));
      setShowEditDialog(false);
      setEditingSession(null);
      setEditingTitle('');
    } catch (error) {
      console.error('Failed to update session:', error);
    }
  };

  const handleDeleteSession = async () => {
    if (!deletingSession) return;

    try {
      await chatSessionService.deleteChatSession(deletingSession.id);
      setSessions(prev => prev.filter(s => s.id !== deletingSession.id));
      if (activeSessionId === deletingSession.id) {
        onSessionSelect(null);
      }
      setShowDeleteDialog(false);
      setDeletingSession(null);
    } catch (error) {
      console.error('Failed to delete session:', error);
    }
  };

  const handleEditClick = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSession(session);
    setEditingTitle(session.title);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (session: ChatSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingSession(session);
    setShowDeleteDialog(true);
  };

  const getStageCheckmarks = (session: ChatSession): boolean[] => {
    if (!session.stage_history) return [];
    
    // Get latest scores for each stage
    const latestScores = session.stage_history.reduce((acc, entry) => {
      if (entry.stage === 'stage1-understand-validate') {
        acc.stage1 = entry.clarityScore || 0;
      } else if (entry.stage === 'stage2-plan-validate') {
        acc.stage2 = entry.feasibilityScore || 0;
      } else if (entry.stage === 'stage3-agent-instructions') {
        acc.stage3 = entry.instructionQuality || 0;
      }
      return acc;
    }, { stage1: 0, stage2: 0, stage3: 0 });

    return [
      latestScores.stage1 > 90,
      latestScores.stage2 > 90,
      latestScores.stage3 > 90
    ];
  };

  return (
    <div className="h-full flex flex-col p-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Chat Sessions</h2>
        <Button onClick={handleCreateSession} size="sm" variant="outline">
          <FiPlus className="mr-1" />
          New Chat
        </Button>
      </div>

      {/* Sessions List */}
      <div className="flex-grow overflow-y-auto space-y-2">
        {sessions.map((session) => (
          <div
            key={session.id}
            className={`group flex items-center justify-between p-2 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 ${
              activeSessionId === session.id ? 'bg-gray-100 dark:bg-gray-800' : ''
            }`}
            onClick={() => onSessionSelect(session)}
          >
            <div className="flex flex-col overflow-hidden flex-grow">
              <div className="flex items-center space-x-2">
                <FiMessageSquare className="flex-shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                <div className="flex items-center">
                  <FiClock className="mr-1" size={12} />
                  <span>{formatTimestamp(session)}</span>
                </div>
                <div className="flex items-center gap-0.5">
                  {getStageCheckmarks(session).map((isComplete, index) => (
                    <CheckCircle2 
                      key={index}
                      className={isComplete ? "text-green-500" : "text-gray-400"} 
                      size={12}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100">
              <button
                onClick={(e) => handleEditClick(session, e)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
              >
                <FiEdit2 size={14} />
              </button>
              <button
                onClick={(e) => handleDeleteClick(session, e)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded text-red-500"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Session Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Chat Title</DialogTitle>
          </DialogHeader>
          <div className="p-4">
            <Input
              value={editingTitle}
              onChange={(e) => setEditingTitle(e.target.value)}
              placeholder="Chat Title"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateSession}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Chat</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this chat? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteSession} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ChatSessions;