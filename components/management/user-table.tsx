'use client'

import { useState } from 'react'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { StatusBadge } from './status-badge'
import { RoleBadge } from './role-badge'
import { MoreHorizontal, CheckCircle, XCircle, Shield, Ban, PlayCircle } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import type { UserWithDetails } from '@/app/actions/management'
import type { Role } from '@/lib/auth/permissions'

interface UserTableProps {
  users: UserWithDetails[]
  onApprove?: (userId: number) => void
  onReject?: (userId: number) => void
  onChangeRole?: (userId: number, newRole: Role) => void
  onSuspend?: (userId: number) => void
  onActivate?: (userId: number) => void
  showActions?: boolean
}

export function UserTable({
  users,
  onApprove,
  onReject,
  onChangeRole,
  onSuspend,
  onActivate,
  showActions = true,
}: UserTableProps) {
  const [loadingUserId, setLoadingUserId] = useState<number | null>(null)

  const handleAction = async (action: () => Promise<void> | void, userId: number) => {
    setLoadingUserId(userId)
    try {
      await action()
    } finally {
      setLoadingUserId(null)
    }
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Role</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Joined</TableHead>
            <TableHead>Last Active</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {users.length === 0 ? (
            <TableRow>
              <TableCell colSpan={showActions ? 6 : 5} className="text-center py-8 text-muted-foreground">
                No users found
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => (
              <TableRow key={user.id}>
                <TableCell>
                  <div className="flex flex-col">
                    <span className="font-medium">
                      {user.firstName && user.lastName
                        ? `${user.firstName} ${user.lastName}`
                        : 'No name set'}
                    </span>
                    <span className="text-sm text-muted-foreground">{user.email}</span>
                  </div>
                </TableCell>
                <TableCell>
                  <RoleBadge role={user.role as Role} />
                </TableCell>
                <TableCell>
                  <StatusBadge status={user.status as any} />
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.createdAt
                    ? formatDistanceToNow(new Date(user.createdAt), { addSuffix: true })
                    : 'N/A'}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {user.lastActiveAt
                    ? formatDistanceToNow(new Date(user.lastActiveAt), { addSuffix: true })
                    : 'Never'}
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          disabled={loadingUserId === user.id}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        {user.status === 'pending' && (
                          <>
                            {onApprove && (
                              <DropdownMenuItem
                                onClick={() => handleAction(() => onApprove(user.id), user.id)}
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </DropdownMenuItem>
                            )}
                            {onReject && (
                              <DropdownMenuItem
                                onClick={() => handleAction(() => onReject(user.id), user.id)}
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {user.status === 'active' && onSuspend && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction(() => onSuspend(user.id), user.id)}
                            >
                              <Ban className="h-4 w-4 mr-2" />
                              Suspend
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {user.status === 'suspended' && onActivate && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction(() => onActivate(user.id), user.id)}
                            >
                              <PlayCircle className="h-4 w-4 mr-2" />
                              Activate
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                          </>
                        )}
                        {onChangeRole && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleAction(() => onChangeRole(user.id, 'admin'), user.id)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Admin
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(() => onChangeRole(user.id, 'operator'), user.id)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Operator
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleAction(() => onChangeRole(user.id, 'viewer'), user.id)}
                            >
                              <Shield className="h-4 w-4 mr-2" />
                              Make Viewer
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                )}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  )
}
