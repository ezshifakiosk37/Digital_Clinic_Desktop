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
  'Other',
  '10CC SYRINGE',
  '1CC SYRINGE',
  '25% DEXTROSE WATER 25ML INJ',
  '3CC SYRINGE',
  '5CC SYRINGE',
  '5CC SYRINGE SYRINGE',
  'ABOCOL TAB',
  'ABOCRAN SACHETS',
  'ACEBEX-P CAP',
  'ACEFYL 120ML SYRUP',
  'ACEFYL 60ML SYRUP',
  'ACENAC 100MG TAB',
  'ACENAC SR 200MG TAB',
  'ACETIN 25MG',
  'ACICON 20MG TAB',
  'ACICON 40MG TAB',
  'ACIREG 40 MG CAP',
  'ACNE WASH SOAP',
  'ACSOLVE GEL 10G',
  'ACSOLVE LOTION',
  'ACTIDIL 60ML SYRUP',
  'ACTIDIL ELIXIR SYRUP',
  'ACTIDIL SYRUP',
  'ACTIFED DM SYRUP',
  'ACTIFED P TAB',
  'ACTIFED-P SYRUP',
  'ACTIFLOR SACHETS',
  'ACTIM 10MG TAB',
  'ACTIM 2.5MG TAB',
  'ACTIM 5 MG TAB',
  'ACTNISE CREAM 50G',
  'ACYLEX 200MG',
  'AD FOLIC OD 300MCG TAB',
  'AD FOLIC OD 600 TAB',
  'ADALAT 20MG',
  'ADALAT 30MG',
  'ADALAT 60MG',
  'ADALAT RTD LA 20MG',
  'ADAPCO CREAM 15G',
  'ADAPCO FORTE GEL 15G',
  'ADAPCO GEL 15G',
  'AD-FOLIC 300MG',
  'ADICOS COUGH SYRUP',
  'ADMIT 1000 MG TAB',
  'ADMIT 50 MG',
  'ADMIT 500 MG TAB',
  'ADOXA 100MG',
  'ADOXA TAB',
  'ADRONIL 150MG CAP SINGLE DOSE',
  'ADVANT 16MG',
  'ADVANT 16MG TAB',
  'ADVANT 8MG TAB',
  'ADVANTAN CREAM 10G',
  'ADVANTAN OINT. 10G',
  'ADVANTEC TAB',
  // ... keep all remaining medicines exactly as provided ...
  'ZYRTEC 10MG',
  'ZYRTEC SYRUP'
];



export const DOSAGE_UNIT_OPTIONS = ['Tab', 'Tsp', 'Tbsp', 'Ampoule', 'Drop', 'Sachet', 'Capsule', 'Puff', 'ml'];

export const DURATION_UNIT_OPTIONS = ['Day(s)', 'Week(s)', 'Month(s)', 'As needed'];

export const FREQUENCY_OPTIONS = ['OD', 'BD', 'TDS', 'QID', 'HS', 'SOS', 'Stat'];

