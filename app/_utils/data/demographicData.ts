export type DemographicField = {
  key: string;
  question: string;
  type: "text" | "radio" | "select"| "date";
  placeHolder?: string;
  options?: string[];
  inputType?: string;
};

export const demographic: DemographicField[] = [
  { key: "phoneNumber",
    question: "Phone Number",
    type: "text",
    placeHolder: "3331111111",
    inputType: "tel" 
  },

  { key: "firstName",
    question: "First Name",
    type: "text", 
    placeHolder: "Enter first name" 
  },

  { key: "lastName", 
    question: "Last Name", 
    type: "text", 
    placeHolder: "Enter last name" 
  },

  { key: "father_husband", 
    question: "Father/Husband Name", 
    type: "text", 
    placeHolder: "Enter father/husband name" 
  },
  
  { key: "email", 
    question: "Email", 
    type: "text", 
    placeHolder: "email@example.com" 
  },

  { key: "cnic", 
    question: "CNIC", 
    type: "text", 
    placeHolder: 
    "6110111111111" 
  },

  { key: "dob", 
    question: "Date of Birth", 
    type: "date" 
  },

  { key: "age", 
    question: "Age", 
    type: "text", 
    placeHolder: "0" 
  },

  { 
    key: "languages", 
    question: "Languages", 
    type: "select",
  },

  { key: "medicalHistory", 
    question: "Existing Conditions", 
    type: "select", 
    options: [
  "Other","None",
  "Acute Respiratory Infections (ARI)",
  "Asthma",
  "Breast Cancer",
  "Cardiovascular Diseases",
  "Chronic Kidney Disease",
  "Chronic Liver Disease",
  "COPD",
  "CVA",
  "Dengue Fever",
  "Dengue Hemorrhagic Fever",
  "Diabetes",
  "DM",
  "Diarrheal Diseases (cholera, typhoid fever, gastroenteritis)",
  "Dyslipidemia",
  "Gastrointestinal Cancers",
  "Gastrointestinal Infections (such as amoebiasis)",
  "Hepatitis A",
  "Hepatitis B and C",
  "HTN",
  "Hypertension",
  "Hypotension",
  "Leishmaniasis",
  "Lung Cancer",
  "Malaria",
  "Malnutrition",
  "Measles",
  "Polio",
  "Pregnancy",
  "Rabies",
  "Respiratory Infections (including pneumonia, bronchitis)",
  "Schistosomiasis",
  "Seizures",
  "Tuberculosis (TB)"
]

  },

  { key: "medicineHistory", 
    question: "Current Medication", 
    type: "select", 
    options: ["Other","Insulin", "Metformin", "Aspirin"] 
  },

  { 
    key: "allergies", 
    question: "Allergies", 
    type: "select", 
    options: 
    [
  "Other",
  "Brazil nuts",
  "Cashews",
  "Dust allergy",
  "Eggs",
  "Fish",
  "Hazelnuts (filberts)",
  "Macadamia nuts",
  "Milk",
  "Pecans",
  "Pine nuts (pinon, pignolias)",
  "Pistachio",
  "Sesame",
  "Shellfish",
  "Skin allergy",
  "Soy",
  "Wheat",
  "Not Aware"] 
  },

  {
    key:"surgicalHistory",
    question:"Surgical History",
    type: "radio", 
    options: ["Yes", "No"]
  },

{ 
  key: "stAddress", 
  question: "Street Address", 
  type: "text", 
  placeHolder: "House #, Street..." 
},
{ 
  key: "country", 
  question: "Country", 
  type: "select" 
},
{ 
  key: "province", 
  question: "Province", 
  type: "select" 
},
{ 
  key: "city", 
  question: "City", 
  type: "select" 
},

];

