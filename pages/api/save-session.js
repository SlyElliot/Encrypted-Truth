import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, gridState, attempts, cooldownTimers } = req.body;

        if (!userId || !gridState || !attempts || !cooldownTimers) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const { error } = await supabase
            .from('sessions')
            .upsert({
                user_id: userId,
                grid_state: gridState,
                attempts,
                cooldown_timers: cooldownTimers,
                updated_at: new Date().toISOString(),
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ error: 'Failed to save session' });
        }

        res.status(200).json({ message: 'Session saved successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
