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

    // --- NEW: VERIFY TOKEN METHOD ---
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
        // Changed process.env to API_BASE_URL and added /api prefix
        // Added handleResponse to properly manage non-JSON responses
        const response = await fetch(`${API_BASE_URL}/api/vitals/history-by-phone/${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        
        return handleResponse(response);
    },
};