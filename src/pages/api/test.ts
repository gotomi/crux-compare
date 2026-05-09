export const GET = async () => {
  return new Response(JSON.stringify({ ok: true, time: new Date().toISOString() }), {
    headers: { 'Content-Type': 'application/json' }
  });
};
