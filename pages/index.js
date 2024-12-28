// pages/index.js
import { useEffect, useState } from 'react';

export default function Home() {
    const [grid, setGrid] = useState([]);
    const [message, setMessage] = useState('');
    const [leaderboard, setLeaderboard] = useState([]);
    const [selectedRowIndex, setSelectedRowIndex] = useState(0);
    const [attempts, setAttempts] = useState([]);
    const [cooldownTimers, setCooldownTimers] = useState([]);
    const [userId, setUserId] = useState(null);

    useEffect(() => {
        const storedUserId = localStorage.getItem('userId') || generateUserId();
        setUserId(storedUserId);
        loadSession(storedUserId);
        createGrid();
        fetchLeaderboard();
    }, []);

    function generateUserId() {
        const id = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', id);
        return id;
    }

    async function saveSession() {
        if (!userId) return;
        const sessionData = {
            userId,
            gridState: JSON.stringify(grid),
            attempts: JSON.stringify(attempts),
            cooldownTimers: JSON.stringify(cooldownTimers),
        };

        await fetch('/api/save-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(sessionData),
        });
    }

    async function loadSession(userId) {
        const response = await fetch('/api/load-session', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId }),
        });

        if (response.ok) {
            const { grid_state, attempts, cooldown_timers } = await response.json();
            setGrid(JSON.parse(grid_state));
            setAttempts(JSON.parse(attempts));
            setCooldownTimers(JSON.parse(cooldown_timers));
        } else {
            console.log('No existing session found.');
        }
    }

    async function createGrid() {
        try {
            const response = await fetch('/api/get-hacker-names');
            if (!response.ok) {
                console.error('Failed to fetch hacker names:', response.statusText);
                return;
            }
            const hackerNames = await response.json();

            if (!Array.isArray(hackerNames)) {
                console.error('Hacker names response is not an array:', hackerNames);
                return;
            }

            const rows = hackerNames.map(({ name }) => Array(name.length).fill(''));
            setGrid(rows);
            setAttempts(new Array(rows.length).fill(0));
            setCooldownTimers(new Array(rows.length).fill(null));
        } catch (error) {
            console.error('Error creating grid:', error);
        }
    }

    async function fetchLeaderboard() {
        try {
            const response = await fetch('/api/get-leaderboard');
            if (!response.ok) {
                console.error('Failed to fetch leaderboard:', response.statusText);
                return;
            }
            const data = await response.json();
            if (Array.isArray(data)) {
                setLeaderboard(data);
            } else {
                setLeaderboard([]);
            }
        } catch (error) {
            setLeaderboard([]);
        }
    }

    async function fetchHackerName(rowIndex) {
        const response = await fetch('/api/get-hacker-name', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rowIndex }),
        });
        if (!response.ok) {
            return null;
        }
        const { name } = await response.json();
        return name.toLowerCase();
    }

    function startCooldown(rowIndex) {
        const endTime = Date.now() + 8 * 60 * 60 * 1000;
        const updatedCooldowns = [...cooldownTimers];
        updatedCooldowns[rowIndex] = endTime;
        setCooldownTimers(updatedCooldowns);
    }

    function getRemainingCooldown(rowIndex) {
        if (!cooldownTimers[rowIndex]) return 0;
        return Math.max(0, cooldownTimers[rowIndex] - Date.now());
    }

    function formatTime(ms) {
        const hours = Math.floor(ms / (1000 * 60 * 60));
        const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((ms % (1000 * 60)) / 1000);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }

    async function handleGuess() {
        if (attempts[selectedRowIndex] >= 10) {
            setMessage('Maximum attempts reached. Please wait.');
            return;
        }

        const nameToGuess = await fetchHackerName(selectedRowIndex);
        if (!nameToGuess) return;

        const guess = grid[selectedRowIndex].map((cell) => cell.char || '').join('').toLowerCase();
        const updatedAttempts = [...attempts];
        updatedAttempts[selectedRowIndex]++;
        setAttempts(updatedAttempts);

        if (updatedAttempts[selectedRowIndex] >= 10) {
            startCooldown(selectedRowIndex);
        }

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

        saveSession();
    }

    function handleKeyDown(e, rowIndex, cellIndex) {
        const { key } = e;
        let newSelectedRowIndex = selectedRowIndex;

        if (key === 'ArrowRight') {
            const nextInput = document.querySelector(
                `input[data-row='${rowIndex}'][data-cell='${cellIndex + 1}']`
            );
            if (nextInput) nextInput.focus();
        } else if (key === 'ArrowLeft') {
            const prevInput = document.querySelector(
                `input[data-row='${rowIndex}'][data-cell='${cellIndex - 1}']`
            );
            if (prevInput) prevInput.focus();
        } else if (key === 'ArrowUp') {
            const aboveInput = document.querySelector(
                `input[data-row='${rowIndex - 1}'][data-cell='${cellIndex}']`
            );
            if (aboveInput) {
                newSelectedRowIndex = rowIndex - 1;
                aboveInput.focus();
            }
        } else if (key === 'ArrowDown') {
            const belowInput = document.querySelector(
                `input[data-row='${rowIndex + 1}'][data-cell='${cellIndex}']`
            );
            if (belowInput) {
                newSelectedRowIndex = rowIndex + 1;
                belowInput.focus();
            }
        } else if (key === 'Backspace') {
            e.preventDefault();
            const updatedGrid = [...grid];
            updatedGrid[rowIndex][cellIndex] = { char: '', status: '' };
            setGrid(updatedGrid);

            const prevInput = document.querySelector(
                `input[data-row='${rowIndex}'][data-cell='${cellIndex - 1}']`
            );
            if (prevInput) prevInput.focus();
        } else if (/^[a-zA-Z0-9]$/.test(key)) {
            const updatedGrid = [...grid];
            updatedGrid[rowIndex][cellIndex] = { char: key, status: '' };
            setGrid(updatedGrid);

            const nextInput = document.querySelector(
                `input[data-row='${rowIndex}'][data-cell='${cellIndex + 1}']`
            );
            if (nextInput) nextInput.focus();
        }

        if (newSelectedRowIndex !== selectedRowIndex) {
            setSelectedRowIndex(newSelectedRowIndex);
        }
    }

    useEffect(() => {
        const rows = document.querySelectorAll('.row');
        rows.forEach((row, index) => {
            if (index === selectedRowIndex) {
                row.classList.add('highlighted');
                row.style.width = '100%';
            } else {
                row.classList.remove('highlighted');
                row.style.width = 'auto';
            }
        });
    }, [selectedRowIndex]);

    useEffect(() => {
        const interval = setInterval(() => {
            setCooldownTimers([...cooldownTimers]);
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownTimers]);

    return (
        <div className="game-container">
            <div className="title">Encrypted Truth</div>
            {/* Wrap grid in a scrollable container */}
            <div className="grid-container">
                <div className="grid">
                    {grid.map((row, rowIndex) => (
                        <div
                            key={rowIndex}
                            className={`row ${rowIndex === selectedRowIndex ? 'selected' : ''}`}
                            onClick={() => setSelectedRowIndex(rowIndex)}
                            style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
                        >
                            <div style={{ flex: 1, display: 'flex', gap: '5px' }}>
                                {row.map((cell, cellIndex) => (
                                    <input
                                        key={cellIndex}
                                        type="text"
                                        maxLength={1}
                                        value={cell.char || ''}
                                        onChange={(e) => {
                                            if (getRemainingCooldown(rowIndex) > 0) return;
                                            const updatedGrid = [...grid];
                                            updatedGrid[rowIndex][cellIndex] = { char: e.target.value[0] || '', status: '' };
                                            setGrid(updatedGrid);
                                        }}
                                        onKeyDown={(e) => handleKeyDown(e, rowIndex, cellIndex)}
                                        className={`cell ${cell?.status || ''}`}
                                        data-row={rowIndex}
                                        data-cell={cellIndex}
                                        style={{ textAlign: 'center' }}
                                    />
                                ))}
                            </div>
                            <div className="attempts-and-timer">
                                <span>{`Attempts: ${attempts[rowIndex]} / 10`}</span>
                                {getRemainingCooldown(rowIndex) > 0 && (
                                    <span className="cooldown">
                                        {`Cooldown: ${formatTime(getRemainingCooldown(rowIndex))}`}
                                    </span>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <button onClick={handleGuess} disabled={getRemainingCooldown(selectedRowIndex) > 0}>Submit</button>
            <div>{message}</div>
            <div className="leaderboard">
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