// api/cron-render.js
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { put } from '@vercel/blob';

export const maxDuration = 60; // Allow function to run up to 60 seconds

export default async function handler(req, res) {
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // Secure the route: require CRON_SECRET
    if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    let browser;
    try {
        // v153.0.0 pack containing al2023.tar.br required by Vercel Node 20 runtime
        const CHROMIUM_PACK_URL = 'https://github.com/Sparticuz/chromium/releases/download/v153.0.0/chromium-v153.0.0-pack.x64.tar';

        browser = await puppeteer.launch({
            args: [...chromium.args, '--enable-webgl'],
            defaultViewport: { width: 1200, height: 600 },
            executablePath: await chromium.executablePath(CHROMIUM_PACK_URL),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // Point to your deployed Vercel URL
        const domain = `https://${req.headers.host}`;
        await page.goto(`${domain}/index.html`, { waitUntil: 'networkidle0' });

        // Wait for the WebGL scene to finish drawing
        await page.waitForFunction('window.isSceneReady === true', { timeout: 10000 });

        const imageBuffer = await page.screenshot({ type: 'png' });

        // Upload to Vercel Blob (supports private store)
        await put('github-3d-contrib.png', imageBuffer, {
            access: 'private',
            addRandomSuffix: false, // Ensures the URL stays identical
            allowOverwrite: true    // Allows periodic overwriting
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error('Cron render error:', error);
        res.status(500).json({ 
            error: 'Failed to render 3D scene', 
            details: error.message 
        });
    } finally {
        if (browser) await browser.close();
    }
}