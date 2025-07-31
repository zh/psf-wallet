import { useAtom } from 'jotai';
import { useState, useCallback } from 'react';
import { syncServerAtom, serverListAtom, serverStatusAtom } from '../atoms';

const useServerManager = () => {
  const [selectedServer, setSelectedServer] = useAtom(syncServerAtom);
  const [serverList, setServerList] = useAtom(serverListAtom);
  const [serverStatus, setServerStatus] = useAtom(serverStatusAtom);
  const [isTestingConnection, setIsTestingConnection] = useState(false);

  // Test server connection
  const testServerConnection = useCallback(async (server) => {
    try {
      setServerStatus(prev => ({ ...prev, [server.id]: 'testing' }));
      
      // Create a test request to the server
      const testUrl = `${server.url}/v5/control/getStatus`;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

      const response = await fetch(testUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        const data = await response.json();
        // Check if it's a valid bch-api response
        if (data && (data.status === 'operational' || data.success !== undefined)) {
          setServerStatus(prev => ({ ...prev, [server.id]: 'online' }));
          return { success: true, status: 'online' };
        } else {
          setServerStatus(prev => ({ ...prev, [server.id]: 'offline' }));
          return { success: false, status: 'offline', error: 'Invalid response format' };
        }
      } else {
        setServerStatus(prev => ({ ...prev, [server.id]: 'offline' }));
        return { success: false, status: 'offline', error: `HTTP ${response.status}` };
      }
    } catch (error) {
      setServerStatus(prev => ({ ...prev, [server.id]: 'offline' }));
      
      if (error.name === 'AbortError') {
        return { success: false, status: 'offline', error: 'Connection timeout' };
      }
      
      return { success: false, status: 'offline', error: error.message };
    }
  }, [setServerStatus]);

  // Test all servers
  const testAllServers = useCallback(async () => {
    setIsTestingConnection(true);
    
    const testPromises = serverList.map(server => testServerConnection(server));
    await Promise.allSettled(testPromises);
    
    setIsTestingConnection(false);
  }, [serverList, testServerConnection]);

  // Switch to a different server
  const switchServer = useCallback(async (serverId) => {
    const server = serverList.find(s => s.id === serverId);
    if (!server) {
      throw new Error('Server not found');
    }

    // Test the server before switching
    const testResult = await testServerConnection(server);
    
    if (testResult.success) {
      setSelectedServer(server);
      return { success: true };
    } else {
      throw new Error(`Cannot connect to server: ${testResult.error}`);
    }
  }, [serverList, testServerConnection, setSelectedServer]);

  // Add a custom server
  const addCustomServer = useCallback((name, url) => {
    // Validate URL
    try {
      new URL(url);
    } catch {
      throw new Error('Invalid URL format');
    }

    if (!url.startsWith('https://') && !url.startsWith('http://')) {
      throw new Error('URL must start with http:// or https://');
    }

    // Create new server object
    const newServer = {
      id: `custom-${Date.now()}`,
      name: name.trim(),
      url: url.trim().replace(/\/$/, ''), // Remove trailing slash
      type: 'custom',
      status: 'unknown'
    };

    // Check if server already exists
    const existingServer = serverList.find(s => s.url === newServer.url);
    if (existingServer) {
      throw new Error('Server already exists');
    }

    // Add to server list
    setServerList(prev => [...prev, newServer]);
    
    // Test the new server
    testServerConnection(newServer);

    return newServer;
  }, [serverList, setServerList, testServerConnection]);

  // Remove a custom server
  const removeCustomServer = useCallback((serverId) => {
    const server = serverList.find(s => s.id === serverId);
    
    if (!server) {
      throw new Error('Server not found');
    }

    if (server.type !== 'custom') {
      throw new Error('Cannot remove built-in server');
    }

    // If this is the currently selected server, switch to default
    if (selectedServer.id === serverId) {
      const defaultServer = serverList.find(s => s.type === 'free');
      if (defaultServer) {
        setSelectedServer(defaultServer);
      }
    }

    // Remove from server list
    setServerList(prev => prev.filter(s => s.id !== serverId));
    
    // Remove from status
    setServerStatus(prev => {
      const newStatus = { ...prev };
      delete newStatus[serverId];
      return newStatus;
    });
  }, [serverList, selectedServer, setServerList, setSelectedServer, setServerStatus]);

  // Get server status with icon
  const getServerStatusIcon = useCallback((serverId) => {
    const status = serverStatus[serverId];
    switch (status) {
      case 'online': return '🟢';
      case 'offline': return '🔴';
      case 'testing': return '🟡';
      default: return '⚪';
    }
  }, [serverStatus]);

  return {
    selectedServer,
    serverList,
    serverStatus,
    isTestingConnection,
    testServerConnection,
    testAllServers,
    switchServer,
    addCustomServer,
    removeCustomServer,
    getServerStatusIcon
  };
};

export default useServerManager;