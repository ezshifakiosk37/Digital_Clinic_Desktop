// doctor_registration.ts
// Central config for all doctor profile / registration fields.
// Import this wherever you need field definitions, options, or labels.

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
  key: string;             // matches DoctorProfile key
  label: string;           // placeholder / label text
  type: FieldType;
  required?: boolean;
  min?: number;
  max?: number;
  options?: FieldOption[]; // for select / multi-select
  allowCustom?: boolean;   // adds a free-text input when "Other" is selected
  colSpan?: 1 | 2 | 3 | 4;
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
//  DEFAULT / EMPTY PROFILE
// ─────────────────────────────────────────────

export const DEFAULT_DOCTOR_PROFILE: DoctorProfile = {
  title: '',
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  phone: '',
  gender: '',
  photo: '',
  specializations: [],
  qualifications: [],
  experience: '',
  city: '',
};

// ─────────────────────────────────────────────
//  OPTION LISTS  (single source of truth)
// ─────────────────────────────────────────────

export const TITLE_OPTIONS: FieldOption[] = [
  { label: 'Dr.',        value: 'Dr.' },
  { label: 'Mr.',        value: 'Mr.' },
  { label: 'Ms.',        value: 'Ms.' },
  { label: 'Mrs.',       value: 'Mrs.' },
  { label: 'Prof.',      value: 'Prof.' },
  { label: 'Assoc. Prof.', value: 'Assoc. Prof.' },
];

export const GENDER_OPTIONS: FieldOption[] = [
  { label: 'Male',   value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other',  value: 'Other' },
];

export const SPECIALIZATION_OPTIONS: FieldOption[] = [
  { label: 'General Physician', value: 'General Physician' },
  { label: 'Cardiologist',      value: 'Cardiologist' },
  { label: 'Dermatologist',     value: 'Dermatologist' },
  { label: 'ENT',               value: 'ENT' },
  { label: 'Gynecologist',      value: 'Gynecologist' },
  { label: 'Neurologist',       value: 'Neurologist' },
  { label: 'Orthopedic',        value: 'Orthopedic' },
  { label: 'Pediatrician',      value: 'Pediatrician' },
  { label: 'Psychiatrist',      value: 'Psychiatrist' },
  { label: 'Urologist',         value: 'Urologist' },
  { label: 'Other',             value: 'Other' },
];

export const QUALIFICATION_OPTIONS: FieldOption[] = [
  { label: 'MBBS',    value: 'MBBS' },
  { label: 'BDS',     value: 'BDS' },
  { label: 'MD',      value: 'MD' },
  { label: 'MS',      value: 'MS' },
  { label: 'FCPS',    value: 'FCPS' },
  { label: 'MRCP',    value: 'MRCP' },
  { label: 'MRCS',    value: 'MRCS' },
  { label: 'PhD',     value: 'PhD' },
  { label: 'DPT',     value: 'DPT' },
  { label: 'Pharm-D', value: 'Pharm-D' },
  { label: 'Other',   value: 'Other' },
];

export const CITY_OPTIONS: FieldOption[] = [
  'Karachi','Lahore','Islamabad','Rawalpindi','Faisalabad',
  'Multan','Peshawar','Quetta','Hyderabad','Sialkot',
  'Gujranwala','Bahawalpur','Sargodha','Sukkur','Larkana',
  'Abbottabad','Mardan','Mingora','Rahim Yar Khan','Sahiwal',
].map(c => ({ label: c, value: c }));

// ─────────────────────────────────────────────
//  FIELD DEFINITIONS  (drives both Registration & Profile)
// ─────────────────────────────────────────────

/** Section 1 — Personal */
export const PERSONAL_FIELDS: FieldDef[] = [
  {
    key: 'photo',
    label: 'Profile Photo',
    type: 'file',
    required: false,
  },
  {
    key: 'title',
    label: 'Title',
    type: 'select',
    required: true,
    options: TITLE_OPTIONS,
  },
  {
    key: 'firstName',
    label: 'First Name',
    type: 'text',
    required: true,
  },
  {
    key: 'lastName',
    label: 'Last Name',
    type: 'text',
    required: true,
  },
  {
    key: 'email',
    label: 'Email Address',
    type: 'email',
    required: true,
  },
  {
    key: 'password',
    label: 'Password',
    type: 'password',
    required: true,
  },
  {
    key: 'phone',
    label: 'Phone Number',
    type: 'tel',
    required: false,
  },
  {
    key: 'gender',
    label: 'Gender',
    type: 'select',
    required: false,
    options: GENDER_OPTIONS,
  },
];

/** Section 2 — Professional */
export const PROFESSIONAL_FIELDS: FieldDef[] = [
  {
    key: 'specializations',
    label: 'Specialization',
    type: 'multi-select',
    required: true,
    options: SPECIALIZATION_OPTIONS,
    allowCustom: true,
  },
  {
    key: 'qualifications',
    label: 'Qualification',
    type: 'multi-select',
    required: true,
    options: QUALIFICATION_OPTIONS,
    allowCustom: true,
  },
  {
    key: 'experience',
    label: 'Experience (Years)',
    type: 'number',
    required: false,
    min: 0,
    max: 60,
  },
  {
    key: 'city',
    label: 'City',
    type: 'select',
    required: false,
    options: CITY_OPTIONS,
  },
];

// ─────────────────────────────────────────────
//  USAGE EXAMPLES
// ─────────────────────────────────────────────
//
//  import {
//    PERSONAL_FIELDS, PROFESSIONAL_FIELDS,
//    SPECIALIZATION_OPTIONS, QUALIFICATION_OPTIONS,
//    DEFAULT_DOCTOR_PROFILE, DoctorProfile
//  } from './doctor_registration';
//
//  // Render fields dynamically:
//  PERSONAL_FIELDS.forEach(field => renderField(field));
//
//  // Pre-fill profile page:
//  const [profile, setProfile] = useState<DoctorProfile>(DEFAULT_DOCTOR_PROFILE);
//
//  // Specialization options in a dropdown:
//  SPECIALIZATION_OPTIONS.map(o => <option value={o.value}>{o.label}</option>)