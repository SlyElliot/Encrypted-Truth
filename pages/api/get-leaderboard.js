import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'GET') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('completion_time', { ascending: true })
            .limit(10);

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }

        res.status(200).json(data || []);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}