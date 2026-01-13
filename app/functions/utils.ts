// Utility functions for Cloudflare Workers

// Generate UUID v4
export function generateId(): string {
    return crypto.randomUUID();
}

// Hash password using Web Crypto API
export async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Verify password
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const passwordHash = await hashPassword(password);
    return passwordHash === hash;
}

// Generate JWT token
export async function generateToken(payload: object, secret: string, expiresInHours: number = 24): Promise<string> {
    const header = { alg: 'HS256', typ: 'JWT' };
    const now = Math.floor(Date.now() / 1000);
    const exp = now + (expiresInHours * 60 * 60);

    const fullPayload = { ...payload, iat: now, exp };

    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(fullPayload)).replace(/=/g, '');

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );

    const signature = await crypto.subtle.sign(
        'HMAC',
        key,
        encoder.encode(`${encodedHeader}.${encodedPayload}`)
    );

    const encodedSignature = btoa(String.fromCharCode(...new Uint8Array(signature)))
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=/g, '');

    return `${encodedHeader}.${encodedPayload}.${encodedSignature}`;
}

// Verify JWT token
export async function verifyToken(token: string, secret: string): Promise<{ valid: boolean; payload?: any }> {
    try {
        const parts = token.split('.');
        if (parts.length !== 3) return { valid: false };

        const [encodedHeader, encodedPayload, encodedSignature] = parts;

        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
            'raw',
            encoder.encode(secret),
            { name: 'HMAC', hash: 'SHA-256' },
            false,
            ['verify']
        );

        const signatureBuffer = Uint8Array.from(
            atob(encodedSignature.replace(/-/g, '+').replace(/_/g, '/')),
            c => c.charCodeAt(0)
        );

        const valid = await crypto.subtle.verify(
            'HMAC',
            key,
            signatureBuffer,
            encoder.encode(`${encodedHeader}.${encodedPayload}`)
        );

        if (!valid) return { valid: false };

        const payload = JSON.parse(atob(encodedPayload));

        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
            return { valid: false };
        }

        return { valid: true, payload };
    } catch {
        return { valid: false };
    }
}

// Get user from request
export async function getUserFromRequest(request: Request, env: any): Promise<{ id: string; email: string } | null> {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return null;

    const token = authHeader.substring(7);
    const result = await verifyToken(token, env.JWT_SECRET);

    if (!result.valid || !result.payload) return null;

    return { id: result.payload.userId, email: result.payload.email };
}

// JSON response helper
export function jsonResponse(data: any, status: number = 200): Response {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
}

// Error response helper
export function errorResponse(message: string, status: number = 400): Response {
    return jsonResponse({ error: message }, status);
}
