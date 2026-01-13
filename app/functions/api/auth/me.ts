import { getUserFromRequest, jsonResponse, errorResponse } from '../../utils';

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

// GET /api/auth/me - Get current user
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Get full user data
        const userData = await env.DB.prepare(
            'SELECT id, email, name, created_at FROM users WHERE id = ?'
        ).bind(user.id).first();

        if (!userData) {
            return errorResponse('User not found', 404);
        }

        return jsonResponse({ user: userData });
    } catch (error) {
        console.error('Get user error:', error);
        return errorResponse('Failed to get user', 500);
    }
};
