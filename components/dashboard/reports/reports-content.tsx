'use client'

import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { ReportGenerator } from './report-generator'
import { RecentReports } from './recent-reports'

export function ReportsContent() {
  return (
    <Tabs defaultValue="generate" className="space-y-6">
      <TabsList>
        <TabsTrigger value="generate">Generate Report</TabsTrigger>
        <TabsTrigger value="recent">Recent Reports</TabsTrigger>
      </TabsList>

      <TabsContent value="generate" className="space-y-6">
        <ReportGenerator />
      </TabsContent>

      <TabsContent value="recent" className="space-y-6">
        <RecentReports />
      </TabsContent>
    </Tabs>
  )
}
