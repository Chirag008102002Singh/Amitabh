"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Search, Clock, CheckCircle, CircleCheck, Plus, Table, List, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Pagination } from "@/components/pagination"
import { CreateRfqModal } from "@/components/create-rfq-modal"
import { cn } from "@/lib/utils"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { initialRfqs } from "@/data/rfq-data"

export function RfqDashboard() {
  const router = useRouter()
  const [rfqs, setRfqs] = useState(initialRfqs)
  const [selectedRfqs, setSelectedRfqs] = useState<string[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [currentTab, setCurrentTab] = useState("all")
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6

  // Add this state for tracking which RFQ is being deleted
  const [rfqToDelete, setRfqToDelete] = useState<string | null>(null)

  // Filter RFQs based on search query and current tab
  const filteredRfqs = rfqs.filter((rfq) => {
    const matchesSearch = rfq.title.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesTab = currentTab === "all" || rfq.status === currentTab
    return matchesSearch && matchesTab
  })

  // Get counts for each status
  const activeCount = rfqs.filter((rfq) => rfq.status === "active").length
  const pendingCount = rfqs.filter((rfq) => rfq.status === "pending").length
  const completedCount = rfqs.filter((rfq) => rfq.status === "completed").length

  // Pagination
  const totalPages = Math.ceil(filteredRfqs.length / itemsPerPage)
  const paginatedRfqs = filteredRfqs.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)

  // Handle RFQ selection
  const toggleRfqSelection = (id: string) => {
    setSelectedRfqs((prev) => (prev.includes(id) ? prev.filter((rfqId) => rfqId !== id) : [...prev, id]))
  }

  // Handle creating a new RFQ
  const handleCreateRfq = (newRfq: any) => {
    // Generate a new RFQ number based on the current count of RFQs
    const newRfqNumber = `RFQ_${new Date().toLocaleString('default', { month: 'short' })}_${new Date().getFullYear()}_${rfqs.length + 1}`
    const newRfqWithNumber = { ...newRfq, id: newRfqNumber, title: newRfqNumber }

    setRfqs((prev) => [newRfqWithNumber, ...prev])
    setIsCreateModalOpen(false)
  }

  // Replace the existing handleDeleteRfq function with this one
  const handleDeleteRfq = (id: string) => {
    setRfqs((prev) => prev.filter((rfq) => rfq.id !== id))
    setSelectedRfqs((prev) => prev.filter((rfqId) => rfqId !== id))
    setRfqToDelete(null)
  }

  // Add this function to handle the delete button click
  const handleDeleteClick = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    setRfqToDelete(id)
  }

  // Handle clicking on an RFQ
  const handleRfqClick = (id: string) => {
    router.push(`/rfq/${id}`)
  }

  // Handle comparing selected RFQs
  const handleCompareRfqs = () => {
    if (selectedRfqs.length >= 2) {
      router.push(`/compare?rfqs=${selectedRfqs.join(",")}`)
    } else if (selectedRfqs.length === 1) {
      // If only one RFQ is selected, compare it with the most recent one
      const otherRfq = rfqs.find((rfq) => rfq.id !== selectedRfqs[0])?.id
      if (otherRfq) {
        router.push(`/compare?rfqs=${selectedRfqs[0]},${otherRfq}`)
      }
    }
  }

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value)
    setCurrentPage(1) // Reset to first page when searching
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">RFQ Dashboard</h1>
          <p className="text-gray-600">Manage and compare your Request for Quotations</p>
        </div>
        <Button className="mt-4 md:mt-0 bg-blue-600 hover:bg-blue-700" onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Create RFQ/Project
        </Button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
          <Input
            className="pl-10 bg-white"
            placeholder="Search RFQs..."
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Active RFQs</p>
              <h2 className="text-3xl font-bold">{activeCount}</h2>
            </div>
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Pending RFQs</p>
              <h2 className="text-3xl font-bold">{pendingCount}</h2>
            </div>
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="h-6 w-6 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-4 flex justify-between items-center">
            <div>
              <p className="text-sm text-gray-500">Completed RFQs</p>
              <h2 className="text-3xl font-bold">{completedCount}</h2>
            </div>
            <div className="bg-blue-100 p-2 rounded-full">
              <CircleCheck className="h-6 w-6 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and View Toggle */}
      <div className="flex justify-between items-center mb-6">
        <Tabs defaultValue="all" value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList>
            <TabsTrigger value="all" className="data-[state=active]:bg-gray-900 data-[state=active]:text-white">
              All
            </TabsTrigger>
            <TabsTrigger value="active">Active</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="flex space-x-2 ml-4">
          <Button
            variant="outline"
            size="icon"
            className={cn(viewMode === "grid" && "bg-blue-50")}
            onClick={() => setViewMode("grid")}
          >
            <Table size={18} />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className={cn(viewMode === "list" && "bg-blue-50")}
            onClick={() => setViewMode("list")}
          >
            <List size={18} />
          </Button>
        </div>
      </div>

      {/* RFQ Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {paginatedRfqs.map((rfq) => (
          <Card key={rfq.id} className="overflow-hidden">
            <div className="p-4 border-b">
              <div className="flex items-start">
                <input
                  type="checkbox"
                  className="mr-3 mt-1"
                  checked={selectedRfqs.includes(rfq.id)}
                  onChange={(e) => {
                    e.stopPropagation()
                    toggleRfqSelection(rfq.id)
                  }}
                />
                <div className="flex-1 cursor-pointer" onClick={() => handleRfqClick(rfq.id)}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <div className="text-blue-600 mr-2">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                          />
                        </svg>
                      </div>
                      <h3 className="font-medium text-gray-900">{rfq.title}</h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "ml-2",
                        rfq.status === "active" && "bg-green-100 text-green-800 border-green-200",
                        rfq.status === "pending" && "bg-yellow-100 text-yellow-800 border-yellow-200",
                        rfq.status === "completed" && "bg-blue-100 text-blue-800 border-blue-200",
                      )}
                    >
                      {rfq.status}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">Created: {rfq.createdAt}</p>
                </div>
              </div>
            </div>
            <div className="p-4 cursor-pointer" onClick={() => handleRfqClick(rfq.id)}>
              <h4 className="text-sm font-medium text-gray-700 mb-2">Suppliers</h4>
              <div className="flex flex-wrap gap-2 mb-2">
                {rfq.suppliers.map((supplier, index) => (
                  <Badge key={index} variant="secondary" className="bg-gray-100 text-gray-700">
                    {supplier.name}
                  </Badge>
                ))}
              </div>
              {rfq.additionalSuppliers > 0 && (
                <Badge variant="secondary" className="bg-gray-100 text-gray-700">
                  +{rfq.additionalSuppliers} more
                </Badge>
              )}
            </div>
            <div className="p-4 border-t flex justify-end">
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDeleteClick(e, rfq.id)
                }}
              >
                <Trash2 size={18} />
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      <div className="flex justify-center mt-8">
        <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
      </div>

      {/* Selected RFQs Counter */}
      <div className="fixed bottom-4 left-4 bg-white rounded-full shadow-lg px-4 py-2 flex items-center">
        <div className="bg-blue-100 text-blue-800 rounded-full w-8 h-8 flex items-center justify-center mr-2">
          {selectedRfqs.length}
        </div>
        <span className="text-gray-700">RFQ(s) selected</span>
      </div>

      {/* Compare Selected Button - only show when 2+ RFQs are selected */}
      {selectedRfqs.length >= 2 && (
        <div className="fixed bottom-4 right-4">
          <Button className="bg-blue-600 hover:bg-blue-700 text-white" onClick={handleCompareRfqs}>
            Compare {selectedRfqs.length} Selected
          </Button>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={rfqToDelete !== null} onOpenChange={(open) => !open && setRfqToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this RFQ?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the RFQ and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => rfqToDelete && handleDeleteRfq(rfqToDelete)}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create RFQ Modal */}
      <CreateRfqModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRfq={handleCreateRfq}
      />
    </div>
  )
}
