// ============================================
// Ultimate Tic-Tac-Toe - Game Logic with AI & Timer
// ============================================

// ============================================
// Sound Manager - Web Audio API
// ============================================
class SoundManager {
    constructor() {
        this.audioContext = null;
        this.enabled = true;
        this.volume = 0.3;
    }

    init() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.log('Web Audio API não suportada');
            this.enabled = false;
        }
    }

    ensureContext() {
        if (!this.audioContext) {
            this.init();
        }
        if (this.audioContext && this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Som de jogada normal
    playMove() {
        if (!this.enabled) return;
        this.ensureContext();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 600;
        osc.type = 'sine';

        gain.gain.setValueAtTime(this.volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Som de vitória em mini-tabuleiro
    playMiniWin() {
        if (!this.enabled) return;
        this.ensureContext();

        const frequencies = [523, 659, 784]; // C5, E5, G5

        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'triangle';

            const startTime = this.audioContext.currentTime + (i * 0.1);
            gain.gain.setValueAtTime(this.volume * 0.8, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    // Som de vitória final
    playWin() {
        if (!this.enabled) return;
        this.ensureContext();

        const frequencies = [523, 659, 784, 1047]; // C5, E5, G5, C6

        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'square';

            const startTime = this.audioContext.currentTime + (i * 0.15);
            gain.gain.setValueAtTime(this.volume, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    // Som de timer acabando (alerta)
    playTimerAlert() {
        if (!this.enabled) return;
        this.ensureContext();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 800;
        osc.type = 'sawtooth';

        gain.gain.setValueAtTime(this.volume * 0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.15);
    }

    // Som de jogada aleatória (tempo acabou)
    playRandomMove() {
        if (!this.enabled) return;
        this.ensureContext();

        const frequencies = [400, 300];

        frequencies.forEach((freq, i) => {
            const osc = this.audioContext.createOscillator();
            const gain = this.audioContext.createGain();

            osc.connect(gain);
            gain.connect(this.audioContext.destination);

            osc.frequency.value = freq;
            osc.type = 'triangle';

            const startTime = this.audioContext.currentTime + (i * 0.1);
            gain.gain.setValueAtTime(this.volume * 0.6, startTime);
            gain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            osc.start(startTime);
            osc.stop(startTime + 0.15);
        });
    }

    // Som de clique de botão
    playClick() {
        if (!this.enabled) return;
        this.ensureContext();

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.audioContext.destination);

        osc.frequency.value = 1000;
        osc.type = 'sine';

        gain.gain.setValueAtTime(this.volume * 0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.05);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.05);
    }

    toggle() {
        this.enabled = !this.enabled;
        return this.enabled;
    }
}

// Instância global do gerenciador de som
const soundManager = new SoundManager();


class UltimateTicTacToe {
    constructor() {
        // Modo de jogo
        this.gameMode = null; // 'pvp' ou 'pve'
        this.aiDifficulty = 'medium';
        this.aiPlayer = 'O';
        this.humanPlayer = 'X';

        // Modo tempo
        this.timerEnabled = false;
        this.timerInterval = null;
        this.currentTime = 0;
        this.maxTime = 10; // Tempo inicial em segundos
        this.minTime = 3; // Tempo mínimo
        this.turnCount = 0;
        this.timeDecreaseRate = 0.3; // Segundos a diminuir por turno

        // Estado do jogo
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.activeBoard = null;
        this.isAiThinking = false;

        // 9 mini-tabuleiros, cada um com 9 células
        this.miniBoards = Array(9).fill(null).map(() => Array(9).fill(null));

        // Resultado de cada mini-tabuleiro
        this.miniBoardWinners = Array(9).fill(null);

        // Combinações vencedoras
        this.winPatterns = [
            [0, 1, 2], [3, 4, 5], [6, 7, 8],
            [0, 3, 6], [1, 4, 7], [2, 5, 8],
            [0, 4, 8], [2, 4, 6]
        ];

        // Pesos para avaliação de posições
        this.positionWeights = [3, 2, 3, 2, 4, 2, 3, 2, 3];

        // Elementos DOM
        this.modeSelection = document.getElementById('mode-selection');
        this.gameArea = document.getElementById('game-area');
        this.macroBoardEl = document.getElementById('macro-board');
        this.currentPlayerEl = document.getElementById('current-player');
        this.gameMessageEl = document.getElementById('game-message');
        this.aiIndicator = document.getElementById('ai-indicator');
        this.restartBtn = document.getElementById('restart-btn');
        this.menuBtn = document.getElementById('menu-btn');
        this.rulesBtn = document.getElementById('rules-btn');
        this.rulesModal = document.getElementById('rules-modal');
        this.closeRulesBtn = document.querySelector('.close-rules');
        this.difficultySelection = document.getElementById('difficulty-selection');
        this.pvpOptions = document.getElementById('pvp-options');

        // Timer elements
        this.timerContainer = document.getElementById('timer-container');
        this.timerBar = document.getElementById('timer-bar');
        this.timerSeconds = document.getElementById('timer-seconds');

        this.init();
    }

    init() {
        this.setupModeSelection();
        this.setupEventListeners();
    }

    setupModeSelection() {
        const pvpBtn = document.getElementById('pvp-btn');
        const pveBtn = document.getElementById('pve-btn');
        const difficultyBtns = document.querySelectorAll('.difficulty-btn');
        const timeModeBtns = document.querySelectorAll('.time-mode-btn');

        pvpBtn.addEventListener('click', () => {
            this.pvpOptions.classList.remove('hidden');
            this.difficultySelection.classList.add('hidden');
            pvpBtn.classList.add('selected');
            pveBtn.classList.remove('selected');
        });

        pveBtn.addEventListener('click', () => {
            this.difficultySelection.classList.remove('hidden');
            this.pvpOptions.classList.add('hidden');
            pveBtn.classList.add('selected');
            pvpBtn.classList.remove('selected');
        });

        // Seleção de modo tempo para PVP
        timeModeBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.gameMode = 'pvp';
                this.timerEnabled = btn.dataset.time === 'on';
                this.startGame();
            });
        });

        difficultyBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.gameMode = 'pve';
                this.aiDifficulty = btn.dataset.difficulty;
                this.timerEnabled = false;
                this.startGame();
            });
        });
    }

    startGame() {
        this.modeSelection.classList.add('hidden');
        this.gameArea.classList.remove('hidden');
        this.createBoard();
        this.updateActiveBoards();

        if (this.gameMode === 'pve') {
            this.aiIndicator.classList.remove('hidden');
        } else {
            this.aiIndicator.classList.add('hidden');
        }

        // Iniciar timer se habilitado
        if (this.timerEnabled) {
            this.timerContainer.classList.remove('hidden');
            this.startTimer();
        } else {
            this.timerContainer.classList.add('hidden');
        }
    }

    // ============================================
    // TIMER SYSTEM
    // ============================================

    startTimer() {
        this.stopTimer();

        // Calcular tempo para este turno (diminui conforme avança)
        const timeForTurn = Math.max(
            this.minTime,
            this.maxTime - (this.turnCount * this.timeDecreaseRate)
        );

        this.currentTime = timeForTurn;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.currentTime -= 0.1;
            this.updateTimerDisplay();

            if (this.currentTime <= 0) {
                this.onTimerExpired();
            }
        }, 100);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }

    updateTimerDisplay() {
        const timeForTurn = Math.max(
            this.minTime,
            this.maxTime - (this.turnCount * this.timeDecreaseRate)
        );

        const percentage = (this.currentTime / timeForTurn) * 100;
        this.timerBar.style.width = `${percentage}%`;
        this.timerSeconds.textContent = Math.ceil(this.currentTime);

        const wasWarning = this.timerBar.classList.contains('warning');
        const wasDanger = this.timerBar.classList.contains('danger');

        // Remover classes anteriores
        this.timerBar.classList.remove('warning', 'danger');
        this.timerSeconds.classList.remove('warning', 'danger');

        // Adicionar classes baseado no tempo restante
        if (percentage <= 30) {
            this.timerBar.classList.add('danger');
            this.timerSeconds.classList.add('danger');

            // Som de alerta ao entrar em zona perigosa
            if (!wasDanger) {
                soundManager.playTimerAlert();
            }
        } else if (percentage <= 50) {
            this.timerBar.classList.add('warning');
            this.timerSeconds.classList.add('warning');
        }
    }

    onTimerExpired() {
        this.stopTimer();

        // Som de tempo esgotado
        soundManager.playRandomMove();

        // Fazer jogada aleatória
        const availableMoves = this.getAvailableMoves();

        if (availableMoves.length > 0) {
            const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];

            // Marcar como jogada aleatória (forçada pelo tempo)
            this.makeMove(randomMove.board, randomMove.cell, false, true);
        }
    }

    showMenu() {
        this.stopTimer();
        this.modeSelection.classList.remove('hidden');
        this.gameArea.classList.add('hidden');
        this.difficultySelection.classList.add('hidden');
        this.pvpOptions.classList.add('hidden');
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('selected'));
        this.resetGameState();
    }

    resetGameState() {
        this.stopTimer();
        this.currentPlayer = 'X';
        this.gameOver = false;
        this.activeBoard = null;
        this.isAiThinking = false;
        this.turnCount = 0;
        this.miniBoards = Array(9).fill(null).map(() => Array(9).fill(null));
        this.miniBoardWinners = Array(9).fill(null);
    }

    createBoard() {
        this.macroBoardEl.innerHTML = '';

        for (let boardIndex = 0; boardIndex < 9; boardIndex++) {
            const miniBoard = document.createElement('div');
            miniBoard.className = 'mini-board';
            miniBoard.dataset.board = boardIndex;

            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.board = boardIndex;
                cell.dataset.cell = cellIndex;

                cell.addEventListener('click', (e) => this.handleCellClick(e));

                miniBoard.appendChild(cell);
            }

            this.macroBoardEl.appendChild(miniBoard);
        }
    }

    setupEventListeners() {
        this.restartBtn.addEventListener('click', () => this.restart());
        this.menuBtn.addEventListener('click', () => this.showMenu());
        this.rulesBtn.addEventListener('click', () => this.rulesModal.classList.remove('hidden'));
        this.closeRulesBtn.addEventListener('click', () => this.rulesModal.classList.add('hidden'));
        this.rulesModal.addEventListener('click', (e) => {
            if (e.target === this.rulesModal) {
                this.rulesModal.classList.add('hidden');
            }
        });

        // Botão de toggle de som
        const soundToggle = document.getElementById('sound-toggle');
        if (soundToggle) {
            soundToggle.addEventListener('click', () => {
                const enabled = soundManager.toggle();
                soundToggle.textContent = enabled ? '🔊' : '🔇';
                soundToggle.classList.toggle('muted', !enabled);
                if (enabled) {
                    soundManager.playClick();
                }
            });
        }
    }

    handleCellClick(e) {
        if (this.gameOver || this.isAiThinking) return;

        if (this.gameMode === 'pve' && this.currentPlayer === this.aiPlayer) return;

        const cell = e.target;
        const boardIndex = parseInt(cell.dataset.board);
        const cellIndex = parseInt(cell.dataset.cell);

        if (!this.isValidMove(boardIndex, cellIndex)) return;

        this.makeMove(boardIndex, cellIndex);

        if (this.gameMode === 'pve' && !this.gameOver && this.currentPlayer === this.aiPlayer) {
            this.makeAiMove();
        }
    }

    isValidMove(boardIndex, cellIndex) {
        if (this.activeBoard !== null && this.activeBoard !== boardIndex) return false;
        if (this.miniBoardWinners[boardIndex] !== null) return false;
        if (this.miniBoards[boardIndex][cellIndex] !== null) return false;
        return true;
    }

    makeMove(boardIndex, cellIndex, isAi = false, isRandom = false) {
        // Parar timer antes de processar jogada
        if (this.timerEnabled) {
            this.stopTimer();
        }

        // Som de jogada (se não for aleatória - ela tem som próprio)
        if (!isRandom) {
            soundManager.playMove();
        }

        this.miniBoards[boardIndex][cellIndex] = this.currentPlayer;

        const cell = document.querySelector(
            `.cell[data-board="${boardIndex}"][data-cell="${cellIndex}"]`
        );
        cell.textContent = this.currentPlayer;
        cell.classList.add(this.currentPlayer.toLowerCase(), 'taken');

        if (isAi) {
            cell.classList.add('ai-move');
        }

        if (isRandom) {
            cell.classList.add('random-move');
        }

        const miniWinner = this.checkWinner(this.miniBoards[boardIndex]);
        if (miniWinner) {
            this.miniBoardWinners[boardIndex] = miniWinner;
            this.updateMiniBoardVisual(boardIndex, miniWinner);

            // Som de vitória no mini-tabuleiro
            soundManager.playMiniWin();

            const macroWinner = this.checkMacroWinner();
            if (macroWinner) {
                this.endGame(macroWinner);
                return;
            }
        } else if (this.isBoardFull(this.miniBoards[boardIndex])) {
            this.miniBoardWinners[boardIndex] = 'draw';
            this.updateMiniBoardVisual(boardIndex, 'draw');

            if (this.isGameDraw()) {
                this.endGame('draw');
                return;
            }
        }

        this.setNextActiveBoard(cellIndex);
        this.switchPlayer();
        this.turnCount++;
        this.updateActiveBoards();

        // Reiniciar timer para próximo jogador
        if (this.timerEnabled && !this.gameOver) {
            this.startTimer();
        }
    }

    // ============================================
    // AI LOGIC
    // ============================================

    makeAiMove() {
        this.isAiThinking = true;
        this.gameMessageEl.textContent = '🤖 IA pensando...';

        const thinkTime = this.aiDifficulty === 'easy' ? 300 :
            this.aiDifficulty === 'medium' ? 500 : 800;

        setTimeout(() => {
            const move = this.getBestMove();
            if (move) {
                this.makeMove(move.board, move.cell, true);
            }
            this.isAiThinking = false;

            if (!this.gameOver) {
                this.updateActiveBoards();
            }
        }, thinkTime);
    }

    getBestMove() {
        const availableMoves = this.getAvailableMoves();
        if (availableMoves.length === 0) return null;

        switch (this.aiDifficulty) {
            case 'easy':
                return this.getEasyMove(availableMoves);
            case 'medium':
                return this.getMediumMove(availableMoves);
            case 'hard':
                return this.getHardMove(availableMoves);
            default:
                return availableMoves[Math.floor(Math.random() * availableMoves.length)];
        }
    }

    getAvailableMoves() {
        const moves = [];
        const boardsToCheck = this.activeBoard !== null ?
            [this.activeBoard] :
            Array.from({ length: 9 }, (_, i) => i);

        for (const boardIndex of boardsToCheck) {
            if (this.miniBoardWinners[boardIndex] !== null) continue;

            for (let cellIndex = 0; cellIndex < 9; cellIndex++) {
                if (this.miniBoards[boardIndex][cellIndex] === null) {
                    moves.push({ board: boardIndex, cell: cellIndex });
                }
            }
        }

        return moves;
    }

    getEasyMove(moves) {
        if (Math.random() < 0.3) {
            const winMove = this.findWinningMove(moves, this.aiPlayer);
            if (winMove) return winMove;
        }

        return moves[Math.floor(Math.random() * moves.length)];
    }

    getMediumMove(moves) {
        const winMove = this.findWinningMove(moves, this.aiPlayer);
        if (winMove) return winMove;

        const blockMove = this.findWinningMove(moves, this.humanPlayer);
        if (blockMove) return blockMove;

        const centerMoves = moves.filter(m => m.cell === 4);
        if (centerMoves.length > 0) {
            return centerMoves[Math.floor(Math.random() * centerMoves.length)];
        }

        const cornerMoves = moves.filter(m => [0, 2, 6, 8].includes(m.cell));
        if (cornerMoves.length > 0) {
            return cornerMoves[Math.floor(Math.random() * cornerMoves.length)];
        }

        return moves[Math.floor(Math.random() * moves.length)];
    }

    getHardMove(moves) {
        let bestScore = -Infinity;
        let bestMoves = [];

        for (const move of moves) {
            const score = this.evaluateMove(move);

            if (score > bestScore) {
                bestScore = score;
                bestMoves = [move];
            } else if (score === bestScore) {
                bestMoves.push(move);
            }
        }

        return bestMoves[Math.floor(Math.random() * bestMoves.length)];
    }

    evaluateMove(move) {
        let score = 0;
        const { board, cell } = move;

        const originalCell = this.miniBoards[board][cell];
        const originalWinner = this.miniBoardWinners[board];
        this.miniBoards[board][cell] = this.aiPlayer;

        if (this.checkWinner(this.miniBoards[board]) === this.aiPlayer) {
            score += 100;

            this.miniBoardWinners[board] = this.aiPlayer;
            if (this.checkMacroWinner() === this.aiPlayer) {
                score += 1000;
            }
            this.miniBoardWinners[board] = originalWinner;
        }

        this.miniBoards[board][cell] = originalCell;

        this.miniBoards[board][cell] = this.humanPlayer;
        if (this.checkWinner(this.miniBoards[board]) === this.humanPlayer) {
            score += 50;
        }
        this.miniBoards[board][cell] = originalCell;

        score += this.positionWeights[cell];
        score += this.positionWeights[board] * 2;

        if (this.miniBoardWinners[cell] === null) {
            const opponentAdvantage = this.evaluateBoardAdvantage(cell, this.humanPlayer);
            score -= opponentAdvantage * 10;
        }

        if (this.miniBoardWinners[cell] !== null) {
            score -= 20;
        }

        score += this.evaluateMacroProgress(board);

        return score;
    }

    evaluateBoardAdvantage(boardIndex, player) {
        const board = this.miniBoards[boardIndex];
        let advantage = 0;

        for (const pattern of this.winPatterns) {
            const line = pattern.map(i => board[i]);
            const playerCount = line.filter(c => c === player).length;
            const emptyCount = line.filter(c => c === null).length;

            if (playerCount > 0 && emptyCount === 3 - playerCount) {
                advantage += playerCount;
            }
        }

        return advantage;
    }

    evaluateMacroProgress(boardIndex) {
        let score = 0;

        for (const pattern of this.winPatterns) {
            if (!pattern.includes(boardIndex)) continue;

            const line = pattern.map(i => this.miniBoardWinners[i]);
            const aiCount = line.filter(w => w === this.aiPlayer).length;
            const humanCount = line.filter(w => w === this.humanPlayer).length;
            const emptyCount = line.filter(w => w === null).length;

            if (humanCount === 0 && emptyCount > 0) {
                score += aiCount * 15;
            }

            if (aiCount === 0 && humanCount === 2 && emptyCount === 1) {
                score += 30;
            }
        }

        return score;
    }

    findWinningMove(moves, player) {
        for (const move of moves) {
            const { board, cell } = move;

            this.miniBoards[board][cell] = player;
            const winner = this.checkWinner(this.miniBoards[board]);
            this.miniBoards[board][cell] = null;

            if (winner === player) {
                return move;
            }
        }
        return null;
    }

    // ============================================
    // GAME LOGIC
    // ============================================

    checkWinner(board) {
        for (const pattern of this.winPatterns) {
            const [a, b, c] = pattern;
            if (board[a] && board[a] === board[b] && board[a] === board[c]) {
                return board[a];
            }
        }
        return null;
    }

    checkMacroWinner() {
        const simplifiedWinners = this.miniBoardWinners.map(w =>
            w === 'draw' ? null : w
        );
        return this.checkWinner(simplifiedWinners);
    }

    isBoardFull(board) {
        return board.every(cell => cell !== null);
    }

    isGameDraw() {
        return this.miniBoardWinners.every(winner => winner !== null);
    }

    updateMiniBoardVisual(boardIndex, winner) {
        const miniBoard = document.querySelector(`.mini-board[data-board="${boardIndex}"]`);

        if (winner === 'draw') {
            miniBoard.classList.add('drawn');
        } else {
            miniBoard.classList.add(`won-${winner.toLowerCase()}`);
            miniBoard.dataset.winner = winner;
        }

        miniBoard.querySelectorAll('.cell').forEach(cell => {
            cell.classList.add('disabled');
        });
    }

    setNextActiveBoard(cellIndex) {
        if (this.miniBoardWinners[cellIndex] !== null) {
            this.activeBoard = null;
        } else {
            this.activeBoard = cellIndex;
        }
    }

    switchPlayer() {
        this.currentPlayer = this.currentPlayer === 'X' ? 'O' : 'X';
        this.currentPlayerEl.textContent = this.currentPlayer;
        this.currentPlayerEl.className = `player-${this.currentPlayer.toLowerCase()}`;
    }

    updateActiveBoards() {
        document.querySelectorAll('.mini-board').forEach((board, index) => {
            board.classList.remove('active');

            const isPlayable = this.activeBoard === null || this.activeBoard === index;
            const isAvailable = this.miniBoardWinners[index] === null;

            board.querySelectorAll('.cell').forEach(cell => {
                if (!isPlayable || !isAvailable) {
                    cell.classList.add('disabled');
                } else if (!cell.classList.contains('taken')) {
                    cell.classList.remove('disabled');
                }
            });

            if (isPlayable && isAvailable) {
                board.classList.add('active');
            }
        });

        if (!this.isAiThinking) {
            if (this.activeBoard !== null) {
                const positions = [
                    'superior esquerdo', 'superior centro', 'superior direito',
                    'centro esquerdo', 'centro', 'centro direito',
                    'inferior esquerdo', 'inferior centro', 'inferior direito'
                ];
                this.gameMessageEl.textContent = `Jogue no tabuleiro ${positions[this.activeBoard]}`;
            } else {
                this.gameMessageEl.textContent = 'Jogue em qualquer tabuleiro';
            }
        }
    }

    endGame(winner) {
        this.gameOver = true;
        this.stopTimer();

        // Som de vitória final
        soundManager.playWin();

        const overlay = document.createElement('div');
        overlay.className = 'victory-overlay';

        let message, className;
        if (winner === 'draw') {
            message = 'Empate!';
            className = 'draw';
        } else if (this.gameMode === 'pve') {
            if (winner === this.humanPlayer) {
                message = 'Você Venceu! 🎉';
                className = 'x-wins';
            } else {
                message = 'IA Venceu! 🤖';
                className = 'o-wins';
            }
        } else {
            message = `${winner} Venceu!`;
            className = `${winner.toLowerCase()}-wins`;
        }

        overlay.innerHTML = `
            <div class="victory-text ${className}">${message}</div>
            <button class="play-again-btn">Jogar Novamente</button>
            <button class="menu-btn-victory">Menu Principal</button>
        `;

        document.body.appendChild(overlay);

        overlay.querySelector('.play-again-btn').addEventListener('click', () => {
            overlay.remove();
            this.restart();
        });

        overlay.querySelector('.menu-btn-victory').addEventListener('click', () => {
            overlay.remove();
            this.showMenu();
        });
    }

    restart() {
        this.resetGameState();

        this.currentPlayerEl.textContent = 'X';
        this.currentPlayerEl.className = 'player-x';

        this.createBoard();
        this.updateActiveBoards();

        const overlay = document.querySelector('.victory-overlay');
        if (overlay) overlay.remove();

        // Reiniciar timer se habilitado
        if (this.timerEnabled) {
            this.startTimer();
        }
    }
}

// Iniciar o jogo quando a página carregar
document.addEventListener('DOMContentLoaded', () => {
    new UltimateTicTacToe();
});
