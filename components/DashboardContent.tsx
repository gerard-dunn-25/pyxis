'use client'

import { useState, useCallback, useEffect } from 'react'
import { Card, CardBody, CardHeader } from '@heroui/card'
import { Tabs, Tab } from '@heroui/tabs'
import { FileUp, FileText, User } from 'lucide-react'
import FileUploadForm from '@/components/FileUploadForm'
import FileList from '@/components/FileList'
import UserProfile from '@/components/UserProfile'
import { useSearchParams } from 'next/navigation'

interface DashboardContentProps {
  userId: string
  userName: string
}

export default function DashboardContent({
  userId,
  userName,
}: DashboardContentProps) {
  const searchParams = useSearchParams()
  const tabParam = searchParams.get('tab')

  const [activeTab, setActiveTab] = useState<string>('files')
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [currentFolder, setCurrentFolder] = useState<string | null>(null)

  // Set the active tab based on URL parameter
  useEffect(() => {
    if (tabParam === 'profile') {
      setActiveTab('profile')
    } else {
      setActiveTab('files')
    }
  }, [tabParam])

  const handleFileUploadSuccess = useCallback(() => {
    setRefreshTrigger((prev) => prev + 1)
  }, [])

  const handleFolderChange = useCallback((folderId: string | null) => {
    setCurrentFolder(folderId)
  }, [])

  return (
    <>
      <div className="mb-8">
        <h2 className="text-4xl font-bold text-default-900">
          Hi,{' '}
          <span className="text-primary">
            {userName?.length > 10
              ? `${userName?.substring(0, 10)}...`
              : userName?.split(' ')[0] || 'there'}
          </span>
          !
        </h2>
        <p className="text-default-600 mt-2 text-lg">
          Your images are waiting for you.
        </p>
      </div>

      <Tabs
        aria-label="Dashboard Tabs"
        color="primary"
        variant="underlined"
        selectedKey={activeTab}
        onSelectionChange={(key) => setActiveTab(key as string)}
        classNames={{
          tabList: 'gap-6',
          tab: 'py-3',
          cursor: 'bg-primary',
        }}
      >
        <Tab
          key="files"
          title={
            <div className="flex items-center gap-3">
              <FileText className="h-5 w-5" />
              <span className="font-medium">My Files</span>
            </div>
          }
        >
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Card className="border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex gap-3">
                  <FileUp className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Upload</h2>
                </CardHeader>
                <CardBody>
                  <FileUploadForm
                    userId={userId}
                    onUploadSuccess={handleFileUploadSuccess}
                    currentFolder={currentFolder}
                  />
                </CardBody>
              </Card>
            </div>

            <div className="lg:col-span-2">
              <Card className="border border-default-200 bg-default-50 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex gap-3">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">Your Files</h2>
                </CardHeader>
                <CardBody>
                  <FileList
                    userId={userId}
                    refreshTrigger={refreshTrigger}
                    onFolderChange={handleFolderChange}
                  />
                </CardBody>
              </Card>
            </div>
          </div>
        </Tab>

        <Tab
          key="profile"
          title={
            <div className="flex items-center gap-3">
              <User className="h-5 w-5" />
              <span className="font-medium">Profile</span>
            </div>
          }
        >
          <div className="mt-8">
            <UserProfile />
          </div>
        </Tab>
      </Tabs>
    </>
  )
}
