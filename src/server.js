const http = require('http');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { WebSocketServer } = require('ws');
const { CdcBroadcaster } = require('./cdc-broadcaster');

const app = express();
app.use(helmet());
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const broadcaster = new CdcBroadcaster(wss);

wss.on('connection', (ws, req) => {
  console.log(`[CDC WSS] New client connected from ${req.socket.remoteAddress}`);
  ws.send(JSON.stringify({ status: 'connected', channel: 'cdc_events_stream' }));

  ws.on('close', () => {
    console.log('[CDC WSS] Client disconnected');
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'postgres-cdc-event-stream',
    active_websocket_subscribers: wss.clients.size,
    timestamp: new Date().toISOString()
  });
});

// Simulation Trigger Endpoint (for live testing without requiring full local Postgres)
app.post('/api/cdc/emit', (req, res) => {
  const { table = 'customer_orders', action = 'INSERT', recordId = 'ord-999', newData = {} } = req.body;
  const event = broadcaster.formatMutation(table, action, recordId, null, newData);
  const sent = broadcaster.broadcast(event);

  res.json({
    status: 'broadcasted',
    delivered_to_clients: sent,
    event
  });
});

const PORT = process.env.PORT || 6001;
server.listen(PORT, () => {
  console.log(`[CDC-STREAM] HTTP & WebSocket Server running on port ${PORT}`);
});

module.exports = { app, server, broadcaster };
