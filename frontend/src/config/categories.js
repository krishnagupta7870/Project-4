/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY IF YOU WANT TO KEEP DB SYNC
 * This file is synced with the backend database.
 */

export const categoryConfig = {
    "Books & Sports": {
        "subCategories": {
            "Books": {
                "fields": [
                    {
                        "name": "author",
                        "label": "Author",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519484fec7709a348bc030"
                    },
                    {
                        "name": "publisher",
                        "label": "Publisher",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6951949cfec7709a348bc038"
                    },
                    {
                        "name": "edition",
                        "label": "Edition",
                        "type": "text",
                        "placeholder": "e.g., 1st, 2nd, Revised",
                        "options": [],
                        "required": false,
                        "_id": "695194acfec7709a348bc043"
                    },
                    {
                        "name": "language",
                        "label": "Language",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "English",
                            "Nepali",
                            "Other"
                        ],
                        "required": false,
                        "_id": "695194d7fec7709a348bc051"
                    },
                    {
                        "name": "format",
                        "label": "Format",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Hardcover",
                            "Paperback",
                            "Digital"
                        ],
                        "required": false,
                        "_id": "69519514fec7709a348bc072"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": false,
                        "_id": "6951956dfec7709a348bc09d"
                    }
                ]
            },
            "Sports Equipments": {
                "fields": [
                    {
                        "name": "sportType",
                        "label": "Sport Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Cricket",
                            "Football",
                            "Badminton",
                            "Table Tennis",
                            "Basketball",
                            "Other"
                        ],
                        "required": true,
                        "_id": "695195aefec7709a348bc0a8"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695195cafec7709a348bc0b6"
                    },
                    {
                        "name": "equipmentType",
                        "label": "Equipment Type",
                        "type": "text",
                        "placeholder": "e.g., Bat, Ball, Racket, Net",
                        "options": [],
                        "required": true,
                        "_id": "695195eafec7709a348bc0c7"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6951960cfec7709a348bc0ee"
                    },
                    {
                        "name": "ageGroup",
                        "label": "Suitable Age Group",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Kids",
                            "Teens",
                            "Adults",
                            "All Ages"
                        ],
                        "required": false,
                        "_id": "69519635fec7709a348bc105"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": false,
                        "_id": "69519655fec7709a348bc11f"
                    }
                ]
            }
        }
    },
    "Commercial Vehicles & Spare Parts": {
        "subCategories": {
            "Commercial Vehicles": {
                "fields": [
                    {
                        "name": "vehicleType",
                        "label": "Vehicle Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Truck",
                            "Bus",
                            "Pickup",
                            "Trailer",
                            "Other"
                        ],
                        "required": true,
                        "_id": "695165d8deb6d3faa2e34f98"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519a29fec7709a348bc40d"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519a3efec7709a348bc41e"
                    },
                    {
                        "name": "fuelType",
                        "label": "Fuel Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Diesel",
                            "Petrol",
                            "CNG",
                            "Electric",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69519a91fec7709a348bc480"
                    },
                    {
                        "name": "year",
                        "label": "Year",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695165d8deb6d3faa2e34f99"
                    },
                    {
                        "name": "mileage",
                        "label": "Mileage (km/l or km)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519abdfec7709a348bc4b5"
                    },
                    {
                        "name": "kmDriven",
                        "label": "KM Driven",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69675560e8b93d83d648bb97"
                    },
                    {
                        "name": "transmission",
                        "label": "Transmission",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Manual",
                            "Automatic"
                        ],
                        "required": false,
                        "_id": "69519aeffec7709a348bc4f9"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695263c749fe7d997d97b38a"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Excellent",
                            "Good",
                            "Fair",
                            "Needs Work"
                        ],
                        "required": true,
                        "_id": "695165d8deb6d3faa2e34f94"
                    }
                ]
            },
            "Spare Parts": {
                "fields": [
                    {
                        "name": "partName",
                        "label": "Part Name",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69519b5dfec7709a348bc55a"
                    },
                    {
                        "name": "compatibleWith",
                        "label": "Compatible With (Brand/Model)",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519b8ffec7709a348bc56a"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519baefec7709a348bc57d"
                    },
                    {
                        "name": "partType",
                        "label": "Part Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Engine",
                            "Brakes",
                            "Suspension",
                            "Tires",
                            "Electrical",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69519be9fec7709a348bc593"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "69519c13fec7709a348bc5ac"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69519c39fec7709a348bc5c8"
                    }
                ]
            }
        }
    },
    "Electronics": {
        "subCategories": {
            "Accessories & Components": {
                "fields": [
                    {
                        "name": "componentType",
                        "label": "Component Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "HDD",
                            "SSD",
                            "RAM",
                            "Graphics Card",
                            "Processor (CPU)",
                            "Motherboard",
                            "Power Supply (PSU)",
                            "Cabinet / Casing",
                            "Cooling Fan / Liquid Cooler",
                            "Sound Card",
                            "Network Card",
                            "Other"
                        ],
                        "required": true,
                        "_id": "695165d5deb6d3faa2e34dd5"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "e.g. Samsung, Seagate, Corsair, ASUS",
                        "options": [],
                        "required": false,
                        "_id": "695165d5deb6d3faa2e34dd6"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "Exact model number",
                        "options": [],
                        "required": false,
                        "_id": "695165d5deb6d3faa2e34dd7"
                    },
                    {
                        "name": "capacity",
                        "label": "Capacity",
                        "type": "text",
                        "placeholder": "e.g. 1TB, 16GB, 750W",
                        "options": [],
                        "required": false,
                        "_id": "695165d5deb6d3faa2e34dd8"
                    },
                    {
                        "name": "interface",
                        "label": "Interface / Socket",
                        "type": "text",
                        "placeholder": "e.g. SATA, NVMe, DDR4, LGA1700",
                        "options": [],
                        "required": false,
                        "_id": "695165d5deb6d3faa2e34dd9"
                    },
                    {
                        "name": "compatibleWith",
                        "label": "Compatible With",
                        "type": "text",
                        "placeholder": "e.g. Intel / AMD / Laptop / Desktop",
                        "options": [],
                        "required": false,
                        "_id": "695165d5deb6d3faa2e34dda"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69518680fec7709a348bb4a1"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty Status",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "695165d5deb6d3faa2e34ddb"
                    }
                ]
            },
            "Cameras & Lenses": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "DSLR",
                            "Mirrorless",
                            "Point & Shoot",
                            "Lens",
                            "Action Camera",
                            "Drone"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e542e"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Canon",
                            "Nikon",
                            "Sony",
                            "Fujifilm",
                            "GoPro",
                            "DJI",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e542f"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b39d708b521310e5430"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952628049fe7d997d97af83"
                    },
                    {
                        "name": "shutterCount",
                        "label": "Shutter Count (approx)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b39d708b521310e5431"
                    },
                    {
                        "name": "lensesIncluded",
                        "label": "Lenses Included?",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b39d708b521310e5432"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Excellent",
                            "Good",
                            "Fair"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5433"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "696752f3e8b93d83d648b892"
                    }
                ]
            },
            "Laptops": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "HP",
                            "Dell",
                            "Lenovo",
                            "Asus",
                            "Acer",
                            "Apple",
                            "MSI",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5424"
                    },
                    {
                        "name": "processor",
                        "label": "Processor",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b39d708b521310e5425"
                    },
                    {
                        "name": "ram",
                        "label": "RAM",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "4GB",
                            "8GB",
                            "16GB",
                            "32GB",
                            "64GB"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5426"
                    },
                    {
                        "name": "storage",
                        "label": "Storage",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "256 GB SSD",
                            "512 GB SSD",
                            "1TB SSD",
                            "2TB SSD"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5427"
                    },
                    {
                        "name": "graphics",
                        "label": "Graphics Card",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b39d708b521310e5428"
                    },
                    {
                        "name": "screenSize",
                        "label": "Screen Size",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "13.3″",
                            "14″",
                            "15.6″",
                            "16″",
                            "17.3″"
                        ],
                        "required": false,
                        "_id": "69513b39d708b521310e5429"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e542a"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "6951803ffec7709a348bad0c"
                    },
                    {
                        "name": "batteryHealth",
                        "label": "Battery Health",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "80-100%",
                            "60-79%",
                            "40-59%",
                            "Below 40%"
                        ],
                        "required": false,
                        "_id": "69513b39d708b521310e542b"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952625749fe7d997d97aec5"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "6967523ae8b93d83d648b6ce"
                    }
                ]
            },
            "PC": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Dell",
                            "HP",
                            "Lenovo",
                            "Asus",
                            "Acer",
                            "Custom Build",
                            "Other"
                        ],
                        "required": false,
                        "_id": "69518194fec7709a348bad50"
                    },
                    {
                        "name": "processor",
                        "label": "Processor",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Intel i3",
                            "Intel i5",
                            "Intel i7",
                            "Intel i9",
                            "AMD Ryzen 3",
                            "AMD Ryzen 5",
                            "AMD Ryzen 7",
                            "AMD Ryzen 9"
                        ],
                        "required": false,
                        "_id": "695181e5fec7709a348bad82"
                    },
                    {
                        "name": "ram",
                        "label": "RAM",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "4GB",
                            "8GB",
                            "16GB",
                            "32GB",
                            "64GB"
                        ],
                        "required": false,
                        "_id": "6951822bfec7709a348badb7"
                    },
                    {
                        "name": "storage",
                        "label": "Storage",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "256GB SSD",
                            "512GB SSD",
                            "1TB SSD",
                            "1TB HDD",
                            "2TB HDD",
                            "Other"
                        ],
                        "required": false,
                        "_id": "69518280fec7709a348badef"
                    },
                    {
                        "name": "graphics",
                        "label": "Graphics Card",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695182d8fec7709a348bae6e"
                    },
                    {
                        "name": "powerSupply",
                        "label": "Power Supply (Watt)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69518302fec7709a348baeac"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "69653f0e9f07cef6897177f9"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952625f49fe7d997d97af02"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "69675250e8b93d83d648b71b"
                    }
                ]
            },
            "Printers": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "HP",
                            "Canon",
                            "Epson",
                            "Brother",
                            "Other"
                        ],
                        "required": true,
                        "_id": "695183ecfec7709a348baffb"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Inkjet",
                            "Laser",
                            "All-in-One",
                            "Dot Matrix"
                        ],
                        "required": false,
                        "_id": "69518443fec7709a348bb067"
                    },
                    {
                        "name": "colorPrinting",
                        "label": "Color Printing",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No"
                        ],
                        "required": true,
                        "_id": "6951846dfec7709a348bb09c"
                    },
                    {
                        "name": "duplexPrinting",
                        "label": "Duplex Printing",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "NO"
                        ],
                        "required": false,
                        "_id": "695184b0fec7709a348bb10b"
                    },
                    {
                        "name": "paperSize",
                        "label": "Supported Paper Size",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "A4",
                            "A3",
                            "Letter",
                            "Legal",
                            "Other"
                        ],
                        "required": false,
                        "_id": "695184effec7709a348bb146"
                    },
                    {
                        "name": "connectivity",
                        "label": "Connectivity",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "USB",
                            "Wi-Fi",
                            "Ethernet",
                            "Bluetooth",
                            "All"
                        ],
                        "required": false,
                        "_id": "69518519fec7709a348bb184"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used Year",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "69675318e8b93d83d648b8dd"
                    }
                ]
            },
            "TVs": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Samsung",
                            "CG",
                            "LG",
                            "Sony",
                            "Mi",
                            "OnePlus",
                            "TCL",
                            "Panasonic",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5419"
                    },
                    {
                        "name": "screenSize",
                        "label": "Screen Size (Inches)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b39d708b521310e541a"
                    },
                    {
                        "name": "resolution",
                        "label": "Resolution",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "HD Ready",
                            "Full HD",
                            "4K",
                            "8K"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e541b"
                    },
                    {
                        "name": "screenType",
                        "label": "Screen Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "LED",
                            "LCD",
                            "QLED",
                            "OLED"
                        ],
                        "required": false,
                        "_id": "69513b39d708b521310e541c"
                    },
                    {
                        "name": "isSmart",
                        "label": "Smart TV?",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e541d"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e541f"
                    },
                    {
                        "name": "issues",
                        "label": "Any Issues?",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b39d708b521310e5420"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952626949fe7d997d97af44"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "696752b7e8b93d83d648b7b0"
                    }
                ]
            }
        }
    },
    "Fashion": {
        "subCategories": {
            "Kids": {
                "fields": [
                    {
                        "name": "clothingType",
                        "label": "Item Type",
                        "type": "text",
                        "placeholder": "T-Shirt, Pants, Dress, Jacket, Shoes, etc.",
                        "options": [],
                        "required": true,
                        "_id": "69513b3bd708b521310e54ab"
                    },
                    {
                        "name": "ageGroup",
                        "label": "Age Group",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "0-2 years",
                            "3-5 years",
                            "6-8 years",
                            "9-12 years"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e54ac"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695193b1fec7709a348bbf8c"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "Cotton, Polyester, Wool, etc.",
                        "options": [],
                        "required": false,
                        "_id": "695193ccfec7709a348bbfa9"
                    },
                    {
                        "name": "gender",
                        "label": "Gender",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Boys",
                            "Girls",
                            "Unisex"
                        ],
                        "required": false,
                        "_id": "695193f6fec7709a348bbfc9"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695263a749fe7d997d97b322"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New with Tags",
                            "New without Tags",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e54ad"
                    }
                ]
            },
            "Men": {
                "fields": [
                    {
                        "name": "clothingType",
                        "label": "Item Type",
                        "type": "text",
                        "placeholder": "Dress, T-Shirt, Jeans, Jacket, Shoes, etc.",
                        "options": [],
                        "required": true,
                        "_id": "69513b3bd708b521310e549f"
                    },
                    {
                        "name": "size",
                        "label": "Size",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "S",
                            "M",
                            "L",
                            "XL",
                            "XXL"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e54a0"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3bd708b521310e54a1"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695191eafec7709a348bbe5b"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "Cotton, Polyester, Wool, etc.",
                        "options": [],
                        "required": false,
                        "_id": "6951921dfec7709a348bbe76"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New with Tags",
                            "New without Tags",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e54a2"
                    }
                ]
            },
            "Women": {
                "fields": [
                    {
                        "name": "clothingType",
                        "label": "Item Type",
                        "type": "text",
                        "placeholder": "Dress, Top, T-Shirt, Jeans, Jacket, Shoes, etc.",
                        "options": [],
                        "required": true,
                        "_id": "69513b3bd708b521310e54a5"
                    },
                    {
                        "name": "size",
                        "label": "Size",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "XS",
                            "S",
                            "M",
                            "L",
                            "XL",
                            "XXL"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e54a6"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3bd708b521310e54a7"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519271fec7709a348bbeae"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "Cotton, Silk, Polyester, Wool, etc.",
                        "options": [],
                        "required": false,
                        "_id": "6951928dfec7709a348bbecb"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New with Tags",
                            "New without Tags",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e54a8"
                    }
                ]
            }
        }
    },
    "Furniture": {
        "subCategories": {
            "Beds & Wardrobes": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e547c"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3ad708b521310e547d"
                    },
                    {
                        "name": "size",
                        "label": "Size",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Single",
                            "Double",
                            "Queen",
                            "King"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e547e"
                    },
                    {
                        "name": "storage",
                        "label": "Storage?",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No"
                        ],
                        "required": false,
                        "_id": "69513b3ad708b521310e547f"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": false,
                        "_id": "69518f2ffec7709a348bbce0"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952636e49fe7d997d97b290"
                    }
                ]
            },
            "Kids Furniture": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5483"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519010fec7709a348bbd3e"
                    },
                    {
                        "name": "ageGroup",
                        "label": "Age Group",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "0-3 years",
                            "4-7 years",
                            "8-12 years"
                        ],
                        "required": false,
                        "_id": "6951904bfec7709a348bbd60"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3ad708b521310e5484"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952638e49fe7d997d97b2e8"
                    }
                ]
            },
            "Other Household Items": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "text",
                        "placeholder": "e.g., Cabinet, Shelf, Rack",
                        "options": [],
                        "required": true,
                        "_id": "69519090fec7709a348bbd7f"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695190abfec7709a348bbdac"
                    },
                    {
                        "name": "dimensions",
                        "label": "Dimensions (LxWxH in cm)",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695190c2fec7709a348bbdc6"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": false,
                        "_id": "695190e1fec7709a348bbde3"
                    }
                ]
            },
            "Sofa & Dining": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5477"
                    },
                    {
                        "name": "material",
                        "label": "Material",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3ad708b521310e5478"
                    },
                    {
                        "name": "age",
                        "label": "Age (Years)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3ad708b521310e5479"
                    },
                    {
                        "name": "seatingCapacity",
                        "label": "Seating Capacity",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "2 Seater",
                            "3 Seater",
                            "4 Seater",
                            "5+ Seater"
                        ],
                        "required": false,
                        "_id": "69518f6dfec7709a348bbcf5"
                    },
                    {
                        "name": "dimensions",
                        "label": "Dimensions (LxWxH in cm)",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69518fc7fec7709a348bbd0d"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952637b49fe7d997d97b2b5"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": false,
                        "_id": "69518fe9fec7709a348bbd28"
                    }
                ]
            }
        }
    },
    "Home Appliances": {
        "subCategories": {
            "ACs": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "LG",
                            "CG",
                            "Samsung",
                            "Hitachi",
                            "Voltas",
                            "Daikin",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5446"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Split",
                            "Window",
                            "Portable"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5447"
                    },
                    {
                        "name": "ton",
                        "label": "Capacity (Ton)",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "0.75 Ton",
                            "1 Ton",
                            "1.5 Ton",
                            "2 Ton",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5448"
                    },
                    {
                        "name": "energyRating",
                        "label": "Energy Rating",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "1 Star",
                            "2 Star",
                            "3 Star",
                            "4 Star",
                            "5 Star"
                        ],
                        "required": false,
                        "_id": "69513b39d708b521310e5449"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "NO",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "6951883cfec7709a348bb670"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "6964b6a8f9deb0ec5e0fe370"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695262d049fe7d997d97b037"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "69675374e8b93d83d648b9e8"
                    }
                ]
            },
            "Kitchen Appliances": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Mixer",
                            "Grinder",
                            "Oven",
                            "Juicer",
                            "Blender",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5438"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e543b"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "e.g. CG, Philips, Panasonic, Bajaj, Other",
                        "options": [
                            "CG",
                            "Philips",
                            "Panasonic",
                            "Bajaj",
                            "Usha",
                            "Other"
                        ],
                        "required": false,
                        "_id": "69513b39d708b521310e5439"
                    },
                    {
                        "name": "capacity",
                        "label": "Capacity (Litres / Cups / Kg)",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69518b9bfec7709a348bba4b"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "6964b74af9deb0ec5e0fe57b"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "69675487e8b93d83d648ba8a"
                    }
                ]
            },
            "Refrigerators (Fridge)": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "LG",
                            "CG",
                            "Samsung",
                            "Whirlpool",
                            "Hitachi",
                            "Haier",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5440"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Single Door",
                            "Double Door",
                            "Side by Side",
                            "Bottom Freezer"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5441"
                    },
                    {
                        "name": "capacity",
                        "label": "Capacity (Litres)",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "150-250 L",
                            "250-350 L",
                            "350-450 L",
                            "450+ L"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5442"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695262c649fe7d997d97b00e"
                    },
                    {
                        "name": "energyRating",
                        "label": "Energy Rating",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "3 Star",
                            "4 Star",
                            "5 Star"
                        ],
                        "required": false,
                        "_id": "69518963fec7709a348bb77f"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "6964b6cff9deb0ec5e0fe3eb"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "69518a00fec7709a348bb875"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "6967538de8b93d83d648ba19"
                    }
                ]
            },
            "Washing Machines": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "LG",
                            "CG",
                            "Samsung",
                            "Whirlpool",
                            "Haier",
                            "Bosch",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e544c"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Top Load",
                            "Front Load",
                            "Semi Automatic"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e544d"
                    },
                    {
                        "name": "capacity",
                        "label": "Capacity (kg)",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "6 kg",
                            "7 kg",
                            "8 kg",
                            "9 kg",
                            "10 kg+"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e544e"
                    },
                    {
                        "name": "energyRating",
                        "label": "Energy Rating",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "3 Star",
                            "4 Star",
                            "5 Star"
                        ],
                        "required": false,
                        "_id": "69518ab7fec7709a348bb923"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair"
                        ],
                        "required": true,
                        "_id": "6964b72cf9deb0ec5e0fe50d"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "69518af8fec7709a348bb96c"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "6967539ee8b93d83d648ba46"
                    }
                ]
            }
        }
    },
    "Mobiles": {
        "subCategories": {
            "Accessories": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Charger",
                            "USB Cable",
                            "Headphones",
                            "Power Bank",
                            "Earphones",
                            "Bluetooth Speaker",
                            "Mobile Cover",
                            "Screen Guard",
                            "Smart Watch",
                            "Mobile Holder / Stand",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b39d708b521310e5412"
                    },
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "e.g. Apple, Samsung, Xiaomi, Anker",
                        "options": [
                            "Apple",
                            "Samsung",
                            "Xiaomi",
                            "Anker",
                            "Other"
                        ],
                        "required": false,
                        "_id": "69513b39d708b521310e5413"
                    },
                    {
                        "name": "compatibleWith",
                        "label": "Compatible Device",
                        "type": "text",
                        "placeholder": "e.g. iPhone, Type-C phones, Android",
                        "options": [],
                        "required": false,
                        "_id": "69513b39d708b521310e5414"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": false,
                        "_id": "69517ab5fec7709a348ba79f"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952624649fe7d997d97ae6b"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "69675214e8b93d83d648b66b"
                    }
                ]
            },
            "Mobile Phones": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Apple",
                            "Samsung",
                            "Xiaomi",
                            "Oppo",
                            "Vivo",
                            "Realme",
                            "OnePlus",
                            "Google",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e53ff"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b38d708b521310e5400"
                    },
                    {
                        "name": "ram",
                        "label": "RAM",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "2GB",
                            "3GB",
                            "4GB",
                            "6GB",
                            "8GB",
                            "12GB",
                            "16GB"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e5401"
                    },
                    {
                        "name": "storage",
                        "label": "Storage",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "16GB",
                            "32GB",
                            "64GB",
                            "128GB",
                            "256GB",
                            "512GB",
                            "1TB"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e5402"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Like New",
                            "Good",
                            "Fair",
                            "Needs Repair"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e5403"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e5404"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty Valid?",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "69513b38d708b521310e5405"
                    },
                    {
                        "name": "accessories",
                        "label": "Includes Box/Charger?",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b38d708b521310e5406"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952621549fe7d997d97ae1e"
                    }
                ]
            },
            "Tablets": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Apple",
                            "Samsung",
                            "Lenovo",
                            "Xiaomi",
                            "Other"
                        ],
                        "required": true,
                        "_id": "695152f4bfe32789dfe3b4d9"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b38d708b521310e540b"
                    },
                    {
                        "name": "screenSize",
                        "label": "Screen Size",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b38d708b521310e540c"
                    },
                    {
                        "name": "storage",
                        "label": "Storage",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "16GB",
                            "32GB",
                            "64GB",
                            "128GB",
                            "256GB",
                            "512GB",
                            "1TB"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e540d"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Like New",
                            "Good",
                            "Fair"
                        ],
                        "required": true,
                        "_id": "69513b38d708b521310e540e"
                    },
                    {
                        "name": "usedYear",
                        "label": "Used For",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "< 1 Month",
                            "1-6 Months",
                            "6-12 Months",
                            "1-2 Years",
                            "> 2 Years"
                        ],
                        "required": false,
                        "_id": "69513b38d708b521310e540f"
                    },
                    {
                        "name": "warranty",
                        "label": "Warranty Valid?",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Expired"
                        ],
                        "required": false,
                        "_id": "695178bffec7709a348ba5aa"
                    },
                    {
                        "name": "accessories",
                        "label": "Includes Box/Charger?",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6951798cfec7709a348ba733"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952622649fe7d997d97ae48"
                    }
                ]
            }
        }
    },
    "Other": {
        "subCategories": {
            "Miscellaneous": {
                "fields": [
                    {
                        "name": "categoryDetails",
                        "label": "Additional Details",
                        "type": "textarea",
                        "placeholder": "\"Material, brand, size, color, etc. (optional)\"",
                        "options": [],
                        "required": false,
                        "_id": "69519ff4fec7709a348bc93c"
                    }
                ]
            }
        }
    },
    "Pets": {
        "subCategories": {
            "Cats": {
                "fields": [
                    {
                        "name": "breed",
                        "label": "Breed",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519daefec7709a348bc778"
                    },
                    {
                        "name": "age",
                        "label": "Age",
                        "type": "text",
                        "placeholder": "e.g., 6 months, 2 years",
                        "options": [],
                        "required": false,
                        "_id": "69519ddbfec7709a348bc7b8"
                    },
                    {
                        "name": "gender",
                        "label": "Gender",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Male",
                            "Female"
                        ],
                        "required": true,
                        "_id": "69519e11fec7709a348bc7e1"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695263da49fe7d997d97b3cd"
                    },
                    {
                        "name": "vaccinated",
                        "label": "Vaccinated",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Partially"
                        ],
                        "required": true,
                        "_id": "69519e2ffec7709a348bc7f9"
                    }
                ]
            },
            "Dogs": {
                "fields": [
                    {
                        "name": "breed",
                        "label": "Breed",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519cf2fec7709a348bc729"
                    },
                    {
                        "name": "age",
                        "label": "Age",
                        "type": "text",
                        "placeholder": "e.g., 6 months, 2 years",
                        "options": [],
                        "required": false,
                        "_id": "69519d11fec7709a348bc744"
                    },
                    {
                        "name": "gender",
                        "label": "Gender",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Male",
                            "Female"
                        ],
                        "required": true,
                        "_id": "69519d32fec7709a348bc755"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "695263e849fe7d997d97b3f9"
                    },
                    {
                        "name": "vaccinated",
                        "label": "Vaccinated",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No",
                            "Partially"
                        ],
                        "required": true,
                        "_id": "69519d5cfec7709a348bc769"
                    }
                ]
            },
            "Fishes": {
                "fields": [
                    {
                        "name": "species",
                        "label": "Species",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519e5bfec7709a348bc887"
                    },
                    {
                        "name": "size",
                        "label": "Size",
                        "type": "text",
                        "placeholder": "e.g., Small, Medium, Large",
                        "options": [],
                        "required": false,
                        "_id": "69519e76fec7709a348bc897"
                    },
                    {
                        "name": "waterType",
                        "label": "Water Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Freshwater",
                            "Saltwater"
                        ],
                        "required": false,
                        "_id": "69519e9ffec7709a348bc8aa"
                    }
                ]
            },
            "Other Pets": {
                "fields": [
                    {
                        "name": "species",
                        "label": "Species",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519f56fec7709a348bc8f6"
                    },
                    {
                        "name": "age",
                        "label": "Age",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69519f69fec7709a348bc90c"
                    },
                    {
                        "name": "gender",
                        "label": "Gender",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Male",
                            "Female"
                        ],
                        "required": false,
                        "_id": "69519f84fec7709a348bc925"
                    }
                ]
            },
            "Pets Food & Accessories": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Food",
                            "Toys",
                            "Cage / Tank",
                            "Accessory",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69519ee1fec7709a348bc8ba"
                    },
                    {
                        "name": "compatibleWith",
                        "label": "Compatible With",
                        "type": "text",
                        "placeholder": "e.g., Dogs, Cats, Birds, Fish",
                        "options": [],
                        "required": false,
                        "_id": "69519f0dfec7709a348bc8cd"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "New",
                            "Used"
                        ],
                        "required": true,
                        "_id": "69519f2cfec7709a348bc8e3"
                    }
                ]
            }
        }
    },
    "Properties": {
        "subCategories": {
            "House & Apartments": {
                "fields": [
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Apartment",
                            "House",
                            "Villa"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e548a"
                    },
                    {
                        "name": "bhk",
                        "label": "BHK",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "1 RK",
                            "1 BHK",
                            "2 BHK",
                            "3 BHK",
                            "4 BHK",
                            "5 BHK",
                            "5+ BHK"
                        ],
                        "required": true,
                        "_id": "69515390bfe32789dfe3b51a"
                    },
                    {
                        "name": "area",
                        "label": "Area (Aana)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e548c"
                    },
                    {
                        "name": "furnishing",
                        "label": "Furnishing",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Furnished",
                            "Semi-Furnished",
                            "Unfurnished"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e548d"
                    },
                    {
                        "name": "floor",
                        "label": "Floor No",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3ad708b521310e548e"
                    },
                    {
                        "name": "parking",
                        "label": "Parking",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "None",
                            "1 Vehicle",
                            "2 Vehicles",
                            "More"
                        ],
                        "required": false,
                        "_id": "69513b3ad708b521310e548f"
                    },
                    {
                        "name": "availability",
                        "label": "Availability",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Ready to Move",
                            "Under Construction",
                            "Immediate",
                            "Flexible"
                        ],
                        "required": false,
                        "_id": "695197c4fec7709a348bc1bf"
                    }
                ]
            },
            "Land & Plots": {
                "fields": [
                    {
                        "name": "area",
                        "label": "Area (Aana)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3bd708b521310e5492"
                    },
                    {
                        "name": "facing",
                        "label": "Facing",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "North",
                            "South",
                            "East",
                            "West"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e5493"
                    },
                    {
                        "name": "zoning",
                        "label": "Zoning",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Residential",
                            "Commercial",
                            "Agricultural"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e5494"
                    },
                    {
                        "name": "roadAccess",
                        "label": "Road Access",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Yes",
                            "No"
                        ],
                        "required": true,
                        "_id": "6951988cfec7709a348bc243"
                    },
                    {
                        "name": "ownership",
                        "label": "Ownership",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Freehold",
                            "Leasehold"
                        ],
                        "required": false,
                        "_id": "695198b7fec7709a348bc25f"
                    }
                ]
            },
            "Shops & Offices": {
                "fields": [
                    {
                        "name": "propertyType",
                        "label": "Property Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Shop",
                            "Office",
                            "Showroom",
                            "Warehouse"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e5497"
                    },
                    {
                        "name": "area",
                        "label": "Area (sq ft)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3bd708b521310e5498"
                    },
                    {
                        "name": "parking",
                        "label": "Parking",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "None",
                            "1 Vehicle",
                            "2 Vehicles",
                            "More"
                        ],
                        "required": true,
                        "_id": "69513b3bd708b521310e549a"
                    },
                    {
                        "name": "furnishing",
                        "label": "Furnishing",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Furnished",
                            "Semi-Furnished",
                            "Unfurnished"
                        ],
                        "required": false,
                        "_id": "69513b3bd708b521310e5499"
                    },
                    {
                        "name": "floor",
                        "label": "Floor",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69519936fec7709a348bc2f2"
                    },
                    {
                        "name": "availability",
                        "label": "Availability",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Ready to Move",
                            "Under Construction",
                            "Immediate",
                            "Flexible"
                        ],
                        "required": false,
                        "_id": "69519969fec7709a348bc312"
                    }
                ]
            }
        }
    },
    "Vehicles": {
        "subCategories": {
            "Bicycles": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e546f"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Mountain",
                            "Hybrid",
                            "Road",
                            "Electric",
                            "Kids"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5470"
                    },
                    {
                        "name": "age",
                        "label": "Age (Years)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "69513b3ad708b521310e5471"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952635a49fe7d997d97b241"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair",
                            "Needs Work"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5472"
                    }
                ]
            },
            "Cars": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Maruti Suzuki",
                            "Hyundai",
                            "Tata",
                            "Mahindra",
                            "Kia",
                            "Toyota",
                            "Honda",
                            "Volkswagen",
                            "Skoda",
                            "Ford",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5465"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5466"
                    },
                    {
                        "name": "fuelType",
                        "label": "Fuel Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Petrol",
                            "Diesel",
                            "CNG",
                            "Electric",
                            "Hybrid"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5467"
                    },
                    {
                        "name": "transmission",
                        "label": "Transmission",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Manual",
                            "Automatic"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5468"
                    },
                    {
                        "name": "kmDriven",
                        "label": "KM Driven",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5469"
                    },
                    {
                        "name": "year",
                        "label": "Registration Year",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e546a"
                    },
                    {
                        "name": "ownership",
                        "label": "Ownership",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "1st Owner",
                            "2nd Owner",
                            "3rd+ Owner"
                        ],
                        "required": false,
                        "_id": "69513b3ad708b521310e546b"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952633249fe7d997d97b1ab"
                    },
                    {
                        "name": "condition",
                        "label": "Current Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair",
                            "Needs Work"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e546c"
                    }
                ]
            },
            "Motorcycles": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Bajaj",
                            "Hero",
                            "Honda",
                            "KTM",
                            "Royal Enfield",
                            "TVS",
                            "Yamaha",
                            "Suzuki",
                            "Jawa",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5454"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5455"
                    },
                    {
                        "name": "kmDriven",
                        "label": "KM Driven",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5457"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Petrol",
                            "Electric"
                        ],
                        "required": false,
                        "_id": "69518d96fec7709a348bbc79"
                    },
                    {
                        "name": "year",
                        "label": "Registration Year",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5456"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952631a49fe7d997d97b13b"
                    },
                    {
                        "name": "mileage",
                        "label": "Mileage (kmpl)",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5458"
                    },
                    {
                        "name": "details",
                        "label": "Ownership",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "1st Owner",
                            "2nd Owner",
                            "3rd+ Owner"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5459"
                    },
                    {
                        "name": "condition",
                        "label": "Current Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair",
                            "Needs Work"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e545a"
                    }
                ]
            },
            "Scooters": {
                "fields": [
                    {
                        "name": "brand",
                        "label": "Brand",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Honda",
                            "TVS",
                            "Suzuki",
                            "Hero",
                            "Vespa",
                            "Yamaha",
                            "Aprilia",
                            "Other"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e545d"
                    },
                    {
                        "name": "model",
                        "label": "Model",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e545e"
                    },
                    {
                        "name": "year",
                        "label": "Registration Year",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e545f"
                    },
                    {
                        "name": "kmDriven",
                        "label": "KM Driven",
                        "type": "number",
                        "placeholder": "",
                        "options": [],
                        "required": true,
                        "_id": "69513b3ad708b521310e5460"
                    },
                    {
                        "name": "details",
                        "label": "Ownership",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "1st Owner",
                            "2nd Owner",
                            "3rd+ Owner"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5461"
                    },
                    {
                        "name": "color",
                        "label": "Color",
                        "type": "text",
                        "placeholder": "",
                        "options": [],
                        "required": false,
                        "_id": "6952634349fe7d997d97b1f0"
                    },
                    {
                        "name": "condition",
                        "label": "Condition",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Brand New",
                            "Used - Good",
                            "Used - Fair",
                            "Needs Work"
                        ],
                        "required": true,
                        "_id": "69513b3ad708b521310e5462"
                    },
                    {
                        "name": "type",
                        "label": "Type",
                        "type": "select",
                        "placeholder": "",
                        "options": [
                            "Electric",
                            "Petrol"
                        ],
                        "required": false,
                        "_id": "69518d62fec7709a348bbc4c"
                    }
                ]
            }
        }
    }
};

export const getAllCategories = () => Object.keys(categoryConfig);

export const getSubCategories = (category) => {
    return categoryConfig[category]?.subCategories ? Object.keys(categoryConfig[category].subCategories) : [];
};

export const getCategoryFields = (category, subCategory) => {
    return categoryConfig[category]?.subCategories?.[subCategory]?.fields || [];
};
