import { AIMFlag, AIMValue } from "./aim";
import { MATCHER_COMPRESSED, MATCHER_UNCOMPRESSED } from "./digital-link";
import { FNC1, GS1Element, GS1DefinitionMap } from "./gs1";

// source: https://sps-support.honeywell.com/s/article/List-of-barcode-symbology-AIM-Identifiers
export function parseAIM(value: string): AIMValue {
    const result: AIMValue = {
        value: value
    }

    if (!value.startsWith(AIMFlag)) {
        return result;
    }

    const aimStr = value.substring(0, 3);
    result.value = value.substring(3);

    result.data = {
        symbology: aimStr[1],
        modifier: aimStr[2]
    };
    switch (result.data.symbology) {
        case "A": {
            result.data.format = "code_39";
            break;
        }
        case "C": {
            result.data.format = "code_128";
            break;
        }
        case "E": {
            switch (value.length) {
                case 13: {
                    result.data.format = "ean_13";
                    break;
                }
                case 12: {
                    result.data.format = "upc_a";
                    break;
                }
                case 8: {
                    result.data.format = result.data.modifier === "4" ? "ean_8" : "upc_e";
                    break;
                }
            }
            break;
        }
        case "F": {
            result.data.format = "codabar";
            break;
        }
        case "G": {
            result.data.format = "code_93";
            break;
        }
        case "I": {
            result.data.format = "itf";
            break;
        }
        case "L": {
            result.data.format = "pdf417";
            break;
        }
        case "Q": {
            result.data.format = "qr_code";
            break;
        }
        case "d": {
            result.data.format = "data_matrix";
            break;
        }
        case "z": {
            result.data.format = "aztec-code";
            break;
        }
    }

    return result;
}

// https://ref.gs1.org/standards/genspecs/
// https://ref.gs1.org/standards/digital-link/uri-syntax/
export function parseGS1(value: string, format?: string) {
    let isFnc1 = false;
    if (value[0] === AIMFlag) {
        const aimData = parseAIM(value);
        value = aimData.value;
        if (!format) {
            format = aimData.data?.format;
        }
        isFnc1 = isGS1(aimData);
    }

    switch (format) {
        case "itf": {
            if (value.length === 14) {
                value = `01${value}`;
                isFnc1 = true;
            }
            break;
        }
        case "upc_a":
        case "ean_13":
        case "ean_8": {
            value = `01${value}`;
            isFnc1 = true;
            break;
        }
        case "upc_e": {
            // expand upc_e
            const ns = value[0];
            const check = value[7];

            let manufacturer = '';
            let product = '';
            switch (value[6]) {
                case '0':
                case '1':
                case '2':
                    manufacturer = `${value.substring(1, 3)}${value[6]}00`;
                    product = `00${value.substring(3, 6)}`;
                    break;
                case '3':
                    manufacturer = `${value.substring(1, 4)}00`;
                    product = `000${value.substring(4, 6)}`;
                    break;
                case '4':
                    manufacturer = `${value.substring(1, 5)}0`;
                    product = `0000${value[5]}`;
                    break;
                default:
                    manufacturer = value.substring(1, 6);
                    product = `0000${value[6]}`;
                    break;
            }

            value = `01${ns}${manufacturer}${product}${check}`;
            isFnc1 = true;
            break;
        }
        default: {
            if (!isFnc1) {
                isFnc1 = value.includes(FNC1);
            }
        }
    }

    if (isFnc1) {
        return parseGS1Element(value);
    }
    if (MATCHER_UNCOMPRESSED.test(value)) {
        return parseDigitalLink(value);
    }
    if (MATCHER_COMPRESSED.test(value)) {
        throw new Error("Compressed Digital Link not supported");
    }

    return [];
}

function isGS1(aim: AIMValue) {
    const data = aim?.data;
    if (!data) {
        return false;
    }

    if (data.symbology === "C" && data.modifier === '1') {
        return true;
    }
    if (data.symbology === "Q" && "3456".includes(data.modifier ?? "0")) {
        return true;
    }
    if (data.symbology === "z" && "124578AB".includes(data.modifier ?? "0")) {
        return true;
    }
    if (data.symbology === "e") {
        return true;
    }
    return false;
}

function parseGS1Element(value: string) {
    const result: GS1Element[] = [];
    let aiId = "";
    let parentesis = false;
    let i = 0;
    while (i < value.length) {
        const char = value[i++];
        if (char === FNC1) {
            continue;
        }
        if (char === "(") {
            parentesis = true;
            continue;
        }

        aiId += char;
        const definition = GS1DefinitionMap[aiId];
        if (definition) {
            const element: GS1Element = {
                ai: aiId,
                title: definition.title,
                rawValue: ""
            };

            if (["floatParser", "sequenceParser"].includes(definition.parser?.name ?? "")) {
                element.ai += value[i++];
            }

            if (parentesis) {
                i++;
            }

            if (definition.fixed) {
                element.rawValue = value.substring(i, i + definition.fixed);
                i += definition.fixed;
            }
            else {
                let fncIx = value.indexOf(FNC1, i + (definition.min ?? 0));
                if (parentesis) {
                    const pIx = value.indexOf('(', i + (definition.min ?? 0));
                    if (fncIx === -1) {
                        fncIx = pIx;
                    }
                    else if (pIx !== -1) {
                        fncIx = Math.min(fncIx, pIx);
                    }
                }
                let end = fncIx;
                if (end === -1) {
                    end = value.length;
                }
                if (definition.max && (end - i) > definition.max + 1) {
                    end = i + definition.max;
                }
                element.rawValue = value.substring(i, end);
                i = end;
            }

            if (definition.parser) {
                element.data = definition.parser(element);
            }

            result.push(element);
            parentesis = false;
            aiId = "";
        }
        else if (aiId.length >= 4) {
            throw new Error(`Invalid AI (${aiId})`);
        }
    }

    return result;
}

function parseDigitalLink(link: string) {
    const url = new URL(link);
    const valuePairs: [string, string][] = [];
    if (url.pathname != '/') {
        const pairs = url.pathname.split('/');
        // remove first empty record
        pairs.shift();
        for (let i = 0, len = pairs.length; i < len; i += 2) {
            valuePairs.push([pairs[i], pairs[i + 1]]);
        }
    }
    if (url.search != '') {
        // if semicolon was used as delimiter between key=value pairs, replace with ampersand as delimiter
        const params = new URLSearchParams(url.search.replaceAll(";", "&"));
        valuePairs.splice(valuePairs.length, 0, ...params);
    }

    const result: GS1Element[] = [];
    for (const [ai, value] of valuePairs) {
        const definition = GS1DefinitionMap[ai];
        if (!definition) {
            continue;
        }

        const element: GS1Element = {
            ai: ai,
            rawValue: value,
            title: definition.title
        };
        if (definition.parser) {
            element.data = definition.parser(element);
        }
        result.push(element);
    }

    return result;
}