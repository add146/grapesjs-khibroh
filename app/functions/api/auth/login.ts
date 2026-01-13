import { verifyPassword, generateToken, jsonResponse, errorResponse } from '../../utils';

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

// POST /api/auth/login - Login user
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const body = await request.json() as { email: string; password: string };
        const { email, password } = body;

        if (!email || !password) {
            return errorResponse('Email and password are required', 400);
        }

        // Find user
        const user = await env.DB.prepare(
            'SELECT id, email, password_hash, name FROM users WHERE email = ?'
        ).bind(email).first<{ id: string; email: string; password_hash: string; name: string }>();

        if (!user) {
            return errorResponse('Invalid credentials', 401);
        }

        // Verify password
        const isValid = await verifyPassword(password, user.password_hash);
        if (!isValid) {
            return errorResponse('Invalid credentials', 401);
        }

        // Get JWT_SECRET with fallback
        const jwtSecret = env.JWT_SECRET || 'khibroh-default-secret-key-2024';

        if (!env.JWT_SECRET) {
            console.warn('Warning: JWT_SECRET not configured, using default');
        }

        // Generate token
        const token = await generateToken({ userId: user.id, email: user.email }, jwtSecret);

        return jsonResponse({
            success: true,
            user: { id: user.id, email: user.email, name: user.name },
            token,
        });
    } catch (error: any) {
        console.error('Login error:', error?.message);
        return errorResponse('Login failed: ' + (error?.message || 'Unknown error'), 500);
    }
};
