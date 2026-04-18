const HARDWARE_PARSERS = [
    {
        pattern: /^O(\d{1,3}):(\d{1,3})X$/,
        keys: ['temp', 'bp']
    },
    {
        pattern: /^T([\d.]+)P$/,
        keys: ['pulse']
    },
    {
        pattern: /^W([\d.]+)S$/,
        keys: ['weight']
    }

];