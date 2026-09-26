import { signup } from './auth.mjs';
export default async (req) => {
  if (req.method !== 'POST') return Response.json({ message: 'Method not allowed.' }, { status: 405 });
  try { return await signup(await req.json()); }
  catch (e) { console.error(e); return Response.json({ message: 'Server error.' }, { status: 500 }); }
};
