require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./models/User');

async function deleteRegularUsers() {
  try {
    console.log('⚠️  WARNING: This will delete all NON-ADMIN users!');
    console.log('Connecting to MongoDB...');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Count users before deletion
    const regularUsers = await User.countDocuments({ isAdmin: false });
    const adminCount = await User.countDocuments({ isAdmin: true });

    console.log(`\n📊 Current Users:`);
    console.log(`   Admins: ${adminCount} (will be kept)`);
    console.log(`   Regular Users: ${regularUsers} (will be deleted)`);

    console.log('\n🗑️  Deleting regular users...');
    
    const result = await User.deleteMany({ isAdmin: false });
    
    console.log(`✅ Deleted ${result.deletedCount} regular users successfully!`);
    console.log(`✅ Admin accounts preserved.`);
    
    // Show remaining users
    const remaining = await User.find({ isAdmin: true });
    console.log(`\n👤 Remaining Admins:`);
    remaining.forEach(admin => {
      console.log(`   - ${admin.name} (${admin.email})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteRegularUsers();