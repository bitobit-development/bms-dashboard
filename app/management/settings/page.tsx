'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ArrowLeft, Settings as SettingsIcon } from 'lucide-react'
import Link from 'next/link'

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Link href="/management">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
        </div>
        <h1 className="text-3xl font-bold">Platform Settings</h1>
        <p className="text-muted-foreground">
          Configure platform-wide settings and preferences
        </p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            Platform Settings
            <Badge variant="secondary" className="ml-2">
              Coming Soon
            </Badge>
          </CardTitle>
          <CardDescription>
            Platform-wide configuration and preferences will be available here
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Organization Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure organization details, branding, and general settings
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Security Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage authentication, password policies, and security preferences
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Notification Settings</h3>
              <p className="text-sm text-muted-foreground">
                Configure email, SMS, and push notification preferences
              </p>
            </div>
            <div className="p-4 border rounded-lg">
              <h3 className="font-medium mb-2">Integration Settings</h3>
              <p className="text-sm text-muted-foreground">
                Manage third-party integrations and API keys
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
