// Type definitions
export type Supplier = {
  id: string
  name: string
}

export type RFQ = {
  id: string
  title: string
  createdAt: string
  month: string // Add this to track the month
  status: "active" | "pending" | "completed"
  suppliers: { name: string }[]
  additionalSuppliers: number
}

export type RouteRecommendation = {
  route: string
  businessEntity: string
  containerType: string
  commodity: string
  targetPrice: number
  options: {
    category: string
    supplier: string
    price: number
    transitTime: string
    freeTime: string
    transshipments: string
    temperatureControl: boolean
    awardStatus: string
  }[]
}

export type RouteDetail = {
  category: string
  supplier: string
  transfers: number
  transitTime: string
  temperatureControl: boolean
  freeTime: string
  price: number
  priceCode: string
  recommendationScore: number
  shortestTransitTime: string
  longestTransitTime: string
  awardStatus: string
}

export type SupplierCategory = "all" | "reverted" | "pending"

// Helper functions
const getRandomInt = (min: number, max: number): number => {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const getRandomElement = <T>(array: T[]): T => {
  return array[Math.floor(Math.random() * array.length)]
}

const getRandomSubset = <T>(array: T[], minSize: number, maxSize: number): T[] => {
  const size = getRandomInt(minSize, Math.min(maxSize, array.length))
  const shuffled = [...array].sort(() => 0.5 - Math.random())
  return shuffled.slice(0, size)
}

const getRandomBoolean = (probability: number = 0.5): boolean => {
  return Math.random() < probability
}

const generatePrice = (base: number, variance: number): number => {
  const varianceFactor = 1 + (Math.random() * variance * 2 - variance)
  return Math.round(base * varianceFactor)
}

const generateConsistentPrice = (seed: string, base: number, variance: number): number => {
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = ((hash << 5) - hash) + seed.charCodeAt(i)
    hash |= 0
  }
  const random = Math.abs((Math.sin(hash) * 10000) % 1)
  const varianceFactor = 1 + (random * variance * 2 - variance)
  return Math.round(base * varianceFactor)
}

