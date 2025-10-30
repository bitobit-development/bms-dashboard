'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { CheckCircle, XCircle, Clock } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { UserWithDetails } from '@/app/actions/management'
import { RoleBadge } from './role-badge'

interface ApprovalQueueProps {
  users: UserWithDetails[]
  onApprove: (userId: number) => void
  onReject: (userId: number) => void
}

export function ApprovalQueue({ users, onApprove, onReject }: ApprovalQueueProps) {
  if (users.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
          <CardDescription>No users pending approval</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mb-4" />
          <p className="text-lg font-medium mb-2">All caught up!</p>
          <p className="text-sm text-muted-foreground">
            There are no pending user approvals at this time.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Pending Approvals</CardTitle>
            <CardDescription>
              {users.length} {users.length === 1 ? 'user' : 'users'} waiting for approval
            </CardDescription>
          </div>
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
            <Clock className="h-3 w-3 mr-1" />
            {users.length}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {users.map((user) => (
          <div
            key={user.id}
            className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-medium">{user.email}</span>
                <RoleBadge role={user.role as any} />
              </div>
              <p className="text-sm text-muted-foreground">
                Requested{' '}
                {user.invitedAt
                  ? formatDistanceToNow(new Date(user.invitedAt), { addSuffix: true })
                  : 'recently'}
              </p>
              {user.invitedBy && (
                <p className="text-xs text-muted-foreground">
                  Invited by: {user.invitedBy}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => onReject(user.id)}
                className="text-red-600 border-red-200 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4 mr-1" />
                Reject
              </Button>
              <Button
                size="sm"
                onClick={() => onApprove(user.id)}
                className="bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="h-4 w-4 mr-1" />
                Approve
              </Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}
