const { MongoClient, GridFSBucket } = require('mongodb');
const url = process.env.MONGO_URI || 'mongodb://localhost:27017/stealthcam';
let client = null;
async function connect() {
  if (!client) client = new MongoClient(url);
  if (!client.isConnected?.()) await client.connect();
  const db = client.db();
  return { db, bucket: new GridFSBucket(db, { bucketName: 'snapshots' }) };
}

async function saveBuffer(filename, buffer, metadata = {}) {
  const { bucket } = await connect();
  return new Promise((resolve, reject) => {
    const upload = bucket.openUploadStream(filename, { metadata });
    upload.end(buffer);
    upload.on('finish', () => resolve(upload.id));
    upload.on('error', reject);
  });
}

module.exports = { saveBuffer };
