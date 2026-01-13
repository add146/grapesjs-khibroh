interface Env {
    R2_BUCKET: R2Bucket;
}

// Serve assets from R2
export const onRequestGet: PagesFunction<Env> = async (context) => {
    const { request, env, params } = context;

    // Get the full path from the URL
    const url = new URL(request.url);
    const path = url.pathname.replace('/assets/', '');

    if (!path) {
        return new Response('Not found', { status: 404 });
    }

    try {
        const object = await env.R2_BUCKET.get(path);

        if (!object) {
            return new Response('Not found', { status: 404 });
        }

        const headers = new Headers();
        object.writeHttpMetadata(headers);
        headers.set('Cache-Control', 'public, max-age=31536000');
        headers.set('Access-Control-Allow-Origin', '*');

        return new Response(object.body, { headers });
    } catch (error) {
        console.error('Asset fetch error:', error);
        return new Response('Error fetching asset', { status: 500 });
    }
};
