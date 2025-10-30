'use client'

import { useCallback, useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, RefreshCw, ArrowLeft } from 'lucide-react'
import { ApprovalQueue } from '@/components/management/approval-queue'
import { getPendingUsers, approveUser, rejectUser } from '@/src/lib/actions/users'
import Link from 'next/link'

type UserWithDetails = {
  id: number
  email: string
  firstName: string | null
  lastName: string | null
  createdAt: Date
  role: string
  status: string
}

export default function PendingUsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadPendingUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const result = await getPendingUsers()
      if (result.success) {
        setUsers(result.users)
      } else {
        setError('Failed to load pending users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load pending users')
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    loadPendingUsers()
  }, [loadPendingUsers])

  const handleApprove = async (userId: number) => {
    const result = await approveUser(userId)
    if (result.success) {
      await loadPendingUsers()
    } else {
      alert(result.error || 'Failed to approve user')
    }
  }

  const handleReject = async (userId: number) => {
    const result = await rejectUser(userId)
    if (result.success) {
      await loadPendingUsers()
    } else {
      alert(result.error || 'Failed to reject user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Link href="/management">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
          </div>
          <h1 className="text-3xl font-bold">Pending Approvals</h1>
          <p className="text-muted-foreground">
            Review and approve user access requests
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={loadPendingUsers}
          disabled={isLoading}
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Approval Queue */}
      {isLoading && users.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <ApprovalQueue
          users={users}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}
    </div>
  )
}
