class CdcBroadcaster {
  constructor(wss) {
    this.wss = wss;
    this.clientCount = 0;
  }

  broadcast(event) {
    const payload = typeof event === 'string' ? event : JSON.stringify(event);
    let sentCount = 0;

    for (const client of this.wss.clients) {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(payload);
        sentCount++;
      }
    }

    return sentCount;
  }

  formatMutation(table, action, recordId, oldData, newData) {
    return {
      table,
      action: action.toUpperCase(),
      record_id: recordId,
      old_data: oldData || null,
      new_data: newData || null,
      emitted_at: new Date().toISOString()
    };
  }
}

module.exports = { CdcBroadcaster };
