import { generateId, getUserFromRequest, jsonResponse, errorResponse } from '../../utils';

interface Env {
    DB: D1Database;
    R2_BUCKET: R2Bucket;
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

// POST /api/assets/upload - Upload file to R2
export const onRequestPost: PagesFunction<Env> = async (context) => {
    const { request, env } = context;

    try {
        const user = await getUserFromRequest(request, env);
        if (!user) {
            return errorResponse('Unauthorized', 401);
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;
        const projectId = formData.get('projectId') as string | null;

        if (!file) {
            return errorResponse('No file provided', 400);
        }

        // Generate unique key for R2
        const id = generateId();
        const ext = file.name.split('.').pop() || 'bin';
        const r2Key = `uploads/${user.id}/${id}.${ext}`;

        // Upload to R2
        const arrayBuffer = await file.arrayBuffer();
        await env.R2_BUCKET.put(r2Key, arrayBuffer, {
            httpMetadata: {
                contentType: file.type,
            },
        });

        // Generate public URL (assumes public bucket or custom domain)
        // For Cloudflare Pages, assets are typically served via /assets/ path
        const url = `/assets/${r2Key}`;

        // Save to database
        await env.DB.prepare(
            'INSERT INTO assets (id, project_id, user_id, filename, r2_key, url, content_type, size) VALUES (?, ?, ?, ?, ?, ?, ?, ?)'
        ).bind(id, projectId, user.id, file.name, r2Key, url, file.type, file.size).run();

        return jsonResponse({
            success: true,
            asset: {
                id,
                filename: file.name,
                url,
                type: file.type,
                size: file.size,
            },
        }, 201);
    } catch (error) {
        console.error('Upload error:', error);
        return errorResponse('Upload failed', 500);
    }
};
