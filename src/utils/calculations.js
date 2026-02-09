/**
 * Industrial Instrumentation Calculation Engine
 * Logic 3: ITS-90 Thermocouple (NIST Monograph 175 Coefficients)
 * Logic 4: RTD Callendar-Van Dusen
 * Logic 5: Metrology Unit Converter
 */

// --- Logic 3: ITS-90 Thermocouple Engine ---
// NIST ITS-90 Inverse Polynomial Coefficients (mV → °C)
export const thermocoupleInverse = {
    K: {
        // 0 to 500°C (0 to 20.644 mV)
        high: [
            0.0000000E+00,
            2.5083550E+01,
            7.8601060E-02,
            -2.5031310E-01,
            8.3152460E-02,
            -1.2280340E-02,
            9.8040360E-04,
            -4.4130300E-05,
            1.0577340E-06,
            -1.0527550E-08
        ],
        // -200 to 0°C (-5.891 to 0 mV)
        low: [
            0.0000000E+00,
            2.5173462E+01,
            -1.1662878E+00,
            -1.0833638E+00,
            -8.9773540E-01,
            -3.7342377E-01,
            -8.6632643E-02,
            -1.0450598E-02,
            -5.1920577E-04
        ]
    },
    J: {
        // 0 to 760°C (0 to 42.919 mV)
        high: [
            0.0000000E+00,
            1.9528268E+01,
            -1.2286185E+00,
            -1.0752178E+00,
            -5.9086933E-01,
            -1.7256792E-01,
            -2.8131513E-02,
            -2.3963370E-03,
            -8.3823321E-05
        ],
        // -210 to 0°C (-8.095 to 0 mV)
        low: [
            0.0000000E+00,
            1.9528268E+01,
            -1.2286185E+00,
            -1.0752178E+00,
            -5.9086933E-01,
            -1.7256792E-01,
            -2.8131513E-02,
            -2.3963370E-03,
            -8.3823321E-05
        ]
    },
    E: {
        // 0 to 1000°C (0 to 76.373 mV)
        high: [
            0.0000000E+00,
            1.7057035E+01,
            -2.3301759E-01,
            6.5435585E-03,
            -7.3562749E-05,
            -1.7896001E-06,
            8.4036165E-08,
            -1.3735879E-09,
            1.0629823E-11,
            -3.2447087E-14
        ],
        // -200 to 0°C (-8.825 to 0 mV)
        low: [
            0.0000000E+00,
            1.6977288E+01,
            -4.3514970E-01,
            -1.5859697E-01,
            -9.2502871E-02,
            -2.6084314E-02,
            -4.1360199E-03,
            -3.4034030E-04,
            -1.1564890E-05
        ]
    },
    T: {
        // 0 to 400°C (0 to 20.872 mV)
        high: [
            0.0000000E+00,
            2.5949192E+01,
            -2.1316967E-01,
            7.9018692E-01,
            4.2527777E-01,
            1.3304473E-01,
            2.0241446E-02,
            1.2668171E-03
        ],
        // -200 to 0°C (-5.603 to 0 mV)
        low: [
            0.0000000E+00,
            2.5949192E+01,
            -2.1316967E-01,
            7.9018692E-01,
            4.2527777E-01,
            1.3304473E-01,
            2.0241446E-02,
            1.2668171E-03
        ]
    },
    S: {
        // 0 to 1768°C
        coeffs: [
            0.0000000000E+00,
            1.84949460E+02,
            -8.00504062E+01,
            1.02237430E+02,
            -1.52248592E+02,
            1.88821343E+02,
            -1.59085941E+02,
            8.23027880E+01,
            -2.34181944E+01,
            2.79786260E+00
        ]
    },
    R: {
        // Type R: 0 to 1064.18°C (NIST ITS-90)
        coeffs: [
            0.0000000000E+00,
            1.8891380E+02,
            -9.3835637E+01,
            1.3068715E+02,
            -2.2703580E+02,
            3.5145659E+02,
            -3.8953900E+02,
            2.8247440E+02,
            -1.2105584E+02,
            2.8159440E+01,
            -2.7555000E+00
        ]
    }
};

