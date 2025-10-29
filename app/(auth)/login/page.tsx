import Link from 'next/link'
import { Button } from '@/components/ui/button'

export default function LoginPage() {
  // TODO: Implement Stack Auth login when authentication is configured
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
      <div className="max-w-md w-full space-y-8 p-8 bg-white dark:bg-slate-800 rounded-lg shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">BMS Dashboard</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-300">Battery Management System</p>
        </div>
        <div className="mt-8 space-y-4">
          <p className="text-center text-slate-500 dark:text-slate-400">
            Authentication is not yet configured
          </p>
          <Link href="/dashboard" className="block">
            <Button className="w-full">Go to Dashboard</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
