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

        if (!userId) {
            return res.status(400).json({ error: 'Missing userId' });
        }

        const { error } = await supabase
            .from('sessions')
            .upsert({
                user_id: userId,
                grid_state: gridState,
                attempts: attempts,
                cooldown_timers: cooldownTimers,
                updated_at: new Date().toISOString()
            }, {
                onConflict: 'user_id'
            });

        if (error) {
            return res.status(500).json({ error: 'Database error' });
        }

        return res.status(200).json({ success: true });
    } catch (error) {
        return res.status(500).json({ error: 'Internal server error' });
    }
}
