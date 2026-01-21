import "dotenv/config";
import { db } from "./drizzle";
import { user } from "./schema/auth-schema";

// Note: Schema uses text("id") which does NOT auto-increment
// Only serial/bigserial types auto-increment in PostgreSQL
// Since better-auth uses text IDs, we need to provide them manually for raw inserts
// better-auth typically uses nanoid for IDs, but for seeding we'll use a simple hex string
import { randomBytes } from "crypto";
function generateId() {
  return randomBytes(16).toString("hex");
}

async function seed() {
  console.log("🌱 Seeding database...");

  // =============================== Users ==================================================================================
  try {
    // Example: Seed test users
    // Note: Since id is text (not auto-increment), we need to provide it
    // better-auth generates IDs when using its API, but for raw inserts we provide them
    const testUsers = [
      {
        id: generateId(),
        name: "Admin User",
        email: "admin@example.com",
        emailVerified: true,
      },
      {
        id: generateId(),
        name: "User User",
        email: "user@example.com",
        emailVerified: false,
      },
    ];

    // Insert users (skip if email already exists)
    let created = 0;
    let skipped = 0;
    
    for (const testUser of testUsers) {
      try {
        await db.insert(user).values(testUser);
        console.log(`  ✓ Created user: ${testUser.email}`);
        created++;
      } catch (error: any) {
        // Check both error.code and error.cause.code (Drizzle wraps PostgreSQL errors)
        const errorCode = error?.code || error?.cause?.code;
        if (errorCode === "23505") {
          // PostgreSQL unique violation error code
          console.log(`  ⊘ Skipped user (already exists): ${testUser.email}`);
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`\n✅ Seeding completed! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
