export type ObjectKey = string | number | symbol;

export type ObjectRecord = Record<ObjectKey, unknown>;

export type TypeOfResult = 'string' | 'object' | 'number' | 'bigint' | 'function' | 'symbol';

export type DuckTypeEntries<T> = {
    [K in keyof T]?: TypeOfResult;
}

export const isObject = (value: unknown): value is ObjectRecord => value != null && typeof value === 'object';

export const isDuckType = <T>(value: unknown, expectedKeyTypes: DuckTypeEntries<T>): value is T =>
    isObject(value) && Object.entries(expectedKeyTypes).every(([expectedKey, expectedType]) => value[expectedKey] != null && typeof value[expectedKey] === expectedType);

export const isDuckTypeArray = <T>(value: unknown, expectedKeyTypes: DuckTypeEntries<T>): value is T[] =>
    Array.isArray(value) && value.every(item => isDuckType<T>(item, expectedKeyTypes));

type IHasProps<T> = {
    [K in keyof T]: unknown;
};

export const hasProps = <T>(value: unknown, props: ReadonlyArray<keyof T>): value is IHasProps<T> => (
    isObject(value)
    && props.every(propName => value.hasOwnProperty(propName))
);

export const isInstance = <T>(value: unknown, element: { new(): T }): value is T => value != null && value instanceof element;