const admin = require('firebase-admin');
const path = require('path');

const serviceAccountPath = path.resolve(__dirname, '../../firebase-admin.json');

try {
  const serviceAccount = require(serviceAccountPath);
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
  console.log('✅ Firebase Admin SDK initialized for project:', serviceAccount.project_id);
} catch (error) {
  console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
}

module.exports = admin;
