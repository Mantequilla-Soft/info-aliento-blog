import express from "express";
import type { VercelRequest, VercelResponse } from "@vercel/node";

// Import your routes
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add your API routes here
app.get("/api/health", (req, res) => {
  res.json({ status: "ok" });
});

// Witness endpoints
app.get("/api/witnesses", async (req, res) => {
  try {
    const hiveNode = "https://api.hive.blog";
    const response = await fetch(hiveNode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "condenser_api.get_witnesses_by_vote",
        params: ["", 100],
        id: 1,
      }),
    });
    const data = await response.json();
    res.json(data.result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch witnesses" });
  }
});

// Network stats
app.get("/api/network-stats", async (req, res) => {
  try {
    const hiveNode = "https://api.hive.blog";
    const response = await fetch(hiveNode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "condenser_api.get_dynamic_global_properties",
        params: [],
        id: 1,
      }),
    });
    const data = await response.json();
    res.json(data.result);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch network stats" });
  }
});

// Account info
app.get("/api/account/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const hiveNode = "https://api.hive.blog";
    const response = await fetch(hiveNode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "condenser_api.get_accounts",
        params: [[username]],
        id: 1,
      }),
    });
    const data = await response.json();
    res.json(data.result?.[0] || null);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch account" });
  }
});

// Recent activity
app.get("/api/account/:username/activity", async (req, res) => {
  try {
    const { username } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const hiveNode = "https://api.hive.blog";
    const response = await fetch(hiveNode, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "condenser_api.get_account_history",
        params: [username, -1, limit],
        id: 1,
      }),
    });
    const data = await response.json();
    res.json(data.result || []);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch activity" });
  }
});

// Export for Vercel
export default (req: VercelRequest, res: VercelResponse) => {
  return app(req as any, res as any);
};
