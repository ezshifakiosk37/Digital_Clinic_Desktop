// app/_utils/apiService.ts
const API_BASE_URL = "https://bifurcation-clinic-api.vercel.app";
// const API_BASE_URL = "http://localhost:5000";

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

        if (data.role === 'doctor') {
            // Doctor login — store doc_token and doctor profile
            if (data.doc_token) localStorage.setItem('doc_token', data.doc_token);
            if (data.doctor) localStorage.setItem('doctor', JSON.stringify(data.doctor));
        } else {
            // Staff login — store token and user
            if (data.token) localStorage.setItem('token', data.token);
            if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
        }
        return data;
    },

    // login: async (credentials: Record<string, any>) => {
    //     const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    //         method: 'POST',
    //         headers: { 'Content-Type': 'application/json' },
    //         body: JSON.stringify(credentials),
    //     });

    //     const data = await handleResponse(response);

    //     if (data.token) {
    //         localStorage.setItem('token', data.token);
    //         if (data.user) {
    //             localStorage.setItem('user', JSON.stringify(data.user));
    //         }
    //     }
    //     return data;
    // },

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
        const authToken = localStorage.getItem('token') || localStorage.getItem('doc_token');
        const response = await fetch(`${API_BASE_URL}/api/patients/verify-token/${token}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${authToken}`,
            },
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

    updateVitals: async (vitalsId: string, vitalsData: any) => {
        const token = localStorage.getItem('token');
        const res = await fetch(`${API_BASE_URL}/api/vitals/update/${vitalsId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ vitals: vitalsData }),
        });
        if (!res.ok) throw new Error(await res.text());
        return res.json();
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
            if (data.doctor) {
                localStorage.setItem('doctor', JSON.stringify(data.doctor));
            }
        }
        return data;
    },

    docRegister: async (formData: FormData) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/register`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${localStorage.getItem('token')}`,   // ← staff token
            },
            body: formData,
        });

        const data = await handleResponse(response);

        if (data.token) {
            localStorage.setItem('doc_token', data.token);
            if (data.doctor) {
                localStorage.setItem('doctor', JSON.stringify(data.doctor));
            }
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

    docGetProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/me`, {
            method: 'GET',
            headers: getDocHeaders(),
        });
        return handleResponse(response);
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

    updateDoctorStatus: async (status: 'online' | 'offline', reason?: string) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/status`, {
            method: 'PATCH',
            headers: getDocHeaders(),
            body: JSON.stringify({ status, reason }),
        });
        return handleResponse(response);
    },

    // ── Dashboard Helpers ──
    getTodayStats: async (doctorId?: string) => {
        const url = doctorId
            ? `${API_BASE_URL}/api/patients/today-stats?doctorId=${doctorId}`
            : `${API_BASE_URL}/api/patients/today-stats`;
        const response = await fetch(url, {
            method: 'GET',
            headers: getDocHeaders(),
        });
        return handleResponse(response);
    },

    getTodayQueue: async (doctorId?: string) => {
        const url = doctorId
            ? `${API_BASE_URL}/api/patients/today-queue?doctorId=${doctorId}`
            : `${API_BASE_URL}/api/patients/today-queue`;
        // Use whichever token is available (staff or doctor)
        const token = localStorage.getItem('token') || localStorage.getItem('doc_token');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
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

    getAgoraToken: async (vitalsId: string) => {
        const token = localStorage.getItem('doc_token') || localStorage.getItem('token');

        if (!token) {
            throw new Error("No auth token found");
        }

        const response = await fetch(`${API_BASE_URL}/api/agoravideo/token/${vitalsId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
            },
        });

        return handleResponse(response);
    },

    saveDoctorFcmToken: async (fcmToken: string) => {
        if (!fcmToken || fcmToken.length < 100) {
            throw new Error("Invalid FCM token");
        }

        const response = await fetch(`${API_BASE_URL}/api/notifications/save-doctor-token`, {
            method: 'POST',
            headers: getDocHeaders(),
            body: JSON.stringify({ token: fcmToken }),
        });

        return handleResponse(response);
    },

    alertDoctor: async (doctorId: string, vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/alert-doctor`, {
            method: 'POST',
            headers: getHeaders(), // patient token
            body: JSON.stringify({ doctorId, vitalsId }),
        });

        return handleResponse(response);
    },

    acceptCall: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/accept-call`, {
            method: 'POST',
            headers: getDocHeaders(),
            body: JSON.stringify({ vitalsId }),
        });

        return handleResponse(response);
    },

    getCallStatus: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/call-status/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });

        return handleResponse(response);
    },

    endCall: async (vitalsId: string, reason?: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/end-call`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId, reason }),
        });

        return handleResponse(response);
    },

    getVitalsQueue: async () => {
        const response = await fetch(`${API_BASE_URL}/api/patients/vitals-queue`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getAllPrescription: async (token: string) => {
        if (!token) throw new Error("Token is required");

        const response = await fetch(
            `${API_BASE_URL}/api/patients/get-all-prescriptions-today?token=${encodeURIComponent(token)}`,
            {
                method: 'GET',
                headers: getHeaders(),
            }
        );

        return handleResponse(response);
    },

    getLatestVitals: async (patientId: string, token: string) => {
        const res = await fetch(
            `${API_BASE_URL}/api/patients/latest-vitals/${patientId}/${token}`,
            {
                method: 'GET',
                headers: getHeaders(),
            }
        );
        return handleResponse(res);
    },

    getAllDoctors: async () => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/all`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

};
