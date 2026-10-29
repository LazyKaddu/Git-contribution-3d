// api/get-image.js
import { get } from '@vercel/blob';

export default async function handler(req, res) {
    try {
        const result = await get('github-3d-contrib.png', { access: 'private' });
        if (!result || !result.stream) {
            return res.status(404).send('Image rendering...');
        }

        // Read stream into buffer
        const chunks = [];
        const reader = result.stream.getReader();
        while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            chunks.push(value);
        }
        const imageBuffer = Buffer.concat(chunks);

        // THE MAGIC HEADERS: Forces GitHub Camo to fetch a new image every profile view
        res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'image/png');

        res.send(imageBuffer);
    } catch (error) {
        console.error('get-image error:', error);
        res.status(500).send('Server Error');
    }
}