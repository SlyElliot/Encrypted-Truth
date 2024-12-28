import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { userId, gridState, attempts, cooldownTimers } = req.body;

        const { error } = await supabase
            .from('sessions')
            .upsert({
                user_id: userId,
                grid_state: gridState,
                attempts,
                cooldown_timers: cooldownTimers,
                updated_at: new Date().toISOString(),
            });

        if (error) {
            return res.status(500).json({ error: 'Failed to save session.' });
        }

        res.status(200).json({ message: 'Session saved successfully.' });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
