// app/_utils/apiService.ts
// app/_utils/apiService.ts
const API_BASE_URL = "https://bifurcation-clinic-api.vercel.app";
// const API_BASE_URL = "http://localhost:5000";

async function handleResponse(response: Response) {
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const error: any = new Error(body.error || "Request failed");
        error.status = response.status; // ✅ attach status so callers can branch on it
        throw error;
    }
    return response.json();
}

const getHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('token')}`,
});

const getDocHeaders = () => ({
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('doc_token')}`,
});

const getAvailableHeaders = () => {
    const token = localStorage.getItem('token');
    const docToken = localStorage.getItem('doc_token');
    const resolved = token ?? docToken;

    if (!resolved) throw new Error("No active session. Please log in.");

    return {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resolved}`,
    };
};

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

    updateSymptoms: async (vitalsId: string, symptoms: string[], bmi?: string | null) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/update/${vitalsId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({
                vitals: {
                    symptoms: symptoms.length ? symptoms : ['Unknown'],
                    ...(bmi !== undefined && { bmi }),
                }
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

    getTodayTokenByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/today-token/${phone}`, {
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

    // In apiService.ts — add inside the apiService object
    docLogoutWithReason: async (reason: string) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/logout`, {
            method: 'POST',
            headers: getDocHeaders(),
            body: JSON.stringify({ reason }),
        });
        localStorage.removeItem('doc_token');
        localStorage.removeItem('doctor');
        return handleResponse(response);
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
        const token = localStorage.getItem('doc_token') || localStorage.getItem('token');
        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });
        return handleResponse(response);
    },

    getTodayQueue: async (doctorId?: string) => {
        const url = doctorId
            ? `${API_BASE_URL}/api/patients/today-queue?doctorId=${doctorId}`
            : `${API_BASE_URL}/api/patients/today-queue`;
        const token = localStorage.getItem('doc_token') || localStorage.getItem('token');
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
            headers: getHeaders(), // ✅ patient token — must NOT use getDocHeaders() here
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
            headers: getAvailableHeaders(),
        });

        return handleResponse(response);
    },

    endCall: async (vitalsId: string, reason?: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/end-call`, {
            method: 'POST',
            headers: getAvailableHeaders(),
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

    getAllPrescription: async () => {
        const response = await fetch(
            `${API_BASE_URL}/api/patients/get-all-prescriptions-today`,
            {
                method: 'GET',
                headers: getHeaders(),
            }
        );

        return handleResponse(response);
    },

    saveRapidTesting: async (vitalsId: string, rapidData: any) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/rapid-testing/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId, rapidData }),
        });
        return handleResponse(response);
    },

    updateRapidTesting: async (id: string, rapidData: any) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/rapid-testing/update/${id}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ rapidData }),
        });
        return handleResponse(response);
    },

    getRapidTesting: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/rapid-testing/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    saveEyeTesting: async (vitalsId: string, eyeData: any) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/eye-testing/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId, eyeData }),
        });
        return handleResponse(response);
    },

    getEyeTesting: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/eye-testing/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    saveColorBlind: async (vitalsId: string, colorBlindData: any) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/color-blind/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId, colorBlindData }),
        });
        return handleResponse(response);
    },

    getColorBlind: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/color-blind/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
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
    getAssignedDoctor: async (kioskId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/assigned-doctor/${kioskId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },
    getProfile: async () => {
        const response = await fetch(`${API_BASE_URL}/api/auth/me`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },
    uploadPatientPhoto: async (file: File) => {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'patient_photos');

        const response = await fetch(
            'https://api.cloudinary.com/v1_1/djuvrhjcz/image/upload',
            { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return { success: true, url: data.secure_url, publicId: data.public_id };
    },

    uploadDoctorPhoto: async (file: File) => {
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
        if (!allowedTypes.includes(file.type)) {
            throw new Error('Only JPG, PNG or WEBP images allowed');
        }
        if (file.size > 5 * 1024 * 1024) {
            throw new Error('Image must be under 5MB');
        }

        const formData = new FormData();
        formData.append('file', file);
        formData.append('upload_preset', 'patient_photos'); // same preset works fine

        const response = await fetch(
            'https://api.cloudinary.com/v1_1/djuvrhjcz/image/upload',
            { method: 'POST', body: formData }
        );

        if (!response.ok) throw new Error('Upload failed');
        const data = await response.json();
        return { success: true, url: data.secure_url };
    },
    //vital report
    getFullReport: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/report/vitals/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    //send vital report via email
    getPatientEmail: async (patientId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/report/patient-email/${patientId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    sendVitalReportEmail: async (vitalsId: string, email: string, payload: any) => {
        const response = await fetch(`${API_BASE_URL}/api/report/vitals/${vitalsId}/send-email`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ email, payload }),
        });
        return handleResponse(response);
    },

    sendVitalReportEmailPdf: async (vitalsId: string, formData: FormData) => {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/api/report/vitals/${vitalsId}/send-email-pdf`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }, // NO Content-Type — let browser set multipart
            body: formData,
        });
        return handleResponse(response);
    },

    updatePatientEmail: async (patientId: string, email: string) => {
        const response = await fetch(`${API_BASE_URL}/api/report/patient-email/${patientId}`, {
            method: 'PATCH',
            headers: getHeaders(),
            body: JSON.stringify({ email }),
        });
        return handleResponse(response);
    },

    getAllDoctors: async () => {
        const response = await fetch(`${API_BASE_URL}/api/doctors/all`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    saveHearingTest: async (vitalsId: string, hearingData: any) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/hearing-testing/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({ vitalsId, hearingData }),
        });
        return handleResponse(response);
    },

    getHearingTest: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/vitals/hearing-testing/${vitalsId}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        return handleResponse(response);
    },

    getPatientByVitalsId: async (vitalsId: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/patient-by-vitals/${vitalsId}`, {
            method: 'GET',
            headers: getDocHeaders(),  // doctor token
        });
        return handleResponse(response);
    },
    //new
    removeDoctorFcmToken: async (token: string) => {
        const response = await fetch(`${API_BASE_URL}/api/notifications/remove-fcm-token`, {
            method: 'DELETE',
            headers: getDocHeaders(),
            body: JSON.stringify({ fcmToken: token }),
        });
        return handleResponse(response);
    },
    //orignal
    // removeDoctorFcmToken: async (token: string) => {
    //     const response = await fetch(`${API_BASE_URL}/api/notifications/remove-fcm-token`, {
    //         method: 'DELETE',
    //         headers: getHeaders(),
    //         body: JSON.stringify({ fcmToken: token }),
    //     });
    //     return handleResponse(response);
    // },
};
