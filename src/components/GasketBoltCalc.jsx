import React, { useState, useMemo } from 'react';
import { Search, Wrench, Package, Hash, CircleDot, Cog } from 'lucide-react';

// GASKET_DATA - Flange size → Rating → bolt/gasket info
const GASKET_DATA = {
    "1/2": {
        "150": { "boltQty": "4", "boltSize": "1/2 * 65", "gasketCode": "PGA00920", "boltNutCode": "PBN00266", "toolSize": "22" },
        "300": { "boltQty": "4", "boltSize": "1/2 * 70", "gasketCode": "PGA00938", "boltNutCode": "PBN00267", "toolSize": "22" },
        "600": { "boltQty": "4", "boltSize": "1/2 * 85", "gasketCode": "PGA00956", "boltNutCode": "PBN00270", "toolSize": "22" },
        "1500": { "boltQty": "4", "boltSize": "3/4 * 115", "gasketCode": "PGA01005", "boltNutCode": "PBN00319", "toolSize": "32" },
        "2500": { "boltQty": "4", "boltSize": "3/4 * 130", "gasketCode": "PGA01026", "boltNutCode": "PBN00322", "toolSize": "32" }
    },
    "3/4": {
        "150": { "boltQty": "4", "boltSize": "1/2 * 65", "gasketCode": "PGA00881", "boltNutCode": "PBN00266", "toolSize": "22" },
        "300": { "boltQty": "4", "boltSize": "5/8 * 75", "gasketCode": "PGA00894", "boltNutCode": "PBN00405", "toolSize": "27" },
        "600": { "boltQty": "4", "boltSize": "5/8 * 90", "gasketCode": "PGA00957", "boltNutCode": "PBN00408", "toolSize": "27" },
        "1500": { "boltQty": "4", "boltSize": "3/4 * 115", "gasketCode": "PGA01006", "boltNutCode": "PBN00319", "toolSize": "32" },
        "2500": { "boltQty": "4", "boltSize": "3/4 * 130", "gasketCode": "PGA01027", "boltNutCode": "PBN00322", "toolSize": "32" }
    },
    "1": {
        "150": { "boltQty": "4", "boltSize": "1/2 * 70", "gasketCode": "PGA00921", "boltNutCode": "PBN00267", "toolSize": "22" },
        "300": { "boltQty": "4", "boltSize": "5/8 * 85", "gasketCode": "PGA00895", "boltNutCode": "PBN00407", "toolSize": "27" },
        "600": { "boltQty": "4", "boltSize": "5/8 * 95", "gasketCode": "PGA00958", "boltNutCode": "PBN00409", "toolSize": "27" },
        "1500": { "boltQty": "4", "boltSize": "7/8 * 130", "gasketCode": "PGA01007", "boltNutCode": "PBN00415", "toolSize": "36" },
        "2500": { "boltQty": "4", "boltSize": "7/8 * 140", "gasketCode": "PGA01028", "boltNutCode": "PBN00417", "toolSize": "36" }
    },
    "1 1/2": {
        "150": { "boltQty": "4", "boltSize": "1/2 * 75", "gasketCode": "PGA00882", "boltNutCode": "PBN00268", "toolSize": "22" },
        "300": { "boltQty": "4", "boltSize": "3/4 * 95", "gasketCode": "PGA00896", "boltNutCode": "PBN00370", "toolSize": "32" },
        "600": { "boltQty": "4", "boltSize": "3/4 * 115", "gasketCode": "PGA00959", "boltNutCode": "PBN00319", "toolSize": "32" },
        "1500": { "boltQty": "4", "boltSize": "1 1/8 * 155", "gasketCode": "PGA01008", "boltNutCode": "PBN00277", "toolSize": "46" },
        "2500": { "boltQty": "4", "boltSize": "1 1/8 * 175", "gasketCode": "PGA01029", "boltNutCode": "PBN00281", "toolSize": "46" }
    },
    "2": {
        "150": { "boltQty": "4", "boltSize": "5/8 * 85", "gasketCode": "PGA00922", "boltNutCode": "PBN00407", "toolSize": "27" },
        "300": { "boltQty": "8", "boltSize": "5/8 * 95", "gasketCode": "PGA00897", "boltNutCode": "PBN00409", "toolSize": "27" },
        "600": { "boltQty": "8", "boltSize": "5/8 * 110", "gasketCode": "PGA00960", "boltNutCode": "PBN00411", "toolSize": "27" },
        "1500": { "boltQty": "8", "boltSize": "1 * 165", "gasketCode": "PGA01009", "boltNutCode": "PBN00196", "toolSize": "41" },
        "2500": { "boltQty": "8", "boltSize": "1 * 185", "gasketCode": "PGA01030", "boltNutCode": "PBN00198", "toolSize": "41" }
    },
    "2 1/2": {
        "150": { "boltQty": "4", "boltSize": "5/8 * 90", "gasketCode": "PGA00923", "boltNutCode": "PBN00408", "toolSize": "27" },
        "300": { "boltQty": "8", "boltSize": "3/4 * 110", "gasketCode": "PGA00898", "boltNutCode": "PBN00318", "toolSize": "32" },
        "600": { "boltQty": "8", "boltSize": "3/4 * 125", "gasketCode": "PGA00961", "boltNutCode": "PBN00321", "toolSize": "32" },
        "1500": { "boltQty": "8", "boltSize": "1 1/8 * 185", "gasketCode": "PGA01010", "boltNutCode": "PBN00281", "toolSize": "46" },
        "2500": { "boltQty": "8", "boltSize": "1 1/8 * 205", "gasketCode": "PGA01031", "boltNutCode": "PBN00282", "toolSize": "46" }
    },
    "3": {
        "150": { "boltQty": "4", "boltSize": "5/8 * 90", "gasketCode": "PGA00883", "boltNutCode": "PBN00408", "toolSize": "27" },
        "300": { "boltQty": "8", "boltSize": "3/4 * 110", "gasketCode": "PGA00898", "boltNutCode": "PBN00318", "toolSize": "32" },
        "600": { "boltQty": "8", "boltSize": "3/4 * 130", "gasketCode": "PGA00961", "boltNutCode": "PBN00322", "toolSize": "32" },
        "1500": { "boltQty": "8", "boltSize": "1 1/4 * 205", "gasketCode": "PGA01011", "boltNutCode": "PBN00636", "toolSize": "50" },
        "2500": { "boltQty": "8", "boltSize": "1 1/4 * 235", "gasketCode": "PGA01032", "boltNutCode": "PBN00642", "toolSize": "50" }
    },
    "4": {
        "150": { "boltQty": "8", "boltSize": "5/8 * 90", "gasketCode": "PGA00923", "boltNutCode": "PBN00408", "toolSize": "27" },
        "300": { "boltQty": "8", "boltSize": "3/4 * 120", "gasketCode": "PGA00899", "boltNutCode": "PBN00321", "toolSize": "32" },
        "600": { "boltQty": "8", "boltSize": "7/8 * 155", "gasketCode": "PGA00962", "boltNutCode": "PBN00419", "toolSize": "36" },
        "1500": { "boltQty": "8", "boltSize": "1 1/2 * 255", "gasketCode": "PGA01012", "boltNutCode": "PBN00595", "toolSize": "60" },
        "2500": { "boltQty": "8", "boltSize": "1 1/2 * 285", "gasketCode": "PGA01033", "boltNutCode": "PBN00600", "toolSize": "60" }
    },
    "6": {
        "150": { "boltQty": "8", "boltSize": "3/4 * 105", "gasketCode": "PGA00884", "boltNutCode": "PBN00317", "toolSize": "32" },
        "300": { "boltQty": "12", "boltSize": "3/4 * 125", "gasketCode": "PGA00900", "boltNutCode": "PBN00321", "toolSize": "32" },
        "600": { "boltQty": "12", "boltSize": "1 * 180", "gasketCode": "PGA00963", "boltNutCode": "PBN00201", "toolSize": "41" },
        "1500": { "boltQty": "12", "boltSize": "1 3/8 * 305", "gasketCode": "PGA01014", "boltNutCode": "PBN00778", "toolSize": "55" },
        "2500": { "boltQty": "12", "boltSize": "2 * 415", "gasketCode": "PGA01035", "boltNutCode": "PBN00286", "toolSize": "80" }
    },
    "8": {
        "150": { "boltQty": "8", "boltSize": "3/4 * 115", "gasketCode": "PGA00885", "boltNutCode": "PBN00319", "toolSize": "32" },
        "300": { "boltQty": "12", "boltSize": "7/8 * 145", "gasketCode": "PGA00901", "boltNutCode": "PBN00418", "toolSize": "36" },
        "600": { "boltQty": "12", "boltSize": "1 1/8 * 220", "gasketCode": "PGA00964", "boltNutCode": "PBN00281", "toolSize": "46" },
        "1500": { "boltQty": "12", "boltSize": "1 5/8 * 365", "gasketCode": "PGA01015", "boltNutCode": "PBN00642", "toolSize": "50" },
        "2500": { "boltQty": "12", "boltSize": "2 1/2 * 535", "gasketCode": "PGA01036", "boltNutCode": "PBN00595", "toolSize": "60" }
    },
    "10": {
        "150": { "boltQty": "12", "boltSize": "7/8 * 125", "gasketCode": "PGA00886", "boltNutCode": "PBN00414", "toolSize": "36" },
        "300": { "boltQty": "16", "boltSize": "1 * 165", "gasketCode": "PGA00902", "boltNutCode": "PBN00196", "toolSize": "41" },
        "600": { "boltQty": "16", "boltSize": "1 1/4 * 255", "gasketCode": "PGA00965", "boltNutCode": "PBN00642", "toolSize": "50" },
        "1500": { "boltQty": "12", "boltSize": "1 7/8 * 415", "gasketCode": "PGA01016", "boltNutCode": "PBN00642", "toolSize": "50" },
        "2500": { "boltQty": "12", "boltSize": "2 3/4 * 615", "gasketCode": "PGA01037", "boltNutCode": "PBN00852", "toolSize": "4.25" }
    },
    "12": {
        "150": { "boltQty": "12", "boltSize": "7/8 * 135", "gasketCode": "PGA00887", "boltNutCode": "PBN00415", "toolSize": "36" },
        "300": { "boltQty": "16", "boltSize": "1 1/8 * 180", "gasketCode": "PGA00890", "boltNutCode": "PBN00282", "toolSize": "46" },
        "600": { "boltQty": "20", "boltSize": "1 1/4 * 275", "gasketCode": "PGA00953", "boltNutCode": "PBN00642", "toolSize": "50" },
        "1500": { "boltQty": "16", "boltSize": "2 * 405", "gasketCode": "PGA01017", "boltNutCode": "PBN00284", "toolSize": "80" },
        "2500": { "boltQty": "12", "boltSize": "2 3/4 * 405", "gasketCode": "PGA01038", "boltNutCode": "PBN00852", "toolSize": "4.25" }
    },
    "14": {
        "150": { "boltQty": "12", "boltSize": "1 * 135", "gasketCode": "PGA00924", "boltNutCode": "PBN00191", "toolSize": "41" },
        "300": { "boltQty": "20", "boltSize": "1 1/8 * 180", "gasketCode": "PGA00903", "boltNutCode": "PBN00708", "toolSize": "46" },
        "600": { "boltQty": "20", "boltSize": "1 3/8 * 245", "gasketCode": "PGA00966", "boltNutCode": "PBN00772", "toolSize": "55" },
        "1500": { "boltQty": "16", "boltSize": "2 1/4 * 440", "gasketCode": "PGA00992", "boltNutCode": "PBN00850", "toolSize": "3.5" }
    },
    "16": {
        "150": { "boltQty": "16", "boltSize": "1 * 140", "gasketCode": "PGA00925", "boltNutCode": "PBN00192", "toolSize": "41" },
        "300": { "boltQty": "20", "boltSize": "1 1/4 * 190", "gasketCode": "PGA00942", "boltNutCode": "PBN00634", "toolSize": "50" },
        "600": { "boltQty": "20", "boltSize": "1 1/2 * 265", "gasketCode": "PGA00551", "boltNutCode": "PBN00597", "toolSize": "60" },
        "1500": { "boltQty": "16", "boltSize": "2 1/2 * 485", "gasketCode": "PGA01018", "boltNutCode": "PBN00853", "toolSize": "3.88" }
    },
    "18": {
        "150": { "boltQty": "16", "boltSize": "1 1/8 * 155", "gasketCode": "PGA00888", "boltNutCode": "PBN00277", "toolSize": "46" },
        "300": { "boltQty": "24", "boltSize": "1 1/4 * 205", "gasketCode": "PGA00904", "boltNutCode": "PBN00636", "toolSize": "50" },
        "600": { "boltQty": "24", "boltSize": "1 5/8 * 290", "gasketCode": "PGA00967", "boltNutCode": "PBN00812", "toolSize": "2.5" },
        "1500": { "boltQty": "16", "boltSize": "2 3/4 * 555", "gasketCode": "PGA01019", "boltNutCode": "PBN00852", "toolSize": "4.25" }
    },
    "20": {
        "150": { "boltQty": "20", "boltSize": "1 1/8 * 165", "gasketCode": "PGA00926", "boltNutCode": "PBN00279", "toolSize": "46" },
        "300": { "boltQty": "24", "boltSize": "1 1/4 * 220", "gasketCode": "PGA00905", "boltNutCode": "PBN00639", "toolSize": "50" },
        "600": { "boltQty": "24", "boltSize": "1 5/8 * 320", "gasketCode": "PGA00968", "boltNutCode": "PBN00815", "toolSize": "2.5" },
        "1500": { "boltQty": "16", "boltSize": "3 * 610", "gasketCode": "PGA01020", "boltNutCode": "PBN00854", "toolSize": "4.62" }
    },
    "22": {
        "150": { "boltQty": "20", "boltSize": "1 1/4 * 180", "gasketCode": "PGA00926", "boltNutCode": "PBN00633", "toolSize": "50" },
        "300": { "boltQty": "24", "boltSize": "1 1/2 * 235", "gasketCode": "PGA00905", "boltNutCode": "PBN00591", "toolSize": "60" },
        "600": { "boltQty": "24", "boltSize": "1 7/8 * 350", "gasketCode": "PGA00910", "boltNutCode": "PBN00830", "toolSize": "75" },
        "1500": { "boltQty": "16", "boltSize": "3 1/2 * 665", "gasketCode": "PGA01022", "boltNutCode": "PBN01009", "toolSize": "5.375" }
    },
    "24": {
        "150": { "boltQty": "20", "boltSize": "1 1/4 * 185", "gasketCode": "PGA00889", "boltNutCode": "PBN00633", "toolSize": "50" },
        "300": { "boltQty": "24", "boltSize": "1 1/2 * 255", "gasketCode": "PGA00906", "boltNutCode": "PBN00595", "toolSize": "60" },
        "600": { "boltQty": "24", "boltSize": "1 7/8 * 370", "gasketCode": "PGA00969", "boltNutCode": "PBN00827", "toolSize": "2.88" },
        "1500": { "boltQty": "16", "boltSize": "3 1/2 * 715", "gasketCode": "PGA01022", "boltNutCode": "PBN00855", "toolSize": "5.38" }
    },
    "26": {
        "150": { "boltQty": "24", "boltSize": "1 1/4 * 190", "gasketCode": "PGA00927", "boltNutCode": "PBN00634", "toolSize": "50" },
        "300": { "boltQty": "28", "boltSize": "1 5/8 * 255", "gasketCode": "PGA00945", "boltNutCode": "PBN00795", "toolSize": "65" },
        "600": { "boltQty": "28", "boltSize": "1 7/8 * 365", "gasketCode": "PGA00970", "boltNutCode": "PBN01347", "toolSize": "75" }
    },
    "30": {
        "150": { "boltQty": "28", "boltSize": "1 1/4 * 195", "gasketCode": "PGA00929", "boltNutCode": "PBN00635", "toolSize": "50" },
        "300": { "boltQty": "28", "boltSize": "1 3/4 * 285", "gasketCode": "PGA00906", "boltNutCode": "PBN01100", "toolSize": "70" },
        "600": { "boltQty": "28", "boltSize": "2 * 380", "gasketCode": "PGA00972", "boltNutCode": "PBN00280", "toolSize": "80" }
    },
    "34": {
        "150": { "boltQty": "32", "boltSize": "1 1/2 * 215", "gasketCode": "PGA00931", "boltNutCode": "PBN01230", "toolSize": "60" },
        "300": { "boltQty": "28", "boltSize": "1 7/8 * 315", "gasketCode": "PGA00948", "boltNutCode": "PBN00826", "toolSize": "75" },
        "600": { "boltQty": "28", "boltSize": "2 1/4 * 410", "gasketCode": "PGA00974", "boltNutCode": "PBN00850", "toolSize": "3.5" }
    }
};

