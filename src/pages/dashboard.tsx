import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Welcome to Horizon Dashboard
          </h1>
          <p className="text-gray-600 text-lg">
            Your journey begins here. Explore the possibilities ahead.
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Active Projects</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">12</div>
              <p className="text-blue-100 text-sm">+2 from last week</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Team Members</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">48</div>
              <p className="text-purple-100 text-sm">+5 new this month</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-medium">Completed Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">284</div>
              <p className="text-green-100 text-sm">+12% this week</p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
                <CardDescription>
                  Latest updates from your projects and team
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: 'Project Alpha milestone completed',
                    time: '2 hours ago',
                    type: 'success'
                  },
                  {
                    title: 'New team member joined Design team',
                    time: '4 hours ago',
                    type: 'info'
                  },
                  {
                    title: 'Budget review scheduled for next week',
                    time: '6 hours ago',
                    type: 'warning'
                  },
                  {
                    title: 'Client feedback received on Project Beta',
                    time: '1 day ago',
                    type: 'info'
                  }
                ].map((activity, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className={`w-2 h-2 rounded-full ${
                        activity.type === 'success' ? 'bg-green-500' :
                        activity.type === 'warning' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`} />
                      <div>
                        <p className="font-medium text-gray-900">{activity.title}</p>
                        <p className="text-sm text-gray-500">{activity.time}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Common tasks and shortcuts
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📊</span>
                  Create New Project
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">👥</span>
                  Invite Team Member
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">📈</span>
                  View Analytics
                </Button>
                <Button className="w-full justify-start" variant="outline">
                  <span className="mr-2">⚙️</span>
                  Settings
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Project Status</CardTitle>
                <CardDescription>
                  Overview of current projects
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { name: 'Project Alpha', status: 'In Progress', progress: 75 },
                  { name: 'Project Beta', status: 'Review', progress: 90 },
                  { name: 'Project Gamma', status: 'Planning', progress: 25 }
                ].map((project, index) => (
                  <div key={index} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{project.name}</span>
                      <Badge variant={
                        project.status === 'In Progress' ? 'default' :
                        project.status === 'Review' ? 'secondary' : 'outline'
                      }>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                        style={{ width: `${project.progress}%` }}
                      />
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}