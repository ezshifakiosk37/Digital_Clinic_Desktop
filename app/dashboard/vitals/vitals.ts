//vitals.ts
export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'file';

 export const COMMON_SYMPTOMS = [
    "Other",
  "Fever", "Cough", "Headache", "Shortness of Breath", "Chest Pain",
  "Fatigue", "Body Ache", "Sore Throat", "Runny Nose", "Nausea",
  "Vomiting", "Diarrhea", "Dizziness", "High Blood Pressure", "Low Blood Pressure"
];