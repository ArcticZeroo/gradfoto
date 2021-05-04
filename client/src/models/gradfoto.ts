import { hasProps, isDuckType, isDuckTypeArray } from '../typeguard';

export interface ILoginData {
    name: string;
    eventName: string;
    eventDate: string;
    orderDeadline: string;
}

export interface IGradfotoImagesResponse {
    loginData: ILoginData;
    imageUrls: string[];
}

export const isGradfotoImagesResponse = (value: unknown): value is IGradfotoImagesResponse => (
    hasProps<IGradfotoImagesResponse>(value, ['loginData', 'imageUrls'])
    && (Array.isArray(value.imageUrls) && value.imageUrls.every(imageUrl => typeof imageUrl === 'string'))
    && isDuckType<ILoginData>(value.loginData, {
        name:          'string',
        eventName:     'string',
        eventDate:     'string',
        orderDeadline: 'string'
    })
);