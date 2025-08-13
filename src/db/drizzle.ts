import "dotenv/config";
import { drizzle } from 'drizzle-orm/node-postgres';

// You can specify any property from the postgres-js connection options
export const db = drizzle({ 
  connection: { 
    connectionString: process.env.DATABASE_URL,
  }
});
