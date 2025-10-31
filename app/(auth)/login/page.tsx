import { stackServerApp } from '@/app/stack'
import { AlreadySignedIn } from '@/components/auth/already-signed-in'
import LoginForm from '@/components/auth/login-form'

export default async function LoginPage() {
  // Server-side authentication check
  const user = await stackServerApp.getUser()

  // If user is authenticated, show AlreadySignedIn component
  if (user) {
    return (
      <AlreadySignedIn
        userEmail={user.primaryEmail}
        userName={user.displayName}
        dashboardUrl="/dashboard"
      />
    )
  }

  // Otherwise, show login form
  return <LoginForm />
}
