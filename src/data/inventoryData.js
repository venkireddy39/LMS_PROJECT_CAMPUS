export const inventoryData = [
    {
        id: 1,
        name: "A4 Paper Reams",
        category: "Stationery",
        stock: 45,
        minThreshold: 20,
        unit: "Reams",
        lastUpdated: "2026-01-20",
        usageRate: "5/week"
    },
    {
        id: 2,
        name: "Printer Ink (Black)",
        category: "Office Supplies",
        stock: 8,
        minThreshold: 10,
        unit: "Cartridges",
        lastUpdated: "2026-01-21",
        usageRate: "2/week"
    },
    {
        id: 3,
        name: "Cleaning Liquid (5L)",
        category: "Maintenance",
        stock: 12,
        minThreshold: 5,
        unit: "Cans",
        lastUpdated: "2026-01-18",
        usageRate: "3/week"
    },
    {
        id: 4,
        name: "Hand Sanitizer (1L)",
        category: "Hygiene",
        stock: 25,
        minThreshold: 10,
        unit: "Bottles",
        lastUpdated: "2026-01-22",
        usageRate: "4/week"
    },
    {
        id: 5,
        name: "Light Bulbs (LED)",
        category: "Maintenance",
        stock: 4,
        minThreshold: 15,
        unit: "Pieces",
        lastUpdated: "2026-01-15",
        usageRate: "1/week"
    },
    {
        id: 6,
        name: "Whiteboard Markers",
        category: "Stationery",
        stock: 30,
        minThreshold: 15,
        unit: "Sets",
        lastUpdated: "2026-01-19",
        usageRate: "2/week"
    }
];

export const stockSummary = {
    totalItems: 124,
    lowStockItems: 2,
    outOfStock: 1,
    recentActivity: [
        { type: "Used", item: "Printer Ink", quantity: 1, date: "2026-01-23" },
        { type: "Added", item: "A4 Paper", quantity: 20, date: "2026-01-22" },
        { type: "Used", item: "Cleaning Liquid", quantity: 2, date: "2026-01-21" }
    ],
    usageAnalytics: [
        { month: "Oct", usage: 45 },
        { month: "Nov", usage: 52 },
        { month: "Dec", usage: 38 },
        { month: "Jan", usage: 60 }
    ]
};
