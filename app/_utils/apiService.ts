// //app/_utils/apiService.ts
// app/_utils/apiService.ts
const API_BASE_URL = "https://bifurcation-clinic-api.vercel.app";

const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        if (response.status === 401) {
            console.warn("Unauthorized: Clearing token and redirecting.");
            localStorage.removeItem('token');
        }
        throw new Error(data.error || data.details || "Request failed");
    }
    return data;
};

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const getDocHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('doc_token')}`,
});

export const apiService = {

    login: async (credentials: Record<string, any>) => {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        const data = await handleResponse(response);

        if (data.token) {
            localStorage.setItem('token', data.token);
            if (data.user) {
                localStorage.setItem('user', JSON.stringify(data.user));
            }
        }
        return data;
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('localClinic_entryId');
        window.location.href = '/sign-in';
    },

    findPatientByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/?phone=${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    findPatientByCnic: async (cnic: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/?cnic=${cnic}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    saveOrUpdatePatient: async (patientData: Record<string, any>, id?: string | null) => {
        const { id: _, ...fields } = patientData;
        const payload = {
            ...fields,
            id: (id && id !== "null") ? id : undefined,
        };

        const response = await fetch(`${API_BASE_URL}/api/patients/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        return handleResponse(response);
    },

    verifyToken: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/verify-token/${token}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    saveVitals: async (patientId: string, vitalsData: any) => {
        const url = `${API_BASE_URL}/api/patients/save-vitals`;
        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                patientId,
                vitals: vitalsData
            }),
        });
        return handleResponse(response);
    },

    getVitals: async (patientId: string) => {
        const url = `${API_BASE_URL}/api/patients/history/${patientId}`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getVitalsByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/history-by-phone/${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    // ── DOCTOR AUTH ──
    docLogin: async (credentials: { email: string; password: string }) => {
        const response = await fetch(`${API_BASE_URL}/api/doc-auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(credentials),
        });

        const data = await handleResponse(response);

        if (data.token) {
            localStorage.setItem('doc_token', data.token);
            // We no longer save full doctor object to prevent stale data
        }
        return data;
    },

    docRegister: async (formData: FormData) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/register`, {
            method: 'POST',
            body: formData,
        });
        const data = await handleResponse(response);

        if (data.token) {
            localStorage.setItem('doc_token', data.token);
            // We no longer save full doctor object here
        }
        return data;
    },

    docLogout: () => {
        localStorage.removeItem('doc_token');
        // We do not remove 'doctor' because we are no longer saving it
        window.location.href = '/consultation';
    },

    getDoctor: () => {
        const doc = localStorage.getItem('doctor');
        return doc ? JSON.parse(doc) : null;
    },

    docUpdateProfile: async (doctorId: string, payload: Record<string, any>) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/update/${doctorId}`, {
            method: 'PUT',
            headers: getDocHeaders(),
            body: JSON.stringify(payload),
        });
        const data = await handleResponse(response);
        if (data.doctor) {
            localStorage.setItem('doctor', JSON.stringify(data.doctor)); // Only update on profile edit
        }
        return data;
    },

    // ── Dashboard Helpers ──
    getTodayStats: async () => {
        const response = await fetch(`${API_BASE_URL}/api/patients/today-stats`, {
            method: 'GET',
            headers: getDocHeaders(),
        });
        return handleResponse(response);
    },

    savePrescription: async (payload: any) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/save-prescription`, {
            method: 'POST',
            headers: getDocHeaders(),
            body: JSON.stringify(payload),
        });
        return handleResponse(response);
    },
};



// const API_BASE_URL = "https://bifurcation-clinic-api.vercel.app";

// const handleResponse = async (response: Response) => {
//     const data = await response.json();
//     if (!response.ok) {
//         if (response.status === 401) {
//             console.warn("Unauthorized: Clearing token and redirecting.");
//             localStorage.removeItem('token');
//         }
//         throw new Error(data.error || data.details || "Request failed");
//     }
//     return data;
// };

