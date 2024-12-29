import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
        const { playerName, email } = req.body;

        if (!playerName || !email) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        // Get the most recent entry for this player
        const { data: existingEntry, error: fetchError } = await supabase
            .from('leaderboard')
            .select('*')
            .eq('player_name', playerName)
            .order('completed_at', { ascending: false })
            .limit(1);

        if (fetchError) {
            console.error('Error fetching entry:', fetchError);
            return res.status(500).json({ error: 'Failed to fetch leaderboard entry' });
        }

        if (!existingEntry || existingEntry.length === 0) {
            return res.status(404).json({ error: 'Player not found' });
        }

        // Update the email for this entry
        const { error: updateError } = await supabase
            .from('leaderboard')
            .update({ email: email })
            .eq('id', existingEntry[0].id);

        if (updateError) {
            console.error('Error updating email:', updateError);
            return res.status(500).json({ error: 'Failed to update email' });
        }

        res.status(200).json({ message: 'Email saved successfully' });
    } catch (error) {
        console.error('Server error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
} 