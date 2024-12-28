import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlrpfnlefgfodhmclbtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInRscnBmbmxlZmdmb2RobWNsYnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMzQ2ODgsImV4cCI6MjA1MDkxMDY4OH0.GoUkXylqpFnACpg7Yz3WyuSOpJUYPfC_hE8e2FfZihE';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'GET') {
        const { data, error } = await supabase
            .from('leaderboard')
            .select('*')
            .order('attempts', { ascending: true })
            .limit(10);

        if (error) {
            console.error('Error fetching leaderboard:', error);
            return res.status(500).json({ error: 'Failed to fetch leaderboard.' });
        }

        res.status(200).json(data);
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