export const DIAGNOSIS_OPTIONS: string[] = [
  "Other",

  // Infectious Diseases
  "Upper Respiratory Tract Infection (URTI)",
  "Lower Respiratory Tract Infection (LRTI)",
  "Urinary Tract Infection (UTI)",
  "Typhoid Fever",
  "Malaria",
  "Dengue Fever",
  "Hepatitis A",
  "Hepatitis B",
  "Hepatitis C",
  "Tuberculosis (TB)",
  "COVID-19",
  "Influenza",
  "Gastroenteritis",
  "Tonsillitis",
  "Sinusitis",
  "Flu",
  "Food poisoning",
  "Measles",
  "Whooping cough",

  // Chronic / Non-communicable
  "Hypertension",
  "Type 2 Diabetes Mellitus",
  "Type 1 Diabetes Mellitus",
  "Asthma",
  "COPD",
  "Coronary Artery Disease",
  "Heart Failure",
  "Chronic Kidney Disease",
  "Hypothyroidism",
  "Hyperthyroidism",
  "Anemia",
  "Iron deficiency anaemia",
  "Osteoarthritis",
  "Rheumatoid Arthritis",
  "Gout",
  "GERD / Acid Reflux",
  "Peptic Ulcer Disease",
  "IBS",
  "IBD",
  "Fatty Liver Disease",
  "High cholesterol",
  "Hypotension",
  "Hyperglycaemia (high blood sugar)",
  "Hypoglycaemia (low blood sugar)",
  "Malnutrition",
  "Obesity",
  "Goitre",
  "Autoimmune disorders",
  "Ischemic heart disease",

  // Neurological / Mental Health
  "Migraine",
  "Tension Headache",
  "Epilepsy",
  "Anxiety Disorder",
  "Depression",
  "Insomnia",
  "Vertigo",
  "Psychosis",
  "ADHD",
  "Attention deficit hyperactivity disorder (ADHD)",
  "Autistic spectrum disorder (ASD)",
  "Febrile seizures",
  "Seizures",
  "Stress",
  "Post traumatic stress disorder",
  "Munchausen syndrome",

  // Skin
  "Eczema / Dermatitis",
  "Psoriasis",
  "Acne",
  "Fungal Skin Infection",
  "Scabies",
  "Urticaria (Hives)",
  "Atopic eczema",
  "Pimples on face",
  "Pimples with puss",
  "Sunburn",
  "Warts",

  // Gastrointestinal
  "Constipation",
  "Diarrhea",
  "Dyspepsia",
  "Gastritis",
  "Stomach ulcer",
  "Haemorrhoids (piles)",
  "Acute Appendicitis",
  "Acute cholecystitis",
  "Gallstones",

  // Respiratory
  "Pneumonia",
  "Bronchitis",
  "Allergic rhinitis",
  "Common Cold",
  "Pharyngitis",

  // Renal / Urology
  "Kidney infection",
  "Kidney stones",
  "Urinary retention",

  // Musculoskeletal
  "Back Pain",
  "Backache",
  "Knee Pain",
  "Sciatica",
  "Myalgia",
  "Arthralgia",

  // Gynecology / Obstetrics
  "PCOD",
  "Amenorrhea",
  "Menorrhagia",
  "Oligomenorrhea",
  "Infertility",
  "Pregnancy",
  "Miscarriage",
  "Vaginal thrush",

  // Miscellaneous
  "Dengue",
  "Typhoid",
  "PUO (Pyrexia of Unknown Origin)",
  "Fever (Unspecified)",
  "Cough (Unspecified)",
  "Weakness",
  "Fatigue",
  "Dehydration",
  "Lipoma",
  "Abscess",
  "Rash",
  "Wound",
  "Injury",
  "RTA",
  "Suspicion of malignancy"
];

export const LAB_TEST_OPTIONS: string[] = [
  'Other',
  // Hematology
  'Complete Blood Count (CBC)', 'Erythrocyte Sedimentation Rate (ESR)',
  'Peripheral Blood Smear', 'Bleeding Time / Clotting Time',
  // Blood Chemistry
  'Fasting Blood Sugar (FBS)', 'Random Blood Sugar (RBS)',
  'HbA1c', 'Lipid Profile', 'Liver Function Tests (LFTs)',
  'Kidney Function Tests (KFTs)', 'Serum Electrolytes',
  'Serum Uric Acid', 'Serum Calcium', 'Serum Ferritin',
  'Serum Iron / TIBC', 'Thyroid Function Tests (TFTs)',
  'TSH', 'T3 / T4',
  // Urine
  'Urine Complete Examination (UCE)', 'Urine Culture & Sensitivity',
  'Urine Microalbumin', '24-Hour Urine Protein',
  // Stool
  'Stool Routine Examination', 'Stool Culture', 'Occult Blood Test',
  // Serology / Immunology
  'Hepatitis B Surface Antigen (HBsAg)', 'Anti-HCV', 'HIV 1 & 2',
  'Dengue NS1 Antigen', 'Dengue IgG / IgM', 'Malaria Antigen Test',
  'Typhoid (Widal Test)', 'CRP (C-Reactive Protein)', 'ANA (Antinuclear Antibody)',
  'Rheumatoid Factor (RF)',
  // Microbiology
  'Blood Culture & Sensitivity', 'Throat Swab Culture', 'Sputum Culture',
  // Cardiac
  'ECG', 'Troponin I / T', 'CPK-MB', 'BNP / NT-proBNP',
  // Imaging / Radiology
  'Chest X-Ray', 'Abdominal Ultrasound', 'KUB Ultrasound',
  'Echocardiography', 'CT Scan (Head)', 'CT Scan (Chest)', 'CT Scan (Abdomen)',
  'MRI Brain', 'MRI Spine', 'X-Ray (Specific Joint/Region)',
  // Other
  'Vitamin D (25-OH)', 'Vitamin B12', 'Folate Level',
  'Pregnancy Test (urine hCG)', 'COVID-19 Rapid Antigen Test', 'COVID-19 PCR',
];