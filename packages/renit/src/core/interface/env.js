/**
 * Environment variables for the application.
 * These values are injected by Vite at build time.
 */
export default import.meta.env;
export const api = import.meta.env.API;
export const app = import.meta.env.APP;
export const server = import.meta.env.SERVER;
export const client = import.meta.env.CLIENT;
export const dev = import.meta.env.DEV;
export const ssr = import.meta.env.SSR;
