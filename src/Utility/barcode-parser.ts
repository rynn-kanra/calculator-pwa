type AIMParseResult = {
    value: string;
    aim?: AIMData;
}

type AIMData = {
    symbology?: string;
    modifier?: string;
    format?: string;
}

// source: https://sps-support.honeywell.com/s/article/List-of-barcode-symbology-AIM-Identifiers
export function parseAIM(value: string): AIMParseResult {
    const result: AIMParseResult = {
        value: value
    }

    if (!value.startsWith("]")) {
        return result;
    }

    const aimStr = value.substring(0, 3);
    result.value = value.substring(3);

    result.aim = {
        symbology: aimStr[1],
        modifier: aimStr[2]
    };
    switch (result.aim.symbology) {
        case "A": {
            result.aim.format = "code_39";
            break;
        }
        case "C": {
            result.aim.format = "code_128";
            break;
        }
        case "E": {
            switch (value.length) {
                case 13: {
                    result.aim.format = "ean_13";
                    break;
                }
                case 12: {
                    result.aim.format = "upc_a";
                    break;
                }
                case 8: {
                    result.aim.format = result.aim.modifier === "4" ? "ean_8" : "upc_e";
                    break;
                }
            }
            break;
        }
        case "F": {
            result.aim.format = "codabar";
            break;
        }
        case "G": {
            result.aim.format = "code_93";
            break;
        }
        case "I": {
            result.aim.format = "itf";
            break;
        }
        case "L": {
            result.aim.format = "pdf417";
            break;
        }
        case "Q": {
            result.aim.format = "qr_code";
            break;
        }
        case "d": {
            result.aim.format = "data_matrix";
            break;
        }
        case "z": {
            result.aim.format = "aztec-code";
            break;
        }
    }

    return result;
}

// TODO: parse GS1 and GTIN
