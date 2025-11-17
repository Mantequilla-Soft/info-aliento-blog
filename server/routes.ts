import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createHiveChain } from '@hiveio/wax';
import WaxExtendedData from '@hiveio/wax-api-jsonrpc';

// Cached Wax chain for server routes
let serverWaxChain: any = null;

const getServerWaxChain = async () => {
  if (serverWaxChain) return serverWaxChain;
  const chain = await createHiveChain({ apiEndpoint: 'https://api.hive.blog' });
  serverWaxChain = chain.extend(WaxExtendedData);
  return serverWaxChain;
};

export async function registerRoutes(app: Express): Promise<Server> {
  // API route for fetching Hive nodes
  app.get('/api/nodes', async (req, res) => {
    try {
      const response = await fetch('https://beacon.peakd.com/api/nodes');
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch Hive nodes' });
    }
  });

  // API route for fetching network stats
  app.get('/api/network-stats', async (req, res) => {
    try {
      const chain = await getServerWaxChain();
      const result = await chain.api.condenser_api.get_dynamic_global_properties([]);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch network stats' });
    }
  });

  // API route for fetching witnesses
  app.get('/api/witnesses', async (req, res) => {
    try {
      const chain = await getServerWaxChain();
      const result = await chain.api.condenser_api.get_witnesses_by_vote(['', 100]);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch witnesses' });
    }
  });

  // API route for fetching a specific witness
  app.get('/api/witness/:name', async (req, res) => {
    try {
      const { name } = req.params;
      const chain = await getServerWaxChain();
      const result = await chain.api.condenser_api.get_witness_by_account([name]);
      
      if (!result) {
        return res.status(404).json({ error: 'Witness not found' });
      }
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch witness' });
    }
  });

  // Proxy endpoint for HAFBE API - witness voters
  app.get('/api/hafbe/witnesses/:name/voters', async (req, res) => {
    try {
      const { name } = req.params;
      const { page = '1', 'page-size': pageSize = '100', sort = 'vests', direction = 'desc' } = req.query;
      
      const url = `https://api.syncad.com/hafbe-api/witnesses/${name}/voters?page=${page}&page-size=${pageSize}&sort=${sort}&direction=${direction}`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'HAFBE API error' });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching witness voters from HAFBE:', error);
      res.status(500).json({ error: 'Failed to fetch witness voters' });
    }
  });

  // Proxy endpoint for HAFBE API - account proxy power
  app.get('/api/hafbe/accounts/:name/proxy-power', async (req, res) => {
    try {
      const { name } = req.params;
      
      const url = `https://api.syncad.com/hafbe-api/accounts/${name}/proxy-power`;
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'HAFBE API error' });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching proxy power from HAFBE:', error);
      res.status(500).json({ error: 'Failed to fetch proxy power' });
    }
  });

  // Proxy endpoint for HAFBE API - witness votes history
  app.get('/api/hafbe/witnesses/:name/votes/history', async (req, res) => {
    try {
      const { name } = req.params;
      const { page = '1', 'page-size': pageSize = '100', 'voter-name': voterName } = req.query;
      
      let url = `https://api.syncad.com/hafbe-api/witnesses/${name}/votes/history?page=${page}&page-size=${pageSize}`;
      if (voterName) {
        url += `&voter-name=${voterName}`;
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        return res.status(response.status).json({ error: 'HAFBE API error' });
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error('Error fetching votes history from HAFBE:', error);
      res.status(500).json({ error: 'Failed to fetch votes history' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
