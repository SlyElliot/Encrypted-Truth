import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { playerName, totalAttempts, completionTime } = req.body;

        if (!playerName || typeof totalAttempts !== 'number' || typeof completionTime !== 'number') {
            return res.status(400).json({ error: 'Missing or invalid fields' });
        }

        const { error } = await supabase
            .from('leaderboard')
            .insert([{
                player_name: playerName,
                total_attempts: totalAttempts,
                completion_time: completionTime,
                email: null
            }]);

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to save leaderboard entry' });
        }

        res.status(200).json({ message: 'Leaderboard entry saved successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}