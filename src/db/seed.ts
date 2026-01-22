import "dotenv/config";
import { auth } from "@/lib/auth";

import { db } from "@/db/drizzle";
import { players } from "@/db/schema/players-schema";
import { duels, type DuelWinner, DuelStatus } from "@/db/schema/duels-schema";
import { eq } from "drizzle-orm";

import {
  events,
  eventsPlayers,
  type EventFormat
} from "@/db/schema/event-schema";

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

/**
 * Generic helper function to seed records with duplicate handling
 * @param items Array of items to seed
 * @param insertFn Function that inserts a single item
 * @param getIdentifier Function that returns a string identifier for logging (e.g., nickname, email)
 * @param entityName Name of the entity for logging (e.g., "player", "duel")
 * @returns Object with created and skipped counts
 */
async function seedRecords<T>(
  items: T[],
  insertFn: (item: T) => Promise<unknown>,
  getIdentifier: (item: T) => string,
  entityName: string
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const item of items) {
    try {
      await insertFn(item);
      console.log(`  ✓ Created ${entityName}: ${getIdentifier(item)}`);
      created++;
    } catch (error: any) {
      // Check both error.code and error.cause.code (Drizzle wraps PostgreSQL errors)
      const errorCode = error?.code || error?.cause?.code;
      if (errorCode === "23505") {
        // PostgreSQL unique violation error code
        console.log(`  ⊘ Skipped ${entityName} (already exists): ${getIdentifier(item)}`);
        skipped++;
      } else {
        throw error;
      }
    }
  }

  return { created, skipped };
}

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

    const { created, skipped } = await seedRecords(
      testPlayers,
      (player) => db.insert(players).values(player),
      (player) => player.nickname,
      "player"
    );

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

    const { created, skipped } = await seedRecords(
      testDuels,
      (duel) => db.insert(duels).values(duel),
      (duel) => `${duel.player1Id} vs ${duel.player2Id} (Winner: ${duel.winner})`,
      "duel"
    );

    console.log(`✅ Duels seeding completed! Created: ${created}, Skipped: ${skipped}`);
  } catch (error) {
    console.error("❌ Error seeding duels:", error);
    throw error; // Re-throw to be caught by main seed function
  }
}

async function seedEvents() {
  console.log("\n🌱 Seeding events...");

  try {
    const testEvents = [
      {
        name: "Liga Demo",
        descriptionMarkdown: `
        # Liga Demo
        ## Descripción
        Esta es una liga demo con descripción por markdown
        * Regla 1
        * Regla 2
        `,
        startDate: new Date("2026-01-01"),
        endDate: new Date("2026-06-01"),
        format: "ft10" as EventFormat,
      }
    ];

    const { created, skipped } = await seedRecords(
      testEvents,
      (event) => db.insert(events).values(event),
      (event) => event.name,
      "event"
    );
    
    console.log(`✅ Events seeding completed! Created: ${created}, Skipped: ${skipped}`);

    // EventsXPlayers (make first 3 players participate in the event)
    const [event] = await db.select().from(events).where(eq(events.name, "Liga Demo")).limit(1);

    const participants = await db.select().from(players).limit(3);
    if (!participants || participants.length !== 3) {
      throw new Error("Required players not found. Make sure players are seeded first.");
    }

    const participantsItems = participants.map(participant => ({
      eventId: event.id,
      playerId: participant.id,
    }));

    const { created: createdEventsPlayers, skipped: skippedEventsPlayers } = await seedRecords(
      participantsItems,
      (eventPlayer) => db.insert(eventsPlayers).values(eventPlayer),
      (eventPlayer) => `${eventPlayer.eventId} - ${eventPlayer.playerId}`,
      "event_player"
    );
    
    console.log(`✅ EventsXPlayers seeding completed! Created: ${createdEventsPlayers}, Skipped: ${skippedEventsPlayers}`);
  } catch (error) {
    console.error("❌ Error seeding events:", error);
    throw error; // Re-throw to be caught by main seed function
  }
}

async function seed() {
  try {
    await seedUsers();
    await seedPlayers();
    await seedDuels();
    await seedEvents();
    console.log("\n🎉 All seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

seed();
