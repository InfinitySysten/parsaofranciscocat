document.addEventListener('DOMContentLoaded', () => {  
  // CONFIGURAÇÃO DAS ESTAÇÕES DA VIA SACRA
    const STATIONS = {
        2: {
            title: "1ª Estação",
            description: "Jesus é condenado à morte. Pilatos cede à pressão da multidão e condena Jesus, o inocente, à morte na cruz."
        },
        4: {
            title: "2ª Estação",
            description: "Jesus carrega a cruz. Nosso Senhor aceita a cruz com amor e resignação, carregando sobre seus ombros o peso dos nossos pecados."
        },
        8: {
            title: "3ª Estação",
            description: "Jesus cai pela primeira vez. Sob o peso da cruz e dos nossos pecados, Jesus cai, mas se levanta com determinação."
        },
        16: {
            title: "4ª Estação",
            description: "Jesus encontra sua Mãe. Maria, cheia de dor mas forte na fé, encontra seu filho no caminho do calvário."
        },
        32: {
            title: "5ª Estação",
            description: "Simão Cireneu ajuda Jesus. Um homem do povo é convocado para ajudar Jesus a carregar a cruz."
        },
        64: {
            title: "6ª Estação",
            description: "Verônica enxuga o rosto de Jesus. Uma mulher corajosa se aproxima e enxuga o rosto de Jesus, recebendo sua imagem gravada no véu."
        },
        128: {
            title: "7ª Estação",
            description: "Jesus cai pela segunda vez. Mais uma vez Jesus cai sob o peso da cruz, mas continua seu caminho."
        },
        256: {
            title: "8ª Estação",
            description: "Jesus consola as mulheres. Jesus, mesmo sofrendo, consola as mulheres de Jerusalém que choram por ele."
        },
        512: {
            title: "9ª Estação",
            description: "Jesus cai pela terceira vez. Próximo ao calvário, Jesus cai pela terceira vez, demonstrando sua humanidade."
        },
        1024: {
            title: "10ª Estação",
            description: "Jesus é despojado de suas vestes. Os soldados tiram as roupas de Jesus, humilhando-o publicamente."
        },
        2048: {
            title: "11ª Estação",
            description: "Jesus é pregado na cruz. As mãos que abençoaram tantos são pregadas na cruz por amor à humanidade."
        },
        4096: {
            title: "12ª Estação",
            description: "Jesus morre na cruz. Depois de três horas de agonia, Jesus entrega seu espírito ao Pai."
        },
        8192: {
            title: "13ª Estação",
            description: "Jesus é descido da cruz. O corpo de Jesus é retirado da cruz e entregue a Maria, sua mãe."
        },
        16384: {
            title: "14ª Estação",
            description: "Jesus é colocado no sepulcro. O corpo de Jesus é sepultado, mas a história não termina aqui..."
        }
    };

    const LEVELS = {
        easy: 6,
        medium: 5,
        hard: 4
    };

    class Game2048 {
        constructor(size=4) {
            this.size = size;
            this.grid = [];
            this.score = 0;
            this.bestScore = parseInt(localStorage.getItem('bestScore2048')) || 0;
            this.previousState = null;
            this.moved = false;
            this.seenStations = new Set();
            this.showMessages = localStorage.getItem('showMessages2048') !== 'false';
            this.isPaused = false;
            this.startTime = Date.now();
            this.elapsedTime = 0;
            this.timerInterval = null;
            this.previousGrid = [];
            this.newValueCreated = null;
            
            this.initGrid();
            this.setupEventListeners();
            this.updateMessageButton();
            this.updateDisplay();
            this.addRandomTile();
            this.addRandomTile();
            this.renderTiles();
            this.startTimer();
        }

        startTimer() {
            this.timerInterval = setInterval(() => {
                if (!this.isPaused) {
                    this.elapsedTime = Math.floor((Date.now() - this.startTime) / 1000);
                    this.updateTimerDisplay();
                }
            }, 1000);
        }

        updateTimerDisplay() {
            const minutes = Math.floor(this.elapsedTime / 60);
            const seconds = this.elapsedTime % 60;
            document.getElementById('timer').textContent = 
                `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }

        pauseGame() {
            this.isPaused = true;
            document.getElementById('pausedIndicator').classList.add('show');
        }

        resumeGame() {
            this.isPaused = false;
            this.startTime = Date.now() - (this.elapsedTime * 1000);
            document.getElementById('pausedIndicator').classList.remove('show');
        }

        initGrid() {
            this.grid = [];
            for (let i = 0; i < this.size; i++) {
                this.grid[i] = [];
                for (let j = 0; j < this.size; j++) {
                    this.grid[i][j] = 0;
                }
            }
        }

        setupEventListeners() {
            this.keyHandler = (e) => {
                if (this.isPaused) return;

                if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                    e.preventDefault();
                    this.handleMove(e.key);
                }
            };

            document.addEventListener('keydown', this.keyHandler);

            document.querySelectorAll('.arrow-key').forEach(key => {
                key.addEventListener('click', () => {
                    if (this.isPaused) return;
                    
                    const direction = key.dataset.direction;
                    const keyMap = {
                        'up': 'ArrowUp',
                        'down': 'ArrowDown',
                        'left': 'ArrowLeft',
                        'right': 'ArrowRight'
                    };
                    this.handleMove(keyMap[direction]);
                });
            });

            document.getElementById('newGameBtn').addEventListener('click', () => this.newGame());
            document.getElementById('undoBtn').addEventListener('click', () => this.undo());
            
            document.getElementById('continueBtn').addEventListener('click', () => this.closeStationModal());
            document.getElementById('dontShowAgainBtn').addEventListener('click', () => this.disableMessages());
            document.getElementById('reactivateMessagesBtn').addEventListener('click', () => this.reactivateMessages());

            document.getElementById('restartBtn').addEventListener('click', () => {
                if (game) game.newGame();
            });

            // === SUPORTE A SWIPE (MOBILE) ===
            let touchStartX = 0;
            let touchStartY = 0;

            const container = document.getElementById('gridContainer');

            container.addEventListener('touchstart', (e) => {
                const touch = e.touches[0];
                touchStartX = touch.clientX;
                touchStartY = touch.clientY;
            }, { passive: true });

            container.addEventListener('touchend', (e) => {
                if (this.isPaused) return;

                const touch = e.changedTouches[0];
                const diffX = touch.clientX - touchStartX;
                const diffY = touch.clientY - touchStartY;

                const absX = Math.abs(diffX);
                const absY = Math.abs(diffY);

                const threshold = 30;
                if (Math.max(absX, absY) < threshold) return;

                if (absX > absY) {
                    this.handleMove(diffX > 0 ? 'ArrowRight' : 'ArrowLeft');
                } else {
                    this.handleMove(diffY > 0 ? 'ArrowDown' : 'ArrowUp');
                }
            });

            document.querySelectorAll('.level-btn').forEach(btn => {
                btn.addEventListener('click', () => {
                    const level = btn.dataset.level;
                    startGame(level);
                });
            });
        }

        checkForNewValues() {
            // Encontra todos os valores únicos no grid atual
            const currentValues = new Set();
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] > 0) {
                        currentValues.add(this.grid[i][j]);
                    }
                }
            }

            // Encontra todos os valores únicos no grid anterior
            const previousValues = new Set();
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.previousGrid[i] && this.previousGrid[i][j] > 0) {
                        previousValues.add(this.previousGrid[i][j]);
                    }
                }
            }

            // Encontra valores novos (que estão no atual mas não estavam no anterior)
            const newValues = [...currentValues].filter(v => !previousValues.has(v));
            
            // Retorna o maior valor novo encontrado (que foi criado por merge)
            return newValues.length > 0 ? Math.max(...newValues) : null;
        }

        showStationMessage(value, force = false) {
            if (!this.showMessages || !value) {
                return;
            }

            // Só bloqueia se NÃO for clique manual
            if (!force && this.seenStations.has(value)) {
                return;
            }

            const station = STATIONS[value];
            if (!station) return;

            this.pauseGame();

            if (!force) {
                this.seenStations.add(value);
            }

            document.getElementById('stationTitle').textContent = station.title;

            const imgContainer = document.getElementById('stationNumber');
            imgContainer.innerHTML = '';

            const imgSrc = TILE_IMAGES[value];

            if (imgSrc) {
                const img = document.createElement('img');
                img.src = imgSrc;
                img.style.width = '80px';
                img.style.height = '80px';
                img.style.objectFit = 'contain';
                imgContainer.appendChild(img);
            } else {
                imgContainer.textContent = value;
            }

            document.getElementById('stationDescription').textContent = station.description;
            document.getElementById('stationModal').classList.add('show');
        }

        closeStationModal() {
            document.getElementById('stationModal').classList.remove('show');
            this.resumeGame();
        }

        disableMessages() {
            this.showMessages = false;
            localStorage.setItem('showMessages2048', 'false');
            this.updateMessageButton();
            this.closeStationModal();
        }

        reactivateMessages() {
            this.showMessages = true;
            localStorage.removeItem('showMessages2048');
            this.updateMessageButton();
            alert('Mensagens reativadas!');
        }

        updateMessageButton() {
            const btn = document.getElementById('reactivateMessagesBtn');
            if (this.showMessages) {
                btn.disabled = true;
                btn.textContent = '🔔 Mensagens ativas';
            } else {
                btn.disabled = false;
                btn.textContent = '🔕 Ativar mensagens';
            }
        }

        handleMove(direction) {
            // Salva o grid anterior para comparação
            this.previousGrid = JSON.parse(JSON.stringify(this.grid));
            
            this.saveState();
            this.moved = false;
            
            switch(direction) {
                case 'ArrowUp':
                    this.moveUp();
                    break;
                case 'ArrowDown':
                    this.moveDown();
                    break;
                case 'ArrowLeft':
                    this.moveLeft();
                    break;
                case 'ArrowRight':
                    this.moveRight();
                    break;
            }

            if (this.moved) {
                // Verifica se algum valor novo foi criado (por merge)
                const newValue = this.checkForNewValues();
                
                this.addRandomTile();
                this.renderTiles();
                this.updateDisplay();
                
                // Se um valor novo foi criado, mostra a mensagem
                if (newValue && newValue > 2) {
                    setTimeout(() => {
                        this.showStationMessage(newValue);
                    }, 250);
                }
                
                if (this.checkWin()) {
                    this.pauseGame();
                    this.showGameOverModal('🎉 Você Completou a Via Sacra!', `Parabéns! Você percorreu toda a Via Sacra!<br>Tempo: ${document.getElementById('timer').textContent}<br>Pontuação: ${this.score}`);
                } else if (this.checkGameOver()) {
                    this.pauseGame();
                    this.showGameOverModal('😔 Fim de Jogo', `Sem movimentos possíveis!<br>Tempo: ${document.getElementById('timer').textContent}<br>Pontuação: ${this.score}`);
                }
            }
        }

        saveState() {
            this.previousState = {
                grid: JSON.parse(JSON.stringify(this.grid)),
                score: this.score
            };
        }

        undo() {
            if (this.previousState && !this.isPaused) {
                this.grid = this.previousState.grid;
                this.score = this.previousState.score;
                this.previousState = null;
                this.renderTiles();
                this.updateDisplay();
            }
        }

        destroy() {
            this.isPaused = true;

            clearInterval(this.timerInterval);

            document.removeEventListener('keydown', this.keyHandler);
        }

        moveLeft() {
            for (let i = 0; i < this.size; i++) {
                let row = this.grid[i].filter(val => val !== 0);
                let newRow = [];
                let skip = false;
                
                for (let j = 0; j < row.length; j++) {
                    if (skip) {
                        skip = false;
                        continue;
                    }
                    
                    if (j < row.length - 1 && row[j] === row[j + 1]) {
                        newRow.push(row[j] * 2);
                        this.score += row[j] * 2;
                        skip = true;
                        this.moved = true;
                    } else {
                        newRow.push(row[j]);
                    }
                }
                
                while (newRow.length < this.size) {
                    newRow.push(0);
                }
                
                if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                    this.moved = true;
                }
                
                this.grid[i] = newRow;
            }
        }

        moveRight() {
            for (let i = 0; i < this.size; i++) {
                let row = this.grid[i].filter(val => val !== 0);
                let newRow = [];
                let skip = false;
                
                for (let j = row.length - 1; j >= 0; j--) {
                    if (skip) {
                        skip = false;
                        continue;
                    }
                    
                    if (j > 0 && row[j] === row[j - 1]) {
                        newRow.unshift(row[j] * 2);
                        this.score += row[j] * 2;
                        skip = true;
                        this.moved = true;
                    } else {
                        newRow.unshift(row[j]);
                    }
                }
                
                while (newRow.length < this.size) {
                    newRow.unshift(0);
                }
                
                if (JSON.stringify(this.grid[i]) !== JSON.stringify(newRow)) {
                    this.moved = true;
                }
                
                this.grid[i] = newRow;
            }
        }

        moveUp() {
            for (let j = 0; j < this.size; j++) {
                let col = [];
                for (let i = 0; i < this.size; i++) {
                    if (this.grid[i][j] !== 0) {
                        col.push(this.grid[i][j]);
                    }
                }
                
                let newCol = [];
                let skip = false;
                
                for (let i = 0; i < col.length; i++) {
                    if (skip) {
                        skip = false;
                        continue;
                    }
                    
                    if (i < col.length - 1 && col[i] === col[i + 1]) {
                        newCol.push(col[i] * 2);
                        this.score += col[i] * 2;
                        skip = true;
                        this.moved = true;
                    } else {
                        newCol.push(col[i]);
                    }
                }
                
                while (newCol.length < this.size) {
                    newCol.push(0);
                }
                
                for (let i = 0; i < this.size; i++) {
                    if (this.grid[i][j] !== newCol[i]) {
                        this.moved = true;
                    }
                    this.grid[i][j] = newCol[i];
                }
            }
        }

        moveDown() {
            for (let j = 0; j < this.size; j++) {
                let col = [];
                for (let i = 0; i < this.size; i++) {
                    if (this.grid[i][j] !== 0) {
                        col.push(this.grid[i][j]);
                    }
                }
                
                let newCol = [];
                let skip = false;
                
                for (let i = col.length - 1; i >= 0; i--) {
                    if (skip) {
                        skip = false;
                        continue;
                    }
                    
                    if (i > 0 && col[i] === col[i - 1]) {
                        newCol.unshift(col[i] * 2);
                        this.score += col[i] * 2;
                        skip = true;
                        this.moved = true;
                    } else {
                        newCol.unshift(col[i]);
                    }
                }
                
                while (newCol.length < this.size) {
                    newCol.unshift(0);
                }
                
                for (let i = 0; i < this.size; i++) {
                    if (this.grid[i][j] !== newCol[i]) {
                        this.moved = true;
                    }
                    this.grid[i][j] = newCol[i];
                }
            }
        }

        addRandomTile() {
            let emptyCells = [];
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] === 0) {
                        emptyCells.push({row: i, col: j});
                    }
                }
            }

            if (emptyCells.length > 0) {
                let randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
                const value = Math.random() < 0.9 ? 2 : 4;
                this.grid[randomCell.row][randomCell.col] = value;
                return value;
            }
            return null;
        }

        renderTiles() {
            const container = document.getElementById('gridContainer');
            const existingTiles = container.querySelectorAll('.tile');
            existingTiles.forEach(tile => tile.remove());

            const cellSize = container.offsetWidth / this.size;
            const gap = 2.1;

            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const value = this.grid[i][j];

                    if (value !== 0) {
                        const tile = document.createElement('div');
                        tile.className = `tile tile-${value} tile-new`;

                        tile.style.width = `${cellSize - 15}px`;
                        tile.style.height = `${cellSize - 15}px`;
                        tile.style.left = `${j * (cellSize + gap) + 4}px`;
                        tile.style.top = `${i * (cellSize + gap) + 4}px`;

                        const imgSrc = TILE_IMAGES[value];

                        if (imgSrc) {
                            const img = document.createElement('img');
                            img.src = imgSrc;
                            img.style.width = '100%';
                            img.style.height = '100%';
                            img.style.objectFit = 'contain';
                            img.draggable = false;
                            tile.appendChild(img);
                        } else {
                            tile.textContent = value;
                        }

                        // ✅ AQUI é o lugar correto
                        tile.addEventListener('click', () => {
                            this.showStationMessage(value, true);
                        });

                        container.appendChild(tile);

                        setTimeout(() => {
                            tile.classList.remove('tile-new');
                        }, 200);
                    }
                }
            }
        }

        updateDisplay() {
            document.getElementById('score').textContent = this.score;
            
            if (this.score > this.bestScore) {
                this.bestScore = this.score;
                localStorage.setItem('bestScore2048', this.bestScore);
            }
            
            document.getElementById('bestScore').textContent = this.bestScore;
        }

        checkWin() {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] === 16384) {
                        return true;
                    }
                }
            }
            return false;
        }

        checkGameOver() {
            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    if (this.grid[i][j] === 0) {
                        return false;
                    }
                }
            }

            for (let i = 0; i < this.size; i++) {
                for (let j = 0; j < this.size; j++) {
                    const current = this.grid[i][j];
                    if (j < this.size - 1 && current === this.grid[i][j + 1]) {
                        return false;
                    }
                    if (i < this.size - 1 && current === this.grid[i + 1][j]) {
                        return false;
                    }
                }
            }

            return true;
        }

        showGameOverModal(title, message) {
            document.getElementById('modalTitle').textContent = title;
            document.getElementById('modalMessage').innerHTML = message;
            document.getElementById('gameOverModal').classList.add('show');
        }

        newGame() {
            document.getElementById('gameOverModal').classList.remove('show');
            this.score = 0;
            this.previousState = null;
            this.isPaused = false;
            this.startTime = Date.now();
            this.elapsedTime = 0;
            this.previousGrid = [];
            this.initGrid();
            this.addRandomTile();
            this.addRandomTile();
            this.renderTiles();
            this.updateDisplay();
            this.updateTimerDisplay();
            document.getElementById('pausedIndicator').classList.remove('show');
        }
    }

    function initMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav');
        
        if (mobileMenuBtn && nav) {
            mobileMenuBtn.addEventListener('click', function() {
                this.classList.toggle('active');
                nav.classList.toggle('active');
            });
            
            // Fecha ao clicar fora
            document.addEventListener('click', function(e) {
                if (!nav.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                    closeMobileMenu();
                }
            });
            
            // Fecha ao redimensionar
            window.addEventListener('resize', function() {
                if (window.innerWidth > 768) {
                    closeMobileMenu();
                }
            });
        }
    }

    function closeMobileMenu() {
        const mobileMenuBtn = document.getElementById('mobile-menu-btn');
        const nav = document.getElementById('nav');
        
        if (mobileMenuBtn && nav) {
            mobileMenuBtn.classList.remove('active');
            nav.classList.remove('active');
        }
    }

    let TILE_IMAGES = {};
    let game = null;

    function startGame(level) {
        const size = LEVELS[level] || 4;

        // Atualiza grid visual antes de instanciar
        updateGridLayout(size);

        if (game) {
            game.destroy();
        }

        game = new Game2048(size);
    }

    function updateGridLayout(size) {
        const container = document.getElementById('gridContainer');

        // limpa grid
        container.innerHTML = '';

        // atualiza CSS grid
        container.style.gridTemplateColumns = `repeat(${size}, 1fr)`;

        // recria células
        for (let i = 0; i < size * size; i++) {
            const cell = document.createElement('div');
            cell.classList.add('grid-cell');
            container.appendChild(cell);
        }
    }

    fetch('../../data/estacoes.json')
        .then(res => res.json())
        .then(data => {
            TILE_IMAGES = data;
            initMobileMenu();
            startGame('hard');
        })
        .catch(err => {
            console.error('Erro ao carregar imagens:', err);
            startGame('hard');
        });
});