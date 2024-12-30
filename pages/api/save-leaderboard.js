import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { playerName, totalAttempts, completionTime } = req.body;

    try {
        const { error } = await supabase
            .from('leaderboard')
            .insert([
                { 
                    player_name: playerName,
                    total_attempts: totalAttempts,
                    completion_time: completionTime
                }
            ]);

        if (error) {
            return res.status(500).json({ error: 'Failed to save to leaderboard' });
        }

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
}