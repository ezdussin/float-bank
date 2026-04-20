import { mergeApplicationConfig, ApplicationConfig, REQUEST } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes)),
    // In some environments, REQUEST from @angular/core might not be provided automatically.
    // We can ensure it's available here if needs be, but usually provideServerRendering handles it.
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
