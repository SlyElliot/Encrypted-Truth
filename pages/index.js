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
    const [startTime] = useState(Date.now());
    const [showLeaderboardPopup, setShowLeaderboardPopup] = useState(false);
    const [playerName, setPlayerName] = useState('');
    const [isGameComplete, setIsGameComplete] = useState(false);
    const [showCompletionMessage, setShowCompletionMessage] = useState(false);
    const [playerEmail, setPlayerEmail] = useState('');
    const [showTutorial, setShowTutorial] = useState(true);

    useEffect(() => {
        async function initializeGame() {
            const storedUserId = localStorage.getItem('userId') || generateUserId();
            setUserId(storedUserId);
            
            try {
                // First try to load existing session
                const sessionLoaded = await loadSession(storedUserId);
                
                // Only create new grid if no session was loaded
                if (!sessionLoaded) {
                    await createGrid();
                }
                
                await fetchLeaderboard();
            } catch (error) {
                console.error('Error initializing game:', error);
                // Fallback to creating new grid if loading fails
                await createGrid();
            }
        }

        initializeGame();
    }, []);

    function generateUserId() {
        const id = `user_${Math.random().toString(36).substr(2, 9)}`;
        localStorage.setItem('userId', id);
        return id;
    }

    useEffect(() => {
        let timeoutId;
        if (grid.length > 0 && userId) {
            // Debounce the save to prevent too many calls
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                saveSession();
            }, 1000);
        }
        return () => clearTimeout(timeoutId);
    }, [grid, userId]);

    async function saveSession() {
        if (!userId || !grid.length) return;
        
        try {
            const sessionData = {
                userId,
                gridState: JSON.stringify(grid),
                attempts: JSON.stringify(attempts),
                cooldownTimers: JSON.stringify(cooldownTimers),
            };

            const response = await fetch('/api/save-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(sessionData),
            });

            const data = await response.json();

            if (!response.ok) {
                setMessage('Failed to save progress');
                return false;
            }
            
            return true;
        } catch (error) {
            setMessage('Failed to save progress');
            return false;
        }
    }

    async function loadSession(userId) {
        try {
            
            const response = await fetch('/api/load-session', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId }),
            });

            const data = await response.json();
            

            if (response.ok && data.grid_state && data.attempts && data.cooldown_timers) {
                const parsedGrid = JSON.parse(data.grid_state);
                const parsedAttempts = JSON.parse(data.attempts);
                const parsedCooldowns = JSON.parse(data.cooldown_timers);

                

                setGrid(parsedGrid);
                setAttempts(parsedAttempts);
                setCooldownTimers(parsedCooldowns);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading session:', error);
            return false;
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
            setLeaderboard(data);
        } catch (error) {
            console.error('Error fetching leaderboard:', error);
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
        const endTime = Date.now() + 5 * 60 * 1000;
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

    function checkGameCompletion(updatedGrid) {
        return updatedGrid.every(row => 
            row.every(cell => cell.status === 'correct')
        );
    }

    async function handleLeaderboardSubmission(e) {
        e.preventDefault();
        if (!playerName.trim()) return;

        const totalAttempts = attempts.reduce((sum, current) => sum + current, 0);
        const completionTime = Math.floor((Date.now() - startTime) / 1000);

        try {
            const response = await fetch('/api/save-leaderboard', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    totalAttempts,
                    completionTime
                }),
            });

            if (!response.ok) throw new Error('Failed to save leaderboard entry');

            setShowLeaderboardPopup(false);
            setShowCompletionMessage(true);
            fetchLeaderboard();
        } catch (error) {
            console.error('Error saving to leaderboard:', error);
        }
    }

    async function handleEmailSubmission(e) {
        e.preventDefault();
        if (!playerEmail.trim()) return;

        try {
            const response = await fetch('/api/update-leaderboard-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    playerName,
                    email: playerEmail
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save email');
            }
            
            setShowCompletionMessage(false);
        } catch (error) {
            console.error('Error saving email:', error);
            setMessage(error.message || 'Failed to save email. Please try again.');
        }
    }

    async function handleGuess() {
        if (attempts[selectedRowIndex] >= 20) {
            setMessage('Maximum attempts reached. Please wait.');
            return;
        }

        const guess = grid[selectedRowIndex].map((cell) => cell.char || '').join('').toLowerCase();
        
        if (!guess) {
            setMessage('Enter a name.');
            return;
        }

        try {
            const response = await fetch('/api/get-hacker-name', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    rowIndex: selectedRowIndex,
                    guess: guess 
                }),
            });

            if (!response.ok) return;

            const { pattern, isCorrect } = await response.json();
            
            // Create all updates first
            const updatedAttempts = [...attempts];
            updatedAttempts[selectedRowIndex]++;

            const updatedGrid = [...grid];
            for (let i = 0; i < guess.length; i++) {
                updatedGrid[selectedRowIndex][i] = { 
                    char: guess[i], 
                    status: pattern[i] 
                };
            }

            let updatedCooldowns = [...cooldownTimers];
            if (updatedAttempts[selectedRowIndex] >= 20) {
                const endTime = Date.now() + 5 * 60 * 1000;
                updatedCooldowns[selectedRowIndex] = endTime;
            }

            // Update all state at once
            setGrid(updatedGrid);
            setAttempts(updatedAttempts);
            setCooldownTimers(updatedCooldowns);
            
            if (isCorrect) {
                setMessage('Correct! Well done!');
                
                // Check if this was the last name needed
                const isComplete = checkGameCompletion(updatedGrid);
                if (isComplete && !isGameComplete) {
                    setIsGameComplete(true);
                    setShowLeaderboardPopup(true);
                }
            } else {
                setMessage('Try again!');
            }

            await new Promise(resolve => setTimeout(resolve, 100));
            await saveSession();

        } catch (error) {
            setMessage('An error occurred. Please try again.');
        }
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
            e.preventDefault(); // Prevent default to stop the key from being entered twice
            const updatedGrid = [...grid];
            updatedGrid[rowIndex][cellIndex] = { char: key, status: '' };
            setGrid(updatedGrid);

            const nextInput = document.querySelector(
                `input[data-row='${rowIndex}'][data-cell='${cellIndex + 1}']`
            );
            if (nextInput) {
                nextInput.focus();
                // Clear any existing value in the next input when moving to it
                if (nextInput && grid[rowIndex][cellIndex + 1]?.char === '') {
                    const updatedGrid = [...grid];
                    updatedGrid[rowIndex][cellIndex + 1] = { char: '', status: '' };
                    setGrid(updatedGrid);
                }
            }
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
                        >
                            <div className="cell-container">
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
                                <span>{`Attempts: ${attempts[rowIndex]} / 20`}</span>
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
            <button 
                onClick={handleGuess} 
                disabled={getRemainingCooldown(selectedRowIndex) > 0}
                className="submit-button"
            >
                Submit
            </button>
            <div>{message}</div>
            {showLeaderboardPopup && (
                <div className="popup-overlay">
                    <div className="popup">
                        <h2>Congratulations!</h2>
                        <p>You've completed all the names!</p>
                        <form onSubmit={handleLeaderboardSubmission}>
                            <input
                                type="text"
                                placeholder="Enter your name"
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                maxLength={20}
                                required
                            />
                            <button type="submit">Submit Score</button>
                        </form>
                    </div>
                </div>
            )}
            {showCompletionMessage && (
                <div className="popup-overlay">
                    <div className="popup">
                        <h2>Access Granted</h2>
                        <p>You have our attention now.</p>
                        <p>Please await the next phase.</p>
                        <form onSubmit={handleEmailSubmission} className="email-form">
                            <input
                                type="email"
                                placeholder="Enter your email"
                                value={playerEmail}
                                onChange={(e) => setPlayerEmail(e.target.value)}
                                className="email-input"
                            />
                            <button type="submit">Submit</button>
                        </form>
                        <button onClick={() => setShowCompletionMessage(false)} className="skip-button">
                            Skip
                        </button>
                    </div>
                </div>
            )}
            <div className="leaderboard">
                <h2>Leaderboard</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Rank</th>
                            <th>Name</th>
                            <th>Attempts</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leaderboard.map((entry, index) => (
                            <tr key={index}>
                                <td>{index + 1}</td>
                                <td>{entry.player_name}</td>
                                <td>{entry.total_attempts}</td>
                                <td>{formatTime(entry.completion_time * 1000)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            {showTutorial && (
                <div className="popup-overlay">
                    <div className="popup">
                        <h2>Welcome to the fight</h2>
                        <div className="tutorial-content">
                            <p>Your goal is to decrypt the hidden hacker names.</p>
                            <p>If you watch the video, you will find the answers.</p>
                            <p>How to play:</p>
                            <ul>
                                <li>Type your guess into each row</li>
                                <li>Green = correct letter in correct position</li>
                                <li>Yellow = correct letter in wrong position</li>
                                <li>Red = incorrect letter</li>
                            </ul>
                            <p>You have a set number of attempts per name</p>
                            <p>After you reach the maximum attempts, row locks for a set time limit</p>
                        </div>
                        <button 
                            onClick={() => setShowTutorial(false)}
                            className="submit-button"
                        >
                            Start Decrypting
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}