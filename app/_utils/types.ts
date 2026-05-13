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

export interface VitalsDataForHardware {
  Spo2?: string;
  PulseRate?: string;
  Temperature?: string;
  Weight?: string;
  BP?: {
    value1: string; // Systolic
    value2: string; // Diastolic
  };
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
    phoneNumber?: string;
    vitals: Vitals;
}

interface Medicine {
  id: number;
  name: string;
  dosage: string;
  duration: string;
  [key: string]: any; // Using a union for stricter checks
  morning: boolean;
  afternoon: boolean;
  night: boolean;
}


export interface DocConsultProps {
    selectedPatient: Patient;
    setSelectedPatient: (p: Patient | null) => void;
    medicines: Medicine[];
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

export interface BluetoothPrinter {
    name: string;
    address: string;
}

export type PrinterModalStep = 'list' | 'connecting' | 'ready' | 'printing';

// ─────────────────────────────────────────────────────────────────────────────
// BluetoothPrinterModal
// ─────────────────────────────────────────────────────────────────────────────
export interface BluetoothPrinterModalProps {
    isOpen: boolean;
    onClose: () => void;
    onPrint: () => void;        // called after printer is selected & connected
    isPrinting: boolean;
}

// ─────────────────────────────────────────────
// PRESCRIPTION API TYPES
// ─────────────────────────────────────────────

export interface PrescriptionMedicine {
  id: string;
  prescription_id: string;
  medicineName: string;
  morning: boolean;
  afternoon: boolean;
  night: boolean;
  beforeMeal: boolean;
  afterMeal: boolean;
  dosage: string | null;
  duration: string | null;
}

export interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  token: string;
  prescriptionDate: string;
  prescriptionTime: string;
  diagnosis: string | null;
  labTest: string | null;
  clinicalNotes: string | null;

  patient: Patient;
  medicines: PrescriptionMedicine[];
}

export interface PrescriptionApiResponse {
  success: boolean;
  data: Prescription[];
}

export interface PrescriptionWithPatient extends Prescription {
  patient: Patient;
  medicines: PrescriptionMedicine[];
}

export interface QueueItem {
  id: string;
  token: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  patientType: string;
  vitalsId?: string | null;
  symptoms?: string | null;
  vitalsRecorded: boolean;
}

export interface PatientResult {
  id: string
  token: string
  firstName: string
  lastName: string
  phoneNumber: string
  symptoms: string | null
  vitalsId: string | null
  patientType: string
}

export interface Doctor {
  id: string
  title: string
  firstName: string
  lastName: string
  photo: string | null
  specializations: string[]
  experience: number
  doctorStatus: 'online' | 'offline'
}