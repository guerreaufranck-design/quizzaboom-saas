import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders } from './_cors';

const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const MAX_CONCURRENCY = 5;

interface QuestionImage {
  id: string;
  searchTerm: string;
}

async function fetchUnsplashImage(searchTerm: string): Promise<string | null> {
  if (!UNSPLASH_ACCESS_KEY) return null;

  try {
    const url = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchTerm)}&per_page=1&orientation=landscape`;
    const response = await fetch(url, {
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
    });

    if (!response.ok) {
      console.warn(`Unsplash API error for "${searchTerm}": ${response.status}`);
      return null;
    }

    const data = await response.json();
    // Use 'regular' size (1080px width) for good quality on TV displays
    return data.results?.[0]?.urls?.regular || null;
  } catch (error) {
    console.warn(`Unsplash fetch failed for "${searchTerm}":`, error);
    return null;
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCorsHeaders(res, req.headers.origin as string);

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  if (!UNSPLASH_ACCESS_KEY) {
    console.warn('⚠️ UNSPLASH_ACCESS_KEY not configured — skipping image fetch');
    return res.status(200).json({ images: {}, skipped: true });
  }

  if (!SUPABASE_URL || !SUPABASE_KEY) {
    return res.status(503).json({ error: 'Database not configured' });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

  try {
    const { questions } = req.body as { questions: QuestionImage[] };

    if (!questions || !Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ error: 'Missing questions array' });
    }

    console.log(`🖼️ Fetching ${questions.length} images from Unsplash...`);

    const results: Record<string, string> = {};

    // Process in batches of MAX_CONCURRENCY
    for (let i = 0; i < questions.length; i += MAX_CONCURRENCY) {
      const batch = questions.slice(i, i + MAX_CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (q) => {
          const imageUrl = await fetchUnsplashImage(q.searchTerm);
          return { id: q.id, imageUrl };
        })
      );

      // Update DB and collect results
      for (const { id, imageUrl } of batchResults) {
        if (imageUrl) {
          results[id] = imageUrl;

          const { error } = await supabase
            .from('ai_questions')
            .update({ image_url: imageUrl })
            .eq('id', id);

          if (error) {
            console.warn(`Failed to update image_url for question ${id}:`, error.message);
          }
        }
      }
    }

    const successCount = Object.keys(results).length;
    console.log(`✅ Images fetched: ${successCount}/${questions.length}`);

    return res.status(200).json({ images: results, total: questions.length, fetched: successCount });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Fetch images error:', message);
    return res.status(500).json({ error: `Image fetch failed: ${message}` });
  }
}
