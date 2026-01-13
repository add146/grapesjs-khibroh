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

// GET /api/assets - List all assets for current user
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const url = new URL(request.url);
        const projectId = url.searchParams.get('projectId');

        let query = 'SELECT id, filename, url, content_type, size, created_at FROM assets WHERE user_id = ?';
        const bindings: string[] = [user.id];

        if (projectId) {
            query += ' AND project_id = ?';
            bindings.push(projectId);
        }

        query += ' ORDER BY created_at DESC';

        const stmt = env.DB.prepare(query);
        const { results } = await stmt.bind(...bindings).all();

        return jsonResponse({ assets: results || [] });
    } catch (error) {
        console.error('List assets error:', error);
        return errorResponse('Failed to list assets', 500);
    }
};
