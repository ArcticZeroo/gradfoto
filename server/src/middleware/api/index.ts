import Router from '@koa/router';
import { RouterMiddleware } from '../../models/middleware';
import { registerGrabberRoutes } from './grabber';

export const registerApiRoutes: RouterMiddleware = router => {
    const apiRouter = new Router();

    registerGrabberRoutes(apiRouter);

    router.use('/api', apiRouter.routes(), apiRouter.allowedMethods());
};