// Flange sizes in order
const FLANGE_SIZES = Object.keys(GASKET_DATA);

export default function GasketBoltCalc() {
    const [flangeSize, setFlangeSize] = useState('');
    const [rating, setRating] = useState('');

    // Get available ratings for selected flange size
    const availableRatings = useMemo(() => {
        if (!flangeSize || !GASKET_DATA[flangeSize]) return [];
        return Object.keys(GASKET_DATA[flangeSize]);
    }, [flangeSize]);

    // Get result data
    const result = useMemo(() => {
        if (!flangeSize || !rating) return null;
        return GASKET_DATA[flangeSize]?.[rating] || null;
    }, [flangeSize, rating]);

    // Handle flange size change
    const handleFlangeSizeChange = (newSize) => {
        setFlangeSize(newSize);
        setRating(''); // Reset rating when size changes
    };

    // Format bolt size: "1 * 180" → "1″ × 180mm"
    const formatBoltSize = (rawSize) => {
        if (!rawSize) return '';
        const parts = rawSize.split(' * ');
        if (parts.length === 2) {
            return {
                diameter: parts[0].trim(),
                length: parts[1].trim()
            };
        }
        return { diameter: rawSize, length: '' };
    };

    // Format tool size with appropriate unit
    // > 10 → mm (standard), ≤ 10 → inch (large flange special tools)
    const formatToolSize = (rawSize) => {
        if (!rawSize) return { value: '', unit: '' };
        const numValue = parseFloat(rawSize);
        if (numValue > 10) {
            return { value: rawSize, unit: 'mm' };
        } else {
            return { value: rawSize, unit: 'inch' };
        }
    };

    return (
        <div className="flex flex-col gap-4 h-full">
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

            {/* Input Section */}
            <div className="bg-slate-900/50 rounded-2xl p-4 shadow-xl border border-slate-800">
                <div className="flex flex-col gap-3">
                    {/* Flange Size */}
                    <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">플랜지 사이즈 (inch)</label>
                        <select
                            value={flangeSize}
                            onChange={e => handleFlangeSizeChange(e.target.value)}
                            className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-cyan-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer"
                        >
                            <option value="">사이즈 선택...</option>
                            {FLANGE_SIZES.map(size => (
                                <option key={size} value={size}>{size}"</option>
                            ))}
                        </select>
                    </div>

                    {/* Rating - Only show if flange size is selected */}
                    <div>
                        <label className="block text-xs text-slate-400 font-bold mb-1">레이팅 (lb)</label>
                        <select
                            value={rating}
                            onChange={e => setRating(e.target.value)}
                            disabled={!flangeSize}
                            className="w-full h-12 bg-black rounded-xl px-3 font-mono text-base font-bold text-green-400 border border-slate-700 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/30 outline-none transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <option value="">레이팅 선택...</option>
                            {availableRatings.map(r => (
                                <option key={r} value={r}>{r}#</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Section - New Hierarchy Layout */}
            {result ? (
                <div className="flex-1 flex flex-col gap-3 overflow-y-auto">
                    {/* === ROW 1: MATERIAL CODES (Top) === */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* GASKET CODE */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(result.gasketCode);
                                if (navigator.vibrate) navigator.vibrate(30);
                            }}
                            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all active:scale-95 text-left"
                        >
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">GASKET CODE</p>
                            <p className="text-xl font-mono font-bold text-orange-400">
                                {result.gasketCode}
                            </p>
                            <p className="text-[9px] text-slate-600 mt-1">탭하여 복사</p>
                        </button>

                        {/* BOLT/NUT CODE */}
                        <button
                            onClick={() => {
                                navigator.clipboard.writeText(result.boltNutCode);
                                if (navigator.vibrate) navigator.vibrate(30);
                            }}
                            className="bg-slate-900/50 rounded-xl p-4 border border-slate-800 hover:border-orange-500/50 hover:bg-slate-800/50 transition-all active:scale-95 text-left"
                        >
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BOLT/NUT CODE</p>
                            <p className="text-xl font-mono font-bold text-orange-400">
                                {result.boltNutCode}
                            </p>
                            <p className="text-[9px] text-slate-600 mt-1">탭하여 복사</p>
                        </button>
                    </div>

                    {/* === ROW 2: BOLT DETAILS (Middle) === */}
                    <div className="grid grid-cols-2 gap-3">
                        {/* BOLT QTY */}
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BOLT QTY</p>
                            <p className="text-2xl font-bold text-cyan-400">
                                {result.boltQty}<span className="text-base text-slate-500 ml-1">EA</span>
                            </p>
                        </div>

                        {/* BOLT SPEC */}
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-800">
                            <p className="text-xs text-slate-500 uppercase tracking-wider mb-1">BOLT SPEC</p>
                            <p className="text-lg font-bold font-mono text-cyan-400">
                                <span>{formatBoltSize(result.boltSize).diameter}</span>
                                <span className="text-slate-500 text-xs ml-1">inch</span>
                                <span className="text-slate-600 mx-1">×</span>
                                <span>{formatBoltSize(result.boltSize).length}</span>
                                <span className="text-slate-500 text-xs ml-1">mm</span>
                            </p>
                        </div>
                    </div>

                    {/* === ROW 3: TOOL SIZE (Bottom Bar) === */}
                    <div className="bg-slate-800/50 rounded-xl py-2 px-4 border border-slate-800 text-center">
                        <span className="text-sm text-slate-500">TOOL SIZE: </span>
                        <span className="text-sm font-bold text-cyan-400 font-mono">
                            {formatToolSize(result.toolSize).value}
                        </span>
                        <span className={`text-sm ml-1 ${formatToolSize(result.toolSize).unit === 'inch' ? 'text-orange-400' : 'text-slate-400'}`}>
                            {formatToolSize(result.toolSize).unit}
                        </span>
                        {formatToolSize(result.toolSize).unit === 'inch' && (
                            <span className="text-orange-400 text-xs ml-2">(특수)</span>
                        )}
                    </div>
                </div>
            ) : (
                /* Empty State */
                <div className="flex-1 flex flex-col items-center justify-center text-slate-600">
                    <Search className="w-16 h-16 mb-4 opacity-30" />
                    <p className="text-sm font-bold">사이즈와 레이팅을 선택하세요</p>
                    <p className="text-xs text-slate-500 mt-1">Select flange size and rating</p>
                </div>
            )}
        </div>
    );
}
