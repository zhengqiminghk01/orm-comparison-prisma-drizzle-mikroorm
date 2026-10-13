export const PRIMARY = (process.env.PRIMARY_URL ?? "postgresql://postgres@127.0.0.1:5432/b_bench") + "?application_name=";
export const REPLICA = (process.env.REPLICA_URL ?? "postgresql://postgres@127.0.0.1:5433/b_bench") + "?application_name=";
export const TENANT = "00000000-0000-7000-8000-000000000001";
export const HOT = "00000000-0000-7000-9000-000000000000";
export const POOL = 10;
export type Cursor = { createdAt: Date; id: string };
export const encode = (c: Cursor) => Buffer.from(JSON.stringify([c.createdAt.toISOString(), c.id])).toString("base64url");
export const decode = (s: string): Cursor => { const [t, id] = JSON.parse(Buffer.from(s, "base64url").toString()); return { createdAt: new Date(t), id }; };
