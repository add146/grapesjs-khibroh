import { generateId, getUserFromRequest, jsonResponse, errorResponse } from '../../utils';

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

// GET /api/projects - List all projects for current user
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const { results } = await env.DB.prepare(
            'SELECT id, name, created_at, updated_at FROM projects WHERE user_id = ? ORDER BY updated_at DESC'
        ).bind(user.id).all();

        return jsonResponse({ projects: results || [] });
    } catch (error) {
        console.error('List projects error:', error);
        return errorResponse('Failed to list projects', 500);
    }
};

// POST /api/projects - Create new project
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const body = await request.json() as { name: string; data?: object };
        const { name, data } = body;

        if (!name) {
            return errorResponse('Project name is required', 400);
        }

        const id = generateId();
        const projectData = JSON.stringify(data || {});

        await env.DB.prepare(
            'INSERT INTO projects (id, user_id, name, data) VALUES (?, ?, ?, ?)'
        ).bind(id, user.id, name, projectData).run();

        return jsonResponse({
            project: { id, name, data: data || {} },
        }, 201);
    } catch (error) {
        console.error('Create project error:', error);
        return errorResponse('Failed to create project', 500);
    }
};
