import Router from '@koa/router';
import { GraduationfotoSession, Tab } from '../../api/graduationfoto';
import { RouterMiddleware } from '../../models/middleware';

const customerIdQueryName = 'id';
const lastNameQueryName = 'ln';
// const retrieveMineQueryName = 'rm';
const retrieveCandidsQueryName = 'rc';

export const registerGrabberRoutes: RouterMiddleware = router => {
    const grabberRouter = new Router();

    grabberRouter.get('/', async ctx => {
        const queryParams = ctx.request.query;

        const customerId = queryParams[customerIdQueryName];
        const lastName = queryParams[lastNameQueryName];

        if (!customerId || !lastName || Array.isArray(customerId) || Array.isArray(lastName)) {
            ctx.status = 400;
            ctx.body = 'Bad Request: Missing customer ID or last name';
            return;
        }

        const shouldRetrieveCandids = queryParams[retrieveCandidsQueryName] === 'true';

        const session = new GraduationfotoSession({
            customerId,
            lastName
        });

        await session.open();
        await session.login();

        const [loginData, imageUrls] = await Promise.all([
            session.retrieveLoginData(),
            session.collectPageImageUrls()
        ]);

        if (shouldRetrieveCandids) {
            await session.switchTab(Tab.candids);
            const candidImageUrls = await session.navigatePagesAndCollectImageUrls();
            imageUrls.push(...candidImageUrls);
        }

        ctx.body = {
            loginData,
            imageUrls
        };
    });

    router.use('/grabber', grabberRouter.routes(), grabberRouter.allowedMethods());
};