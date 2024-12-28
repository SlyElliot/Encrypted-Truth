import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlrpfnlefgfodhmclbtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscnBmbmxlZmdmb2RobWNsYnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMzQ2ODgsImV4cCI6MjA1MDkxMDY4OH0.GoUkXylqpFnACpg7Yz3WyuSOpJUYPfC_hE8e2FfZihE';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    try {
        if (req.method !== 'POST') {
            return res.status(405).json({ error: 'Method not allowed' });
        }

        const { rowIndex } = req.body;

        if (typeof rowIndex !== 'number' || rowIndex < 0) {
            return res.status(400).json({ error: 'Invalid rowIndex provided' });
        }

        const { data, error } = await supabase
            .from('hacker_names')
            .select('name')
            .eq('id', rowIndex + 1) // 1-based index in the database
            .single();

        if (error || !data) {
            console.error('Database error:', error || 'No data found');
            return res.status(500).json({ error: 'Failed to fetch hacker name' });
        }

        return res.status(200).json({ name: data.name });
    } catch (err) {
        console.error('Unexpected error:', err);
        return res.status(500).json({ error: 'Internal server error' });
    }
}
