require('dotenv').config();
const mongoose = require('mongoose');

async function resetDatabase() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const db = mongoose.connection.db;
    
    // Drop tickets collection
    console.log('🗑️  Dropping tickets collection...');
    try {
      await db.collection('tickets').drop();
      console.log('✅ Tickets collection dropped');
    } catch (error) {
      if (error.codeName === 'NamespaceNotFound') {
        console.log('ℹ️  Collection does not exist');
      } else {
        throw error;
      }
    }

    console.log('\n✅ Database reset successfully!');
    console.log('ℹ️  The tickets collection will be recreated when you create your first ticket');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

resetDatabase();