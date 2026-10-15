const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

async function testMongoDB() {
  console.log('\n========================================');
  console.log('       MONGODB HEALTH CHECK TOOL       ');
  console.log('========================================\n');

  const uri = process.env.VITE_MONGODB_URI;

  if (!uri) {
    console.error('❌ Error: VITE_MONGODB_URI is not defined in .env');
    console.log('👉 Solution: Open .env in your root directory and make sure VITE_MONGODB_URI is set.');
    process.exit(1);
  }

  const maskedUri = uri.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 Connecting to: ${maskedUri}`);

  const startTime = Date.now();
  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 15000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ Connection Successful! (${elapsed}ms)`);
    console.log(`📁 Database Name: ${mongoose.connection.name}`);
    console.log(`🌐 Cluster Host: ${mongoose.connection.host}\n`);

    const db = mongoose.connection.db;

    // Test Write and Delete
    console.log('🧪 Testing Read & Write permissions...');
    const testCollection = db.collection('__db_health_check__');
    const insertResult = await testCollection.insertOne({ ping: 'pong', timestamp: new Date() });
    console.log('   ✓ Write permission OK');

    const doc = await testCollection.findOne({ _id: insertResult.insertedId });
    if (doc && doc.ping === 'pong') {
      console.log('   ✓ Read permission OK');
    }
    await testCollection.deleteOne({ _id: insertResult.insertedId });
    console.log('   ✓ Delete permission OK\n');

    // List collections and counts
    console.log('📊 Existing Collections & Document Counts:');
    const collections = await db.listCollections().toArray();
    for (const c of collections) {
      if (c.name !== '__db_health_check__') {
        const count = await db.collection(c.name).countDocuments();
        console.log(`   • ${c.name}: ${count} document(s)`);
      }
    }

    console.log('\n🎉 Result: Your MongoDB Atlas database is working 100% properly!');
    console.log('----------------------------------------\n');
    process.exit(0);
  } catch (error) {
    const elapsed = Date.now() - startTime;
    console.error(`\n❌ MongoDB Connection Failed after ${elapsed}ms!\n`);
    console.error(`Error Type: ${error.name}`);
    console.error(`Message: ${error.message}\n`);

    console.log('🛠️ HOW TO SOLVE THIS:');

    if (error.name === 'MongooseServerSelectionError' || error.message.includes('buffering timed out')) {
      console.log('1. IP Whitelist Issue (Most Common):');
      console.log('   - Log in to your MongoDB Atlas dashboard: https://cloud.mongodb.com');
      console.log('   - In the left sidebar under "Security", click "Network Access".');
      console.log('   - Click "Add IP Address" and either choose "Add Current IP Address" or "Allow Access From Anywhere" (0.0.0.0/0).');
      console.log('   - Wait 1-2 minutes for the changes to apply, then test again.\n');
      console.log('2. Internet / DNS / Firewall:');
      console.log('   - Ensure your internet connection is active.');
      console.log('   - Some corporate or college Wi-Fi networks block MongoDB ports (27017). Try a mobile hotspot.');
    } else if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.log('1. Bad Username or Password:');
      console.log('   - Go to MongoDB Atlas -> "Database Access" and verify your username and password.');
      console.log('   - If your password has special characters like @, #, $, encode them (e.g. @ is %40).');
    } else {
      console.log('1. Check your connection string in .env:');
      console.log('   ' + maskedUri);
    }

    console.log('\n----------------------------------------\n');
    process.exit(1);
  }
}

testMongoDB();
