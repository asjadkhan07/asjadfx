export default function handler(req: any, res: any) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    service: 'asjadfx-backend',
    environment: process.env.VERCEL ? 'vercel-serverless' : 'node-server',
    time: new Date().toISOString(),
  });
}
