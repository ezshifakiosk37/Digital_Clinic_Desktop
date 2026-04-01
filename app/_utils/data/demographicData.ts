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
    question: "Medical History", 
    type: "select", 
    options: ["Diabetes", "Hypertension", "Asthma", "Other"] 
  },

  { key: "medicineHistory", 
    question: "Medicine History", 
    type: "select", 
    options: ["Insulin", "Metformin", "Aspirin", "Other"] 
  },

  { 
    key: "allergies", 
    question: "Allergies", 
    type: "select", 
    options: ["Peanuts", "Dust", "Penicillin", "None", "Other"] 
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

