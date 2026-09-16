import mongoose from 'mongoose';

const MONGO_URI = "mongodb+srv://ramlinghule10_db_user:ProConnect%401234%2A@cluster0.k5idpqr.mongodb.net/?appName=Cluster0";
const TARGET_EMAIL = "ramlinghule10@gmail.com";

async function setAdmin() {
  await mongoose.connect(MONGO_URI);
  console.log("✅ Connected to MongoDB");

  const db = mongoose.connection.db;
  const result = await db.collection('users').updateOne(
    { email: TARGET_EMAIL },
    { $set: { role: 'admin' } }
  );

  if (result.matchedCount === 0) {
    console.error(`❌ No user found with email: ${TARGET_EMAIL}`);
  } else if (result.modifiedCount === 0) {
    console.log(`ℹ️  User found but role was already 'admin' — no change made.`);
  } else {
    console.log(`✅ SUCCESS — role updated to 'admin' for ${TARGET_EMAIL}`);
  }

  await mongoose.disconnect();
  console.log("🔌 Disconnected.");
}

setAdmin().catch((err) => {
  console.error("❌ Error:", err.message);
  process.exit(1);
});
