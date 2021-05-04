import * as Router from '@koa/router';

export type RouterMiddleware = (router: Router) => void;