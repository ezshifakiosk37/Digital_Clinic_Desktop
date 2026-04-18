//app/_utils/types.ts
import { DoctorProfile } from "../dashboard/consultation/doctor_registration";
import { demographic } from "./data/demographicData";

export type DemographicField = {
  key: string;
  question: string;
  type: "text" | "radio" | "select";
  placeHolder?: string;
  options?: string[];
  inputType?: string;
};

// 1. Extract the specific keys from the array to create a Union Type
// This results in: "phoneNumber" | "firstName" | "lastName" | etc.
export type DemographicKey = (typeof demographic)[number]["key"];

// 2. Map those keys into the FormData interface
// This ensures you can't accidentally use a key that doesn't exist in your config
export type FormData = {
  [K in DemographicKey]?: string;
};

// Your existing menu item interface
export interface MenuItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export enum VitalType {
  BLOOD_PRESSURE = 'Blood Pressure',
  HEART_RATE = 'Heart Rate',
  TEMPERATURE = 'Temperature',
  BLOOD_OXYGEN = 'Blood Oxygen',
  WEIGHT = 'Weight',
  HEIGHT = 'Height',
  BLOOD_SUGAR = 'Blood Sugar',
  PULSE_RATE = "Pulse Rate",
  BMI = 'BMI'
}

export interface VitalReading {
  id: string;
  type: VitalType;
  value: string;
  unit: string;
  timestamp: Date;
  note?: string;
}

export interface AIInsight {
  summary: string;
  recommendations: string[];
  status: 'Normal' | 'Alert' | 'Warning';
}

export interface Vitals {
    temp: string;
    bp: string;
    pulse: string;
    weight: string;
}

export interface VitalsData {
  Spo2?: string;
  PulseRate?: string;
  Temperature?: string;
  Weight?: string;
}

export interface Patient {
    id: number;
    token: string;
    firstName: string;
    lastName: string;
    age: number;
    gender: string;
    symptoms: string;
    medicalHistory: string;
    vitals: Vitals;
}

export interface DocConsultProps {
    selectedPatient: Patient;
    setSelectedPatient: (p: Patient | null) => void;
    medicines: any[];
    setMedicines: React.Dispatch<React.SetStateAction<any[]>>;
    notes: string;
    setNotes: (n: string) => void;
    prescriptionGenerated: boolean;
    setPrescriptionGenerated: (v: boolean) => void;
    doctor: DoctorProfile;
    updateMedicine: (id: number, field: string, value: any) => void;
    fullName: string;
    onSessionEnd: (patient: any) => void;
    endingSession: boolean;
    setEndingSession: (v: boolean) => void;
}