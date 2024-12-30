import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { rowIndex, guess } = req.body;
    
    try {
        // Get the name from your source but don't send it back
        const hackerName = getHackerName(rowIndex); // Your existing function
        
        if (!guess) {
            return res.status(400).json({ error: 'No guess provided' });
        }

        // Validate the guess and return only the result pattern
        const result = guess.toLowerCase().split('').map((char, index) => {
            if (char === hackerName[index]) {
                return 'correct';
            } else if (hackerName.includes(char)) {
                return 'present';
            } else {
                return 'incorrect';
            }
        });

        res.status(200).json({ result });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
