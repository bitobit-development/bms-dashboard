'use client'

import { useCallback, useEffect, useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle, Search, RefreshCw } from 'lucide-react'
import { UserTable } from '@/components/management/user-table'
import { UserInviteForm } from '@/components/management/user-invite-form'
import {
  getUsers,
  approveUser,
  rejectUser,
  updateUserRole,
  suspendUser,
  activateUser,
  inviteUser,
} from '@/app/actions/management'
import type { Role } from '@/lib/auth/permissions'
import type { UserWithDetails } from '@/app/actions/management'

export default function UsersPage() {
  const [users, setUsers] = useState<UserWithDetails[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')

  const loadUsers = useCallback(async () => {
    setIsLoading(true)
    setError(null)
    try {
      const filters: any = {}
      if (search) filters.search = search
      if (statusFilter !== 'all') filters.status = statusFilter
      if (roleFilter !== 'all') filters.role = roleFilter

      const result = await getUsers(filters)
      if (result.success) {
        setUsers(result.users)
      } else {
        setError('Failed to load users')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users')
    } finally {
      setIsLoading(false)
    }
  }, [search, statusFilter, roleFilter])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const handleApprove = async (userId: number) => {
    const result = await approveUser(userId)
    if (result.success) {
      await loadUsers()
    } else {
      alert(result.error || 'Failed to approve user')
    }
  }

  const handleReject = async (userId: number) => {
    const result = await rejectUser(userId)
    if (result.success) {
      await loadUsers()
    } else {
      alert(result.error || 'Failed to reject user')
    }
  }

  const handleChangeRole = async (userId: number, newRole: Role) => {
    const result = await updateUserRole(userId, newRole)
    if (result.success) {
      await loadUsers()
    } else {
      alert(result.error || 'Failed to change role')
    }
  }

  const handleSuspend = async (userId: number) => {
    const result = await suspendUser(userId)
    if (result.success) {
      await loadUsers()
    } else {
      alert(result.error || 'Failed to suspend user')
    }
  }

  const handleActivate = async (userId: number) => {
    const result = await activateUser(userId)
    if (result.success) {
      await loadUsers()
    } else {
      alert(result.error || 'Failed to activate user')
    }
  }

  const handleInviteUser = async (email: string, role: Role) => {
    const result = await inviteUser(email, role)
    if (result.success) {
      await loadUsers()
    } else {
      throw new Error(result.error || 'Failed to invite user')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Users</h1>
          <p className="text-muted-foreground">
            Manage all users in your organization
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadUsers}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <UserInviteForm onInvite={handleInviteUser} />
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="owner">Owner</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="operator">Operator</SelectItem>
              <SelectItem value="viewer">Viewer</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Users Table */}
      {isLoading && users.length === 0 ? (
        <Card className="p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        </Card>
      ) : (
        <UserTable
          users={users}
          onApprove={handleApprove}
          onReject={handleReject}
          onChangeRole={handleChangeRole}
          onSuspend={handleSuspend}
          onActivate={handleActivate}
        />
      )}
    </div>
  )
}
