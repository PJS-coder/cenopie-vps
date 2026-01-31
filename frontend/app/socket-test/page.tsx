'use client';

import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';

export default function SocketTestPage() {
  const [logs, setLogs] = useState<string[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  useEffect(() => {
    const token = localStorage.getItem('authToken') || localStorage.getItem('token');
    
    if (!token) {
      addLog('❌ No auth token found');
      return;
    }

    addLog('🔑 Auth token found: ' + token.substring(0, 20) + '...');

    // Test different socket configurations
    const testConfigs = [
      {
        name: 'Production HTTPS',
        url: 'https://cenopie.com',
        options: { transports: ['polling', 'websocket'] }
      },
      {
        name: 'Production HTTP',
        url: 'http://cenopie.com',
        options: { transports: ['polling', 'websocket'] }
      },
      {
        name: 'Production with Port',
        url: 'https://cenopie.com:4000',
        options: { transports: ['polling', 'websocket'] }
      },
      {
        name: 'Polling Only',
        url: 'https://cenopie.com',
        options: { transports: ['polling'] }
      }
    ];

    let currentTest = 0;

    const testConnection = (config: any) => {
      addLog(`🧪 Testing: ${config.name} - ${config.url}`);
      
      const testSocket = io(config.url, {
        auth: { token },
        timeout: 10000,
        ...config.options
      });

      testSocket.on('connect', () => {
        addLog(`✅ ${config.name} - Connected! Transport: ${testSocket.io.engine.transport.name}`);
        setIsConnected(true);
        setSocket(testSocket);
      });

      testSocket.on('connect_error', (error) => {
        addLog(`❌ ${config.name} - Error: ${error.message}`);
        testSocket.disconnect();
        
        // Try next configuration
        currentTest++;
        if (currentTest < testConfigs.length) {
          setTimeout(() => testConnection(testConfigs[currentTest]), 2000);
        } else {
          addLog('🔚 All tests completed');
        }
      });

      testSocket.on('disconnect', (reason) => {
        addLog(`🔌 ${config.name} - Disconnected: ${reason}`);
        setIsConnected(false);
      });
    };

    // Start testing
    testConnection(testConfigs[0]);

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, []);

  const sendTestMessage = () => {
    if (socket && isConnected) {
      addLog('📤 Sending test message...');
      socket.emit('test_message', { message: 'Hello from test page!' });
    } else {
      addLog('❌ Socket not connected');
    }
  };

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Socket.IO Connection Test</h1>
        
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-center gap-4 mb-4">
            <div className={`w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span className="font-semibold">
              Status: {isConnected ? 'Connected' : 'Disconnected'}
            </span>
            <button
              onClick={sendTestMessage}
              disabled={!isConnected}
              className="px-4 py-2 bg-blue-500 text-white rounded disabled:opacity-50"
            >
              Send Test Message
            </button>
            <button
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-500 text-white rounded"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div className="bg-black text-green-400 rounded-lg p-4 font-mono text-sm">
          <h2 className="text-white mb-2">Connection Logs:</h2>
          <div className="max-h-96 overflow-y-auto">
            {logs.map((log, index) => (
              <div key={index} className="mb-1">
                {log}
              </div>
            ))}
            {logs.length === 0 && (
              <div className="text-gray-500">No logs yet...</div>
            )}
          </div>
        </div>

        <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-semibold text-yellow-800 mb-2">Instructions:</h3>
          <ol className="list-decimal list-inside text-yellow-700 space-y-1">
            <li>Open this page on cenopie.com</li>
            <li>Check the connection logs above</li>
            <li>Look for successful connections (green checkmarks)</li>
            <li>Note which transport method works (polling vs websocket)</li>
            <li>If all fail, check your server configuration</li>
          </ol>
        </div>
      </div>
    </div>
  );
}