// NIST ITS-90 Forward Polynomial Coefficients (°C → mV)
export const thermocoupleForward = {
    K: {
        // 0 to 1372°C
        high: [
            0.000000000000E+00,
            3.9450128025494E-02,
            2.3622373598014E-05,
            -3.2858906784541E-07,
            4.9904698541642E-09,
            -6.7509059173354E-11,
            5.7410614127976E-13,
            -3.1088872894544E-15,
            1.0451609365313E-17,
            -1.9889266878617E-20,
            1.6322697486209E-23
        ],
        // -270 to 0°C
        low: [
            0.000000000000E+00,
            3.9450128025494E-02,
            2.3622373598014E-05,
            -3.2858906784541E-07,
            4.9904698541642E-09,
            -6.7509059173354E-11,
            5.7410614127976E-13,
            -3.1088872894544E-15,
            1.0451609365313E-17,
            -1.9889266878617E-20,
            1.6322697486209E-23
        ]
    },
    J: {
        // 0 to 760°C
        high: [
            0.000000000000E+00,
            5.0381187815E-02,
            3.0475836930E-05,
            -8.5681065720E-08,
            1.3228195295E-10,
            -1.7052958340E-13,
            2.0948090695E-16,
            -1.2538395332E-19,
            1.5631725697E-23
        ],
        // -210 to 0°C
        low: [
            0.000000000000E+00,
            5.0381187815E-02,
            3.0475836930E-05,
            -8.5681065720E-08,
            1.3228195295E-10,
            -1.7052958340E-13,
            2.0948090695E-16,
            -1.2538395332E-19,
            1.5631725697E-23
        ]
    },
    E: {
        // 0 to 1000°C
        high: [
            0.000000000000E+00,
            5.8665508708853E-02,
            4.5410977124727E-05,
            -7.7998048686725E-08,
            2.5800160843712E-10,
            -5.9452583057708E-13,
            -9.3214058667588E-16,
            -1.0287606573818E-18,
            -8.0370123621955E-22,
            -4.3979497396969E-25,
            -1.6414776355390E-28,
            -3.9673619514257E-32,
            -5.5827328721887E-36,
            -3.4657842019361E-40
        ],
        // -270 to 0°C
        low: [
            0.000000000000E+00,
            5.8665508708853E-02,
            4.5032275582986E-05,
            -2.8908407212954E-07,
            -3.3056896652187E-08,
            -6.5024403102441E-10,
            -1.9197495504600E-12,
            -1.2536600497064E-14,
            -2.1489217450777E-17
        ]
    },
    T: {
        // 0 to 400°C
        high: [
            0.000000000000E+00,
            3.8748106364E-02,
            3.3292227880E-05,
            2.0618243404E-07,
            -2.1882256846E-09,
            1.0996880928E-11,
            -3.0815758772E-14,
            4.5479135290E-17,
            -2.7512901673E-20
        ],
        // -270 to 0°C
        low: [
            0.000000000000E+00,
            3.8748106364E-02,
            4.4194434347E-05,
            1.1844323105E-07,
            2.0032973554E-08,
            9.0138019559E-10,
            2.2651156593E-11,
            3.6071154205E-13,
            3.8493939883E-15,
            2.8213521925E-17,
            1.4251594779E-19,
            4.8768662286E-22,
            1.0795539270E-24,
            1.3945027062E-27,
            7.9795153927E-31
        ]
    },
    S: {
        // 0 to 1768°C
        high: [
            0.000000000000E+00,
            5.40313308631E-03,
            1.25934289740E-05,
            -2.32477968689E-08,
            3.22028823036E-11,
            -3.31465196389E-14,
            2.55744251786E-17,
            -1.25068871393E-20,
            2.71443176145E-24
        ],
        low: [
            0.000000000000E+00,
            5.40313308631E-03,
            1.25934289740E-05,
            -2.32477968689E-08,
            3.22028823036E-11,
            -3.31465196389E-14,
            2.55744251786E-17,
            -1.25068871393E-20,
            2.71443176145E-24
        ]
    },
    R: {
        // Type R: 0 to 1064.18°C (NIST ITS-90)
        high: [
            0.000000000000E+00,
            5.28966788E-03,
            1.39166589E-05,
            -2.38855693E-08,
            3.56916E-11,
            -4.62347E-14,
            4.65806E-17,
            -3.26582E-20,
            1.44067E-23,
            -3.11242E-27
        ],
        low: [
            0.000000000000E+00,
            5.28966788E-03,
            1.39166589E-05,
            -2.38855693E-08,
            3.56916E-11,
            -4.62347E-14,
            4.65806E-17,
            -3.26582E-20,
            1.44067E-23,
            -3.11242E-27
        ]
    }
};

