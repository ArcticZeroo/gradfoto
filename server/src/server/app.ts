import * as path from 'path';
import json from 'koa-json';
import Koa from 'koa';
import serve from 'koa-static';
import { registerMiddlewares } from '../middleware';

const app = new Koa();

app.use(json());

registerMiddlewares(app);

app.use(serve(path.resolve(__dirname, '../../../client/dist')));

export { app };