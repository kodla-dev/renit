/**
 * Environment variables for the application.
 * These values are injected by Vite at build time.
 */
export default import.meta.env;
export const api = import.meta.env.API;
export const app = import.meta.env.APP;
export const server = import.meta.env.SERVER && import.meta.env.SSR;
export const client = import.meta.env.CLIENT || !import.meta.env.SSR;
export const development = import.meta.env.DEV;
export const production = !import.meta.env.DEV;
export const ssr = import.meta.env.SSR;
export const csr = !import.meta.env.SSR;
