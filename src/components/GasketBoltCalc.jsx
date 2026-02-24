import React, { useState, useMemo } from 'react';
import { Search, Cog, ChevronDown } from 'lucide-react';

// ══════════════════════════════════════════════════════════
// RAW_DATA_MASTER - Unified Material Database
// ══════════════════════════════════════════════════════════
export const RAW_DATA_MASTER = {
    "flange": {
        "1/2": {
            "150": { "qty": "4", "spec": "1/2 * 65", "gasket": "PGA00920", "bolt": "PBN00266", "tool": "22.0" },
            "300": { "qty": "4", "spec": "1/2 * 70", "gasket": "PGA00938", "bolt": "PBN00267", "tool": "22.0" },
            "600": { "qty": "4", "spec": "1/2 * 85", "gasket": "PGA00956", "bolt": "PBN00270", "tool": "22.0" },
            "1500": { "qty": "4", "spec": "3/4 * 115", "gasket": "PGA01005", "bolt": "PBN00319", "tool": "32.0" },
            "2500": { "qty": "4", "spec": "3/4 * 130", "gasket": "PGA01026", "bolt": "PBN00322", "tool": "32.0" }
        },
        "3/4": {
            "150": { "qty": "4", "spec": "1/2 * 65", "gasket": "PGA00881", "bolt": "PBN00266", "tool": "22.0" },
            "300": { "qty": "4", "spec": "5/8 * 75", "gasket": "PGA00894", "bolt": "PBN00405", "tool": "27.0" },
            "600": { "qty": "4", "spec": "5/8 * 90", "gasket": "PGA00957", "bolt": "PBN00408", "tool": "27.0" },
            "1500": { "qty": "4", "spec": "3/4 * 115", "gasket": "PGA01006", "bolt": "PBN00319", "tool": "32.0" },
            "2500": { "qty": "4", "spec": "3/4 * 130", "gasket": "PGA01027", "bolt": "PBN00322", "tool": "32.0" }
        },
        "1": {
            "150": { "qty": "4", "spec": "1/2 * 70", "gasket": "PGA00921", "bolt": "PBN00267", "tool": "22.0" },
            "300": { "qty": "4", "spec": "5/8 * 85", "gasket": "PGA00895", "bolt": "PBN00407", "tool": "27.0" },
            "600": { "qty": "4", "spec": "5/8 * 95", "gasket": "PGA00958", "bolt": "PBN00409", "tool": "27.0" },
            "1500": { "qty": "4", "spec": "7/8 * 130", "gasket": "PGA01007", "bolt": "PBN00415", "tool": "36.0" },
            "2500": { "qty": "4", "spec": "7/8 * 140", "gasket": "PGA01028", "bolt": "PBN00417", "tool": "36.0" }
        },
        "1 1/2": {
            "150": { "qty": "4", "spec": "1/2 * 75", "gasket": "PGA00882", "bolt": "PBN00268", "tool": "22.0" },
            "300": { "qty": "4", "spec": "3/4 * 95", "gasket": "PGA00896", "bolt": "PBN00370", "tool": "32.0" },
            "600": { "qty": "4", "spec": "3/4 * 110", "gasket": "PGA00959", "bolt": "PBN00318", "tool": "32.0" },
            "1500": { "qty": "4", "spec": "1 * 140", "gasket": "PGA01008", "bolt": "PBN00192", "tool": "41.0" },
            "2500": { "qty": "4", "spec": "1 1/8 * 175", "gasket": "PGA01029", "bolt": "PBN00707", "tool": "46.0" }
        },
        "2": {
            "150": { "qty": "4", "spec": "5/8 * 85", "gasket": "PGA00883", "bolt": "PBN00407", "tool": "27.0" },
            "300": { "qty": "8", "spec": "5/8 * 90", "gasket": "PGA00897", "bolt": "PBN00408", "tool": "27.0" },
            "600": { "qty": "8", "spec": "5/8 * 115", "gasket": "PGA00960", "bolt": "PBN00375", "tool": "27.0" },
            "1500": { "qty": "8", "spec": "7/8 * 150", "gasket": "PGA01009", "bolt": "PBN00419", "tool": "36.0" },
            "2500": { "qty": "8", "spec": "1 * 180", "gasket": "PGA01030", "bolt": "PBN00200", "tool": "41.0" }
        },
        "2 1/2": {
            "150": { "qty": "8", "spec": "5/8 * 90", "gasket": "PGA00922", "bolt": "PBN00408", "tool": "27.0" },
            "300": { "qty": "8", "spec": "3/4 * 100", "gasket": "PGA00939", "bolt": "PBN00316", "tool": "32.0" },
            "600": { "qty": "8", "spec": "3/4 * 130", "gasket": "PGA00961", "bolt": "PBN00322", "tool": "32.0" },
            "1500": { "qty": "8", "spec": "1 * 160", "gasket": "PGA01010", "bolt": "PBN00196", "tool": "36.0" },
            "2500": { "qty": "8", "spec": "1 1/8 * 205", "gasket": "PGA01031", "bolt": "PBN00713", "tool": "41.0" }
        },
        "3": {
            "150": { "qty": "4", "spec": "5/8 * 95", "gasket": "PGA00884", "bolt": "PBN00409", "tool": "27.0" },
            "300": { "qty": "8", "spec": "3/4 * 110", "gasket": "PGA00898", "bolt": "PBN00318", "tool": "32.0" },
            "600": { "qty": "8", "spec": "3/4 * 135", "gasket": "PGA00962", "bolt": "PBN00323", "tool": "32.0" },
            "1500": { "qty": "8", "spec": "1 1/8 * 175", "gasket": "PGA01011", "bolt": "PBN00707", "tool": "46.0" },
            "2500": { "qty": "8", "spec": "1 1/8 * 230", "gasket": "PGA01032", "bolt": "PBN00718", "tool": "50.0" }
        },
        "4": {
            "150": { "qty": "8", "spec": "5/8 * 95", "gasket": "PGA00885", "bolt": "PBN00409", "tool": "27.0" },
            "300": { "qty": "8", "spec": "3/4 * 115", "gasket": "PGA00940", "bolt": "PBN00319", "tool": "32.0" },
            "600": { "qty": "8", "spec": "7/8 * 150", "gasket": "PGA00963", "bolt": "PBN00419", "tool": "36.0" },
            "1500": { "qty": "8", "spec": "1 1/4 * 200", "gasket": "PGA01012", "bolt": "PBN00636", "tool": "50.0" },
            "2500": { "qty": "8", "spec": "1 1/2 * 270", "gasket": "PGA01033", "bolt": "PBN00597", "tool": "60.0" }
        },
        "6": {
            "150": { "qty": "8", "spec": "3/4 * 100", "gasket": "PGA00886", "bolt": "PBN00316", "tool": "32.0" },
            "300": { "qty": "12", "spec": "3/4 * 125", "gasket": "PGA00899", "bolt": "PBN00321", "tool": "32.0" },
            "600": { "qty": "12", "spec": "1 * 175", "gasket": "PGA00965", "bolt": "PBN00199", "tool": "41.0" },
            "1500": { "qty": "12", "spec": "1 3/8 * 270", "gasket": "PGA01014", "bolt": "PBN00777", "tool": "55.0" },
            "2500": { "qty": "8", "spec": "2 * 365", "gasket": "PGA01035", "bolt": "PBN01216", "tool": "80.0" }
        },
        "8": {
            "150": { "qty": "8", "spec": "3/4 * 110", "gasket": "PGA00887", "bolt": "PBN00318", "tool": "32.0" },
            "300": { "qty": "12", "spec": "7/8 * 140", "gasket": "PGA00900", "bolt": "PBN00417", "tool": "36.0" },
            "600": { "qty": "12", "spec": "1 1/8 * 200", "gasket": "PGA00907", "bolt": "PBN00712", "tool": "46.0" },
            "1500": { "qty": "12", "spec": "1 3/8 * 310", "gasket": "PGA01015", "bolt": "PBN00783", "tool": "55.0" },
            "2500": { "qty": "12", "spec": "2 * 410", "gasket": "PGA01036", "bolt": "PBN00285", "tool": "80.0" }
        },
        "10": {
            "150": { "qty": "12", "spec": "7/8 * 120", "gasket": "PGA00888", "bolt": "PBN00413", "tool": "36.0" },
            "300": { "qty": "16", "spec": "1 * 160", "gasket": "PGA00901", "bolt": "PBN00196", "tool": "41.0" },
            "600": { "qty": "16", "spec": "1 1/4 * 225", "gasket": "PGA00908", "bolt": "PBN00641", "tool": "50.0" },
            "1500": { "qty": "12", "spec": "1 7/8 * 360", "gasket": "PGA01016", "bolt": "PBN01347", "tool": "75.0" },
            "2500": { "qty": "12", "spec": "2 1/2 * 525", "gasket": "PGA01037", "bolt": "PBN00840", "tool": "100.0" }
        },
        "12": {
            "150": { "qty": "12", "spec": "7/8 * 120", "gasket": "PGA00889", "bolt": "PBN00413", "tool": "36.0" },
            "300": { "qty": "16", "spec": "1 * 170", "gasket": "PGA00902", "bolt": "PBN00198", "tool": "41.0" },
            "600": { "qty": "20", "spec": "1 1/4 * 230", "gasket": "PGA00909", "bolt": "PBN00642", "tool": "50.0" },
            "1500": { "qty": "16", "spec": "2 * 405", "gasket": "PGA01017", "bolt": "PBN00284", "tool": "80.0" },
            "2500": { "qty": "12", "spec": "2 3/4 * 405", "gasket": "PGA01038", "bolt": "PBN00852", "tool": "4.25" }
        },
        "14": {
            "150": { "qty": "12", "spec": "1 * 135", "gasket": "PGA00924", "bolt": "PBN00191", "tool": "41.0" },
            "300": { "qty": "20", "spec": "1 1/8 * 180", "gasket": "PGA00903", "bolt": "PBN00708", "tool": "46.0" },
            "600": { "qty": "20", "spec": "1 3/8 * 245", "gasket": "PGA00966", "bolt": "PBN00772", "tool": "55.0" },
            "1500": { "qty": "16", "spec": "2 1/4 * 440", "gasket": "PGA00992", "bolt": "PBN00850", "tool": "3.5" }
        },
        "16": {
            "150": { "qty": "16", "spec": "1 * 140", "gasket": "PGA00925", "bolt": "PBN00192", "tool": "41.0" },
            "300": { "qty": "20", "spec": "1 1/4 * 190", "gasket": "PGA00942", "bolt": "PBN00634", "tool": "50.0" },
            "600": { "qty": "20", "spec": "1 1/2 * 265", "gasket": "PGA00551", "bolt": "PBN00597", "tool": "60.0" },
            "1500": { "qty": "16", "spec": "2 1/2 * 485", "gasket": "PGA01018", "bolt": "PBN00839", "tool": "100.0" }
        },
        "18": {
            "150": { "qty": "16", "spec": "1 1/8 * 150", "gasket": "PGA00890", "bolt": "PBN00702", "tool": "46.0" },
            "300": { "qty": "24", "spec": "1 1/4 * 190", "gasket": "PGA00904", "bolt": "PBN00634", "tool": "50.0" },
            "600": { "qty": "20", "spec": "1 5/8 * 275", "gasket": "PGA00967", "bolt": "PBN00799", "tool": "65.0" },
            "1500": { "qty": "16", "spec": "2 3/4 * 530", "gasket": "PGA01019", "bolt": "PBN00852", "tool": "4.25" }
        },
        "20": {
            "150": { "qty": "20", "spec": "1 1/8 * 160", "gasket": "PGA00891", "bolt": "PBN00704", "tool": "46.0" },
            "300": { "qty": "24", "spec": "1 1/4 * 210", "gasket": "PGA00943", "bolt": "PBN00638", "tool": "50.0" },
            "600": { "qty": "24", "spec": "1 5/8 * 290", "gasket": "PGA00968", "bolt": "PBN00802", "tool": "65.0" },
            "1500": { "qty": "16", "spec": "3 * 325", "gasket": "PGA01020", "bolt": "근사치 없음", "tool": "4.625" }
        },
        "22": {
            "150": { "qty": "20", "spec": "1 1/4 * 170", "gasket": "PGA00926", "bolt": "PBN00630", "tool": "50.0" },
            "300": { "qty": "24", "spec": "1 1/2 * 225", "gasket": "PGA00944", "bolt": "PBN00589", "tool": "60.0" },
            "600": { "qty": "24", "spec": "1 3/4 * 315", "gasket": "PGA00969", "bolt": "PBN01100", "tool": "70.0" }
        },
        "24": {
            "150": { "qty": "20", "spec": "1 1/4 * 180", "gasket": "PGA00892", "bolt": "PBN00632", "tool": "50.0" },
            "300": { "qty": "24", "spec": "1 1/2 * 235", "gasket": "PGA00905", "bolt": "PBN00591", "tool": "60.0" },
            "600": { "qty": "24", "spec": "1 7/8 * 350", "gasket": "PGA00910", "bolt": "PBN00830", "tool": "75.0" },
            "1500": { "qty": "16", "spec": "3 1/2 * 665", "gasket": "PGA01022", "bolt": "PBN01009", "tool": "5.375" }
        },
        "26": {
            "150": { "qty": "24", "spec": "1 1/4 * 190", "gasket": "PGA00927", "bolt": "PBN00634", "tool": "50.0" },
            "300": { "qty": "28", "spec": "1 5/8 * 255", "gasket": "PGA00945", "bolt": "PBN00795", "tool": "65.0" },
            "600": { "qty": "28", "spec": "1 7/8 * 365", "gasket": "PGA00970", "bolt": "PBN01347", "tool": "75.0" }
        },
        "30": {
            "150": { "qty": "28", "spec": "1 1/4 * 195", "gasket": "PGA00929", "bolt": "PBN00635", "tool": "50.0" },
            "300": { "qty": "28", "spec": "1 3/4 * 285", "gasket": "PGA00906", "bolt": "PBN01100", "tool": "70.0" },
            "600": { "qty": "28", "spec": "2 * 380", "gasket": "PGA00972", "bolt": "PBN00280", "tool": "80.0" }
        },
        "34": {
            "150": { "qty": "32", "spec": "1 1/2 * 215", "gasket": "PGA00931", "bolt": "PBN01230", "tool": "60.0" },
            "300": { "qty": "28", "spec": "1 7/8 * 315", "gasket": "PGA00948", "bolt": "PBN00826", "tool": "75.0" },
            "600": { "qty": "28", "spec": "2 1/4 * 410", "gasket": "PGA00974", "bolt": "PBN00850", "tool": "3.5" }
        }
    },
    "bolts": {
        "1/2": { "65": "PBN00266", "70": "PBN00267", "75": "PBN00268", "85": "PBN00270" },
        "3/4": { "95": "PBN00370", "100": "PBN00316", "110": "PBN00318", "115": "PBN00319", "125": "PBN00321", "130": "PBN00322", "135": "PBN00323" },
        "5/8": { "75": "PBN00405", "85": "PBN00407", "90": "PBN00408", "95": "PBN00409", "115": "PBN00375" },
        "7/8": { "120": "PBN00413", "125": "PBN00414", "130": "PBN00415", "135": "PBN00415", "140": "PBN00417", "145": "PBN00418", "150": "PBN00419" },
        "1": { "135": "PBN00191", "140": "PBN00192", "160": "PBN00196", "165": "PBN00196", "170": "PBN00198", "175": "PBN00199", "180": "PBN00200", "185": "PBN00198" },
        "1 1/8": { "150": "PBN00702", "160": "PBN00704", "175": "PBN00707", "180": "PBN00708", "200": "PBN00712", "205": "PBN00713", "230": "PBN00718" },
        "1 1/4": { "170": "PBN00630", "180": "PBN00632", "190": "PBN00634", "195": "PBN00635", "200": "PBN00636", "210": "PBN00638", "225": "PBN00641", "230": "PBN00642" },
        "1 1/2": { "215": "PBN01230", "225": "PBN00589", "235": "PBN00591", "265": "PBN00597", "270": "PBN00597" },
        "1 3/8": { "245": "PBN00772", "270": "PBN00777", "310": "PBN00783" },
        "2": { "365": "PBN01216", "380": "PBN00280", "405": "PBN00284", "410": "PBN00285" },
        "1 7/8": { "315": "PBN00826", "350": "PBN00830", "360": "PBN01347", "365": "PBN01347" },
        "2 1/2": { "485": "PBN00839", "525": "PBN00840" },
        "2 3/4": { "405": "PBN00852", "530": "PBN00852" },
        "2 1/4": { "410": "PBN00850", "440": "PBN00850" },
        "1 5/8": { "255": "PBN00795", "275": "PBN00799", "290": "PBN00802" },
        "1 3/4": { "285": "PBN01100", "315": "PBN01100" },
        "3 1/2": { "665": "PBN01009" }
    }
};

