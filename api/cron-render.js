// api/cron-render.js
import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium-min';
import { put } from '@vercel/blob';

export const maxDuration = 15; // Allow function to run up to 15 seconds

export default async function handler(req, res) {
    let browser;
    try {
        browser = await puppeteer.launch({
            args: [...chromium.args, '--enable-webgl'],
            defaultViewport: { width: 1200, height: 600 },
            // Pulls the ~45MB compressed Chromium binary dynamically
            executablePath: await chromium.executablePath(
                'https://github.com/Sparticuz/chromium/releases/download/v131.0.1/chromium-v131.0.1-pack.tar'
            ),
            headless: chromium.headless,
        });

        const page = await browser.newPage();

        // Point to your deployed Vercel URL
        const domain = `https://${req.headers.host}`;
        await page.goto(`${domain}/index.html`, { waitUntil: 'networkidle0' });

        // Wait for the WebGL scene to finish drawing
        await page.waitForFunction('window.isSceneReady === true', { timeout: 5000 });

        const imageBuffer = await page.screenshot({ type: 'png' });

        // Upload to Vercel Blob
        await put('github-3d-contrib.png', imageBuffer, {
            access: 'public',
            addRandomSuffix: false // Ensures the URL stays identical
        });

        res.status(200).json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to render 3D scene' });
    } finally {
        if (browser) await browser.close();
    }
}