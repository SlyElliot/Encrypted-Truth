import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

// Add error checking for environment variables
if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { userId, gridState, attempts, cooldownTimers } = req.body;

        // Validate the data
        if (!userId || !gridState || !attempts || !cooldownTimers) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Store the data as strings in Supabase
        const sessionData = {
            user_id: userId,
            grid_state: gridState,  // Already a JSON string
            attempts: attempts,      // Already a JSON string
            cooldown_timers: cooldownTimers,  // Already a JSON string
            updated_at: new Date().toISOString()
        };

        // Use upsert with the unique constraint
        const { data, error } = await supabase
            .from('sessions')
            .upsert(sessionData, {
                onConflict: 'user_id',
                returning: 'minimal'
            });

        if (error) {
            console.error('Supabase error:', error);
            return res.status(500).json({ 
                error: 'Failed to save session', 
                details: error.message 
            });
        }

        return res.status(200).json({ 
            message: 'Session saved successfully',
            userId: userId
        });

    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({ 
            error: 'Internal server error', 
            details: error.message 
        });
    }
}
