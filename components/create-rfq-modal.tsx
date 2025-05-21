"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Plus, Upload } from "lucide-react"
import type { RFQ } from "@/data/rfq-data"

const availableSuppliersInitial = [
  { id: "1", name: "Apex Shipping Services" },
  { id: "2", name: "Beacon Logistics" },
  { id: "3", name: "EcoMarine Logistics" },
  { id: "4", name: "Everflow Cargo" },
  { id: "5", name: "Harborline Logistics" },
  { id: "6", name: "Infinity Shipping Co." },
  { id: "7", name: "Nexus Transport" },
  { id: "8", name: "Oceanic Logistics" },
  { id: "9", name: "Skyline Carriers" },
  { id: "10", name: "Stellar Shipping Corp." },
]

// Helper function to format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Helper function to generate a new RFQ ID
const generateRfqId = (): string => {
  const date = new Date()
  const month = date.toLocaleString("en-US", { month: "short" })
  const year = date.getFullYear()
  const randomNum = Math.floor(Math.random() * 100)
  return `RFQ_${month}_${year}_${randomNum}`
}

interface CreateRfqModalProps {
  isOpen: boolean
  onClose: () => void
  onCreateRfq: (rfq: RFQ) => void
}

export function CreateRfqModal({ isOpen, onClose, onCreateRfq }: CreateRfqModalProps) {
  const [projectName, setProjectName] = useState("")
  const [selectedSuppliers, setSelectedSuppliers] = useState<string[]>([])
  const [csvFile, setCsvFile] = useState<File | null>(null)
  const [availableSuppliers, setAvailableSuppliers] = useState(availableSuppliersInitial)

  // New state for add supplier modal
  const [showAddSupplier, setShowAddSupplier] = useState(false)
  const [newSupplierName, setNewSupplierName] = useState("")
  const [newSupplierEmail, setNewSupplierEmail] = useState("")

  // Handle supplier selection
  const toggleSupplier = (supplierId: string) => {
    setSelectedSuppliers((prev) =>
      prev.includes(supplierId) ? prev.filter((id) => id !== supplierId) : [...prev, supplierId],
    )
  }

  // Select all suppliers
  const selectAllSuppliers = () => {
    setSelectedSuppliers(availableSuppliers.map((supplier) => supplier.id))
  }

  // Deselect all suppliers
  const deselectAllSuppliers = () => {
    setSelectedSuppliers([])
  }

  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setCsvFile(e.target.files[0])
    }
  }

  // Handle form submission
  const handleSubmit = () => {
    if (!projectName.trim()) {
      alert("Please enter a project name")
      return
    }

    if (selectedSuppliers.length === 0) {
      alert("Please select at least one supplier")
      return
    }

    // Create a new RFQ
    const newRfq: RFQ = {
      id: generateRfqId(),
      title: projectName,
      createdAt: formatDate(new Date()),
      status: "pending",
      suppliers: selectedSuppliers.slice(0, 3).map((id) => {
        const supplier = availableSuppliers.find((s) => s.id === id)
        return { name: supplier?.name || "" }
      }),
      additionalSuppliers: Math.max(0, selectedSuppliers.length - 3),
    }

    onCreateRfq(newRfq)

    // Reset form
    setProjectName("")
    setSelectedSuppliers([])
    setCsvFile(null)
  }

  // Add new supplier
  const handleAddSupplier = () => {
    if (!newSupplierName.trim() || !newSupplierEmail.trim()) {
      alert("Please enter both name and email")
      return
    }
    const newId = (availableSuppliers.length + 1).toString()
    setAvailableSuppliers([
      ...availableSuppliers,
      { id: newId, name: newSupplierName, email: newSupplierEmail },
    ])
    setNewSupplierName("")
    setNewSupplierEmail("")
    setShowAddSupplier(false)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold">Create New RFQ/Project</DialogTitle>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              placeholder="Enter project name"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <Label>Select Suppliers</Label>
              <Button
                variant="link"
                size="sm"
                className="text-blue-600 p-0 h-auto"
                onClick={() => setShowAddSupplier(true)}
              >
                <Plus className="h-4 w-4 mr-1" /> Add New Supplier
              </Button>
            </div>

            {/* Add Supplier Modal/Inline Form */}
            {showAddSupplier && (
              <div className="grid grid-cols-1 gap-2 bg-gray-50 p-3 rounded mb-2">
                <Input
                  placeholder="Supplier Email"
                  value={newSupplierEmail}
                  onChange={(e) => setNewSupplierEmail(e.target.value)}
                  className="mb-2"
                />
                <Input
                  placeholder="Supplier Name"
                  value={newSupplierName}
                  onChange={(e) => setNewSupplierName(e.target.value)}
                  className="mb-2"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="bg-blue-500 hover:bg-blue-600" onClick={handleAddSupplier}>
                    Save
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setShowAddSupplier(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-3 mt-2">
              {availableSuppliers.map((supplier) => (
                <div key={supplier.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`supplier-${supplier.id}`}
                    checked={selectedSuppliers.includes(supplier.id)}
                    onChange={() => toggleSupplier(supplier.id)}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor={`supplier-${supplier.id}`} className="text-sm font-normal cursor-pointer">
                    {supplier.name}
                  </Label>
                </div>
              ))}
            </div>

            <div className="flex space-x-2 mt-2">
              <Button variant="secondary" size="sm" className="text-sm" onClick={selectAllSuppliers}>
                Select All
              </Button>
              <Button variant="outline" size="sm" className="text-sm" onClick={deselectAllSuppliers}>
                Deselect All
              </Button>
            </div>
          </div>

          <div className="grid gap-2">
            <Label>Demand Planning File (CSV)</Label>
            <div
              className="border-2 border-dashed rounded-md border-gray-300 p-6 text-center cursor-pointer"
              onClick={() => document.getElementById("csv-upload")?.click()}
            >
              <Upload className="h-6 w-6 mx-auto text-gray-400" />
              <p className="mt-2 text-sm text-gray-500">Click to upload CSV</p>
              <p className="text-xs text-gray-400">Headers required</p>
              <input id="csv-upload" type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </div>
          </div>
        </div>
        <DialogFooter className="sm:justify-between">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button className="bg-blue-500 hover:bg-blue-600" onClick={handleSubmit}>
            Create RFQ
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
