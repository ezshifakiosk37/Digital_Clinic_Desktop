// consultation/doctor_registration.ts
// Central configuration file for all doctor registration and profile fields

// ─────────────────────────────────────────────
//  TYPES
// ─────────────────────────────────────────────

export type FieldType =
  | 'text'
  | 'email'
  | 'password'
  | 'tel'
  | 'number'
  | 'select'
  | 'multi-select'
  | 'file';

export interface FieldOption {
  label: string;
  value: string;
}

export interface FieldDef {
  key: keyof DoctorProfile;
  label: string;
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: FieldOption[];
  allowCustom?: boolean;
  colSpan?: 1 | 2 | 3 | 4;
  position?: 'top' | 'bottom';   // for dropdown position in MultiSelect/SingleSelect
}

export interface DoctorProfile {
  title: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
  gender: string;
  photo: string;
  specializations: string[];
  qualifications: string[];
  experience: string;
  city: string;
}

// ─────────────────────────────────────────────
//  DEFAULT PROFILE
// ─────────────────────────────────────────────

// export const DEFAULT_DOCTOR_PROFILE: DoctorProfile = {
//   title: 'Dr.',
//   firstName: 'Muhammad',
//   lastName: 'Umer',
//   email: 'umer.dev@example.com',
//   password: 'password123',
//   phone: '+92 300 1234567',
//   gender: 'Male',
//   photo: '',
//   specializations: ['General Physician'],
//   qualifications: ['MBBS', 'MD'],
//   experience: '5',
//   city: 'Karachi',
// };

// ─────────────────────────────────────────────
//  OPTION LISTS (Single Source of Truth)
// ─────────────────────────────────────────────

export const TITLE_OPTIONS: FieldOption[] = [
  { label: 'Dr.', value: 'Dr.' },
  { label: 'Mr.', value: 'Mr.' },
  { label: 'Ms.', value: 'Ms.' },
  { label: 'Mrs.', value: 'Mrs.' },
  { label: 'Prof.', value: 'Prof.' },
  { label: 'Assoc. Prof.', value: 'Assoc. Prof.' },
];

export const GENDER_OPTIONS: FieldOption[] = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
];

export const SPECIALIZATION_OPTIONS: FieldOption[] = [
  { label: 'General Physician', value: 'General Physician' },
  { label: 'Cardiologist', value: 'Cardiologist' },
  { label: 'Dermatologist', value: 'Dermatologist' },
  { label: 'ENT', value: 'ENT' },
  { label: 'Gynecologist', value: 'Gynecologist' },
  { label: 'Neurologist', value: 'Neurologist' },
  { label: 'Orthopedic', value: 'Orthopedic' },
  { label: 'Pediatrician', value: 'Pediatrician' },
  { label: 'Psychiatrist', value: 'Psychiatrist' },
  { label: 'Urologist', value: 'Urologist' },
  { label: 'Other', value: 'Other' },
];

export const QUALIFICATION_OPTIONS: FieldOption[] = [
  { label: 'MBBS', value: 'MBBS' },
  { label: 'BDS', value: 'BDS' },
  { label: 'MD', value: 'MD' },
  { label: 'MS', value: 'MS' },
  { label: 'FCPS', value: 'FCPS' },
  { label: 'MRCP', value: 'MRCP' },
  { label: 'MRCS', value: 'MRCS' },
  { label: 'PhD', value: 'PhD' },
  { label: 'DPT', value: 'DPT' },
  { label: 'Pharm-D', value: 'Pharm-D' },
  { label: 'Other', value: 'Other' },
];

export const CITY_OPTIONS: FieldOption[] = [
  'Karachi', 'Lahore', 'Islamabad', 'Rawalpindi', 'Faisalabad',
  'Multan', 'Peshawar', 'Quetta', 'Hyderabad', 'Sialkot',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Sukkur', 'Larkana',
  'Abbottabad', 'Mardan', 'Mingora', 'Rahim Yar Khan', 'Sahiwal',
].map(city => ({ label: city, value: city }));

// ─────────────────────────────────────────────
//  FIELD DEFINITIONS (For Registration & Profile)
// ─────────────────────────────────────────────

