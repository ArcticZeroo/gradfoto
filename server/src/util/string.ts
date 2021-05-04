export const capitalize = (value: string) => {
    if (value.length <= 1) {
        return value;
    }

    // value[0] must be non-null because we have checked the length
    return value[0]!.toUpperCase() + value.slice(1)
};