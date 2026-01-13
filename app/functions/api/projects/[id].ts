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

// GET /api/projects/:id - Get project by ID (for GrapesJS load)
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const projectId = params.id as string;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const project = await env.DB.prepare(
            'SELECT id, name, data, created_at, updated_at FROM projects WHERE id = ? AND user_id = ?'
        ).bind(projectId, user.id).first<{ id: string; name: string; data: string; created_at: string; updated_at: string }>();

        if (!project) {
            return errorResponse('Project not found', 404);
        }

        // Parse the JSON data for GrapesJS
        let parsedData = {};
        try {
            parsedData = JSON.parse(project.data);
        } catch {
            parsedData = {};
        }

        return jsonResponse(parsedData);
    } catch (error) {
        console.error('Get project error:', error);
        return errorResponse('Failed to get project', 500);
    }
};

// PUT /api/projects/:id - Update project (for GrapesJS store)
export const onRequestPut: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const projectId = params.id as string;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Check if project exists and belongs to user
        const existing = await env.DB.prepare(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?'
        ).bind(projectId, user.id).first();

        if (!existing) {
            return errorResponse('Project not found', 404);
        }

        const body = await request.json();
        const projectData = JSON.stringify(body);

        await env.DB.prepare(
            'UPDATE projects SET data = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?'
        ).bind(projectData, projectId, user.id).run();

        return jsonResponse({ success: true });
    } catch (error) {
        console.error('Update project error:', error);
        return errorResponse('Failed to update project', 500);
    }
};

// DELETE /api/projects/:id - Delete project
export const onRequestDelete: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;
    const projectId = params.id as string;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        // Check if project exists and belongs to user
        const existing = await env.DB.prepare(
            'SELECT id FROM projects WHERE id = ? AND user_id = ?'
        ).bind(projectId, user.id).first();

        if (!existing) {
            return errorResponse('Project not found', 404);
        }

        await env.DB.prepare(
            'DELETE FROM projects WHERE id = ? AND user_id = ?'
        ).bind(projectId, user.id).run();

        return jsonResponse({ success: true });
    } catch (error) {
        console.error('Delete project error:', error);
        return errorResponse('Failed to delete project', 500);
    }
};