// Helper function to format date
const formatDate = (date: Date): string => {
  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

// Constants
const businessEntities = ["PTSON", "IEG", "GCC", "FISB"]
const containerTypes = ["20 DC", "40ft HC"]
const commodities = ["Electronics", "Resin", "Oils/Fats", "Textiles", "Machinery", "Chemicals", "Automotive Parts"]

// Sample suppliers data
export const availableSuppliers: Supplier[] = [
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
  { id: "11", name: "Rail Cargo Services" },
  { id: "12", name: "Road Transport Solutions" },
  { id: "13", name: "Cargo Express" },
  { id: "14", name: "Global Logistics Co" },
  { id: "15", name: "Global Supply Chain" },
  { id: "16", name: "Intermodal Transport" },
  { id: "17", name: "Supply Chain Solutions" },
  { id: "18", name: "Transportation Services" },
  { id: "19", name: "FastTrack Shipping" },
  { id: "20", name: "International Shipping" },
  { id: "21", name: "Ocean Freight Ltd" },
  { id: "22", name: "Logistics Network" },
  { id: "23", name: "TransGlobal Shipping" },
  { id: "24", name: "Supply Chain Management" },
  { id: "25", name: "Shipping Solutions" },
  { id: "26", name: "Maritime Shipping Co" },
  { id: "27", name: "Land Transport Solutions" },
  { id: "28", name: "Express Delivery Co" },
  { id: "29", name: "Rail Freight Services" },
  { id: "30", name: "Continental Transport" },
]

// Define routes
const routes = [
  "Singapore → Los Angeles",
  "Kaohsiung → Dubai",
  "Singapore → Marseille",
  "Hong Kong → Marseille",
  "Guangzhou → Hamburg",
  "Kaohsiung → Mumbai",
  "Singapore → Genoa",
  "Tokyo → Rotterdam",
  "Singapore → Barcelona",
  "Shanghai → New York",
  "Busan → Long Beach",
  "Qingdao → Antwerp",
  "Ningbo → Valencia",
  "Shenzhen → Felixstowe",
  "Xiamen → Le Havre",
]

// Helper function to generate RFQs
const generateRfqs = (count: number = 50): RFQ[] => {
  const rfqs: RFQ[] = []
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const years = [2023, 2024, 2025]
  const statuses: Array<"active" | "pending" | "completed"> = ["active", "pending", "completed"]

  for (let i = 0; i < count; i++) {
    const year = getRandomElement(years)
    const month = getRandomElement(months)
    const day = getRandomInt(1, 28)
    const date = new Date(year, months.indexOf(month), day)
    
    const suppliers = getRandomSubset(availableSuppliers, 3, 3).map(s => ({ name: s.name }))
    
    rfqs.push({
      id: `RFQ_${month}_${year}_${i + 1}`,
      title: `RFQ_${month}_${year}_${i + 1}`,
      createdAt: formatDate(date),
      month,
      status: getRandomElement(statuses),
      suppliers,
      additionalSuppliers: getRandomInt(15, 30)
    })
  }

  return rfqs
}

// Export the generated RFQs
export const initialRfqs: RFQ[] = generateRfqs(50)

// Define month-to-lane mapping
const monthToLanesMap: Record<string, string[]> = {};

// Predefine lanes for each month
const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
months.forEach(month => {
  const numLanes = getRandomInt(2, 4); // Each month gets 2-4 lanes
  monthToLanesMap[month] = getRandomSubset(routes, numLanes, numLanes);
});

// Add month-to-lane-to-suppliers mapping
const monthToLaneToSuppliersMap: Record<string, Record<string, string[]>> = {};

// Predefine suppliers for each lane in each month
months.forEach(month => {
  monthToLaneToSuppliersMap[month] = {};
  const selectedLanes = monthToLanesMap[month];
  selectedLanes.forEach(lane => {
    // Assign 4-6 suppliers per lane for consistency
    const suppliers = getRandomSubset(availableSuppliers, 4, 6).map(s => s.name);
    monthToLaneToSuppliersMap[month][lane] = suppliers;
  });
});

// Generate route recommendations for all RFQs
export const generateRouteRecommendations = (): Record<string, RouteRecommendation[]> => {
  const recommendations: Record<string, RouteRecommendation[]> = {};
  
  initialRfqs.forEach(rfq => {
    // Use the predefined lanes for the RFQ's month
    const rfqRoutes = monthToLanesMap[rfq.month]; // Get the lanes assigned to this month
    
    recommendations[rfq.id] = rfqRoutes.map(route => {
      const businessEntity = getRandomElement(businessEntities);
      const containerType = getRandomElement(containerTypes);
      const commodity = getRandomElement(commodities);
      
      const baseTargetPrice = generateConsistentPrice(`${route}-${containerType}`, 
        containerType.includes("40ft") ? 10000 : 5000, 0.5);
      
      // Use the fixed suppliers for this month and lane
      const suppliers = monthToLaneToSuppliersMap[rfq.month][route] || getRandomSubset(availableSuppliers, 4, 6).map(s => s.name);
      const numOptions = suppliers.length; // Use the number of suppliers as the number of options
      const options = [];
      
      suppliers.forEach((supplier, index) => {
        const category = index === 0 ? "Best Overall Option" : index === 1 ? "Alternative 1" : index === 2 ? "Alternative 2" : "Additional Option";
        
        // Base metrics for the first three options
        let price = Math.round(baseTargetPrice * (1 + (0.05 + Math.random() * 0.15)));
        let transitHours = getRandomInt(6, 35);
        let freeDays = getRandomInt(1, 8);
        let transshipments = getRandomInt(1, 6);
        const temperatureControl = getRandomBoolean(0.3);
        
        // For additional options (index >= 3), introduce competitiveness
        if (index >= 3) {
          const bestPriceSoFar = Math.min(...options.slice(0, 3).map(opt => opt.price));
          price = Math.round(bestPriceSoFar * (Math.random() > 0.5 ? 0.95 : 1.05));
          
          const bestTransitSoFar = Math.min(...options.slice(0, 3).map(opt => Number.parseInt(opt.transitTime.split(' ')[0])));
          transitHours = Math.random() > 0.5 ? getRandomInt(6, bestTransitSoFar) : getRandomInt(bestTransitSoFar, 35);
          
          const bestFreeTimeSoFar = Math.max(...options.slice(0, 3).map(opt => Number.parseInt(opt.freeTime.split(' ')[0])));
          freeDays = Math.random() > 0.5 ? getRandomInt(bestFreeTimeSoFar, 8) : getRandomInt(1, bestFreeTimeSoFar);
          
          const bestTransshipmentsSoFar = Math.min(...options.slice(0, 3).map(opt => Number.parseInt(opt.transshipments.split(' ')[0])));
          transshipments = Math.random() > 0.5 ? getRandomInt(1, bestTransshipmentsSoFar) : getRandomInt(bestTransshipmentsSoFar, 6);
        }
        
        options.push({
          category,
          supplier,
          price,
          transitTime: `${transitHours} hours`,
          freeTime: `${freeDays} days`,
          transshipments: `${transshipments} transshipment${transshipments !== 1 ? 's' : ''}`,
          temperatureControl,
          awardStatus: "Not Awarded"
        });
      });
      
      return {
        route,
        businessEntity,
        containerType,
        commodity,
        targetPrice: baseTargetPrice,
        options
      };
    });
  });
  
  return recommendations;
};

// Pre-generate route recommendations data
const routeRecommendationsData = generateRouteRecommendations();

// Generate route details for all RFQs and routes
export const generateRouteDetails = (): Record<string, Record<string, RouteDetail[]>> => {
  const routeRecommendations = routeRecommendationsData;
  const details: Record<string, Record<string, RouteDetail[]>> = {};
  
  Object.entries(routeRecommendations).forEach(([rfqId, recommendations]) => {
    details[rfqId] = {};
    
    recommendations.forEach(recommendation => {
      // Calculate baseline metrics for scoring
      const bestPrice = Math.min(...recommendation.options.map(opt => opt.price));
      const bestTransitTime = Math.min(...recommendation.options.map(opt => Number.parseInt(opt.transitTime.split(' ')[0])));
      const bestTransshipments = Math.min(...recommendation.options.map(opt => Number.parseInt(opt.transshipments.split(' ')[0])));
      
      details[rfqId][recommendation.route] = recommendation.options.map((option, index) => {
        const transitTimeHours = Number.parseInt(option.transitTime.split(' ')[0]);
        const transitTimeDays = (transitTimeHours / 24).toFixed(1);
        const freeTimeDays = option.freeTime === "N/A" ? "0" : option.freeTime.split(' ')[0];
        const transfers = Number.parseInt(option.transshipments.split(' ')[0]);
        
        // Calculate a more dynamic recommendation score based on metrics
        const priceScore = (bestPrice / option.price) * 10; // Better price = higher score
        const transitScore = (bestTransitTime / transitTimeHours) * 10; // Faster transit = higher score
        const transshipmentScore = (bestTransshipments / transfers) * 10; // Fewer transshipments = higher score
        const recommendationScore = (priceScore + transitScore + transshipmentScore) * (1 + (Math.random() * 0.1)); // Add slight randomness
        
        return {
          category: option.category,
          supplier: option.supplier,
          transfers,
          transitTime: transitTimeDays,
          temperatureControl: option.temperatureControl,
          freeTime: freeTimeDays,
          price: option.price,
          priceCode: `L${index + 1}`,
          recommendationScore: Math.round(recommendationScore),
          shortestTransitTime: transitTimeDays,
          longestTransitTime: transitTimeDays,
          awardStatus: "Not Awarded"
        };
      });
    });
  });
  
  return details;
};

// Pre-generate route details data
const routeDetailsData = generateRouteDetails();

// Generate supplier categories for all RFQs
export const generateSupplierCategories = (): Record<string, Record<SupplierCategory, string[]>> => {
  const categories: Record<string, Record<SupplierCategory, string[]>> = {}
  
  initialRfqs.forEach(rfq => {
    // Get a random subset of suppliers for each category
    const allSuppliers = getRandomSubset(availableSuppliers, 5, 15).map(s => s.name)
    const revertedSuppliers = getRandomSubset(allSuppliers, 3, Math.floor(allSuppliers.length * 0.8))
    const pendingSuppliers = getRandomSubset(
      [...allSuppliers.filter(s => !revertedSuppliers.includes(s)), ...revertedSuppliers.slice(0, 2)],
      3, 10
    )
    
    categories[rfq.id] = {
      all: allSuppliers,
      reverted: revertedSuppliers,
      pending: pendingSuppliers
    }
  })
  
  return categories
}

// Pre-generate supplier categories data
const supplierCategoriesData = generateSupplierCategories()

// Helper function to generate a new RFQ ID
export const generateRfqId = (): string => {
  const date = new Date()
  const month = date.toLocaleString('en-US', { month: 'short' })
  const year = date.getFullYear()
  const randomNum = Math.floor(Math.random() * 100)
  return `RFQ_${month}_${year}_${randomNum}`
}

// Get RFQ by ID
export const getRfqById = (id: string): RFQ | null => {
  return initialRfqs.find((rfq) => rfq.id === id) || null
}

export const updateRfqStatus = (id: string, status: "active" | "pending" | "completed") => {
  const index = initialRfqs.findIndex((rfq) => rfq.id === id);
  if (index !== -1) {
    initialRfqs[index] = { ...initialRfqs[index], status };
  }
};

// Get route recommendations for an RFQ
export const getRouteRecommendations = (rfqId: string): RouteRecommendation[] => {
  return routeRecommendationsData[rfqId] || []
}

export function updateRouteDetails(rfqId: string, route: string, updatedDetails: RouteDetail[]) {
  if (!routeDetailsData[rfqId]) {
    routeDetailsData[rfqId] = {}
  }
  routeDetailsData[rfqId][route] = updatedDetails
}

// Get route details for an RFQ and route
export const getRouteDetails = (rfqId: string, route: string): RouteDetail[] => {
  return (routeDetailsData[rfqId] && routeDetailsData[rfqId][route]) || []
}

// Get suppliers by category for an RFQ
export const getSuppliersByCategory = (rfqId: string): Record<SupplierCategory, string[]> => {
  return supplierCategoriesData[rfqId] || { all: [], reverted: [], pending: [] }
}

// Get all unique routes across all RFQs
export const getAllRoutes = (): string[] => {
  const allRoutes = new Set<string>()
  
  Object.values(routeRecommendationsData).forEach(recommendations => {
    recommendations.forEach(rec => allRoutes.add(rec.route))
  })
  
  return Array.from(allRoutes)
}

// Get all unique business entities across all RFQs
export const getAllBusinessEntities = (): string[] => {
  return businessEntities
}

// Get all unique container types across all RFQs
export const getAllContainerTypes = (): string[] => {
  return containerTypes
}

export const getAllCommodities = (): string[] => {
  return commodities
}

const allRows = Object.entries(routeRecommendationsData).flatMap(([rfqId, recommendations]) =>
  recommendations.flatMap(rec =>
    rec.options.map(option => ({
      rfqId,
      route: rec.route,
      businessEntity: rec.businessEntity,
      containerType: rec.containerType,
      commodity: rec.commodity,
      targetPrice: rec.targetPrice,
      ...option,
    }))
  )
);