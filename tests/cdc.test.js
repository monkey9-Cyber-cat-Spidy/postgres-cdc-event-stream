const assert = require('assert');
const { CdcBroadcaster } = require('../src/cdc-broadcaster');

console.log('[TEST] Verifying PostgreSQL CDC Event Broadcaster...');

// Mock WebSocket Server
const mockClients = new Set([
  { readyState: 1, send: (d) => { receivedData = d; } },
  { readyState: 2, send: () => {} } // closed client
]);
let receivedData = null;

const broadcaster = new CdcBroadcaster({ clients: mockClients });

// Format and broadcast mutation event
const event = broadcaster.formatMutation('customer_orders', 'INSERT', 'ord-4421', null, { amount: 149.99 });
assert.strictEqual(event.table, 'customer_orders', 'Table name should match');
assert.strictEqual(event.action, 'INSERT', 'Action should match');
assert.strictEqual(event.record_id, 'ord-4421', 'Record ID should match');

const sent = broadcaster.broadcast(event);
assert.strictEqual(sent, 1, 'Should deliver to exactly 1 open client');
assert.ok(receivedData.includes('ord-4421'), 'Client payload should contain record ID');
console.log('✓ CDC payload formatting and WebSocket broadcast distribution verified');

console.log('\n[SUCCESS] All CDC tests passed cleanly!');