export const PERSONAL_FIELDS: FieldDef[] = [
  { key: 'photo',        label: 'Profile Photo',       type: 'file',     required: false },
  { key: 'title',        label: 'Title',               type: 'select',   required: true,  options: TITLE_OPTIONS },
  { key: 'firstName',    label: 'First Name',          type: 'text',     required: true },
  { key: 'lastName',     label: 'Last Name',           type: 'text',     required: true },
  { key: 'email',        label: 'Email Address',       type: 'email',    required: true },
  { key: 'password',     label: 'Password',            type: 'password', required: true },
  { key: 'phone',        label: 'Phone Number',        type: 'tel',      required: false },
  { key: 'gender',       label: 'Gender',              type: 'select',   required: false, options: GENDER_OPTIONS },
];

export const PROFESSIONAL_FIELDS: FieldDef[] = [
  {
    key: 'specializations',
    label: 'Specialization',
    type: 'multi-select',
    required: true,
    options: SPECIALIZATION_OPTIONS,
    allowCustom: true,
    colSpan: 2,
    position: 'top'
  },
  {
    key: 'qualifications',
    label: 'Qualification',
    type: 'multi-select',
    required: true,
    options: QUALIFICATION_OPTIONS,
    allowCustom: true,
    colSpan: 2,
    position: 'top'
  },
  {
    key: 'experience',
    label: 'Experience (Years)',
    type: 'number',
    required: false,
    min: 0,
    max: 60,
    colSpan: 1
  },
  {
    key: 'city',
    label: 'City',
    type: 'select',
    required: false,
    options: CITY_OPTIONS,
    colSpan: 1,
    position: 'top'
  },
];

// ─────────────────────────────────────────────
//  LOGOUT REASONS
// ─────────────────────────────────────────────

export const LOGOUT_REASONS = [
  'Meal Break',
  'Namaz break',
  'Meeting break',
  'Shift Ends',
  'Smoking Break',
  'Tea Break',
  'Washroom break - Restroom break'
];

//_________________________________________________
// Medicines//
//_________________________________________________

export const MEDICINE_OPTIONS: string[] = [
  // Antibiotics
  'Amoxicillin', 'Augmentin', 'Azithromycin', 'Ciprofloxacin', 'Metronidazole',
  'Clarithromycin', 'Doxycycline', 'Ceftriaxone', 'Clindamycin', 'Trimethoprim',
  // Painkillers / Anti-inflammatory
   'Panadol', 'Paracetamol', 'Ibuprofen', 'Diclofenac', 'Aspirin', 'Naproxen',
  'Mefenamic Acid', 'Tramadol', 'Ketorolac', 'Celecoxib', 'Piroxicam',
  // Antacids / GI
  'Omeprazole', 'Pantoprazole', 'Ranitidine', 'Domperidone', 'Metoclopramide',
  'Lactulose', 'Bismuth', 'Sucralfate', 'Esomeprazole', 'Ondansetron',
  // Antihistamines / Allergy
  'Cetirizine', 'Loratadine', 'Chlorpheniramine', 'Fexofenadine', 'Promethazine',
  // Cough / Cold
  'Salbutamol', 'Bromhexine', 'Dextromethorphan', 'Guaifenesin', 'Ambroxol',
  'Montelukast', 'Budesonide', 'Ipratropium',
  // Cardiovascular
  'Amlodipine', 'Atenolol', 'Lisinopril', 'Losartan', 'Metoprolol',
  'Atorvastatin', 'Rosuvastatin', 'Warfarin', 'Clopidogrel', 'Digoxin',
  // Diabetes
  'Metformin', 'Glibenclamide', 'Insulin', 'Sitagliptin', 'Pioglitazone',
  // Vitamins / Supplements
  'Vitamin C', 'Vitamin D3', 'Vitamin B12', 'Folic Acid', 'Zinc Sulphate',
  'Calcium Carbonate', 'Iron Sulphate', 'Multivitamin', 'Omega-3',
  // Steroids / Other
  'Prednisolone', 'Dexamethasone', 'Hydrocortisone', 'Fluticasone',
  'Fluconazole', 'Clotrimazole', 'Albendazole', 'Mebendazole',
];