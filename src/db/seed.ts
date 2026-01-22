import "dotenv/config";
import { auth } from "@/lib/auth";

import { db } from "@/db/drizzle";
import { players } from "@/db/schema/players-schema";

/**
 * Seed script for better-auth
 * 
 * IMPORTANT: User vs Account relationship
 * - user: Core user identity (one per person) - stores name, email, etc.
 * - account: Authentication methods linked to a user (can have multiple)
 *   - For email/password: providerId="credential", password stored here (hashed)
 *   - For OAuth (Google, GitHub, etc.): separate account records per provider
 * 
 * Passwords are stored in the account table, NOT the user table.
 * better-auth hashes passwords using bcrypt, so we must use its API to create users.
 */

async function seedUsers() {
  console.log("🌱 Seeding database...");

  // =============================== Users with Passwords ===============================
  try {
    // Test users to create
    // Using better-auth's API ensures passwords are properly hashed
    const testUsers = [
      {
        name: "Admin User",
        email: "admin@example.com",
        password: "admin1234", // Minimum 8 characters (better-auth requirement)
        emailVerified: true,
      },
      {
        name: "User User",
        email: "user@example.com",
        password: "user1234", // Minimum 8 characters (better-auth requirement)
        emailVerified: false,
      },
    ];

    let created = 0;
    let skipped = 0;
    
    for (const testUser of testUsers) {
      try {
        // Use better-auth's API to create user with password
        // This will:
        // 1. Create a user record
        // 2. Create an account record with hashed password (providerId="credential")
        const response = await auth.api.signUpEmail({
          body: {
            email: testUser.email,
            password: testUser.password,
            name: testUser.name,
          },
        });

        // Response contains user data on success
        if (response.user) {
          console.log(`  ✓ Created user: ${testUser.email} (password: ${testUser.password})`);
          created++;
        }
      } catch (error: any) {
        // Check if it's a duplicate error
        const errorMessage = error?.message || error?.toString() || "";
        if (errorMessage.includes("already exists") || 
            errorMessage.includes("unique") ||
            errorMessage.includes("duplicate") ||
            error?.code === "23505") {
          console.log(`  ⊘ Skipped user (already exists): ${testUser.email}`);
          skipped++;
        } else {
          console.error(`  ✗ Error creating user ${testUser.email}:`, error);
          throw error;
        }
      }
    }

    console.log(`✅ Users seeding completed! Created: ${created}, Skipped: ${skipped}`);
    console.log(`\n📝 Test credentials:`);
    testUsers.forEach(u => {
      console.log(`   ${u.email} / ${u.password}`);
    });
  } catch (error) {
    console.error("❌ Error seeding users:", error);
    throw error; // Re-throw to be caught by main seed function
  }
}

// =============================== Players ===============================

async function seedPlayers() {
  console.log("\n🌱 Seeding players...");

  try {
    const testPlayers = [
      {
        name: "Willy",
        nickname: "KingWilly",
        tekkenId: "1234567890",
      },
      {
        name: "Michi",
        nickname: "MichiMishima",
      },
      {
        nickname: "John Doe"
      }
    ];

    let created = 0;
    let skipped = 0;

    for (const player of testPlayers) {
      try {
        await db.insert(players).values(player);
        console.log(`  ✓ Created player: ${player.nickname}`);
        created++;
      } catch (error: any) {
        // Check both error.code and error.cause.code (Drizzle wraps PostgreSQL errors)
        const errorCode = error?.code || error?.cause?.code;
        if (errorCode === "23505") {
          // PostgreSQL unique violation error code
          console.log(`  ⊘ Skipped player (already exists): ${player.nickname}`);
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Players seeding completed! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Error seeding players:", error);
    throw error; // Re-throw to be caught by main seed function
  }
}

async function seed() {
  try {
    await seedUsers();
    await seedPlayers();
    console.log("\n🎉 All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
