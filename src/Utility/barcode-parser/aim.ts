export const AIMFlag = ']';

export type AIMValue = {
    value: string;
    data?: AIMData;
}

export type AIMData = {
    symbology?: string;
    modifier?: string;
    format?: string;
}
