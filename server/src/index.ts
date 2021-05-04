import { app } from './server/app';
import { webserverPort } from './server/config';

console.log('Starting server on port', webserverPort);
app.listen(webserverPort);