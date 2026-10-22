const clients = new Set();

const attachLiveClient = (req, res) => {
  const userId = String(req.query.userId || '');
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no'
  });
  res.write('retry: 3000\n\n');
  res.write(`event: connected\ndata: ${JSON.stringify({ connected: true })}\n\n`);
  const client = { response: res, userId };
  clients.add(client);

  const heartbeat = setInterval(() => {
    try {
      res.write(': keep-alive\n\n');
    } catch (err) {
      clearInterval(heartbeat);
      clients.delete(client);
    }
  }, 25000);

  req.on('close', () => {
    clearInterval(heartbeat);
    clients.delete(client);
  });
};

const publishLiveUpdate = (type) => {
  const event = `event: ${type}\ndata: ${JSON.stringify({ type, updatedAt: new Date().toISOString() })}\n\n`;
  for (const client of clients) {
    try {
      client.response.write(event);
    } catch (error) {
      clients.delete(client);
      console.warn('Removed disconnected live update client:', error.message);
    }
  }
};

const hasLiveUser = (userId) => [...clients].some(client => client.userId === String(userId));

const publishUserNotification = (userId, notification) => {
  const targetId = String(userId || '');
  if (!targetId) return false;
  const event = `event: notification\ndata: ${JSON.stringify(notification)}\n\n`;
  let delivered = false;
  for (const client of clients) {
    if (client.userId !== targetId) continue;
    try {
      client.response.write(event);
      delivered = true;
    } catch (error) {
      clients.delete(client);
      console.warn('Removed disconnected live notification client:', error.message);
    }
  }
  return delivered;
};

module.exports = { attachLiveClient, publishLiveUpdate, publishUserNotification, hasLiveUser };
