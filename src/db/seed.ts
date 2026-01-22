import "dotenv/config";
import { auth } from "@/lib/auth";

import { db } from "@/db/drizzle";
import { players } from "@/db/schema/players-schema";
import { duels, type DuelWinner, DuelStatus } from "@/db/schema/duels-schema";
import { eq } from "drizzle-orm";

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

// =============================== Duels ===============================

async function seedDuels() {
  console.log("\n🌱 Seeding duels...");

  try {
    // First, get player IDs by querying their nicknames
    const [player1] = await db.select().from(players).where(eq(players.nickname, "KingWilly")).limit(1);
    const [player2] = await db.select().from(players).where(eq(players.nickname, "MichiMishima")).limit(1);
    const [player3] = await db.select().from(players).where(eq(players.nickname, "John Doe")).limit(1);

    if (!player1 || !player2 || !player3) {
      throw new Error("Required players not found. Make sure players are seeded first.");
    }

    const testDuels = [
      {
        player1Id: player1.id,
        player2Id: player2.id,
        player1Score: 10,
        player2Score: 3,
        status: "completed" as DuelStatus,
        winner: "player1" as DuelWinner,
        refereeId: player3.id, // John Doe as referee
      },
      {
        player1Id: player2.id,
        player2Id: player3.id,
        player1Score: 2,
        player2Score: 10,
        status: "completed" as DuelStatus,
        winner: "player2" as DuelWinner,
        // No referee for this one
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const duel of testDuels) {
      try {
        await db.insert(duels).values(duel);
        console.log(`  ✓ Created duel: ${duel.player1Id} vs ${duel.player2Id} (Winner: ${duel.winner})`);
        created++;
      } catch (error: any) {
        // Check both error.code and error.cause.code (Drizzle wraps PostgreSQL errors)
        const errorCode = error?.code || error?.cause?.code;
        if (errorCode === "23505") {
          // PostgreSQL unique violation error code
          console.log(`  ⊘ Skipped duel (already exists): ${duel.player1Id} vs ${duel.player2Id}`);
          skipped++;
        } else {
          throw error;
        }
      }
    }

    console.log(`✅ Duels seeding completed! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Error seeding duels:", error);
    throw error; // Re-throw to be caught by main seed function
  }
}

async function seed() {
  try {
    await seedUsers();
    await seedPlayers();
    await seedDuels();
    console.log("\n🎉 All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
