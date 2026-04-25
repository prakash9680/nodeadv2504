require('dotenv').config({ path: require('path').join(__dirname, '..', '..', '.env') });

const amqp = require('amqplib');

let channel = null;

async function getChannel() {
  if (channel) return channel;
  const conn = await amqp.connect(process.env.RABBITMQ_URL);
  channel = await conn.createChannel();
  await channel.prefetch(1);
  return channel;
}

async function publish(queue, message) {
  const ch = await getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.sendToQueue(queue, Buffer.from(JSON.stringify(message)), {
    persistent: true,
    headers: {
      documentId: message.documentId || '',
      fileName: message.originalName || '',
      userId: message.userId || '',
      publishedAt: new Date().toISOString(),
    },
  });
}

async function consume(queue, handler) {
  const ch = await getChannel();
  await ch.assertQueue(queue, { durable: true });
  ch.consume(queue, async (msg) => {
    if (!msg) return;
    try {
      await handler(JSON.parse(msg.content.toString()));
      ch.ack(msg);
    } catch {
      ch.nack(msg, false, false);
    }
  });
}

module.exports = { publish, consume };
