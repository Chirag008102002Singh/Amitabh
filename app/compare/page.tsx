"use client"

import React from "react"
import { useState, useEffect, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { ArrowLeft, Download, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card } from "@/components/ui/card"
import { getRouteRecommendations, RouteRecommendation, initialRfqs as rfqDataInitialRfqs, RFQ } from "@/data/rfq-data"


console.log("RFQ Lane Data", rfqDataInitialRfqs)
console.log("Route Recommendations", getRouteRecommendations)

interface ComparisonData {
  lane: string
  commodity: string
  businessEntity: string
  containerType: string
  supplierName: string
  percentChange: number
  trend: "up" | "down" | "stable"
  overallTrend: "increase" | "decrease" | "stable"
  category: string
  [key: string]: any
}

const additionalFilters = [
  { name: "Select Business Entity *", value: "" },
  { name: "Select Commodity *", value: "" },
  { name: "Select Container Type *", value: "" },
]

export default function ComparePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [selectedLane, setSelectedLane] = useState<string>("")
  const [selectedBusinessEntity, setSelectedBusinessEntity] = useState<string>("")
  const [selectedCommodity, setSelectedCommodity] = useState<string>("")
  const [selectedContainerType, setSelectedContainerType] = useState<string>("")
  const [showLaneDropdown, setShowLaneDropdown] = useState<boolean>(false)
  const [showBusinessEntityDropdown, setShowBusinessEntityDropdown] = useState<boolean>(false)
  const [showCommodityDropdown, setShowCommodityDropdown] = useState<boolean>(false)
  const [showContainerTypeDropdown, setShowContainerTypeDropdown] = useState<boolean>(false)
  const [comparisonData, setComparisonData] = useState<ComparisonData[]>([])
  const [sortDirection, setSortDirection] = useState<"asc" | "desc" | null>(null)
  const [sortColumn, setSortColumn] = useState<string | null>(null)
  const [uniqueLanes, setUniqueLanes] = useState<string[]>([])
  const [uniqueBusinessEntities, setUniqueBusinessEntities] = useState<string[]>([])
  const [uniqueCommodities, setUniqueCommodities] = useState<string[]>([])
  const [uniqueContainerTypes, setUniqueContainerTypes] = useState<string[]>([])
  const [allComparisonData, setAllComparisonData] = useState<ComparisonData[]>([]) // Store unfiltered data

  const initialized = useRef(false)
  const rfqsInitialized = useRef(false)

  useEffect(() => {
    if (!initialized.current) {
      // Extract unique Business Entities, Commodities, and Container Types
      const businessEntitiesSet = new Set<string>()
      const commoditiesSet = new Set<string>()
      const containerTypesSet = new Set<string>()
      const lanesSet = new Set<string>()

      rfqDataInitialRfqs.forEach((rfq) => {
        const recommendations = getRouteRecommendations(rfq.id)
        recommendations.forEach((rec) => {
          lanesSet.add(rec.route)
          businessEntitiesSet.add(rec.businessEntity)
          commoditiesSet.add(rec.commodity)
          containerTypesSet.add(rec.containerType)
        })
      })

      setUniqueLanes(Array.from(lanesSet))
      setUniqueBusinessEntities(Array.from(businessEntitiesSet))
      setUniqueCommodities(Array.from(commoditiesSet))
      setUniqueContainerTypes(Array.from(containerTypesSet))
      initialized.current = true
    }
  }, [])

  useEffect(() => {
    if (!rfqsInitialized.current) {
      const rfqIds = searchParams?.get("rfqs")?.split(",") || []
      const laneFromUrl = searchParams?.get("lane") || ""

      if (rfqIds.length > 0) {
        const selectedRfqs = rfqDataInitialRfqs.filter((rfq) => rfqIds.includes(rfq.id))
        if (selectedRfqs.length > 0) {
          setRfqs(selectedRfqs)

          // Dynamically populate lanes based on selected RFQs
          const lanesSet = new Set<string>()
          selectedRfqs.forEach((rfq) => {
            const recommendations = getRouteRecommendations(rfq.id)
            recommendations.forEach((rec) => lanesSet.add(rec.route))
          })
          setUniqueLanes(Array.from(lanesSet))

          // Set the selected lane from the URL
          if (laneFromUrl && lanesSet.has(decodeURIComponent(laneFromUrl))) {
            setSelectedLane(decodeURIComponent(laneFromUrl))
          }

          const dynamicComparisonData = generateComparisonData(selectedRfqs)
          setAllComparisonData(dynamicComparisonData)
          setComparisonData(dynamicComparisonData)  // Always set all data initially
        } else {
          const defaultRfqs = rfqDataInitialRfqs.slice(0, 2)
          setRfqs(defaultRfqs)
          const dynamicComparisonData = generateComparisonData(defaultRfqs)
          setAllComparisonData(dynamicComparisonData)
          setComparisonData(dynamicComparisonData)
        }
      } else {
        const defaultRfqs = rfqDataInitialRfqs.slice(0, 2)
        setRfqs(defaultRfqs)
        const dynamicComparisonData = generateComparisonData(defaultRfqs)
        setAllComparisonData(dynamicComparisonData)
        setComparisonData(dynamicComparisonData)
      }
      rfqsInitialized.current = true
    }
  }, [searchParams])

  const generateComparisonData = (selectedRfqs: RFQ[]) => {
    const data: ComparisonData[] = []

    // 1. Collect all unique (lane, category) pairs across all RFQs
    const laneCategoryPairs = new Set<string>()
    selectedRfqs.forEach((rfq) => {
      const recommendations = getRouteRecommendations(rfq.id)
      recommendations.forEach((rec) => {
        rec.options.forEach((opt) => {
          laneCategoryPairs.add(`${rec.route}|||${opt.category}`)
        })
      })
    })

    // 2. For each (lane, category), build a row
    Array.from(laneCategoryPairs).forEach((pair) => {
      const [lane, category] = pair.split("|||")
      const item: ComparisonData = {
        lane,
        commodity: "",
        businessEntity: "",
        containerType: "",
        supplierName: "",
        percentChange: 0,
        trend: "stable",
        overallTrend: "stable",
        category,
      }

      let previousPrice = 0
      let overallChange = 0
      let hasAnyPrice = false

      selectedRfqs.forEach((rfq, index) => {
        const recommendations = getRouteRecommendations(rfq.id)
        const recommendation = recommendations.find((rec) => rec.route === lane)
        const option = recommendation?.options.find((opt) => opt.category === category)

        if (index === 0 && recommendation) {
          item.commodity = recommendation.commodity
          item.businessEntity = recommendation.businessEntity
          item.containerType = recommendation.containerType
        }

        const price = option ? option.price : 0
        const targetPrice = recommendation ? recommendation.targetPrice : 0

        item[`${rfq.id}Price`] = price
        item[`${rfq.id}TargetPrice`] = targetPrice > 0 ? targetPrice : ""
        item[`${rfq.id}SupplierName`] = option?.supplier || ""
        item[`${rfq.id}Category`] = category

        if (price > 0) hasAnyPrice = true

        // Only calculate % change if both previous and current price exist
        if (index > 0 && previousPrice > 0 && price > 0) {
          const change = ((price - previousPrice) / previousPrice) * 100
          item[`${selectedRfqs[index - 1].id}_${rfq.id}`] = change.toFixed(1)
          item[`${selectedRfqs[index - 1].id}_${rfq.id}_trend`] =
            change < 0 ? "down" : change > 0 ? "up" : "stable"
          overallChange += change
        }

        previousPrice = price
      })

      // Calculate overall trend if there are at least two RFQs with prices
      if (selectedRfqs.length > 1) {
        const avgChange = overallChange / (selectedRfqs.length - 1)
        if (avgChange < -5) {
          item.overallTrend = "decrease"
          item.trend = "down"
          item.percentChange = Math.round(avgChange)
        } else if (avgChange > 5) {
          item.overallTrend = "increase"
          item.trend = "up"
          item.percentChange = Math.round(avgChange)
        } else {
          item.overallTrend = "stable"
          item.trend = "stable"
          item.percentChange = Math.round(avgChange)
        }
      }

      // Only add row if at least one price exists for this (lane, category)
      if (hasAnyPrice) {
        data.push(item)
      }
    })

    return data
  }

  const applyFilters = () => {
    let filteredData = [...allComparisonData]

    console.log("Filtered Data", filteredData)

    if (selectedLane && selectedLane !== "All") {
      filteredData = filteredData.filter((data) => data.lane === selectedLane)
    }

    if (selectedBusinessEntity && selectedBusinessEntity !== "All") {
      filteredData = filteredData.filter((data) => data.businessEntity === selectedBusinessEntity)
    }

    if (selectedCommodity && selectedCommodity !== "All") {
      filteredData = filteredData.filter((data) => data.commodity === selectedCommodity)
    }

    if (selectedContainerType && selectedContainerType !== "All") {
      filteredData = filteredData.filter((data) => data.containerType === selectedContainerType)
    }

    setComparisonData(filteredData)
  }

  const handleFilterChange = (filterType: string, value: string) => {
    if (filterType === "lane") {
      setSelectedLane(value)
      setShowLaneDropdown(false)
    } else if (filterType === "businessEntity") {
      setSelectedBusinessEntity(value)
      setShowBusinessEntityDropdown(false)
    } else if (filterType === "commodity") {
      setSelectedCommodity(value)
      setShowCommodityDropdown(false)
    } else if (filterType === "containerType") {
      setSelectedContainerType(value)
      setShowContainerTypeDropdown(false)
    }

    applyFilters()
  }

  const handleSort = (column: string) => {
    const isAsc = sortColumn === column && sortDirection === "asc"
    setSortDirection(isAsc ? "desc" : "asc")
    setSortColumn(column)

    const sortedData = [...comparisonData].sort((a, b) => {
      let valueA = a[column]
      let valueB = b[column]

      if (typeof valueA === "string" && !isNaN(Number(valueA))) {
        valueA = Number(valueA)
      }
      if (typeof valueB === "string" && !isNaN(Number(valueB))) {
        valueB = Number(valueB)
      }

      if (isAsc) {
        return valueB > valueA ? 1 : -1
      } else {
        return valueA > valueB ? 1 : -1
      }
    })

    setComparisonData(sortedData)
  }

  const handleExportComparison = () => {
    const headers = ["Lane"]
    rfqs.forEach((rfq) => {
      headers.push(`${rfq.title} Price`, `${rfq.title} Target Price`, `${rfq.title} Supplier Name`)
    })
    if (rfqs.length >= 2) {
      for (let i = 0; i < rfqs.length - 1; i++) {
        headers.push(`${rfqs[i].title} - ${rfqs[i + 1].title} % Change`)
      }
    }
    headers.push("Overall Trend")

    let csvContent = headers.join(",") + "\n"

    comparisonData.forEach((data) => {
      const row = [data.lane]
      rfqs.forEach((rfq) => {
        row.push(data[`${rfq.id}Price`], data[`${rfq.id}TargetPrice`], data[`${rfq.id}SupplierName`])
      })
      if (rfqs.length >= 2) {
        for (let i = 0; i < rfqs.length - 1; i++) {
          row.push(data[`${rfqs[i].id}_${rfqs[i + 1].id}`] + "%")
        }
      }
      row.push(data.overallTrend)
      csvContent += row.join(",") + "\n"
    })

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", "rfq_comparison.csv")
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleBackToDashboard = () => {
    router.push("/")
  }

  const getRfqStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-blue-50"
      case "pending":
        return "bg-yellow-50"
      case "active":
        return "bg-green-50"
      default:
        return "bg-gray-50"
    }
  }

  useEffect(() => {
    applyFilters()
  }, [selectedLane, selectedBusinessEntity, selectedCommodity, selectedContainerType])

  return (
    <div className="bg-gray-50 min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        <Button
          variant="ghost"
          className="mb-6 text-blue-600 hover:text-blue-800 hover:bg-blue-50 pl-0"
          onClick={handleBackToDashboard}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {rfqs.map((rfq) => (
            <Card key={rfq.id} className="p-6 shadow-sm">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold">{rfq.title}</h2>
                <Badge
                  className={
                    rfq.status === "completed"
                      ? "bg-blue-100 text-blue-800"
                      : rfq.status === "pending"
                        ? "bg-yellow-100 text-yellow-800"
                        : "bg-green-100 text-green-800"
                  }
                >
                  {rfq.status}
                </Badge>
              </div>
              <p className="text-gray-600 mt-2">Created: {rfq.createdAt}</p>
              <p className="text-gray-600 mt-1">
                Suppliers: {rfq.suppliers.length + rfq.additionalSuppliers}
              </p>
            </Card>
          ))}
        </div>

        <Card className="p-6 mb-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Required Information</h2>
          {selectedLane ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <button
                  className="w-full px-4 py-2 text-left border rounded-md flex justify-between items-center"
                  onClick={() => setShowLaneDropdown(!showLaneDropdown)}
                >
                  <span>{selectedLane}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
                {showLaneDropdown && (
                  <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                    <div
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFilterChange("lane", "All")}
                    >
                      All
                    </div>
                    {uniqueLanes.map((lane, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleFilterChange("lane", lane)}
                      >
                        {lane}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {additionalFilters.slice(0, 2).map((filter, index) => (
                <div key={index} className="relative">
                  {index === 0 ? (
                    <button
                      className="w-full px-4 py-2 text-left border rounded-md flex justify-between items-center"
                      onClick={() => setShowBusinessEntityDropdown(!showBusinessEntityDropdown)}
                    >
                      <span>{selectedBusinessEntity || filter.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  ) : (
                    <button
                      className="w-full px-4 py-2 text-left border rounded-md flex justify-between items-center"
                      onClick={() => setShowCommodityDropdown(!showCommodityDropdown)}
                    >
                      <span>{selectedCommodity || filter.name}</span>
                      <ChevronDown className="h-4 w-4" />
                    </button>
                  )}
                  {index === 0 && showBusinessEntityDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleFilterChange("businessEntity", "")}
                      >
                        All
                      </div>
                      {uniqueBusinessEntities.map((entity, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleFilterChange("businessEntity", entity)}
                        >
                          {entity}
                        </div>
                      ))}
                    </div>
                  )}
                  {index === 1 && showCommodityDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleFilterChange("commodity", "")}
                      >
                        All
                      </div>
                      {uniqueCommodities.map((commodity, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleFilterChange("commodity", commodity)}
                        >
                          {commodity}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {additionalFilters.slice(2).map((filter, index) => (
                <div key={index} className="relative">
                  <button
                    className="w-full px-4 py-2 text-left border rounded-md flex justify-between items-center"
                    onClick={() => setShowContainerTypeDropdown(!showContainerTypeDropdown)}
                  >
                    <span>{selectedContainerType || filter.name}</span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  {showContainerTypeDropdown && (
                    <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                      <div
                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                        onClick={() => handleFilterChange("containerType", "")}
                      >
                        All
                      </div>
                      {uniqueContainerTypes.map((type, idx) => (
                        <div
                          key={idx}
                          className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                          onClick={() => handleFilterChange("containerType", type)}
                        >
                          {type}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="relative">
              <button
                className="w-full px-4 py-2 text-left border rounded-md flex justify-between items-center"
                onClick={() => setShowLaneDropdown(!showLaneDropdown)}
              >
                <span>Select Lane *</span>
                <ChevronDown className="h-4 w-4" />
              </button>
              {showLaneDropdown && (
                <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-auto">
                  <div
                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                    onClick={() => handleFilterChange("lane", "All")}
                  >
                    All
                  </div>
                  {uniqueLanes.map((lane, index) => (
                    <div
                      key={index}
                      className="px-4 py-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handleFilterChange("lane", lane)}
                    >
                      {lane}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">RFQ Comparison Matrix</h2>
            <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={handleExportComparison}>
              <Download className="mr-2 h-4 w-4" />
              Export Comparison
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="p-3 bg-gray-50 border text-left text-sm font-medium text-gray-500" rowSpan={2}>
                    LANE DETAILS
                  </th>
                  <th className="p-3 bg-gray-50 border text-left text-sm font-medium text-gray-500" rowSpan={2}>
                    SUPPLIER NAME
                  </th>
                  {rfqs.map((rfq) => (
                    <th
                      key={rfq.id}
                      className={`p-3 border text-center text-sm font-medium text-gray-500 ${getRfqStatusColor(rfq.status)}`}
                      colSpan={2}
                    >
                      {rfq.title}
                    </th>
                  ))}
                  {rfqs.length >= 2 && (
                    <>
                      {rfqs.slice(0, -1).map((rfq, index) => (
                        <th
                          key={`${rfq.id}-comparison`}
                          className="p-3 bg-purple-50 border text-center text-sm font-medium text-gray-500"
                          colSpan={2}
                        >
                          {rfq.title} – {rfqs[index + 1].title}
                        </th>
                      ))}
                    </>
                  )}
                </tr>
                <tr>
                  {rfqs.map((rfq) => (
                    <React.Fragment key={`${rfq.id}-headers`}>
                      <th
                        className={`p-3 border text-center text-sm font-medium text-gray-500 cursor-pointer ${getRfqStatusColor(rfq.status)}`}
                        onClick={() => handleSort(`${rfq.id}Price`)}
                      >
                        PRICE ↕
                      </th>
                      <th
                        className={`p-3 border text-center text-sm font-medium text-gray-500 ${getRfqStatusColor(rfq.status)}`}
                      >
                        TARGET PRICE
                      </th>
                    </React.Fragment>
                  ))}
                  {rfqs.length >= 2 &&
                    rfqs.slice(0, -1).map((rfq, idx) => (
                      <React.Fragment key={`${rfq.id}-comparison-headers`}>
                        <th className="p-3 bg-purple-50 border text-center text-sm font-medium text-gray-500">
                          % CHANGE
                        </th>
                        <th className="p-3 bg-purple-50 border text-center text-sm font-medium text-gray-500">TREND</th>
                      </React.Fragment>
                    ))}
                </tr>
              </thead>
              <tbody>
                {comparisonData.map((data, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="p-3 border text-sm">{data.lane}</td>
                    <td className="p-3 border text-sm text-center bg-yellow-50">
                      {data[`${rfqs[0].id}SupplierName`] || "-"}
                    </td>
                    {rfqs.map((rfq) => (
                      <React.Fragment key={`${rfq.id}-data-${index}`}>
                        <td className="p-3 border text-sm text-center bg-red-50">
                          {data[`${rfq.id}Price`] && data[`${rfq.id}Price`] !== 0
                            ? `$${data[`${rfq.id}Price`]?.toLocaleString()}`
                            : "-"}
                        </td>
                        <td className="p-3 border text-sm text-center bg-blue-50">
                          {rfq.status !== "completed" && data[`${rfq.id}TargetPrice`] && data[`${rfq.id}TargetPrice`] !== 0
                            ? `$${data[`${rfq.id}TargetPrice`]?.toLocaleString()}`
                            : "-"}
                        </td>
                      </React.Fragment>
                    ))}
                    {rfqs.length >= 2 &&
                      rfqs.slice(0, -1).map((rfq, idx) => {
                        const comparisonKey = `${rfq.id}_${rfqs[idx + 1].id}`
                        const trendKey = `${comparisonKey}_trend`
                        const percentChangeRaw = data[comparisonKey]
                        const percentChange = Number.parseFloat(percentChangeRaw || "0")
                        const hasPercentChange = percentChangeRaw !== undefined && percentChangeRaw !== null && percentChangeRaw !== "" && !isNaN(Number(percentChangeRaw))
                        const trend = data[trendKey] || ""
                        const isNegative = percentChange < 0

                        return (
                          <React.Fragment key={`${comparisonKey}-${index}`}>
                            <td
                              className={`p-3 border text-sm text-center ${hasPercentChange && isNegative ? "text-red-500" : hasPercentChange ? "text-green-500" : "text-gray-400"}`}
                            >
                              {hasPercentChange
                                ? `${percentChange > 0 ? "+" : ""}${data[comparisonKey]}%`
                                : "N/A"}
                            </td>
                            <td className="p-3 border text-sm text-center text-green-500 flex justify-center">
                              <span className="flex items-center">
                                {hasPercentChange ? (
                                  <svg className="h-4 w-4 mr-1" viewBox="0 0 24 24" fill="none">
                                    <path
                                      d={trend === "down" ? "M5 11L12 18L19 11" : "M19 13L12 6L5 13"}
                                      stroke={trend === "down" ? "rgb(239, 68, 68)" : "rgb(34, 197, 94)"}
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                    />
                                  </svg>
                                ) : null}
                                <span className={trend === "down" ? "text-red-500" : hasPercentChange ? "text-green-500" : "text-gray-400"}>
                                  {hasPercentChange
                                    ? (trend === "down" ? "Down" : "Up")
                                    : "-"}
                                </span>
                              </span>
                            </td>
                          </React.Fragment>
                        )
                      })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}