// ══════════════════════════════════════════════════════════
// Derived constants
// ══════════════════════════════════════════════════════════
const FLANGE_SIZES = Object.keys(RAW_DATA_MASTER.flange);
const BOLT_DIAMETERS = Object.keys(RAW_DATA_MASTER.bolts);

// Tab definitions
const TABS = [
    { id: 'calc', label: '종합 계산기' },
    { id: 'bolt', label: '볼트 검색' },
    { id: 'gasket', label: '가스켓 검색' },
];

// ══════════════════════════════════════════════════════════
// Helper Functions
// ══════════════════════════════════════════════════════════
const formatBoltSize = (rawSize) => {
    if (!rawSize) return { diameter: '', length: '' };
    const parts = rawSize.split(' * ');
    if (parts.length === 2) return { diameter: parts[0].trim(), length: parts[1].trim() };
    return { diameter: rawSize, length: '' };
};

const formatToolSize = (rawSize) => {
    if (!rawSize) return { value: '', unit: '' };
    const numValue = parseFloat(rawSize);
    return numValue > 10 ? { value: rawSize, unit: 'mm' } : { value: rawSize, unit: 'inch' };
};

// Copy to clipboard with haptic feedback
const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    if (navigator.vibrate) navigator.vibrate(30);
};

// ══════════════════════════════════════════════════════════
// Main Component
// ══════════════════════════════════════════════════════════
export default function GasketBoltCalc() {
    const [activeTab, setActiveTab] = useState('calc');

    // ── Tab 1: 종합 계산기 State ──
    const [flangeSize, setFlangeSize] = useState('');
    const [rating, setRating] = useState('');
    const [isFlushingRing, setIsFlushingRing] = useState(false);
    const [ringThickness, setRingThickness] = useState(0);

    // ── Tab 2: 볼트 검색 State ──
    const [boltDiameter, setBoltDiameter] = useState('');
    const [boltLength, setBoltLength] = useState('');

    // ── Tab 3: 가스켓 검색 State ──
    const [gasketSize, setGasketSize] = useState('');
    const [gasketRating, setGasketRating] = useState('');

    // ══ Tab 1 Logic ══
    const availableRatings = useMemo(() => {
        if (!flangeSize || !RAW_DATA_MASTER.flange[flangeSize]) return [];
        return Object.keys(RAW_DATA_MASTER.flange[flangeSize]);
    }, [flangeSize]);

    const flangeResult = useMemo(() => {
        if (!flangeSize || !rating) return null;
        return RAW_DATA_MASTER.flange[flangeSize]?.[rating] || null;
    }, [flangeSize, rating]);

    const getRecommendedBolt = (spec) => {
        if (!spec || !isFlushingRing || ringThickness <= 0) return null;
        const parts = spec.split(' * ');
        if (parts.length !== 2) return null;
        const originalLength = parseInt(parts[1].trim(), 10);
        if (isNaN(originalLength)) return null;
        const rawLen = originalLength + ringThickness + 3;
        const newLength = Math.ceil(rawLen / 5) * 5;
        const diameter = parts[0].trim();
        const boltDB = RAW_DATA_MASTER.bolts[diameter];
        const code = boltDB ? boltDB[String(newLength)] || null : null;
        return { original: originalLength, recommended: newLength, diameter, code };
    };

    const handleFlangeSizeChange = (val) => { setFlangeSize(val); setRating(''); };

    // ══ Tab 2 Logic ══
    const availableLengths = useMemo(() => {
        if (!boltDiameter || !RAW_DATA_MASTER.bolts[boltDiameter]) return [];
        return Object.keys(RAW_DATA_MASTER.bolts[boltDiameter]).sort((a, b) => Number(a) - Number(b));
    }, [boltDiameter]);

    const boltResult = useMemo(() => {
        if (!boltDiameter || !boltLength) return null;
        const code = RAW_DATA_MASTER.bolts[boltDiameter]?.[boltLength];
        return code || null;
    }, [boltDiameter, boltLength]);

    const handleBoltDiameterChange = (val) => { setBoltDiameter(val); setBoltLength(''); };

    // ══ Tab 3 Logic ══
    const gasketRatings = useMemo(() => {
        if (!gasketSize || !RAW_DATA_MASTER.flange[gasketSize]) return [];
        return Object.keys(RAW_DATA_MASTER.flange[gasketSize]);
    }, [gasketSize]);

    const gasketResult = useMemo(() => {
        if (!gasketSize || !gasketRating) return null;
        return RAW_DATA_MASTER.flange[gasketSize]?.[gasketRating]?.gasket || null;
    }, [gasketSize, gasketRating]);

    const handleGasketSizeChange = (val) => { setGasketSize(val); setGasketRating(''); };

    // ══════════════════════════════════════════════════════
    // RENDER
    // ══════════════════════════════════════════════════════
    return (
        <div className="flex flex-col gap-3 h-full">
            {/* Header */}
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                    <Cog className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">가스켓 & 볼트 조회</h2>
                    <p className="text-xs text-slate-500">Gasket & Bolt Material Lookup</p>
                </div>
            </div>

            {/* Tab Bar */}
            <div className="flex rounded-xl overflow-hidden border border-slate-700 bg-slate-900/50">
                {TABS.map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-2.5 text-sm font-bold transition-all ${activeTab === tab.id
                            ? 'bg-orange-500/20 text-orange-400 border-b-2 border-orange-400'
                            : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ════════════════════════════════════════════ */}
            {/* TAB 1: 종합 계산기                          */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'calc' && (
                <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
                    {/* Input Section */}
                    <div className="bg-slate-900/50 rounded-2xl p-4 shadow-xl border border-slate-800">
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">플랜지 사이즈 (inch)</label>
                                <select value={flangeSize} onChange={e => handleFlangeSizeChange(e.target.value)}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-cyan-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer">
                                    <option value="">사이즈 선택...</option>
                                    {FLANGE_SIZES.map(s => <option key={s} value={s}>{s}"</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">레이팅 (lb)</label>
                                <select value={rating} onChange={e => setRating(e.target.value)} disabled={!flangeSize}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-green-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    <option value="">레이팅 선택...</option>
                                    {availableRatings.map(r => <option key={r} value={r}>{r}#</option>)}
                                </select>
                            </div>
                            {/* Flushing Ring */}
                            <div className="pt-3 border-t border-slate-800">
                                <label className="flex items-center gap-3 cursor-pointer group">
                                    <input type="checkbox" checked={isFlushingRing} onChange={e => setIsFlushingRing(e.target.checked)}
                                        className="w-5 h-5 rounded accent-lime-400 cursor-pointer" />
                                    <span className="text-sm text-slate-400 group-hover:text-slate-300 transition-colors">플러싱 링 적용</span>
                                </label>
                                {isFlushingRing && (
                                    <div className="mt-2">
                                        <label className="block text-xs text-slate-500 font-bold mb-1">링 두께 (mm)</label>
                                        <input type="number" value={ringThickness || ''} onChange={e => setRingThickness(parseFloat(e.target.value) || 0)}
                                            placeholder="두께 입력..."
                                            className="w-full h-10 bg-green-900/20 rounded-lg px-3 font-mono text-base font-bold text-lime-400 border border-green-800 focus:border-lime-500 focus:ring-2 focus:ring-lime-500/30 outline-none transition-all placeholder-slate-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Results */}
                    {flangeResult ? (
                        <div className="flex flex-col gap-3">
                            {/* ROW 1: Material Codes */}
                            <div className="grid grid-cols-2 gap-3">
                                {/* GASKET CODE */}
                                <button onClick={() => copyToClipboard(flangeResult.gasket)}
                                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all active:scale-95 text-left">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">GASKET CODE</p>
                                    <p className="text-xl font-mono font-bold text-orange-400">{flangeResult.gasket}</p>
                                    {isFlushingRing && <p className="text-xs text-lime-400 font-bold mt-1">× 2 EA</p>}
                                    <p className="text-[9px] text-slate-600 mt-1">탭하여 복사</p>
                                </button>

                                {/* BOLT/NUT CODE */}
                                {(() => {
                                    const rec = getRecommendedBolt(flangeResult.spec);
                                    const displayCode = rec?.code || flangeResult.bolt;
                                    return (
                                        <button onClick={() => copyToClipboard(displayCode)}
                                            className={`bg-slate-900/50 rounded-xl p-4 border ${rec ? 'border-lime-800/60' : 'border-slate-800'} hover:border-orange-500/50 hover:bg-slate-800/50 transition-all active:scale-95 text-left`}>
                                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BOLT/NUT CODE</p>
                                            {rec ? (
                                                <>
                                                    <p className="text-xs font-mono text-slate-500 line-through">{flangeResult.bolt}</p>
                                                    {rec.code ? (
                                                        <p className="text-lg font-mono font-bold text-lime-400 mt-0.5">➜ {rec.code}</p>
                                                    ) : (
                                                        <p className="text-sm font-bold text-amber-400 mt-0.5">⚠ 창고 재고 확인 필요</p>
                                                    )}
                                                </>
                                            ) : (
                                                <p className="text-xl font-mono font-bold text-orange-400">{flangeResult.bolt}</p>
                                            )}
                                            <p className="text-[9px] text-slate-600 mt-1">탭하여 복사</p>
                                        </button>
                                    );
                                })()}

                                {/* Navigate to Bolt Search - only when no matching code */}
                                {(() => {
                                    const rec = getRecommendedBolt(flangeResult.spec);
                                    if (!rec || rec.code) return null;
                                    return (
                                        <button
                                            onClick={() => {
                                                setBoltDiameter(rec.diameter);
                                                setBoltLength('');
                                                setActiveTab('bolt');
                                            }}
                                            className="col-span-2 w-full py-3 mt-1 bg-lime-500 text-black font-bold text-sm rounded-lg animate-pulse hover:bg-lime-400 active:scale-95 transition-all shadow-lg shadow-lime-500/25"
                                        >
                                            🔍 유사 볼트 직접 찾기
                                        </button>
                                    );
                                })()}
                            </div>

                            {/* ROW 2: Bolt Details */}
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BOLT QTY</p>
                                    <p className="text-2xl font-bold text-cyan-400">{flangeResult.qty}<span className="text-base text-slate-500 ml-1">EA</span></p>
                                </div>
                                <div className={`bg-slate-900/50 rounded-xl p-4 border ${isFlushingRing && getRecommendedBolt(flangeResult.spec) ? 'border-lime-800/60' : 'border-slate-800'}`}>
                                    <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BOLT SPEC</p>
                                    {(() => {
                                        const rec = getRecommendedBolt(flangeResult.spec);
                                        if (rec) {
                                            return (
                                                <>
                                                    <p className="text-xs font-mono text-slate-500 line-through">{rec.diameter} × {rec.original} mm</p>
                                                    <p className="text-lg font-bold font-mono text-lime-400 mt-0.5">
                                                        ➜ {rec.diameter}<span className="text-slate-500 text-xs ml-1">inch</span>
                                                        <span className="text-slate-600 mx-1">×</span>
                                                        {rec.recommended}<span className="text-slate-500 text-xs ml-1">mm</span>
                                                    </p>
                                                </>
                                            );
                                        }
                                        const bs = formatBoltSize(flangeResult.spec);
                                        return (
                                            <p className="text-lg font-bold font-mono text-cyan-400">
                                                {bs.diameter}<span className="text-slate-500 text-xs ml-1">inch</span>
                                                <span className="text-slate-600 mx-1">×</span>
                                                {bs.length}<span className="text-slate-500 text-xs ml-1">mm</span>
                                            </p>
                                        );
                                    })()}
                                </div>
                            </div>

                            {/* ROW 3: Tool Size */}
                            <div className="bg-slate-800/50 rounded-xl py-2 px-4 border border-slate-800 text-center">
                                <span className="text-sm text-slate-500">TOOL SIZE: </span>
                                <span className="text-sm font-bold text-cyan-400 font-mono">{formatToolSize(flangeResult.tool).value}</span>
                                <span className={`text-sm ml-1 ${formatToolSize(flangeResult.tool).unit === 'inch' ? 'text-orange-400' : 'text-slate-400'}`}>
                                    {formatToolSize(flangeResult.tool).unit}
                                </span>
                                {formatToolSize(flangeResult.tool).unit === 'inch' && <span className="text-orange-400 text-xs ml-2">(특수)</span>}
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                            <Search className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-sm font-bold">사이즈와 레이팅을 선택하세요</p>
                            <p className="text-xs text-slate-500 mt-1">Select flange size and rating</p>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* TAB 2: 볼트 검색                            */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'bolt' && (
                <div className="flex flex-col gap-3 flex-1">
                    <div className="bg-slate-900/50 rounded-2xl p-4 shadow-xl border border-slate-800">
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">볼트 직경 (inch)</label>
                                <select value={boltDiameter} onChange={e => handleBoltDiameterChange(e.target.value)}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-cyan-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer">
                                    <option value="">직경 선택...</option>
                                    {BOLT_DIAMETERS.map(d => <option key={d} value={d}>{d}"</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">볼트 길이 (mm)</label>
                                <select value={boltLength} onChange={e => setBoltLength(e.target.value)} disabled={!boltDiameter}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-green-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    <option value="">길이 선택...</option>
                                    {availableLengths.map(l => <option key={l} value={l}>{l} mm</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {boltResult ? (
                        <button onClick={() => copyToClipboard(boltResult)}
                            className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all active:scale-95 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">BOLT/NUT CODE</p>
                            <p className="text-3xl font-mono font-black text-orange-400">{boltResult}</p>
                            <p className="text-sm text-slate-500 font-mono mt-2">{boltDiameter}" × {boltLength} mm</p>
                            <p className="text-[10px] text-slate-600 mt-3">탭하여 복사</p>
                        </button>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                            <Search className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-sm font-bold">직경과 길이를 선택하세요</p>
                            <p className="text-xs text-slate-500 mt-1">Select bolt diameter and length</p>
                        </div>
                    )}
                </div>
            )}

            {/* ════════════════════════════════════════════ */}
            {/* TAB 3: 가스켓 검색                          */}
            {/* ════════════════════════════════════════════ */}
            {activeTab === 'gasket' && (
                <div className="flex flex-col gap-3 flex-1">
                    <div className="bg-slate-900/50 rounded-2xl p-4 shadow-xl border border-slate-800">
                        <div className="flex flex-col gap-3">
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">가스켓 사이즈 (inch)</label>
                                <select value={gasketSize} onChange={e => handleGasketSizeChange(e.target.value)}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-cyan-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer">
                                    <option value="">사이즈 선택...</option>
                                    {FLANGE_SIZES.map(s => <option key={s} value={s}>{s}"</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs text-slate-400 font-bold mb-1">레이팅 (lb)</label>
                                <select value={gasketRating} onChange={e => setGasketRating(e.target.value)} disabled={!gasketSize}
                                    className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-green-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
                                    <option value="">레이팅 선택...</option>
                                    {gasketRatings.map(r => <option key={r} value={r}>{r}#</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    {gasketResult ? (
                        <button onClick={() => copyToClipboard(gasketResult)}
                            className="bg-slate-900/50 rounded-2xl p-6 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all active:scale-95 text-center">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">GASKET CODE</p>
                            <p className="text-3xl font-mono font-black text-orange-400">{gasketResult}</p>
                            <p className="text-sm text-slate-500 font-mono mt-2">{gasketSize}" / {gasketRating}#</p>
                            <p className="text-[10px] text-slate-600 mt-3">탭하여 복사</p>
                        </button>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                            <Search className="w-16 h-16 mb-4 opacity-30" />
                            <p className="text-sm font-bold">사이즈와 레이팅을 선택하세요</p>
                            <p className="text-xs text-slate-500 mt-1">Select gasket size and rating</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
