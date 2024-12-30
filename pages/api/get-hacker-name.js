import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method === 'POST') {
        const { rowIndex, guess } = req.body;

        // Adjusted to match IDs starting from 19
        const targetId = 19 + rowIndex;

        const { data, error } = await supabase
            .from('hacker_names')
            .select('name')
            .eq('id', targetId)
            .single();

        if (error) {
            return res.status(500).json({ error: 'Failed to fetch hacker name.' });
        }

        if (!data) {
            return res.status(404).json({ error: 'No hacker name found for this row index.' });
        }

        const actualName = data.name.toLowerCase();

        // If no guess provided, only return the length
        if (!guess) {
            return res.status(200).json({ 
                length: actualName.length,
                mask: '*'.repeat(actualName.length)
            });
        }

        // Validate the guess and return the pattern
        const guessedName = guess.toLowerCase();
        const pattern = guessedName.split('').map((char, index) => {
            if (char === actualName[index]) {
                return 'correct';
            } else if (actualName.includes(char)) {
                return 'present';
            } else {
                return 'incorrect';
            }
        });

        return res.status(200).json({
            pattern,
            isCorrect: guessedName === actualName,
            length: actualName.length,
            mask: '*'.repeat(actualName.length)
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}
