import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://tlrpfnlefgfodhmclbtp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRscnBmbmxlZmdmb2RobWNsYnRwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzMzQ2ODgsImV4cCI6MjA1MDkxMDY4OH0.GoUkXylqpFnACpg7Yz3WyuSOpJUYPfC_hE8e2FfZihE';
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { rowIndex } = req.body;
        const { data, error } = await supabase
            .from('hacker_names')
            .select('name')
            .eq('id', rowIndex + 1)
            .single();

        if (error) {
            console.error('Error fetching hacker name:', error);
            return res.status(500).json({ error: 'Failed to fetch hacker name.' });
        }

        return res.status(200).json({ name: data.name });
    } else {
        return res.status(405).json({ error: 'Method not allowed' });
    }
}
