export const HARDWARE_PARSERS = [
    {
        pattern: /^O(\d{1,3}):(\d{1,3}):X$/
        keys: ['Spo2', 'PulseRate']
    },
    {
        pattern: /^T([\d.]+)P$/,
        keys: ['Temperature']
    },
    {
        pattern: /^W([\d.]+)S$/,
        keys: ['Weight']
    }

];