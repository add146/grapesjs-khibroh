import { generateId, hashPassword, verifyPassword, generateToken, jsonResponse, errorResponse } from '../../utils';

interface Env {
    DB: D1Database;
    JWT_SECRET: string;
}

// Handle OPTIONS for CORS
export const onRequestOptions: PagesFunction<Env> = async () => {
    return new Response(null, {
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        },
    });
};

// POST /api/auth/register - Register new user
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const body = await request.json() as { email: string; password: string; name?: string };
        const { email, password, name } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        // Check if user already exists
        const existing = await env.DB.prepare(
            'SELECT id FROM users WHERE email = ?'
        ).bind(email).first();

        if (existing) {
            return errorResponse('User already exists', 409);
        }

        // Create user
        const id = generateId();
        const passwordHash = await hashPassword(password);

        await env.DB.prepare(
            'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)'
        ).bind(id, email, passwordHash, name || null).run();

        // Generate token
        const token = await generateToken({ userId: id, email }, env.JWT_SECRET);

        return jsonResponse({
            success: true,
            user: { id, email, name },
            token,
        }, 201);
    } catch (error: any) {
        console.error('Register error:', error);
        console.error('Error message:', error?.message);
        console.error('Error stack:', error?.stack);
        console.error('DB available:', !!env.DB);
        console.error('JWT_SECRET available:', !!env.JWT_SECRET);
        return errorResponse('Registration failed: ' + (error?.message || 'Unknown error'), 500);
    }
};
