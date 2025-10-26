// https://ref.gs1.org/standards/genspecs/
export const FNC1 = '\x1D';

export type GS1Element = {
    ai: string;
    title: string;
    rawValue: string;
    data?: any;
};
export type GS1Definition = {
    title: string;
    fixed?: number;
    min?: number;
    max?: number;
    fnc1?: true;
    parser?: (data: GS1Element) => any;
};

type ParseFormat = { [key: string]: number | string };
type DateFormat = { [key in "year" | "month" | "day"]: number; }
    & { [key in "hour" | "minute" | "second"]?: number; };

const dateParserFactory = (format: DateFormat) => {
    return function dateParser(data: GS1Element) {
        try {
            const result: DateFormat = {
                year: 0,
                month: 0,
                day: 0
            };
            let ix = 0;
            for (const key in format) {
                const tkey = key as keyof DateFormat;
                const length = format[tkey];
                if (typeof length !== "number") {
                    continue;
                }

                result[tkey] = parseInt(data.rawValue.substring(ix, ix + length) || '0');
                switch (tkey) {
                    case "year": {
                        if (length < 4) {
                            // section 7.12
                            const currentYear = new Date().getFullYear();
                            const current2DigitYear = currentYear % 100;
                            const currentCentury = currentYear - current2DigitYear;
                            const yearGap = result.year - current2DigitYear;
                            result.year += currentCentury + (yearGap > 50 ? -100 : yearGap <= -50 ? -100 : 0);
                        }
                        break;
                    }
                    case "month": {
                        result[tkey] -= 1;
                        break;
                    }
                    case "day": {
                        if (result.day === 0) {
                            result.month += 1;
                        }
                        break;
                    }
                }
                ix += length;
            }

            return {
                value: new Date(result.year, result.month, result.day, result.hour ?? 0, result.minute ?? 0, result.second ?? 0)
            };
        }
        catch { }
    };
};
const floatParserFactory = (format?: ParseFormat) => {
    return function floatParser(data: GS1Element) {
        try {
            const decimal = parseInt(data.ai[data.ai.length - 1]);
            let ix = 0;
            const result = {} as any;
            if (format) {
                for (const key in format) {
                    const formatValue = format[key];
                    switch (typeof formatValue) {
                        case "string": {
                            result[key] = formatValue;
                            break;
                        }
                        case "number": {
                            result[key] = data.rawValue.substring(ix, ix + formatValue);
                            ix += formatValue;
                            break;
                        }
                    }
                }
            }

            result.value = parseFloat(`${data.rawValue.substring(ix, data.rawValue.length - decimal)}.${data.rawValue.substring(data.rawValue.length - decimal)}`);
            return result;
        }
        catch { }
    };
};
const intParserFactory = (format?: ParseFormat) => {
    return function intParser(data: GS1Element) {
        try {
            let ix = 0;
            const result = {} as any;
            if (format) {
                for (const key in format) {
                    const formatValue = format[key];
                    switch (typeof formatValue) {
                        case "string": {
                            result[key] = formatValue;
                            break;
                        }
                        case "number": {
                            result[key] = data.rawValue.substring(ix, ix + formatValue);
                            ix += formatValue;
                            break;
                        }
                    }
                }
            }

            result.value = parseInt(data.rawValue.substring(ix));
            return result;
        }
        catch { }
    };
};
const stringParserFactory = (format?: ParseFormat) => {
    return function stringParser(data: GS1Element) {
        try {
            let ix = 0;
            const result = {} as any;
            if (format) {
                for (const key in format) {
                    const formatValue = format[key];
                    switch (typeof formatValue) {
                        case "string": {
                            result[key] = formatValue;
                            break;
                        }
                        case "number": {
                            result[key] = data.rawValue.substring(ix, ix + formatValue);
                            ix += formatValue;
                            break;
                        }
                    }
                }
            }

            const value = data.rawValue.substring(ix);
            if (value) {
                result.value = value;
            }
            return result;
        }
        catch { }
    };
};
const sequenceParserFactory = (format?: ParseFormat) => {
    return function sequenceParser(data: GS1Element) {
        try {
            const sequence = parseInt(data.ai[data.ai.length - 1]);
            data.title += sequence;

            const result = {
                sequence: sequence
            } as any;

            let ix = 0;
            if (format) {
                for (const key in format) {
                    const formatValue = format[key];
                    switch (typeof formatValue) {
                        case "string": {
                            result[key] = formatValue;
                            break;
                        }
                        case "number": {
                            result[key] = data.rawValue.substring(ix, ix + formatValue);
                            ix += formatValue;
                            break;
                        }
                    }
                }
            }

            const value = data.rawValue.substring(ix);
            if (value) {
                result.value = value;
            }

            return result;
        }
        catch { }
    };
};
const temperatureParserFactory = (format?: ParseFormat) => {
    return function temperatureParser(data: GS1Element) {
        try {
            const result = {} as any;
            let ix = 0;
            if (format) {
                for (const key in format) {
                    const formatValue = format[key];
                    switch (typeof formatValue) {
                        case "string": {
                            result[key] = formatValue;
                            break;
                        }
                        case "number": {
                            result[key] = data.rawValue.substring(ix, ix + formatValue);
                            ix += formatValue;
                            break;
                        }
                    }
                }
            }

            const isNegative = data.rawValue[data.rawValue.length - 1] === "-";
            result.value = parseInt(data.rawValue.substring(ix, data.rawValue.length - +isNegative)) * (isNegative ? -1 : 1) / 100;
            return result;
        }
        catch { }
    };
};

