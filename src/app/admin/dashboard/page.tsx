import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/get-session"
import { authClient } from "@/lib/auth-client"
import { SignOutButton } from "@/components/sign-out-button"

export default async function DashboardPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect("/sign-in")
  }

  return (
    <div className="container mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back, {user.name || user.email}!
          </p>
        </div>
        <SignOutButton />
      </div>

      <div className="space-y-4">
        <div className="rounded-lg border p-6">
          <h2 className="text-xl font-semibold mb-4">User Information</h2>
          <dl className="space-y-2">
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email</dt>
              <dd className="text-sm">{user.email}</dd>
            </div>
            {user.name && (
              <div>
                <dt className="text-sm font-medium text-muted-foreground">Name</dt>
                <dd className="text-sm">{user.name}</dd>
              </div>
            )}
            <div>
              <dt className="text-sm font-medium text-muted-foreground">Email Verified</dt>
              <dd className="text-sm">{user.emailVerified ? "Yes" : "No"}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}
