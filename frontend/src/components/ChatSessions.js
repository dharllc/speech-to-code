import React, { useState, useEffect } from 'react';
import { FiPlus, FiTrash2, FiEdit2, FiMessageSquare, FiClock } from 'react-icons/fi';
import { format, formatDistanceToNow } from 'date-fns';
import * as chatSessionService from '../services/chatSessionService';

// Import shadcn components
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "../components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "../components/ui/alert-dialog";

const ChatSessions = ({ onSessionSelect, activeSessionId }) => {
  const [sessions, setSessions] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [editingSession, setEditingSession] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [deletingSession, setDeletingSession] = useState(null);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    try {
      const data = await chatSessionService.listChatSessions();
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

  const getLastMessageTimestamp = (session) => {
    if (!session.conversation_history || session.conversation_history.length === 0) {
      return new Date(session.created_at).getTime();
    }
    const lastMessage = session.conversation_history[session.conversation_history.length - 1];
    return new Date(lastMessage.timestamp || session.created_at).getTime();
  };

  const formatTimestamp = (session) => {
    const timestamp = getLastMessageTimestamp(session);
    return formatDistanceToNow(timestamp, { addSuffix: true });
  };

  const generateDefaultTitle = (userPrompt) => {
    if (!userPrompt) return 'New Chat';
    
    // Remove HTML tags
    const textWithoutTags = userPrompt.replace(/<[^>]*>/g, '');
    
    // Get first three words
    const words = textWithoutTags.trim().split(/\s+/);
    const title = words.slice(0, 3).join(' ');
    
    return title || 'New Chat';
  };

  const handleCreateSession = async () => {
    try {
      const title = newTitle.trim() || 'New Chat';
      const session = await chatSessionService.createChatSession(title);
      setSessions(prev => [session, ...prev]);
      setNewTitle('');
      setIsCreating(false);
      onSessionSelect(session);
    } catch (error) {
      console.error('Failed to create session:', error);
    }
  };

  const handleUpdateSession = async () => {
    if (!editingSession) return;

    try {
      const updatedSession = {
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

  const handleEditClick = (session, e) => {
    e.stopPropagation();
    setEditingSession(session);
    setEditingTitle(session.title);
    setShowEditDialog(true);
  };

  const handleDeleteClick = (session, e) => {
    e.stopPropagation();
    setDeletingSession(session);
    setShowDeleteDialog(true);
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
            <div className="flex flex-col overflow-hidden">
              <div className="flex items-center space-x-2">
                <FiMessageSquare className="flex-shrink-0" />
                <span className="truncate">{session.title}</span>
              </div>
              <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mt-1">
                <FiClock className="mr-1" size={12} />
                <span>{formatTimestamp(session)}</span>
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