import Router from '@koa/router';
import Koa from 'koa';
import { registerApiRoutes } from './api';

export const registerMiddlewares = (app: Koa) => {
    const router = new Router();

    registerApiRoutes(router);

    app.use(router.middleware())
        .use(router.allowedMethods());
};