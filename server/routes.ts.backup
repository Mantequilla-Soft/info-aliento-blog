import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

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
      // Use Hive API to fetch network stats
      const response = await fetch('https://api.hive.blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_dynamic_global_properties",
          "params": [],
          "id": 1
        })
      });
      
      const data = await response.json();
      res.json(data.result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch network stats' });
    }
  });

  // API route for fetching witnesses
  app.get('/api/witnesses', async (req, res) => {
    try {
      const response = await fetch('https://api.hive.blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_witnesses_by_vote",
          "params": ["", 100],
          "id": 1
        })
      });
      
      const data = await response.json();
      res.json(data.result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch witnesses' });
    }
  });

  // API route for fetching a specific witness
  app.get('/api/witness/:name', async (req, res) => {
    try {
      const { name } = req.params;
      
      const response = await fetch('https://api.hive.blog', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          "jsonrpc": "2.0",
          "method": "condenser_api.get_witness_by_account",
          "params": [name],
          "id": 1
        })
      });
      
      const data = await response.json();
      
      if (!data.result) {
        return res.status(404).json({ error: 'Witness not found' });
      }
      
      res.json(data.result);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch witness' });
    }
  });
  
  const httpServer = createServer(app);
  return httpServer;
}