const dateRangeParser = (data: GS1Element) => {
    try {
        const dateParser = dateParserFactory({ year: 2, month: 2, day: 2 });
        const start = dateParser({
            ai: data.ai,
            title: data.title,
            rawValue: data.rawValue
        })?.value;

        let end: Date | undefined = undefined;
        if (data.rawValue.length > 6) {
            end = dateParser({
                ai: data.ai,
                title: data.title,
                rawValue: data.rawValue.substring(6)
            })?.value;
        }

        return {
            start: start,
            end: end
        };
    }
    catch { }
};
const geoParser = (data: GS1Element) => {
    try {
        // section 7.14
        const x = parseInt(data.rawValue.substring(0, 10));
        const y = parseInt(data.rawValue.substring(10, 20));

        return {
            long: (x / 10_000_000) - 90,
            lat: (((y / 10_000_000) + 180) % 360) - 180
        };
    }
    catch { }
};
const boolParser = (data: GS1Element) => {
    try {
        return {
            value: data.rawValue[0] === "1"
        };
    }
    catch { }
};
const gtinParser = (data: GS1Element) => {
    try {
        return {
            value: data.rawValue.padStart(14, '0')
        };
    }
    catch { }
};

export const GS1DefinitionMap: Record<string, GS1Definition> = {
    "00": {
        title: "SSCC",
        fixed: 18
    },
    "01": {
        title: "GTIN",
        fixed: 14,
        parser: gtinParser
    },
    "02": {
        title: "CONTENT",
        fixed: 14,
        parser: gtinParser
    },
    "10": {
        title: "BATCH/LOT",
        max: 20,
        fnc1: true
    },
    "11": {
        title: "PROD DATE",
        fixed: 6,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "12": {
        title: "DUE DATE",
        fixed: 6,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "13": {
        title: "PACK DATE",
        fixed: 6,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "15": {
        title: "BEST BEFORE or BEST BY",
        fixed: 6,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "16": {
        title: "SELL BY",
        fixed: 6,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "17": {
        title: "USE BY OR EXPIRY",
        fixed: 6,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "20": {
        title: "VARIANT",
        fixed: 2
    },
    "21": {
        title: "SERIAL",
        max: 20,
        fnc1: true
    },
    "22": {
        title: "CPV",
        max: 20,
        fnc1: true
    },
    "235": {
        title: "TPX",
        max: 28,
        fnc1: true
    },
    "240": {
        title: "ADDITIONAL ID",
        max: 30,
        fnc1: true
    },
    "241": {
        title: "CUST. PART NO.",
        max: 30,
        fnc1: true
    },
    "242": {
        title: "MTO VARIANT",
        max: 6,
        fnc1: true
    },
    "243": {
        title: "PCN",
        max: 20,
        fnc1: true
    },
    "250": {
        title: "SECONDARY SERIAL",
        max: 30,
        fnc1: true
    },
    "251": {
        title: "REF. TO SOURCE",
        max: 30,
        fnc1: true
    },
    "253": {
        title: "GDTI",
        min: 13,
        max: 30,
        fnc1: true,
        parser: stringParserFactory({ base: 13, serial: 17 })
    },
    "254": {
        title: "GLN EXTENSION COMPONENT",
        max: 20,
        fnc1: true
    },
    "255": {
        title: "GCN",
        min: 13,
        max: 25,
        fnc1: true,
        parser: stringParserFactory({ base: 13, serial: 12 })
    },
    "30": {
        title: "VAR. COUNT",
        max: 8,
        fnc1: true
    },
    "310": {
        title: "NET WEIGHT (kg)",
        fixed: 6,
        parser: floatParserFactory({ unit: "kg" })
    },
    "311": {
        title: "LENGTH (m)",
        fixed: 6,
        parser: floatParserFactory({ unit: "m" })
    },
    "312": {
        title: "WIDTH (m)",
        fixed: 6,
        parser: floatParserFactory({ unit: "m" })
    },
    "313": {
        title: "HEIGHT (m)",
        fixed: 6,
        parser: floatParserFactory({ unit: "m" })
    },
    "314": {
        title: "AREA (m2)",
        fixed: 6,
        parser: floatParserFactory({ unit: "m2" })
    },
    "315": {
        title: "NET VOLUME (l)",
        fixed: 6,
        parser: floatParserFactory({ unit: "l" })
    },
    "316": {
        title: "NET VOLUME (m3)",
        fixed: 6,
        parser: floatParserFactory({ unit: "m3" })
    },
    "320": {
        title: "NET WEIGHT (lb)",
        fixed: 6,
        parser: floatParserFactory({ unit: "lb" })
    },
    "321": {
        title: "LENGTH (in)",
        fixed: 6,
        parser: floatParserFactory({ unit: "in" })
    },
    "322": {
        title: "LENGTH (ft)",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft" })
    },
    "323": {
        title: "LENGTH (yd)",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd" })
    },
    "324": {
        title: "WIDTH (in)",
        fixed: 6,
        parser: floatParserFactory({ unit: "in" })
    },
    "325": {
        title: "WIDTH (ft)",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft" })
    },
    "326": {
        title: "WIDTH (yd)",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd" })
    },
    "327": {
        title: "HEIGHT (in)",
        fixed: 6,
        parser: floatParserFactory({ unit: "in" })
    },
    "328": {
        title: "HEIGHT (ft)",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft" })
    },
    "329": {
        title: "HEIGHT (yd)",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd" })
    },
    "330": {
        title: "GROSS WEIGHT (kg)",
        fixed: 6,
        parser: floatParserFactory({ unit: "kg" })
    },
    "331": {
        title: "LENGTH (m), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "m" })
    },
    "332": {
        title: "WIDTH (m), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "m" })
    },
    "333": {
        title: "HEIGHT (m), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "m" })
    },
    "334": {
        title: "AREA (m2), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "m2" })
    },
    "335": {
        title: "VOLUME (l), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "l" })
    },
    "336": {
        title: "VOLUME (m3), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "m3" })
    },
    "337": {
        title: "KG PER m2",
        fixed: 6,
        parser: floatParserFactory({ unit: "m2" })
    },
    "340": {
        title: "GROSS WEIGHT (lb)",
        fixed: 6,
        parser: floatParserFactory({ unit: "lb" })
    },
    "341": {
        title: "LENGTH (in), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "in" })
    },
    "342": {
        title: "LENGTH (ft), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft" })
    },
    "343": {
        title: "LENGTH (yd), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd" })
    },
    "344": {
        title: "WIDTH (in), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "in" })
    },
    "345": {
        title: "WIDTH (ft), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft" })
    },
    "346": {
        title: "WIDTH (yd), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd" })
    },
    "347": {
        title: "HEIGHT (in), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "in" })
    },
    "348": {
        title: "HEIGHT (ft), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft" })
    },
    "349": {
        title: "HEIGHT (yd), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd" })
    },
    "350": {
        title: "AREA (in2)",
        fixed: 6,
        parser: floatParserFactory({ unit: "in2" })
    },
    "351": {
        title: "AREA (ft2)",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft2" })
    },
    "352": {
        title: "AREA (yd2)",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd2" })
    },
    "353": {
        title: "AREA (in2), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "in2" })
    },
    "354": {
        title: "AREA (ft2), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft2" })
    },
    "355": {
        title: "AREA (yd2), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd2" })
    },
    "356": {
        title: "NET WEIGHT (ozt)",
        fixed: 6,
        parser: floatParserFactory({ unit: "ozt" })
    },
    "357": {
        title: "NET VOLUME (oz)",
        fixed: 6,
        parser: floatParserFactory({ unit: "oz" })
    },
    "360": {
        title: "NET VOLUME (qt)",
        fixed: 6,
        parser: floatParserFactory({ unit: "qt" })
    },
    "361": {
        title: "NET VOLUME (gal)",
        fixed: 6,
        parser: floatParserFactory({ unit: "gal" })
    },
    "362": {
        title: "VOLUME (qt), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "qt" })
    },
    "363": {
        title: "VOLUME (gal.), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "gal" })
    },
    "364": {
        title: "VOLUME (in3) ",
        fixed: 6,
        parser: floatParserFactory({ unit: "in3" })
    },
    "365": {
        title: "VOLUME (ft3) ",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft3" })
    },
    "366": {
        title: "VOLUME (yd3) ",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd3" })
    },
    "367": {
        title: "VOLUME (in3), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "in3" })
    },
    "368": {
        title: "VOLUME (ft3), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "ft3" })
    },
    "369": {
        title: "VOLUME (yd3), log",
        fixed: 6,
        parser: floatParserFactory({ unit: "yd3" })
    },
    "37": {
        title: "COUNT",
        max: 8,
        fnc1: true,
        parser: intParserFactory()
    },
    "390": {
        title: "AMOUNT",
        max: 15,
        fnc1: true,
        parser: floatParserFactory()
    },
    "391": {
        title: "AMOUNT",
        min: 3,
        max: 15,
        fnc1: true,
        parser: floatParserFactory({ currency: 3 })
    },
    "392": {
        title: "PRICE",
        max: 15,
        fnc1: true,
        parser: floatParserFactory()
    },
    "393": {
        title: "PRICE",
        min: 3,
        max: 15,
        fnc1: true,
        parser: floatParserFactory({ currency: 3 })
    },
    "394": {
        title: "PRCNT OFF",
        fixed: 4,
        fnc1: true,
        parser: floatParserFactory()
    },
    "395": {
        title: "PRICE/UoM",
        fixed: 6,
        fnc1: true,
        parser: floatParserFactory()
    },
    "400": {
        title: "ORDER NUMBER",
        max: 30,
        fnc1: true
    },
    "401": {
        title: "GINC",
        max: 30,
        fnc1: true
    },
    "402": {
        title: "GSIN",
        fixed: 17,
        fnc1: true
    },
    "403": {
        title: "ROUTE",
        max: 30,
        fnc1: true
    },
    "410": {
        title: "SHIP TO LOC",
        fixed: 13
    },
    "411": {
        title: "BILL TO ",
        fixed: 13
    },
    "412": {
        title: "PURCHASE FROM",
        fixed: 13
    },
    "413": {
        title: "SHIP FOR LOC",
        fixed: 13
    },
    "414": {
        title: "LOC No",
        fixed: 13
    },
    "415": {
        title: "PAY TO",
        fixed: 13
    },
    "416": {
        title: "PROD/SERV LOC",
        fixed: 13
    },
    "417": {
        title: "PARTY",
        fixed: 13
    },
    "420": {
        title: "SHIP TO POST",
        max: 20,
        fnc1: true
    },
    "421": {
        title: "SHIP TO POST",
        min: 3,
        max: 12,
        fnc1: true,
        parser: stringParserFactory({ country: 3 })
    },
    "422": {
        title: "ORIGIN",
        fixed: 3,
        fnc1: true
    },
    "423": {
        title: "COUNTRY - INITIAL PROCESS.",
        min: 3,
        max: 15,
        fnc1: true,
        parser: stringParserFactory({ country: 3 })
    },
    "424": {
        title: "COUNTRY - PROCESS.",
        fixed: 3,
        fnc1: true
    },
    "425": {
        title: "COUNTRY - DISASSEMBLY",
        min: 3,
        max: 15,
        fnc1: true,
        parser: stringParserFactory({ country: 3 })
    },
    "426": {
        title: "COUNTRY - FULL PROCESS",
        fixed: 3,
        fnc1: true
    },
    "427": {
        title: "ORIGIN SUBDIVISION",
        max: 3,
        fnc1: true
    },
    "4300": {
        title: "SHIP TO COMP",
        max: 35,
        fnc1: true
    },
    "4301": {
        title: "SHIP TO NAME",
        max: 35,
        fnc1: true
    },
    "4302": {
        title: "SHIP TO ADD1",
        max: 70,
        fnc1: true
    },
    "4303": {
        title: "SHIP TO ADD2",
        max: 70,
        fnc1: true
    },
    "4304": {
        title: "SHIP TO SUB",
        max: 70,
        fnc1: true
    },
    "4305": {
        title: "SHIP TO LOC",
        max: 70,
        fnc1: true
    },
    "4306": {
        title: "SHIP TO REG",
        max: 70,
        fnc1: true
    },
    "4307": {
        title: "SHIP TO COUNTRY",
        fixed: 2,
        fnc1: true
    },
    "4308": {
        title: "SHIP TO PHONE",
        max: 30,
        fnc1: true
    },
    "4309": {
        title: "SHIP TO GEO",
        fixed: 20,
        fnc1: true,
        parser: geoParser
    },
    "4310": {
        title: "RTN TO COMP",
        max: 35,
        fnc1: true
    },
    "4311": {
        title: "RTN TO NAME",
        max: 35,
        fnc1: true
    },
    "4312": {
        title: "RTN TO ADD1",
        max: 70,
        fnc1: true
    },
    "4313": {
        title: "RTN TO ADD2",
        max: 70,
        fnc1: true
    },
    "4314": {
        title: "RTN TO SUB",
        max: 70,
        fnc1: true
    },
    "4315": {
        title: "RTN TO LOC",
        max: 70,
        fnc1: true
    },
    "4316": {
        title: "RTN TO REG",
        max: 70,
        fnc1: true
    },
    "4317": {
        title: "RTN TO COUNTRY",
        fixed: 2,
        fnc1: true
    },
    "4318": {
        title: "RTN TO PHONE",
        max: 30,
        fnc1: true
    },
    "4319": {
        title: "RTN TO GEO",
        fixed: 20,
        fnc1: true,
        parser: geoParser
    },
    "4320": {
        title: "SRV DESCRIPTION",
        max: 35,
        fnc1: true
    },
    "4321": {
        title: "DANGEROUS GOODS",
        fixed: 1,
        fnc1: true,
        parser: boolParser
    },
    "4322": {
        title: "AUTH LEAVE",
        fixed: 1,
        fnc1: true,
        parser: boolParser
    },
    "4323": {
        title: "SIG REQUIRED",
        fixed: 1,
        fnc1: true,
        parser: boolParser
    },
    "4324": {
        title: "NBEF DEL DT",
        fixed: 10,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2, hour: 2, minute: 2 })
    },
    "4325": {
        title: "NAFT DEL DT",
        fixed: 10,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2, hour: 2, minute: 2 })
    },
    "4326": {
        title: "REL DATE",
        fixed: 6,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 }),
    },
    "4330": {
        title: "MAX TEMP F",
        min: 6,
        max: 7,
        fnc1: true,
        parser: temperatureParserFactory({ unit: "°F" })
    },
    "4331": {
        title: "MAX TEMP C",
        min: 6,
        max: 7,
        fnc1: true,
        parser: temperatureParserFactory({ unit: "°C" })
    },
    "4332": {
        title: "MIN TEMP F",
        min: 6,
        max: 7,
        fnc1: true,
        parser: temperatureParserFactory({ unit: "°F" })
    },
    "4333": {
        title: "MIN TEMP C",
        min: 6,
        max: 7,
        fnc1: true,
        parser: temperatureParserFactory({ unit: "°C" })
    },
    "7001": {
        title: "NSN",
        fixed: 13,
        fnc1: true,
        parser: stringParserFactory({ classification: 4, country: 2, sequence: 7 })
    },
    "7002": {
        title: "MEAT CUT",
        max: 30,
        fnc1: true
    },
    "7003": {
        title: "EXPIRY TIME",
        fixed: 10,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2, hour: 2, minute: 2 })
    },
    "7004": {
        title: "ACTIVE POTENCY",
        max: 4,
        fnc1: true
    },
    "7005": {
        title: "CATCH AREA",
        max: 12,
        fnc1: true
    },
    "7006": {
        title: "FIRST FREEZE DATE",
        fixed: 6,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2 })
    },
    "7007": {
        title: "HARVEST DATE",
        min: 6,
        max: 12,
        fnc1: true,
        parser: dateRangeParser
    },
    "7008": {
        title: "AQUATIC SPECIES",
        max: 3,
        fnc1: true
    },
    "7009": {
        title: "FISHING GEAR TYPE",
        max: 10,
        fnc1: true
    },
    "7010": {
        title: "PROD METHOD",
        max: 2,
        fnc1: true
    },
    "7011": {
        title: "TEST BY DATE",
        min: 6,
        max: 10,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2, hour: 2, minute: 2 })
    },
    "7020": {
        title: "REFURB LOT",
        max: 20,
        fnc1: true
    },
    "7021": {
        title: "FUNC STAT",
        max: 20,
        fnc1: true
    },
    "7022": {
        title: "REV STAT",
        max: 20,
        fnc1: true
    },
    "7023": {
        title: "GIAI - ASSEMBLY",
        max: 30,
        fnc1: true
    },
    "703": {
        title: "PROCESSOR #",
        min: 3,
        max: 30,
        fnc1: true,
        parser: sequenceParserFactory({ country: 2 })
    },
    "7040": {
        title: "UIC+EXT",
        fixed: 4,
        fnc1: true,
        parser: stringParserFactory({ UIC: 2, extension: 1, importer: 1 })
    },
    "7041": {
        title: "UFRGT UNIT TYPE",
        max: 4,
        fnc1: true
    },
    "710": {
        title: "NHRN PZN",
        max: 20,
        fnc1: true
    },
    "711": {
        title: "NHRN CIP",
        max: 20,
        fnc1: true
    },
    "712": {
        title: "NHRN CN",
        max: 20,
        fnc1: true
    },
    "713": {
        title: "NHRN DRN",
        max: 20,
        fnc1: true
    },
    "714": {
        title: "NHRN AIM",
        max: 20,
        fnc1: true
    },
    "715": {
        title: "NHRN NDC",
        max: 20,
        fnc1: true
    },
    "716": {
        title: "NHRN AIC",
        max: 20,
        fnc1: true
    },
    "723": {
        title: "CERT #",
        min: 2,
        max: 30,
        fnc1: true,
        parser: sequenceParserFactory({ schema: 2 })
    },
    "7240": {
        title: "PROTOCOL",
        max: 20,
        fnc1: true
    },
    "7241": {
        title: "AIDC MEDIA TYPE",
        fixed: 2,
        fnc1: true
    },
    "7242": {
        title: "VCN",
        max: 25,
        fnc1: true
    },
    "7250": {
        title: "DOB",
        fixed: 8,
        fnc1: true,
        parser: dateParserFactory({ year: 4, month: 2, day: 2 })
    },
    "7251": {
        title: "DOB TIME",
        fixed: 12,
        fnc1: true,
        parser: dateParserFactory({ year: 4, month: 2, day: 2, hour: 2, minute: 2 })
    },
    "7252": {
        title: "BIO SEX",
        fixed: 1,
        fnc1: true
    },
    "7253": {
        title: "FAMILY NAME",
        max: 40,
        fnc1: true
    },
    "7254": {
        title: "GIVEN NAME",
        max: 40,
        fnc1: true
    },
    "7255": {
        title: "SUFFIX",
        max: 10,
        fnc1: true
    },
    "7256": {
        title: "FULL NAME",
        max: 90,
        fnc1: true
    },
    "7257": {
        title: "PERSON ADDR",
        max: 70,
        fnc1: true
    },
    "7258": {
        title: "BIRTH SEQUENCE",
        fixed: 3,
        fnc1: true
    },
    "7259": {
        title: "BABY",
        max: 40,
        fnc1: true
    },
    "8001": {
        title: "DIMENSIONS",
        fixed: 14,
        fnc1: true,
        parser: stringParserFactory({ width: 4, length: 5, diameter: 3, direction: 1, splices: 1 })
    },
    "8002": {
        title: "CMT No",
        max: 20,
        fnc1: true
    },
    "8003": {
        title: "GRAI",
        min: 14,
        max: 30,
        fnc1: true,
        parser: stringParserFactory({ leadZero: 1, base: 13, serial: 16 })
    },
    "8004": {
        title: "GIAI",
        max: 30,
        fnc1: true
    },
    "8005": {
        title: "PRICE PER UNIT",
        fixed: 6,
        fnc1: true,
        parser: intParserFactory()
    },
    "8006": {
        title: "ITIP",
        fixed: 18,
        fnc1: true,
        parser: stringParserFactory({ GTIN: 14, piece: 2, count: 2 })
    },
    "8007": {
        title: "IBAN",
        max: 34,
        fnc1: true
    },
    "8008": {
        title: "PROD TIME",
        min: 8,
        max: 12,
        fnc1: true,
        parser: dateParserFactory({ year: 2, month: 2, day: 2, hour: 2, minute: 2, second: 2 })
    },
    "8009": {
        title: "OPT SEN",
        max: 50,
        fnc1: true
    },
    "8010": {
        title: "CPID",
        max: 30,
        fnc1: true
    },
    "8011": {
        title: "CPID SERIAL",
        max: 12,
        fnc1: true
    },
    "8012": {
        title: "VERSION",
        max: 20,
        fnc1: true
    },
    "8013": {
        title: "GMN",
        max: 25,
        fnc1: true
    },
    "8014": {
        title: "MUDI",
        max: 25,
        fnc1: true
    },
    "8017": {
        title: "GSRN - PROVIDER",
        fixed: 18,
        fnc1: true
    },
    "8018": {
        title: "GSRN - RECIPIENT",
        fixed: 18,
        fnc1: true
    },
    "8019": {
        title: "SRIN",
        max: 10,
        fnc1: true
    },
    "8020": {
        title: "REF No",
        max: 25,
        fnc1: true
    },
    "8026": {
        title: "ITIP CONTENT",
        fixed: 18,
        fnc1: true,
        parser: stringParserFactory({ GTIN: 14, piece: 2, count: 2 })
    },
    "8110": {
        title: "-",
        max: 70,
        fnc1: true
    },
    "8111": {
        title: "POINTS",
        fixed: 4,
        fnc1: true,
        parser: intParserFactory()
    },
    "8112": {
        title: "-",
        max: 70,
        fnc1: true
    },
    "8200": {
        title: "PRODUCT URL",
        max: 70,
        fnc1: true
    },
    "90": {
        title: "INTERNAL",
        max: 30,
        fnc1: true
    },
    "91": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "92": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "93": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "94": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "95": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "96": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "97": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "98": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    },
    "99": {
        title: "INTERNAL",
        max: 90,
        fnc1: true
    }
};
