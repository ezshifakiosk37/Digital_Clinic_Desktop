const API_BASE_URL = "https://api-for-digital-clinic-desktop.onrender.com"; // Adjust based on your Render URL

/**
 * Logic: Centralized Error Handler
 * This avoids repeating try/catch blocks for every single fetch call.
 */
const handleResponse = async (response: Response) => {
    const data = await response.json();
    if (!response.ok) {
        // If unauthorized, you might want to redirect to login
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
            headers: { 'Content-Type': 'application/json' }, // No Auth header needed
            body: JSON.stringify(credentials),
        });

        const data = await handleResponse(response);

        if (data.token) {
            // Logic: Store the token so getHeaders() can use it for subsequent calls
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
        window.location.href = '/login';
    },
    // GET: Find by phone (mapped to router.get('/'))
    findPatientByPhone: async (phone: string) => {
        const response = await fetch(`${API_BASE_URL}/api/patients/?phone=${phone}`, {
            method: 'GET',
            headers: getHeaders(),
        });
        // Special case: 404 isn't necessarily an "error" for a search, just "not found"
        if (response.status === 404) return null;
        return handleResponse(response);
    },

    saveOrUpdatePatient: async (patientData: Record<string, any>, id?: string | null) => {
        // Logic: Create a clean payload. 
        // We strip out the 'id' from patientData and explicitly set it 
        // to ensure the backend receives a clean 'id' key for its conditional logic.
        const { id: _, ...fields } = patientData;

        const payload = {
            ...fields,
            id: id || undefined, // If null or empty, send undefined so the backend ignores it
        };

        const response = await fetch(`${API_BASE_URL}/api/patients/save`, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify(payload),
        });

        return handleResponse(response);
    },

    saveVitals: async (patientId: string, vitalsData: any) => {
        const url = `${API_BASE_URL}/api/patients/save-vitals`;

        const response = await fetch(url, {
            method: 'POST',
            headers: getHeaders(),
            body: JSON.stringify({
                patientId, // The ID at the top level
                vitals: vitalsData // The WHOLE object (PulseRate, BP, etc.) at the 'vitals' key
            }),
        });
        return handleResponse(response);
    },
};