/**
 * Calculates temperature from mV using inverse polynomial.
 * @param {number} mV 
 * @param {Array<number>} coeffs - [c0, c1, c2, ...]
 */
export function calculatePoly(mV, coeffs) {
    let t = 0;
    for (let i = 0; i < coeffs.length; i++) {
        t += coeffs[i] * Math.pow(mV, i);
    }
    return t;
}

/**
 * Get forward polynomial coefficients for a specific type and temperature
 * @param {string} type - 'K', 'J', 'E', 'T', 'S'
 * @param {number} T - Temperature in °C
 */
function getForwardCoeffs(type, T) {
    const fwd = thermocoupleForward[type];
    if (!fwd) return null;

    if (fwd.high && fwd.low) {
        return T >= 0 ? fwd.high : fwd.low;
    }
    return fwd.high || fwd.coeffs;
}

/**
 * Get inverse polynomial coefficients for a specific type and voltage
 * @param {string} type - 'K', 'J', 'E', 'T', 'S'
 * @param {number} mV - Voltage in mV
 */
function getInverseCoeffs(type, mV) {
    const inv = thermocoupleInverse[type];
    if (!inv) return null;

    if (inv.high && inv.low) {
        return mV >= 0 ? inv.high : inv.low;
    }
    return inv.coeffs;
}

/**
 * Calculates mV from temperature using forward polynomial (T → mV)
 * @param {string} type - 'K', 'J', 'E', 'T', 'S' 
 * @param {number} T - Temperature in degrees C
 * @param {number} cjcTemp - Cold junction compensation temperature (default 0)
 * @returns {number} - EMF in mV
 */
export function calculateThermocoupleMV(type, T, cjcTemp = 0) {
    const coeffsT = getForwardCoeffs(type, T);
    const coeffsCjc = getForwardCoeffs(type, cjcTemp);

    if (!coeffsT || !coeffsCjc) return 0;

    // V_measured = V(T_measure) - V(T_cjc)
    const Vmeasure = calculatePoly(T, coeffsT);
    const Vcjc = calculatePoly(cjcTemp, coeffsCjc);

    return Vmeasure - Vcjc;
}

/**
 * Wrapper to handle Thermocouple Type logic and CJC compensation
 * @param {string} type - 'K', 'J', 'E', 'T', 'S'
 * @param {number} mV - Input voltage in mV
 * @param {number} cjcTemp - Cold junction compensation temperature (default 0)
 * @returns {number} - Temperature in °C
 */
export function calculateThermocoupleTemp(type, mV, cjcTemp = 0) {
    // Step 1: Calculate CJC voltage from CJC temperature using forward polynomial
    const coeffsCjc = getForwardCoeffs(type, cjcTemp);
    if (!coeffsCjc) return 0;

    const Vcjc = calculatePoly(cjcTemp, coeffsCjc);

    // Step 2: Total voltage = input mV + CJC voltage
    const Vtotal = mV + Vcjc;

    // Step 3: Convert total voltage to temperature using inverse polynomial
    const coeffsInv = getInverseCoeffs(type, Vtotal);
    if (!coeffsInv) return 0;

    return calculatePoly(Vtotal, coeffsInv);
}

