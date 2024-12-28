// pages/index.js
import { useEffect, useState } from 'react';
import '../styles/style.css';


export default function Home() {
    const [grid, setGrid] = useState([]);
    const [inputValue, setInputValue] = useState('');
    const [message, setMessage] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState(0);
    const [attempts, setAttempts] = useState(0);

    useEffect(() => {
        createGrid();
        fetchLeaderboard();
    }, []);

    function createGrid() {
        const rows = [];
        for (let i = 0; i < 10; i++) {
            rows.push(Array(10).fill(''));
        }
        setGrid(rows);
    }

    async function fetchLeaderboard() {
        try {
            const response = await fetch('/api/get-leaderboard');
            const data = await response.json();
            console.log('Fetched leaderboard:', data); // Debug log
            if (Array.isArray(data)) {
                setLeaderboard(data);
            } else {
                console.error('Leaderboard response is not an array:', data);
                setLeaderboard([]);
            }
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
            setLeaderboard([]); // Set to empty array on error
        }
    }
    

    async function fetchHackerName(rowIndex) {
        const response = await fetch('/api/get-hacker-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex }),
        });
        if (!response.ok) {
            console.error('Failed to fetch hacker name.');
            return null;
        }
        const { name } = await response.json();
        return name.toLowerCase();
    }

    async function handleGuess() {
        const nameToGuess = await fetchHackerName(selectedRowIndex);
        if (!nameToGuess) return;

        const guess = inputValue.trim().toLowerCase();
        setInputValue('');
        setAttempts(attempts + 1);

        if (!guess) {
            setMessage('Enter a name.');
            return;
        }

        const updatedGrid = [...grid];
        for (let i = 0; i < guess.length; i++) {
            const char = guess[i];
            if (char === nameToGuess[i]) {
                updatedGrid[selectedRowIndex][i] = { char, status: 'correct' };
            } else if (nameToGuess.includes(char)) {
                updatedGrid[selectedRowIndex][i] = { char, status: 'present' };
            } else {
                updatedGrid[selectedRowIndex][i] = { char, status: 'incorrect' };
            }
        }
        setGrid(updatedGrid);

        if (guess === nameToGuess) {
            setMessage('Correct! Well done!');
        } else {
            setMessage('Try again!');
        }
    }

    return (
        <div className="game-container">
            <div className="title">The Little Black Book Game</div>
            <div className="grid">
                {grid.map((row, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={`row ${rowIndex === selectedRowIndex ? 'selected' : ''}`}
                        onClick={() => setSelectedRowIndex(rowIndex)}
                    >
                        {row.map((cell, cellIndex) => (
                            <div key={cellIndex} className={`cell ${cell?.status || ''}`}>
                                {cell?.char || ''}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
            <input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter hacker name..."
            />
            <button onClick={handleGuess}>Submit</button>
            <div>{message}</div>
            <div className="leaderboard">
                <h2>Top Codebreakers</h2>
                <ol>
                    {leaderboard.map((entry, index) => (
                        <li key={index}>
                            {entry.name} - {entry.attempts} attempts
                        </li>
                    ))}
                </ol>
            </div>
        </div>
    );
}
