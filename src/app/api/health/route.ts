import { NextResponse } from 'next/server';

// GET /api/health — Check OnlineCompiler.io connectivity.

export async function GET() {
    const apiKey = process.env.ONLINECOMPILER_API_KEY;

    if (!apiKey) {
        return NextResponse.json(
            { overall: 'unhealthy', backend: 'OnlineCompiler.io', error: 'ONLINECOMPILER_API_KEY not set' },
            { status: 503 }
        );
    }

    try {
        const start = Date.now();
        // Send a trivial Python program to verify the API is up
        const res = await fetch('https://api.onlinecompiler.io/api/run-code/', {
            method: 'POST',
            headers: {
                'Authorization': apiKey,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                compiler: 'python-3.14',
                code: 'print(1)',
                input: '',
            }),
            signal: AbortSignal.timeout(10000),
        });
        const latency = Date.now() - start;

        if (res.ok) {
            return NextResponse.json({
                overall: 'healthy',
                backend: 'OnlineCompiler.io',
                latency: `${latency}ms`,
            });
        }

        return NextResponse.json(
            { overall: 'unhealthy', backend: 'OnlineCompiler.io', error: `HTTP ${res.status}`, latency: `${latency}ms` },
            { status: 503 }
        );
    } catch (err: any) {
        return NextResponse.json(
            { overall: 'unhealthy', backend: 'OnlineCompiler.io', error: err.message },
            { status: 503 }
        );
    }
}
