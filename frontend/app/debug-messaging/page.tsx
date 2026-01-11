'use client';

import { useEffect, useState } from 'react';
import { useMessageContext } from '@/context/MessageContext';
import { useMessaging } from '@/hooks/useMessaging';
import { Button } from '@/components/ui/button';

export default function DebugMessagingPage() {
  const messageContext = useMessageContext();
  const messaging = useMessaging();
  const [logs, setLogs] = useState<string[]>([]);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    addLog('Debug page loaded');
    addLog(`MessageContext unread count: ${messageContext.unreadCount}`);
    addLog(`Messaging hook total unread: ${messaging.getTotalUnreadCount()}`);
    addLog(`Conversations loaded: ${messaging.conversations.length}`);
    addLog(`Loading state: ${messaging.loading}`);
  }, []);

  useEffect(() => {
    addLog(`MessageContext unread count changed to: ${messageContext.unreadCount}`);
  }, [messageContext.unreadCount]);

  useEffect(() => {
    const total = messaging.getTotalUnreadCount();
    addLog(`Messaging hook unread count changed to: ${total}`);
  }, [messaging.unreadCounts]);

  const testDispatchEvent = () => {
    const testCount = Math.floor(Math.random() * 10) + 1;
    addLog(`Dispatching test unread count event: ${testCount}`);
    window.dispatchEvent(new CustomEvent('unreadCountUpdate', { 
      detail: { count: testCount } 
    }));
  };

  const refreshData = () => {
    addLog('Refreshing messaging data...');
    messaging.loadConversations();
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Messaging System Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">MessageContext State</h2>
          <div className="space-y-2 text-sm">
            <div>Unread Count: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{messageContext.unreadCount}</span></div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
          <h2 className="text-lg font-semibold mb-3">Messaging Hook State</h2>
          <div className="space-y-2 text-sm">
            <div>Total Unread: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{messaging.getTotalUnreadCount()}</span></div>
            <div>Conversations: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{messaging.conversations.length}</span></div>
            <div>Loading: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{messaging.loading.toString()}</span></div>
            <div>Connected: <span className="font-mono bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">{messaging.isConnected.toString()}</span></div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border mb-6">
        <h2 className="text-lg font-semibold mb-3">Conversations</h2>
        <div className="space-y-2">
          {messaging.conversations.length === 0 ? (
            <p className="text-gray-500">No conversations loaded</p>
          ) : (
            messaging.conversations.map((conv, index) => (
              <div key={conv._id} className="flex justify-between items-center p-2 bg-gray-50 dark:bg-gray-700 rounded">
                <span className="text-sm">
                  {conv.name || conv.otherParticipant?.name || 'Unknown'}
                </span>
                <span className="text-xs bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                  {conv.unreadCount} unread
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Button onClick={testDispatchEvent} variant="outline">
          Test Dispatch Event
        </Button>
        <Button onClick={refreshData} variant="outline">
          Refresh Data
        </Button>
      </div>

      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h2 className="text-lg font-semibold mb-3">Debug Logs</h2>
        <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded font-mono text-xs max-h-96 overflow-y-auto">
          {logs.length === 0 ? (
            <p className="text-gray-500">No logs yet</p>
          ) : (
            logs.map((log, index) => (
              <div key={index} className="mb-1">{log}</div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}