
type ExpTree = { [k: string]: number | ((n: number) => number) }

const map: ExpTree = {
    "nol": 0,
    "satu": 1,
    "dua": 2,
    "tiga": 3,
    "empat": 4,
    "lima": 5,
    "enam": 6,
    "tujuh": 7,
    "delapan": 8,
    "sembilan": 9,
    "sepuluh": 10,
    "sebelas": 11,
    "seratus": 100,
    "seribu": 1000,
    "sejuta": 10 ^ 6,
    "semiliar": 10 ^ 9,
    "setriliun": 10 ^ 12,
    "setengah": (n: number) => n + ((Math.pow(10, Math.floor(n).toString().length - 1)) / 2),
    "puluh": (n: number) => n * 10,
    "belas": (n: number) => n + 10,
    "ratus": (n: number) => n * 100,
    "ribu": (n: number) => n * 1000,
    "juta": (n: number) => n * 10 ^ 6,
    "miliar": (n: number) => n * 10 ^ 9,
    "triliun": (n: number) => n * 10 ^ 12,
};
const normalizeMap: Map<RegExp, string> = new Map([
    [/[.]/g, ""],
    [/,/g, "."],
    [/(di)?kali/g, "*"],
    [/(di)?bagi/g, "/"],
    [/(di)?tambah/g, "+"],
    [/((di)?kurang|min[ue]s)/g, "-"],
    [/koma/g, "."],
    [/ blas/g, "belas"],
    [/enol/g, "nol"],
    [/due/g, "dua"],
    [/tige/g, "tiga"],
    [/lime/g, "lima"],
    [/tujoh/g, "tujuh"],
    [/lapan/g, "delapan"],
    [/persen/g, "%"],
    [/(sama dengan|berapa|hasil|brapa)/g, "="]
]);
function isNumber(n: string) {
    return n.match(/^[-]?[0-9]+([.][0-9]+)?$/) != null;
}
function isOperator(n: string) {
    return n && "+*-/%=".includes(n);
}
function Normalize(input: string) {
    input = input.toLowerCase();
    for (const [key, val] of normalizeMap) {
        input = input.replace(key, val);
    }
    return input;
}
export function MathParser(input: string) {
    const words = Normalize(input).split(" ");
    let res: string[] = [];
    let total = 0;
    let hundred = 0;
    let num = 0;
    let isComa = false;
    let isComaB = false;
    for (const word of words) {
        if (word === ".") {
            res.push((total + hundred + num).toFixed(0) + word);
            isComaB = isComa = true;
            total = hundred = num = 0;
            continue;
        }

        if (isNumber(word)) {
            res.push(word);
            continue;
        }

        if (isOperator(word)) {
            total += hundred + num;
            if (total != 0) {
                res.push(total.toFixed(0));
            }
            res.push(word);
            isComa = false;

            total = hundred = num = 0;
            continue;
        }

        const d = map[word];
        switch (typeof d) {
            case "number": {
                if (isComa) {
                    if (isComaB) {
                        isComaB = false;
                    }
                    else {
                        res[res.length - 1] += num;
                    }
                }
                num = d;
                break;
            }
            case "undefined": {
                break;
            }
            default: {
                if (num == 0) {
                    total += hundred + num;
                    total = d(total);
                    hundred = 0;
                }
                else {
                    const chunk = d(num);
                    if (hundred > 0 && chunk.toFixed(0).length >= hundred.toFixed(0).length) {
                        res.push((total + hundred).toFixed(0));
                        total = 0;
                    }
                    else {
                        hundred += chunk;
                    }
                }
                isComa = false;
                num = 0;
                break;
            }
        }
    }
    if (isComa) {
        if (num) {
            res[res.length - 1] += num;
        }
    }
    else {
        total += hundred + num;
        if (total != 0) {
            res.push(total.toFixed(0));
        }
    }

    return res;
}
export function CalcParser(input: string) {
    const tokens = MathParser(input);
    let result = "";
    let isPrevNumber = false;
    for (const token of tokens) {
        if (isNumber(token)) {
            if (isPrevNumber) {
                result += "+";
            }
            result += token;
            isPrevNumber = true;
        }
        else {
            result += token;
            isPrevNumber = false;
        }
    }

    return result;
}