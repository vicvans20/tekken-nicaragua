import { auth } from "@/lib/auth"
import { headers } from "next/headers"

/**
 * Get the current user session on the server side
 * Use this in Server Components, Server Actions, or API routes
 */
export async function getSession() {
  const headersList = await headers()
  const session = await auth.api.getSession({
    headers: headersList,
  })

  return session
}

/**
 * Get the current user on the server side
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await getSession()
  return session?.user ?? null
}
