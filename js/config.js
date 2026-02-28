// Reference Daily Values (DV) in grams or milligrams
// Based on FDA 2016 Guidelines
const FDA_DV = {
  totalFat: 78, // g
  satFat: 20, // g
  cholesterol: 300, // mg
  sodium: 2300, // mg
  totalCarbs: 275, // g
  dietaryFiber: 28, // g
  addedSugars: 50, // g
  protein: 50, // g
  vitD: 20, // mcg
  calcium: 1300, // mg
  iron: 18, // mg
  potassium: 4700, // mg
  vitA: 900, // mcg RAE
  vitC: 90, // mg
  vitE: 15, // mg
  vitK: 120, // mcg
  thiamin: 1.2, // mg
  riboflavin: 1.3, // mg
  niacin: 16, // mg NE
  vitB6: 1.7, // mg
  folate: 400, // mcg DFE
  folicAcid: 400, // mcg
  vitB12: 2.4, // mcg
  biotin: 30, // mcg
  pantothenicAcid: 5, // mg
  phosphorus: 1250, // mg
  iodine: 150, // mcg
  magnesium: 420, // mg
  zinc: 11, // mg
  selenium: 55, // mcg
  copper: 0.9, // mg
  manganese: 2.3, // mg
  chromium: 35, // mcg
  molybdenum: 45, // mcg
  chloride: 2300, // mg
};

// Based on EU 1169/2011 Reference Intakes (Adults)
const EU_RI = {
  kj: 8400,
  kcal: 2000,
  totalFat: 70, // g
  satFat: 20, // g
  totalCarbs: 260, // g
  totalSugars: 90, // g
  protein: 50, // g
  salt: 6, // g (Note: EU uses salt rather than sodium, Salt = Sodium x 2.5)
};

// Initial Default State
const DEFAULT_STATE = {
  appLang: "es", // Language for the App Interface UI
  labelLang: "es", // Language for the generated label

  standard: "fda", // fda, nom051, eu
  orientation: "vertical",
  dvStandard: "auto",

  // Product
  servingsPerContainer: "8",
  rounding: "default", // default, usually, varied
  servingSizeQuantity: "2/3",
  servingSizeQuantityUnits: "taza",
  servingSizeWeight: "55",
  servingSizeUnit: "g", // g, ml
  useFreeServingSize: false,
  servingSize: "2/3 taza (55g)", // Keep for compatibility if needed, but we'll prioritize structured data
  servingSizeBase: "100g", // For EU

  // Energy
  calories: 230,
  kj: 0,
  autoKj: true,

  // Macros
  totalFat: 8,
  satFat: 1,
  transFat: 0,
  polyFat: 0,
  monoFat: 0,
  cholesterol: 0,
  sodium: 160,
  totalCarbs: 37,
  dietaryFiber: 4,
  totalSugars: 12,
  addedSugars: 10,
  sugarAlcohol: 0,
  protein: 3,
  showProteinDv: false,

  // Vits & Minerals
  vitDataFormat: "percentage", // percentage, units
  showOptionalVitamins: false,
  vitD: 2,
  calcium: 260,
  iron: 8,
  potassium: 235,

  // Optional Vits
  vitA: 0,
  vitAType: "retinol", // retinol, beta-carotene
  vitC: 0,
  vitE: 0,
  vitEType: "rrr", // rrr, all-rac
  vitK: 0,
  thiamin: 0,
  riboflavin: 0,
  niacin: 0,
  vitB6: 0,
  folate: 0,
  folicAcid: 0,
  vitB12: 0,
  biotin: 0,
  pantothenicAcid: 0,
  phosphorus: 0,
  iodine: 0,
  magnesium: 0,
  zinc: 0,
  selenium: 0,
  copper: 0,
  manganese: 0,
  chromium: 0,
  molybdenum: 0,
  chloride: 0,

  // NOM-051 Settings
  seals: {
    calories: false,
    sugars: false,
    satFat: false,
    transFat: false,
    sodium: false,
    caffeine: false,
    sweeteners: false,
  },
  applyRounding: true,
  autoCalculateSeals: true,
  showFdaFooter: true,
};

window.Config = {
  FDA_DV,
  EU_RI,
  DEFAULT_STATE,
};
