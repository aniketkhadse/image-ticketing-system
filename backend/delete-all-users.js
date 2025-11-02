require("dotenv").config();
const mongoose = require("mongoose");
const User = require("./models/User");

async function deleteAllUsers() {
  try {
    console.log("⚠️  WARNING: This will delete ALL users from the database!");
    console.log("Connecting to MongoDB...");

    await mongoose.connect(process.env.MONGODB_URI);
    console.log("✅ Connected to MongoDB");

    // Count users before deletion
    const userCount = await User.countDocuments();
    const adminCount = await User.countDocuments({ isAdmin: true });
    const regularUsers = userCount - adminCount;

    console.log(`\n📊 Current Users:`);
    console.log(`   Total: ${userCount}`);
    console.log(`   Admins: ${adminCount}`);
    console.log(`   Regular Users: ${regularUsers}`);

    console.log("\n🗑️  Deleting ALL users...");

    const result = await User.deleteMany({});

    console.log(`✅ Deleted ${result.deletedCount} users successfully!`);
    console.log("\n✨ Database is now clean. You can create new users.");

    process.exit(0);
  } catch (error) {
    console.error("❌ Error:", error.message);
    process.exit(1);
  }
}

// Confirmation prompt
console.log("\n" + "=".repeat(60));
console.log("⚠️  DELETE ALL USERS SCRIPT");
console.log("=".repeat(60));
console.log("\nThis will permanently delete ALL users from the database.");
console.log("This action CANNOT be undone!\n");

// Run immediately (you can add confirmation if needed)
deleteAllUsers();
