import { Account, Client, Realtime, TablesDB } from 'appwrite';

export const config = {
  endpoint: import.meta.env.VITE_APPWRITE_ENDPOINT as string | undefined,
  projectId: import.meta.env.VITE_APPWRITE_PROJECT_ID as string | undefined,
  databaseId: (import.meta.env.VITE_APPWRITE_DATABASE_ID as string | undefined) || 'seva',
  defaultCenter: [
    Number(import.meta.env.VITE_DEFAULT_LNG ?? 88.3639),
    Number(import.meta.env.VITE_DEFAULT_LAT ?? 22.5726),
  ] as [number, number],
};

export const isConfigured = Boolean(config.endpoint && config.projectId);

export const client = new Client();
if (isConfigured) client.setEndpoint(config.endpoint!).setProject(config.projectId!);

export const account = new Account(client);
export const tablesDB = new TablesDB(client);
export const realtime = new Realtime(client);

export const TABLES = { posts: 'posts', messages: 'messages', kudos: 'kudos' } as const;