// Legacy export for backward compatibility
export const thermocoupleCalc = thermocoupleInverse;

// --- Logic 4: RTD Callendar-Van Dusen ---
const RTD_CONSTANTS = {
    R0: 100,
    A: 3.9083e-3,
    B: -5.775e-7,
    C: -4.183e-12
};

export function rtdTempFromRes(R) {
    const { R0, A, B, C } = RTD_CONSTANTS;
    // if R >= R0 (T >= 0)
    // R = R0 * (1 + A*t + B*t^2)
    // 0 = R0*B*t^2 + R0*A*t + (R0 - R)
    // Quadratic formula: t = (-b + sqrt(b^2 - 4ac)) / 2a
    // a = R0*B, b = R0*A, c = R0 - R

    if (R >= R0) {
        const a = R0 * B;
        const b = R0 * A;
        const c = R0 - R;
        const disc = b * b - 4 * a * c;
        if (disc < 0) return NaN;
        return (-b + Math.sqrt(disc)) / (2 * a); // Note: B is negative. We want the smaller positive root t. 
        // A is positive, B is negative. -b is negative. sqrt(disc) is positive.
        // if B < 0, 2a < 0.
        // t approx 100 deg -> R approx 138.
        // check: 100 = 100 * (1 + 0.39 - 0.0005) approx 100*1.39 = 139.
        // if we use (-b - sqrt)/2a => (-pos - pos)/neg = neg/neg = pos. Correct.
    } else {
        // T < 0
        // R = R0 * (1 + A*t + B*t^2 + C*(t-100)*t^3)
        // R = R0 * (1 + At + Bt^2 + C t^4 - 100 C t^3)
        // f(t) = R0 * (1 + At + Bt^2 - 100Ct^3 + Ct^4) - R = 0
        // f'(t) = R0 * (A + 2Bt - 300Ct^2 + 4Ct^3)
        // Newton-Raphson: t_new = t_old - f(t)/f'(t)

        let t = 0; // Initial guess
        for (let i = 0; i < 50; i++) {
            const f = R0 * (1 + A * t + B * t * t + C * (t - 100) * t * t * t) - R;
            const df = R0 * (A + 2 * B * t + C * (4 * t * t * t - 300 * t * t));
            const nextT = t - f / df;
            if (Math.abs(nextT - t) < 0.001) return nextT;
            t = nextT;
        }
        return t;
    }
}

/**
 * Calculates resistance from temperature using Callendar-Van Dusen
 * @param {number} T - Temperature in °C
 * @returns {number} - Resistance in Ω
 */
export function rtdResFromTemp(T) {
    const { R0, A, B, C } = RTD_CONSTANTS;
    if (T >= 0) {
        // R = R0 * (1 + A*t + B*t^2)
        return R0 * (1 + A * T + B * T * T);
    } else {
        // R = R0 * (1 + A*t + B*t^2 + C*(t-100)*t^3)
        return R0 * (1 + A * T + B * T * T + C * (T - 100) * T * T * T);
    }
}
export const UNITS = {
    atm: 0.009869,
    Pa: 1000,
    hPa: 10,
    kPa: 1,
    MPa: 0.001,
    bar: 0.01,
    'dyn/cm²': 10000,
    'lb/ft²': 20.8854,
    psi: 0.145038,
    mmHg: 7.50062,
    inchHg: 0.2953,
    'mmH₂O': 101.9716,
    'inchH₂O': 4.01463,
    'kg/cm²': 0.010197
};

export function convertPressure(value, fromUnit, toUnit) {
    if (!UNITS[fromUnit] || !UNITS[toUnit]) return 0;
    // Base is kPa. 
    // val (fromUnit) / UNITS[fromUnit] = val (kPa)
    // val (kPa) * UNITS[toUnit] = val (toUnit)
    const valInKPa = value / UNITS[fromUnit];
    return valInKPa * UNITS[toUnit];
}
