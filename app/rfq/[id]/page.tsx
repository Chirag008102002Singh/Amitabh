"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ChevronDown, ChevronUp, Info, Download, Upload, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  getRfqById,
  getRouteRecommendations,
  getRouteDetails,
  getAllCommodities,
  updateRfqStatus,
  updateRouteDetails, // Add this import (assumed to exist or to be implemented)
  type RFQ,
  type RouteRecommendation,
  type RouteDetail,
} from "@/data/rfq-data";

export default function RfqDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const [rfq, setRfq] = useState<RFQ | null>(null)
  const [expandedRoutes, setExpandedRoutes] = useState<string[]>([])
  const [recommendations, setRecommendations] = useState<RouteRecommendation[]>([])
  const [routeDetails, setRouteDetails] = useState<Record<string, RouteDetail[]>>({})
  const [temperatureControl, setTemperatureControl] = useState<"all" | "yes" | "no">("all")
  const [searchValues, setSearchValues] = useState<Record<string, string>>({})
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc")
  const [currentPage, setCurrentPage] = useState(1)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [activeSupplierTab, setActiveSupplierTab] = useState<"all" | "reverted" | "pending">("all")
  const [selectedLane, setSelectedLane] = useState<string>("")
  const [showCloseRfqDialog, setShowCloseRfqDialog] = useState(false)
  const [showImportModal, setShowImportModal] = useState(false)
  const [showMailSentPopup, setShowMailSentPopup] = useState(false)
  const [importFile, setImportFile] = useState<File | null>(null)
  const [selectedCommodities, setSelectedCommodities] = useState<string[]>([])
  const [commodities, setCommodities] = useState<string[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
  const itemsPerPage = 10
  const [awardedSuppliers, setAwardedSuppliers] = useState<Record<string, string | null>>({})
  const [selectedSupplier, setSelectedSupplier] = useState<string>("")
  const [selectedPrice, setSelectedPrice] = useState<number>(0)
  const [selectedCategory, setSelectedCategory] = useState<string>("")
  const [targetPrice, setTargetPrice] = useState<number>(0)
  const [targetCategory, setTargetCategory] = useState<string>("")

  useEffect(() => {
    const rfqData = getRfqById(params.id)
    if (rfqData) {
      setRfq(rfqData)
      const recs = getRouteRecommendations(params.id)
      setRecommendations(recs)
      setCommodities(getAllCommodities())

      if (recs.length > 0) {
        setExpandedRoutes([recs[0].route])
        const details = getRouteDetails(params.id, recs[0].route)
        setRouteDetails((prev) => ({ ...prev, [recs[0].route]: details }))
      }

      // Initialize awardedSuppliers from route details
      const initialAwards: Record<string, string | null> = {}
      recs.forEach((rec) => {
        const details = getRouteDetails(params.id, rec.route)
        const awarded = details?.find((detail) => detail.awardStatus === "Awarded")?.supplier
        initialAwards[rec.route] = awarded || null
      })
      setAwardedSuppliers(initialAwards)
    }
  }, [params.id])

  const toggleRouteExpansion = (route: string) => {
    if (expandedRoutes.includes(route)) {
      setExpandedRoutes(expandedRoutes.filter((r) => r !== route))
    } else {
      setExpandedRoutes([...expandedRoutes, route])
      if (!routeDetails[route]) {
        const details = getRouteDetails(params.id, route)
        setRouteDetails((prev) => ({ ...prev, [route]: details }))
      }
    }
  }

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const handleSearch = (column: string, value: string) => {
    setSearchValues((prev) => ({ ...prev, [column]: value }))
    setCurrentPage(1)
  }

  const handleLaneChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedLane(e.target.value)
  }

  const handleCommodityChange = (commodity: string) => {
    setSelectedCommodities((prev) => {
      if (prev.includes(commodity)) {
        return prev.filter((c) => c !== commodity)
      } else {
        return [...prev, commodity]
      }
    })
  }

  const handleCloseRfq = () => {
    if (rfq) {
      const updatedRfq = { ...rfq, status: "completed" as const }
      setRfq(updatedRfq)
      updateRfqStatus(rfq.id, "completed")
      setShowCloseRfqDialog(false)
      setShowMailSentPopup(true)
      setTimeout(() => setShowMailSentPopup(false), 3000)
    }
  }

  const handleImport = () => {
    if (importFile) {
      alert(`File "${importFile.name}" imported successfully!`)
      setImportFile(null)
      setShowImportModal(false)
    } else {
      alert("Please select a file to import")
    }
  }

  const handleExport = () => {
    let csvContent =
      "Business Entity,Container Type,Commodity,Lane Name,Target Price,Category,Supplier,Price,Transit Time,Free Time,Transshipments,Temperature Control,Award Status\n"

    tableData.forEach((row) => {
      csvContent += `${row.businessEntity},${row.containerType},${row.commodity},${row.laneName},${row.targetPrice},${row.category},${row.supplier},${row.price},${row.transitTime},${row.freeTime},${row.transshipments},${row.temperatureControl ? "Yes" : "No"},${row.awardStatus}\n`
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `rfq_${params.id}_data.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleAwardStatusChange = (supplier: string, laneName: string) => {
    // Update awardedSuppliers state: toggle the supplier for this lane
    setAwardedSuppliers((prev) => {
      const newAwards = { ...prev };
      if (newAwards[laneName] === supplier) {
        newAwards[laneName] = null; // Unaward the supplier
      } else {
        newAwards[laneName] = supplier; // Award the new supplier
      }
      return newAwards;
    });
  
    // Update route details: ensure only the selected supplier is awarded
    const updatedDetails = routeDetails[laneName].map((detail) => ({
      ...detail,
      awardStatus: detail.supplier === supplier && awardedSuppliers[laneName] !== supplier ? "Awarded" : "Not Awarded",
    }));
  
    // Persist changes to the data source
    updateRouteDetails(params.id, laneName, updatedDetails);
  
    // Update local routeDetails state to reflect persisted changes
    setRouteDetails((prev) => ({
      ...prev,
      [laneName]: updatedDetails,
    }));
  };

  const tableData = recommendations.flatMap((rec) =>
    rec.options.map((opt) => ({
      businessEntity: rec.businessEntity,
      containerType: rec.containerType,
      commodity: rec.commodity,
      laneName: rec.route,
      targetPrice: rec.targetPrice,
      category: opt.category === "Additional Option" ? "-" : opt.category,
      supplier: opt.supplier,
      price: opt.price,
      transitTime: opt.transitTime,
      freeTime: opt.freeTime,
      transshipments: opt.transshipments,
      temperatureControl: opt.temperatureControl,
      awardStatus: awardedSuppliers[rec.route] === opt.supplier ? "Awarded" : "Not Awarded",
    })),
  )

  const filteredData = tableData.filter((row) => {
    const matchesLane = !selectedLane || row.laneName === selectedLane
    const matchesSearch = Object.entries(searchValues).every(([column, value]) => {
      if (!value) return true
      const cellValue = String(row[column as keyof typeof row] || "").toLowerCase()
      return cellValue.includes(value.toLowerCase())
    })
    const matchesTemperature =
      temperatureControl === "all" ||
      (temperatureControl === "yes" && row.temperatureControl) ||
      (temperatureControl === "no" && !row.temperatureControl)
    const matchesCommodity = selectedCommodities.length === 0 || selectedCommodities.includes(row.commodity)

    return matchesLane && matchesSearch && matchesTemperature && matchesCommodity
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortColumn) return 0

    const aValue = a[sortColumn as keyof typeof a]
    const bValue = b[sortColumn as keyof typeof b]

    if (typeof aValue === "number" && typeof bValue === "number") {
      return sortDirection === "asc" ? aValue - bValue : bValue - aValue
    }

    const aString = String(aValue || "").toLowerCase()
    const bString = String(bValue || "").toLowerCase()

    return sortDirection === "asc" ? aString.localeCompare(bString) : bString.localeCompare(aString)
  })

  const totalItems = sortedData.length
  const totalPages = Math.ceil(totalItems / itemsPerPage)
  const paginatedData = sortedData.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(startItem + itemsPerPage - 1, totalItems)

  const uniqueLanes = Array.from(new Set(recommendations.map((rec) => rec.route)))

  const handleSupplierSelection = (supplier: string, price: number, category: string) => {
    setSelectedSupplier(supplier)
    setSelectedPrice(price)
    setSelectedCategory(category)
    // ... any other existing logic ...
  }

  if (!rfq) {
    return <div className="p-8">Loading...</div>
  }

  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto p-6">
        <Button
          variant="ghost"
          className="mb-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50 pl-0"
          onClick={() => router.push("/")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{rfq.title}</h1>
            <div className="flex items-center mt-2">
              <Badge
                variant="outline"
                className={
                  rfq.status === "completed"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : rfq.status === "active"
                      ? "bg-green-100 text-green-800 border-green-200"
                      : "bg-yellow-100 text-yellow-800 border-yellow-200"
                }
              >
                {rfq.status}
              </Badge>
              <span className="text-gray-500 ml-4">Created on {rfq.createdAt}</span>
            </div>
          </div>
          <div className="flex space-x-2">
            {(rfq.status === "active" || rfq.status === "pending") && (
              <Button
                variant="destructive"
                className="bg-red-500 hover:bg-red-600"
                onClick={() => setShowCloseRfqDialog(true)}
              >
                Close RFQ
              </Button>
            )}
            <Button
              variant="outline"
              className="flex items-center text-blue-600 border-blue-200"
              onClick={() => setShowDetailsModal(true)}
            >
              <Info className="mr-2 h-4 w-4" />
              More Details
            </Button>
          </div>
        </div>

        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <Label htmlFor="lane-select" className="block mb-2 text-sm font-medium">
                Select Lane
              </Label>
              <select
                id="lane-select"
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                value={selectedLane}
                onChange={handleLaneChange}
              >
                <option value="">All Lanes</option>
                {uniqueLanes.map((lane) => (
                  <option key={lane} value={lane}>
                    {lane}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <p className="block mb-2 text-sm font-medium">Temperature Control</p>
              <div className="flex space-x-4">
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="temp-all"
                    name="temperature"
                    checked={temperatureControl === "all"}
                    onChange={() => setTemperatureControl("all")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="temp-all" className="ml-2">
                    All
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="temp-yes"
                    name="temperature"
                    checked={temperatureControl === "yes"}
                    onChange={() => setTemperatureControl("yes")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="temp-yes" className="ml-2">
                    Yes
                  </Label>
                </div>
                <div className="flex items-center">
                  <input
                    type="radio"
                    id="temp-no"
                    name="temperature"
                    checked={temperatureControl === "no"}
                    onChange={() => setTemperatureControl("no")}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor="temp-no" className="ml-2">
                    No
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <p className="block mb-2 text-sm font-medium">Commodity</p>
              <div className="space-y-2">
                {commodities.map((commodity) => (
                  <div key={commodity} className="flex items-center">
                    <input
                      type="checkbox"
                      id={`commodity-${commodity.toLowerCase()}`}
                      checked={selectedCommodities.includes(commodity)}
                      onChange={() => handleCommodityChange(commodity)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <Label htmlFor={`commodity-${commodity.toLowerCase()}`} className="ml-2">
                      {commodity}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>

        {showDetailsModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-4xl">
              <div className="p-6">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold">Detailed Supplier Information</h2>
                  <button className="text-gray-500 hover:text-gray-700" onClick={() => setShowDetailsModal(false)}>
                    <X className="h-6 w-6" />
                  </button>
                </div>

                <div className="flex border-b mb-6">
                  <div
                    className={`flex items-center px-6 py-3 cursor-pointer ${
                      activeSupplierTab === "all" ? "border-b-2 border-blue-500 text-blue-600" : "text-gray-500"
                    }`}
                    onClick={() => setActiveSupplierTab("all")}
                  >
                    <svg
                      className="h-5 w-5 mr-2 text-blue-600"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    All Suppliers
                  </div>
                  <div
                    className={`flex items-center px-6 py-3 cursor-pointer ${
                      activeSupplierTab === "reverted" ? "border-b-2 border-green-500 text-green-600" : "text-gray-500"
                    }`}
                    onClick={() => setActiveSupplierTab("reverted")}
                  >
                    <svg
                      className="h-5 w-5 mr-2 text-green-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M5 13L9 17L19 7"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Reverted Suppliers
                  </div>
                  <div
                    className={`flex items-center px-6 py-3 cursor-pointer ${
                      activeSupplierTab === "pending" ? "border-b-2 border-yellow-500 text-yellow-600" : "text-gray-500"
                    }`}
                    onClick={() => setActiveSupplierTab("pending")}
                  >
                    <svg
                      className="h-5 w-5 mr-2 text-yellow-500"
                      viewBox="0 0 24 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                    Pending Suppliers
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-6">
                  {activeSupplierTab === "all" && (
                    <div className="col-span-3">
                      <div className="bg-white border rounded-md h-64 overflow-y-auto">
                        <ul className="divide-y">
                          <li className="p-3 hover:bg-gray-50">Rail Cargo Services</li>
                          <li className="p-3 hover:bg-gray-50">Road Transport Solutions</li>
                          <li className="p-3 hover:bg-gray-50">Cargo Express</li>
                          <li className="p-3 hover:bg-gray-50">Worldwide Logistics</li>
                          <li className="p-3 hover:bg-gray-50">Air Cargo Express</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeSupplierTab === "reverted" && (
                    <div className="col-span-3">
                      <div className="bg-green-50 border border-green-100 rounded-md h-64 overflow-y-auto">
                        <ul className="divide-y divide-green-100">
                          <li className="p-3 hover:bg-green-100">Rail Cargo Services</li>
                          <li className="p-3 hover:bg-green-100">Road Transport Solutions</li>
                          <li className="p-3 hover:bg-green-100">Cargo Express</li>
                          <li className="p-3 hover:bg-green-100">Worldwide Logistics</li>
                        </ul>
                      </div>
                    </div>
                  )}

                  {activeSupplierTab === "pending" && (
                    <div className="col-span-3">
                      <div className="bg-yellow-50 border border-yellow-100 rounded-md h-64 overflow-y-auto">
                        <ul className="divide-y divide-yellow-100">
                          <li className="p-3 hover:bg-yellow-100">Rail Cargo Services</li>
                          <li className="p-3 hover:bg-yellow-100">Worldwide Logistics</li>
                          <li className="p-3 hover:bg-yellow-100">Air Cargo Express</li>
                          <li className="p-3 hover:bg-yellow-100">Logistics Partners</li>
                          <li className="p-3 hover:bg-yellow-100">Supply Chain Management</li>
                        </ul>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Supplier Recommendations - Collapsible Routes */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold mb-4">Supplier Recommendations</h2>

          <div className="space-y-4">
            {recommendations
              .filter((rec) => !selectedLane || rec.route === selectedLane)
              .filter((rec) => selectedCommodities.length === 0 || selectedCommodities.includes(rec.commodity))
              .map((rec) => (
                <div key={rec.route} className="border rounded-md overflow-hidden">
                  <button
                    className="w-full flex justify-between items-center p-4 bg-gray-50 hover:bg-gray-100 text-left"
                    onClick={() => toggleRouteExpansion(rec.route)}
                  >
                    <span className="font-medium">{rec.route}</span>
                    {expandedRoutes.includes(rec.route) ? (
                      <ChevronUp className="h-5 w-5" />
                    ) : (
                      <ChevronDown className="h-5 w-5" />
                    )}
                  </button>

                  {expandedRoutes.includes(rec.route) && routeDetails[rec.route] && (
                    <div className="p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {routeDetails[rec.route]
                          .filter((detail) => detail.category !== "Additional Option")
                          .map((detail, idx) => (
                            <Card
                              key={idx}
                              className={`p-4 ${detail.category === "Best Overall Option" ? "border-green-500 border-2" : ""}`}
                            >
                              <div className="flex justify-between items-start mb-4">
                                <h3 className="font-semibold">{detail.category}</h3>
                                {detail.category === "Best Overall Option" && (
                                  <Badge className="bg-green-100 text-green-800 border-green-200">Recommended</Badge>
                                )}
                              </div>

                              <div className="space-y-3">
                                <div className="flex items-center">
                                  <svg
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                    <path
                                      d="M20.5899 22C20.5899 18.13 16.7399 15 11.9999 15C7.25991 15 3.40991 18.13 3.40991 22"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>{detail.supplier}</span>
                                </div>

                                <div className="flex items-center">
                                  <svg
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M8 16H6C4.89543 16 4 15.1046 4 14V6C4 4.89543 4.89543 4 6 4H18C19.1046 4 20 4.89543 20 6V14C20 15.1046 19.1046 16 18 16H16M12 20V12M12 12L9 15M12 12L15 15"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>{detail.transfers} Transfers</span>
                                </div>

                                <div className="flex items-center">
                                  <svg
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>Transit Time: {detail.transitTime} days</span>
                                </div>

                                <div className="flex items-center">
                                  <svg
                                    className={`h-5 w-5 mr-2 ${detail.temperatureControl ? "text-green-500" : "text-red-500"}`}
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    {detail.temperatureControl ? (
                                      <path
                                        d="M5 13L9 17L19 7"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    ) : (
                                      <path
                                        d="M18 6L6 18M6 6L18 18"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                      />
                                    )}
                                  </svg>
                                  <span>Temperature Control: {detail.temperatureControl ? "Yes" : "No"}</span>
                                </div>

                                <div className="flex items-center">
                                  <svg
                                    className="h-5 w-5 mr-2 text-gray-500"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12 8V12L15 15M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                  <span>Free Time at Port: {detail.freeTime} days</span>
                                </div>
                              </div>

                              <div className="mt-6">
                                <div className="flex items-baseline">
                                  <span className="text-xl font-bold">${detail.price.toLocaleString()}</span>
                                  <span className="text-gray-500 ml-1 text-sm">({detail.priceCode})</span>
                                </div>

                                <div className="mt-2">
                                  <div className="h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-blue-500 rounded-full"
                                      style={{ width: `${detail.recommendationScore}%` }}
                                    ></div>
                                  </div>
                                  <div className="text-sm text-gray-500 mt-1">
                                    Recommendation Score: {detail.recommendationScore.toFixed(1)}%
                                  </div>
                                </div>

                                <div className="grid grid-cols-2 gap-2 mt-4 text-sm">
                                  <div>
                                    <div className="text-gray-500">Shortest Transit Time:</div>
                                    <div>{detail.shortestTransitTime} days</div>
                                  </div>
                                  <div>
                                    <div className="text-gray-500">Longest Transit Time:</div>
                                    <div>{detail.longestTransitTime} days</div>
                                  </div>
                                </div>

                                <Button
                                  variant={awardedSuppliers[rec.route] === detail.supplier ? "default" : "outline"}
                                  size="sm"
                                  className={
                                    awardedSuppliers[rec.route] === detail.supplier
                                      ? "bg-green-500 text-white"
                                      : "bg-gray-100 text-gray-700"
                                  }
                                  onClick={() => handleAwardStatusChange(detail.supplier, rec.route)}
                                  disabled={rfq.status === "completed"}
                                >
                                  {awardedSuppliers[rec.route] === detail.supplier ? "Awarded" : "Not Awarded"}
                                </Button>
                              </div>
                            </Card>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
          </div>
        </div>

        {/* Supplier Recommendations - Table */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Supplier Recommendations</h2>
            <div className="flex space-x-2">
              <Button
                variant="outline"
                className="bg-blue-50 text-blue-600 border-blue-200"
                onClick={() => setShowImportModal(true)}
              >
                <Download className="mr-2 h-4 w-4" />
                Import
              </Button>
              <Button variant="outline" className="bg-green-50 text-green-600 border-green-200" onClick={handleExport}>
                <Upload className="mr-2 h-4 w-4" />
                Export
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto border rounded-md">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b">
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Business Entity</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("businessEntity")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.businessEntity || ""}
                      onChange={(e) => handleSearch("businessEntity", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Container Type</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("containerType")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.containerType || ""}
                      onChange={(e) => handleSearch("containerType", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Commodity</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("commodity")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.commodity || ""}
                      onChange={(e) => handleSearch("commodity", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Lane Name</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("laneName")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.laneName || ""}
                      onChange={(e) => handleSearch("laneName", e.target.value)}
                    />
                  </th>
                  {(rfq.status === "active" || rfq.status === "pending") && (
                    <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                      <div className="flex items-center">
                        <span>Target Price</span>
                        <button className="ml-1 focus:outline-none" onClick={() => handleSort("targetPrice")}>
                          <span className="text-gray-400">↕</span>
                        </button>
                      </div>
                      <Input
                        className="mt-1 text-xs h-8"
                        placeholder="Search"
                        value={searchValues.targetPrice || ""}
                        onChange={(e) => handleSearch("targetPrice", e.target.value)}
                      />
                    </th>
                  )}
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Category</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("category")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.category || ""}
                      onChange={(e) => handleSearch("category", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span className="text-green-600">Supplier</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("supplier")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.supplier || ""}
                      onChange={(e) => handleSearch("supplier", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span className="text-green-600">Price</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("price")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.price || ""}
                      onChange={(e) => handleSearch("price", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span className="text-green-600">Transit Time</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("transitTime")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.transitTime || ""}
                      onChange={(e) => handleSearch("transitTime", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Free Time</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("freeTime")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.freeTime || ""}
                      onChange={(e) => handleSearch("freeTime", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Transshipment</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("transshipments")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.transshipments || ""}
                      onChange={(e) => handleSearch("transshipments", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Temperature Control</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("temperatureControl")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.temperatureControl || ""}
                      onChange={(e) => handleSearch("temperatureControl", e.target.value)}
                    />
                  </th>
                  <th className="p-3 text-left text-xs font-medium text-gray-500 uppercase">
                    <div className="flex items-center">
                      <span>Award Status</span>
                      <button className="ml-1 focus:outline-none" onClick={() => handleSort("awardStatus")}>
                        <span className="text-gray-400">↕</span>
                      </button>
                    </div>
                    <Input
                      className="mt-1 text-xs h-8"
                      placeholder="Search"
                      value={searchValues.awardStatus || ""}
                      onChange={(e) => handleSearch("awardStatus", e.target.value)}
                    />
                  </th>
                </tr>
              </thead>
              <tbody className="overflow-y-auto max-h-96">
                {paginatedData.length > 0 ? (
                  paginatedData.map((row, index) => (
                    <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="p-3 text-sm">{row.businessEntity}</td>
                      <td className="p-3 text-sm">{row.containerType}</td>
                      <td className="p-3 text-sm">{row.commodity}</td>
                      <td className="p-3 text-sm text-blue-600 whitespace-nowrap">{row.laneName}</td>
                      {(rfq.status === "active" || rfq.status === "pending") && (
                        <td className="p-3 text-sm">${row.targetPrice.toLocaleString()}</td>
                      )}
                      <td className="p-3 text-sm font-bold text-center">{row.category}</td>
                      <td className="p-3 text-sm text-green-600">{row.supplier}</td>
                      <td className="p-3 text-sm text-green-600">${row.price.toLocaleString()}</td>
                      <td className="p-3 text-sm text-green-600">{row.transitTime}</td>
                      <td className="p-3 text-sm">{row.freeTime}</td>
                      <td className="p-3 text-sm">{row.transshipments}</td>
                      <td className="p-3 text-sm">{row.temperatureControl ? "Yes" : "No"}</td>
                      <td className="p-3 text-sm">
                      <Button
                          variant={awardedSuppliers[row.laneName] === row.supplier ? "default" : "outline"}
                          size="sm"
                          className={
                            awardedSuppliers[row.laneName] === row.supplier
                              ? "bg-green-500 text-white"
                              : "bg-gray-100 text-gray-700"
                          }
                          onClick={() => handleAwardStatusChange(row.supplier, row.laneName)}
                          disabled={rfq.status === "completed"} // Disable button after RFQ is closed
                        >
                          {awardedSuppliers[row.laneName] === row.supplier ? "Awarded" : "Not Awarded"}
                        </Button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={rfq.status === "completed" ? 12 : 13} className="p-6 text-center text-gray-500">
                      No results found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-between items-center mt-4 text-sm text-gray-500">
            <div>
              Showing {startItem} to {endItem} of {totalItems} results
            </div>
            <div className="flex space-x-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage - 1)}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNumber = i + 1
                return (
                  <Button
                    key={i}
                    variant={pageNumber === currentPage ? "default" : "outline"}
                    size="sm"
                    onClick={() => setCurrentPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
              {totalPages > 5 && <span className="px-2">...</span>}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        </div>

        {/* Close RFQ Dialog */}
        {showCloseRfqDialog && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Close RFQ</h2>
              <p className="mb-6">
                Are you sure you want to close this RFQ? This action will mark the RFQ as completed and cannot be
                undone.
              </p>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowCloseRfqDialog(false)}>
                  Cancel
                </Button>
                <Button className="bg-red-500 hover:bg-red-600 text-white" onClick={handleCloseRfq}>
                  Close RFQ
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Mail Sent Popup */}
        {showMailSentPopup && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="bg-green-500 text-white rounded-lg shadow-lg p-4">
              <p className="text-lg font-semibold">Mail sent</p>
            </div>
          </div>
        )}

        {/* Import Modal */}
        {showImportModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg shadow-lg w-full max-w-md p-6">
              <h2 className="text-xl font-bold mb-4">Import Data</h2>
              <div className="mb-6">
                <div
                  className="border-2 border-dashed rounded-md border-gray-300 p-6 text-center cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-6 w-6 mx-auto text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">Click to upload CSV</p>
                  <p className="text-xs text-gray-400">Headers required</p>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setImportFile(e.target.files[0])
                      }
                    }}
                  />
                </div>
                {importFile && (
                  <div className="mt-2 text-sm text-gray-600">
                    Selected file: <span className="font-medium">{importFile.name}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setShowImportModal(false)}>
                  Cancel
                </Button>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={handleImport}>
                  Import
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}