// const getHeaders = () => ({
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${localStorage.getItem('token')}`,
// });

// const getDocHeaders = () => ({
//     'Content-Type': 'application/json',
//     'Authorization': `Bearer ${localStorage.getItem('doc_token')}`,
// });

// export const apiService = {

//     login: async (credentials: Record<string, any>) => {
//         const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(credentials),
//         });

//         const data = await handleResponse(response);

//         if (data.token) {
//             localStorage.setItem('token', data.token);
//             if (data.user) {
//                 localStorage.setItem('user', JSON.stringify(data.user));
//             }
//         }
//         return data;
//     },

//     logout: () => {
//         localStorage.removeItem('token');
//         localStorage.removeItem('user');
//         localStorage.removeItem('localClinic_entryId');
//         window.location.href = '/sign-in';
//     },

//     findPatientByPhone: async (phone: string) => {
//         const response = await fetch(`${API_BASE_URL}/api/patients/?phone=${phone}`, {
//             method: 'GET',
//             headers: getHeaders(),
//         });
//         if (response.status === 404) return null;
//         return handleResponse(response);
//     },

//         findPatientByCnic: async (cnic: string) => {
//         const response = await fetch(`${API_BASE_URL}/api/patients/?cnic=${cnic}`, {
//             method: 'GET',
//             headers: getHeaders(),
//         });
//         if (response.status === 404) return null;
//         return handleResponse(response);
//     },

//     saveOrUpdatePatient: async (patientData: Record<string, any>, id?: string | null) => {
//         const { id: _, ...fields } = patientData;
//         const payload = {
//             ...fields,
//             id: (id && id !== "null") ? id : undefined,
//         };

//         const response = await fetch(`${API_BASE_URL}/api/patients/save`, {
//             method: 'POST',
//             headers: getHeaders(),
//             body: JSON.stringify(payload),
//         });

//         return handleResponse(response);
//     },

//     // --- NEW: VERIFY TOKEN METHOD ---
//     verifyToken: async (token: string) => {
//         const response = await fetch(`${API_BASE_URL}/api/patients/verify-token/${token}`, {
//             method: 'GET',
//             headers: getHeaders(),
//         });
//         return handleResponse(response);
//     },

//     saveVitals: async (patientId: string, vitalsData: any) => {
//         const url = `${API_BASE_URL}/api/patients/save-vitals`;
//         const response = await fetch(url, {
//             method: 'POST',
//             headers: getHeaders(),
//             body: JSON.stringify({
//                 patientId,
//                 vitals: vitalsData
//             }),
//         });
//         return handleResponse(response);
//     },

//     getVitals: async (patientId: string) => {
//         const url = `${API_BASE_URL}/api/patients/history/${patientId}`;
//         const response = await fetch(url, {
//             method: 'GET',
//             headers: getHeaders(),
//         });
//         return handleResponse(response);
//     },

//     getVitalsByPhone: async (phone: string) => {
//         // Changed process.env to API_BASE_URL and added /api prefix
//         // Added handleResponse to properly manage non-JSON responses
//         const response = await fetch(`${API_BASE_URL}/api/vitals/history-by-phone/${phone}`, {
//             method: 'GET',
//             headers: getHeaders(),
//         });
        
//         return handleResponse(response);
//     },

//         // --- DOCTOR AUTH ---
//     docLogin: async (credentials: { email: string; password: string }) => {
//         const response = await fetch(`${API_BASE_URL}/api/doc-auth/login`, {
//             method: 'POST',
//             headers: { 'Content-Type': 'application/json' },
//             body: JSON.stringify(credentials),
//         });

//         const data = await handleResponse(response);

//         if (data.token) {
//             localStorage.setItem('doc_token', data.token);
//             // Remove full doctor object to prevent stale data
//             // localStorage.setItem('doctor', JSON.stringify(data.doctor));   ← COMMENT OUT or REMOVE
//         }
//         return data;
//     },

//     docLogout: () => {
//         localStorage.removeItem('doc_token');
//         localStorage.removeItem('doctor');
//         // redirect to doctor login page — adjust path to match your routing
//         window.location.href = '/consultation';
//     },

// getDoctor: () => {
//         const doc = localStorage.getItem('doctor');
//         return doc ? JSON.parse(doc) : null;
//     },

//     docRegister: async (formData: FormData) => {
//         const response = await fetch(`${API_BASE_URL}/api/doctors/register`, {
//             method: 'POST',
//             body: formData, // FormData for photo upload
//         });
//         const data = await handleResponse(response);
//         if (data.token) {
//             localStorage.setItem('doc_token', data.token);
//             if (data.doctor) {
//                 localStorage.setItem('doctor', JSON.stringify(data.doctor));
//             }
//         }
//         return data;
//     },

//     docUpdateProfile: async (doctorId: string, payload: Record<string, any>) => {
//         const response = await fetch(`${API_BASE_URL}/api/doctors/update/${doctorId}`, {
//             method: 'PUT',
//             headers: getDocHeaders(),
//             body: JSON.stringify(payload),
//         });
//         const data = await handleResponse(response);
//         if (data.doctor) {
//             localStorage.setItem('doctor', JSON.stringify(data.doctor));
//         }
//         return data;
//     },

//     // ── NEW: Get today's dashboard stats ──
//     getTodayStats: async () => {
//         const response = await fetch(`${API_BASE_URL}/api/patients/today-stats`, {
//             method: 'GET',
//             headers: getDocHeaders(),
//         });
//         return handleResponse(response);
//     },

//     // ── NEW: Save full prescription when doctor ends session ──
//     savePrescription: async (payload: any) => {
//         const response = await fetch(`${API_BASE_URL}/api/patients/save-prescription`, {
//             method: 'POST',
//             headers: getDocHeaders(),
//             body: JSON.stringify(payload),
//         });
//         return handleResponse(response);
//     },
// };

    
