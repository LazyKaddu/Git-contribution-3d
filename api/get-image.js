// api/get-image.js
export default async function handler(req, res) {
    // Because we used `addRandomSuffix: false` in Vercel Blob, the URL is always the same.
    // Replace VERCEL_BLOB_STORE_ID with your actual store ID found in the Vercel dashboard.
    const storeId = process.env.VERCEL_BLOB_STORE_ID;
    const BLOB_URL = `https://${storeId}.public.blob.vercel-storage.com/github-3d-contrib.png`;

    try {
        const imageResponse = await fetch(BLOB_URL);
        if (!imageResponse.ok) return res.status(404).send('Image rendering...');

        const imageBuffer = await imageResponse.arrayBuffer();

        // THE MAGIC HEADERS: Forces GitHub Camo to fetch a new image every profile view
        res.setHeader('Cache-Control', 'max-age=0, no-cache, no-store, must-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.setHeader('Content-Type', 'image/png');

        res.send(Buffer.from(imageBuffer));
    } catch (error) {
        res.status(500).send('Server Error');
    }
}