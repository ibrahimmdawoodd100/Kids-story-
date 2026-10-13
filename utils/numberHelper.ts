
export const normalizeArabicNumerals = (str: string): string => {
    const arabicDigits: { [key: string]: string } = {
        '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4',
        '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9'
    };
    return str.replace(/[٠-٩]/g, (d) => arabicDigits[d]);
};

export const safeParseInt = (value: any, defaultValue: number = 0): number => {
    if (value === undefined || value === null) return defaultValue;
    const normalized = normalizeArabicNumerals(String(value));
    const parsed = parseInt(normalized, 10);
    return isNaN(parsed) ? defaultValue : parsed;
};
