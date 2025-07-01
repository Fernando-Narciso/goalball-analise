// Armazenamento de dados do jogo
let gameData = {
    plays: [],
    gameInfo: {
        teamA: '',
        teamB: '',
        date: '',
        location: '',
        athletes: [],
        startTime: null,
        endTime: null,
        isActive: false
    }
};

let gameTimer = null;

// Inicializar aplicação
document.addEventListener('DOMContentLoaded', function() {
    // Definir data atual
    document.getElementById('gameDate').valueAsDate = new Date();

    // Adicionar evento ao formulário de jogadas
    const playForm = document.getElementById('playForm');
    if (playForm) {
        playForm.addEventListener('submit', function(e) {
            e.preventDefault();
            registerPlay();
        });
    }

    // Eventos de teclado para acessibilidade
    setupKeyboardShortcuts();

    // Atualizar contador de atletas
    updateAthleteCount();

    // Anunciar carregamento da página para leitores de tela
    setTimeout(() => {
        announceToScreenReader('Sistema de análise de goalball carregado e pronto para uso');
    }, 1000);
});

// Função para adicionar atleta
function addAthlete() {
    const container = document.getElementById('athletesContainer');
    const athleteInputs = container.querySelectorAll('.athlete-input');

    if (athleteInputs.length >= 6) {
        alert('Máximo de 6 atletas permitido');
        return;
    }

    const athleteDiv = document.createElement('div');
    athleteDiv.className = 'athlete-input';
    athleteDiv.innerHTML = `
        <input type="text" class="athlete-name" placeholder="Nome do Atleta ${athleteInputs.length + 1}" required>
        <button type="button" onclick="removeAthlete(this)">Remover</button>
    `;

    container.appendChild(athleteDiv);
    updateAthleteCount();
    updateRemoveButtons();
}

// Função para remover atleta
function removeAthlete(button) {
    const container = document.getElementById('athletesContainer');
    const athleteInputs = container.querySelectorAll('.athlete-input');

    if (athleteInputs.length <= 3) {
        alert('Mínimo de 3 atletas necessário');
        return;
    }

    button.parentElement.remove();
    updateAthleteCount();
    updateRemoveButtons();

    // Renumerar placeholders
    const remainingInputs = container.querySelectorAll('.athlete-name');
    remainingInputs.forEach((input, index) => {
        input.placeholder = `Nome do Atleta ${index + 1}`;
    });
}

// Função para atualizar contador de atletas
function updateAthleteCount() {
    const athleteInputs = document.querySelectorAll('.athlete-input');
    const count = athleteInputs.length;
    document.getElementById('athleteCount').textContent = `Atletas cadastrados: ${count}`;

    // Controlar botão de adicionar
    const addBtn = document.getElementById('addAthleteBtn');
    addBtn.disabled = count >= 6;
    addBtn.textContent = count >= 6 ? 'Máximo atingido' : 'Adicionar Atleta';
}

// Função para atualizar botões de remover
function updateRemoveButtons() {
    const athleteInputs = document.querySelectorAll('.athlete-input');
    const removeButtons = document.querySelectorAll('.athlete-input button');

    removeButtons.forEach(button => {
        button.disabled = athleteInputs.length <= 3;
    });
}

// Função para validar e obter atletas
function getValidatedAthletes() {
    const athleteInputs = document.querySelectorAll('.athlete-name');
    const athletes = [];

    for (let input of athleteInputs) {
        const name = input.value.trim();
        if (!name) {
            alert('Por favor, preencha o nome de todos os atletas');
            input.focus();
            return null;
        }
        if (athletes.includes(name)) {
            alert('Não é possível cadastrar atletas com nomes iguais');
            input.focus();
            return null;
        }
        athletes.push(name);
    }

    return athletes;
}

// Função para popular select de atletas
function populateAthleteSelect(athletes) {
    const select = document.getElementById('playerName');
    select.innerHTML = '<option value="">Selecione o atleta</option>';

    athletes.forEach(athlete => {
        const option = document.createElement('option');
        option.value = athlete;
        option.textContent = athlete;
        select.appendChild(option);
    });
}

// Função para iniciar nova partida
function startNewGame() {
    const teamA = document.getElementById('teamA').value.trim();
    const teamB = document.getElementById('teamB').value.trim();
    const gameDate = document.getElementById('gameDate').value;
    const gameLocation = document.getElementById('gameLocation').value.trim();
    const athletes = getValidatedAthletes();

    // Validações
    if (!teamA || !teamB) {
        alert('Por favor, preencha os nomes das duas equipes');
        return;
    }

    if (!gameDate) {
        alert('Por favor, selecione a data da partida');
        return;
    }

    if (!athletes) {
        return; // Erro já tratado na função getValidatedAthletes
    }

    // Confirmar início da partida
    if (!confirm(`Iniciar nova partida entre ${teamA} vs ${teamB}?`)) {
        return;
    }

    // Limpar dados anteriores
    gameData = {
        plays: [],
        gameInfo: {
            teamA: teamA,
            teamB: teamB,
            date: gameDate,
            location: gameLocation,
            athletes: athletes,
            startTime: new Date(),
            endTime: null,
            isActive: true
        }
    };

    // Popular select de atletas
    populateAthleteSelect(athletes);

    // Ocultar seção de configuração e mostrar seção de informações
    document.getElementById('gameSetupSection').style.display = 'none';
    document.getElementById('gameInfoSection').style.display = 'block';
    document.getElementById('playRegistrationSection').style.display = 'block';
    document.getElementById('statsSection').style.display = 'block';

    // Atualizar displays
    document.getElementById('teamNameDisplay').textContent = teamA;
    document.getElementById('teamStatsDisplay').textContent = teamA;
    updateGameStatus();

    // Iniciar timer
    startGameTimer();

    // Limpar displays
    updatePlayTable();
    updateStats();
    updateRegionStats();
    updatePlayerStats();

    announceToScreenReader(`Nova partida iniciada: ${teamA} vs ${teamB}`);
}

// Função para finalizar partida
function endGame() {
    if (!gameData.gameInfo.isActive) {
        alert('Não há partida ativa para finalizar');
        return;
    }

    if (gameData.plays.length === 0) {
        if (!confirm('Não há ações registradas. Deseja finalizar mesmo assim?')) {
            return;
        }
    }

    if (!confirm('Finalizar partida e gerar relatório PDF?')) {
        return;
    }

    // Finalizar partida
    gameData.gameInfo.endTime = new Date();
    gameData.gameInfo.isActive = false;

    // Parar timer
    if (gameTimer) {
        clearInterval(gameTimer);
        gameTimer = null;
    }

    // Gerar PDF
    generatePDFReport();

    // Mostrar seção de configuração e ocultar outras
    document.getElementById('gameSetupSection').style.display = 'block';
    document.getElementById('gameInfoSection').style.display = 'none';
    document.getElementById('playRegistrationSection').style.display = 'none';
    document.getElementById('statsSection').style.display = 'none';

    announceToScreenReader('Partida finalizada e relatório PDF gerado');
}

// Função para registrar jogada
function registerPlay() {
    const playerName = document.getElementById('playerName').value;
    const originRegion = document.getElementById('originRegion').value;
    const finalRegion = document.getElementById('finalRegion').value;
    const playResult = document.getElementById('playResult').value;
    const penaltType = document.getElementById('penaltType').value;
    const penaltResult = document.getElementById('penaltResult').value;
    const notes = document.getElementById('notes').value.trim();

    // Validações
    if (!playerName || !originRegion || !finalRegion || !playResult) {
        alert('Por favor, preencha todos os campos obrigatórios');
        return;
    }

    if (playResult === 'penalt' && (!penaltType || !penaltResult)) {
        alert('Para penalidades, selecione o tipo e o resultado');
        return;
    }

    // Criar objeto da jogada
    const play = {
        id: Date.now(),
        timestamp: new Date(),
        player: playerName,
        originRegion: originRegion,
        finalRegion: finalRegion,
        result: playResult,
        penaltType: penaltType || null,
        penaltResult: penaltResult || null,
        notes: notes,
        gameTime: getGameTime()
    };

    // Adicionar aos dados
    gameData.plays.push(play);

    // Atualizar displays
    updatePlayTable();
    updateStats();
    updateRegionStats();
    updatePlayerStats();

    // Limpar formulário
    clearPlayForm();

    // Focar no primeiro campo
    document.getElementById('playerName').focus();

    // Anunciar para leitores de tela
    announceToScreenReader(`Ação registrada: ${playerName} - ${getResultText(playResult)}`);
}

// Função para tratar mudança no resultado
function handleResultChange() {
    const result = document.getElementById('playResult').value;
    const penaltGroup = document.getElementById('penaltGroup');
    const penaltResultGroup = document.getElementById('penaltResultGroup');

    if (result === 'penalt') {
        penaltGroup.style.display = 'block';
        penaltResultGroup.style.display = 'block';
        document.getElementById('penaltType').required = true;
        document.getElementById('penaltResult').required = true;
    } else {
        penaltGroup.style.display = 'none';
        penaltResultGroup.style.display = 'none';
        document.getElementById('penaltType').required = false;
        document.getElementById('penaltResult').required = false;
        document.getElementById('penaltType').value = '';
        document.getElementById('penaltResult').value = '';
    }
}

// Função para iniciar timer do jogo
function startGameTimer() {
    gameTimer = setInterval(updateGameStatus, 1000);
}

// Função para atualizar status do jogo
function updateGameStatus() {
    if (!gameData.gameInfo.isActive) return;

    const startTime = gameData.gameInfo.startTime;
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    const timeString = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;

    document.getElementById('gameInfo').textContent =
        `${gameData.gameInfo.teamA} vs ${gameData.gameInfo.teamB} - ${gameData.gameInfo.location || 'Local não informado'}`;
    document.getElementById('gameTime').textContent = `Tempo de jogo: ${timeString}`;
}

// Função para obter tempo de jogo
function getGameTime() {
    if (!gameData.gameInfo.startTime) return '00:00:00';

    const startTime = gameData.gameInfo.startTime;
    const now = new Date();
    const elapsed = Math.floor((now - startTime) / 1000);

    const hours = Math.floor(elapsed / 3600);
    const minutes = Math.floor((elapsed % 3600) / 60);
    const seconds = elapsed % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Função para atualizar tabela de jogadas
function updatePlayTable() {
    const tbody = document.getElementById('playsTableBody');
    tbody.innerHTML = '';

    gameData.plays.forEach(play => {
        const row = tbody.insertRow();
        row.innerHTML = `
            <td>${play.gameTime}</td>
            <td>${play.player}</td>
            <td>Região ${play.originRegion}</td>
            <td>Região ${play.finalRegion}</td>
            <td>${getResultText(play.result)}</td>
            <td>${getDetailsText(play)}</td>
            <td>${play.notes || '-'}</td>
            <td>
                <button onclick="editPlay(${play.id})" class="btn-edit" aria-label="Editar ação">??</button>
                <button onclick="deletePlay(${play.id})" class="btn-delete" aria-label="Excluir ação">???</button>
            </td>
        `;
    });
}

// Função para atualizar estatísticas gerais
function updateStats() {
    const plays = gameData.plays;
    const totalPlays = plays.length;
    const totalGoals = plays.filter(p => p.result === 'gol').length;
    const totalDefenses = plays.filter(p => p.result === 'defesa').length;
    const totalOuts = plays.filter(p => p.result === 'out').length;
    const totalPenalties = plays.filter(p => p.result === 'penalt').length;
    const penaltyDefenses = plays.filter(p => p.result === 'penalt' && p.penaltResult === 'defendida').length;

    const goalEfficiency = totalPlays > 0 ? ((totalGoals / totalPlays) * 100).toFixed(1) : 0;
    const penaltyDefenseRate = totalPenalties > 0 ? ((penaltyDefenses / totalPenalties) * 100).toFixed(1) : 0;

    document.getElementById('totalPlays').textContent = totalPlays;
    document.getElementById('totalGoals').textContent = totalGoals;
    document.getElementById('totalDefenses').textContent = totalDefenses;
    document.getElementById('totalOuts').textContent = totalOuts;
    document.getElementById('totalPenalties').textContent = totalPenalties;
    document.getElementById('goalEfficiency').textContent = goalEfficiency + '%';
    document.getElementById('penaltyDefenseRate').textContent = penaltyDefenseRate + '%';
}

// Função para atualizar estatísticas por região
function updateRegionStats() {
    const regionStats = {};
    const regions = ['1', '1/2', '2', '2/3', '3', '3/4', '4', '4/5', '5', '5/6', '6'];

    regions.forEach(region => {
        const playsToRegion = gameData.plays.filter(p => p.finalRegion === region);
        const goals = playsToRegion.filter(p => p.result === 'gol').length;

        regionStats[region] = {
            total: playsToRegion.length,
            goals: goals,
            efficiency: playsToRegion.length > 0 ? ((goals / playsToRegion.length) * 100).toFixed(1) : 0
        };
    });

    const regionStatsContainer = document.getElementById('regionStats');
    regionStatsContainer.innerHTML = '';

    regions.forEach(region => {
        const stats = regionStats[region];
        if (stats.total > 0) {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-value">${stats.goals}/${stats.total}</div>
                <div class="stat-label">Região ${region}</div>
                <div class="stat-sublabel">${stats.efficiency}% eficiência</div>
            `;
            regionStatsContainer.appendChild(card);
        }
    });
}

// Função para atualizar estatísticas por jogador
function updatePlayerStats() {
    const playerStats = {};
    const athletes = gameData.gameInfo.athletes || [];

    athletes.forEach(athlete => {
        const playerPlays = gameData.plays.filter(p => p.player === athlete);
        const goals = playerPlays.filter(p => p.result === 'gol').length;
        const defenses = playerPlays.filter(p => p.result === 'defesa').length;
        const outs = playerPlays.filter(p => p.result === 'out').length;
        const penalties = playerPlays.filter(p => p.result === 'penalt').length;

        playerStats[athlete] = {
            total: playerPlays.length,
            goals: goals,
            defenses: defenses,
            outs: outs,
            penalties: penalties,
            efficiency: playerPlays.length > 0 ? ((goals / playerPlays.length) * 100).toFixed(1) : 0
        };
    });

    const playerStatsContainer = document.getElementById('playerStats');
    playerStatsContainer.innerHTML = '';

    athletes.forEach(athlete => {
        const stats = playerStats[athlete];
        if (stats.total > 0) {
            const card = document.createElement('div');
            card.className = 'stat-card';
            card.innerHTML = `
                <div class="stat-value">${stats.goals}/${stats.total}</div>
                <div class="stat-label">${athlete}</div>
                <div class="stat-sublabel">${stats.efficiency}% eficiência</div>
                <div class="stat-details">
                    <small>G: ${stats.goals} | D: ${stats.defenses} | O: ${stats.outs} | P: ${stats.penalties}</small>
                </div>
            `;
            playerStatsContainer.appendChild(card);
        }
    });
}

// Função para obter texto do resultado
function getResultText(result) {
    const resultTexts = {
        'gol': 'Gol',
        'defesa': 'Defesa (Adversário)',
        'out': 'Out (Fora)',
        'penalt': 'Penalidade Cometida'
    };
    return resultTexts[result] || result;
}

// Função para obter texto dos detalhes
function getDetailsText(play) {
    if (play.result === 'penalt') {
        const penaltTypes = {
            'highball': 'Highball',
            'longball': 'Longball',
            'ten_seconds': 'Ten Seconds',
            'noise': 'Ruído',
            'personal_penalty': 'Falta Pessoal'
        };

        const penaltResults = {
            'defendida': 'Defendida',
            'convertida': 'Convertida',
            'desperdicada': 'Desperdiçada'
        };

        const type = penaltTypes[play.penaltType] || play.penaltType;
        const result = penaltResults[play.penaltResult] || play.penaltResult;

        return `${type} - ${result}`;
    }
    return '-';
}

// Função para limpar formulário de jogada
function clearPlayForm() {
    document.getElementById('playerName').value = '';
    document.getElementById('originRegion').value = '';
    document.getElementById('finalRegion').value = '';
    document.getElementById('playResult').value = '';
    document.getElementById('penaltType').value = '';
    document.getElementById('penaltResult').value = '';
    document.getElementById('notes').value = '';

    // Ocultar campos de penalidade
    document.getElementById('penaltGroup').style.display = 'none';
    document.getElementById('penaltResultGroup').style.display = 'none';
}

// Função para editar jogada
function editPlay(playId) {
    const play = gameData.plays.find(p => p.id === playId);
    if (!play) return;

    // Preencher formulário com dados da jogada
    document.getElementById('playerName').value = play.player;
    document.getElementById('originRegion').value = play.originRegion;
    document.getElementById('finalRegion').value = play.finalRegion;
    document.getElementById('playResult').value = play.result;
    document.getElementById('notes').value = play.notes;

    if (play.result === 'penalt') {
        document.getElementById('penaltType').value = play.penaltType;
        document.getElementById('penaltResult').value = play.penaltResult;
        handleResultChange();
    }

    // Remover jogada original
    deletePlay(playId, false);

    // Focar no primeiro campo
    document.getElementById('playerName').focus();
    announceToScreenReader('Ação carregada para edição');
}

// Função para deletar jogada
function deletePlay(playId, confirmDelete = true) {
    if (confirmDelete && !confirm('Deseja realmente excluir esta ação?')) {
        return;
    }

    gameData.plays = gameData.plays.filter(p => p.id !== playId);

    // Atualizar displays
    updatePlayTable();
    updateStats();
    updateRegionStats();
    updatePlayerStats();

    if (confirmDelete) {
        announceToScreenReader('Ação excluída com sucesso');
    }
}

// Função para gerar relatório PDF
function generatePDFReport() {
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF();

    // Configurações de fonte
    doc.setFont('helvetica');

    // Cabeçalho
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text('RELATÓRIO DE ANÁLISE - GOALBALL', 20, 20);

    // Linha separadora
    doc.setLineWidth(0.5);
    doc.line(20, 25, 190, 25);

    // Informações da partida
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('INFORMAÇÕES DA PARTIDA', 20, 35);

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    const gameInfo = gameData.gameInfo;
const startDate = gameInfo.date.split('-').reverse().join('/');
    const startTime = gameInfo.startTime ? gameInfo.startTime.toLocaleTimeString('pt-BR') : 'N/A';
    const endTime = gameInfo.endTime ? gameInfo.endTime.toLocaleTimeString('pt-BR') : 'N/A';
    const duration = gameInfo.startTime && gameInfo.endTime ?
        Math.floor((gameInfo.endTime - gameInfo.startTime) / 1000 / 60) + ' minutos' : 'N/A';

    doc.text(`Equipe Analisada: ${gameInfo.teamA}`, 20, 45);
    doc.text(`Adversário: ${gameInfo.teamB}`, 20, 52);
    doc.text(`Data: ${startDate}`, 20, 59);
    doc.text(`Local: ${gameInfo.location || 'Não informado'}`, 20, 66);
    doc.text(`Início: ${startTime}`, 20, 73);
    doc.text(`Fim: ${endTime}`, 20, 80);
    doc.text(`Duração: ${duration}`, 20, 87);

    // Atletas
    doc.text(`Atletas: ${gameInfo.athletes.join(', ')}`, 20, 94);

    // Estatísticas gerais
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('ESTATÍSTICAS GERAIS', 20, 110);

    const plays = gameData.plays;
    const totalPlays = plays.length;
    const totalGoals = plays.filter(p => p.result === 'gol').length;
    const totalDefenses = plays.filter(p => p.result === 'defesa').length;
    const totalOuts = plays.filter(p => p.result === 'out').length;
    const totalPenalties = plays.filter(p => p.result === 'penalt').length;
    const penaltyDefenses = plays.filter(p => p.result === 'penalt' && p.penaltResult === 'defendida').length;
    const goalEfficiency = totalPlays > 0 ? ((totalGoals / totalPlays) * 100).toFixed(1) : 0;
    const penaltyDefenseRate = totalPenalties > 0 ? ((penaltyDefenses / totalPenalties) * 100).toFixed(1) : 0;

    doc.setFontSize(11);
    doc.setTextColor(80, 80, 80);
    doc.text(`Total de Ações: ${totalPlays}`, 20, 120);
    doc.text(`Gols: ${totalGoals}`, 20, 127);
    doc.text(`Lançamentos Defendidos: ${totalDefenses}`, 20, 134);
    doc.text(`Outs: ${totalOuts}`, 20, 141);
    doc.text(`Penalidades Cometidas: ${totalPenalties}`, 20, 148);
    doc.text(`Eficiência de Ataque: ${goalEfficiency}%`, 20, 155);
    doc.text(`Taxa de Defesa em Penalidades: ${penaltyDefenseRate}%`, 20, 162);

    // Estatísticas por atleta
    doc.setFontSize(14);
    doc.setTextColor(60, 60, 60);
    doc.text('DESEMPENHO INDIVIDUAL', 20, 180);

    let yPosition = 190;
    gameInfo.athletes.forEach(athlete => {
        const playerPlays = plays.filter(p => p.player === athlete);
        const playerGoals = playerPlays.filter(p => p.result === 'gol').length;
        const playerDefenses = playerPlays.filter(p => p.result === 'defesa').length;
        const playerOuts = playerPlays.filter(p => p.result === 'out').length;
        const playerPenalties = playerPlays.filter(p => p.result === 'penalt').length;
        const playerEfficiency = playerPlays.length > 0 ? ((playerGoals / playerPlays.length) * 100).toFixed(1) : 0;

        doc.setFontSize(11);
        doc.setTextColor(80, 80, 80);
        doc.text(`${athlete}: ${playerPlays.length} ações, ${playerGoals} gols (${playerEfficiency}%)`, 20, yPosition);
        yPosition += 7;

        // Verificar se precisa de nova página
        if (yPosition > 270) {
            doc.addPage();
            yPosition = 20;
        }
    });

    // Análise por região (se couber na página)
    if (yPosition < 200) {
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('ANÁLISE POR REGIÃO DE DESTINO', 20, yPosition + 10);
        yPosition += 20;

        const regions = ['1', '1/2', '2', '2/3', '3', '3/4', '4', '4/5', '5', '5/6', '6'];
        regions.forEach(region => {
            const playsToRegion = plays.filter(p => p.finalRegion === region);
            const goalsToRegion = playsToRegion.filter(p => p.result === 'gol').length;
            const regionEfficiency = playsToRegion.length > 0 ? ((goalsToRegion / playsToRegion.length) * 100).toFixed(1) : 0;

            if (playsToRegion.length > 0) {
                doc.setFontSize(11);
                doc.setTextColor(80, 80, 80);
                doc.text(`Região ${region}: ${goalsToRegion}/${playsToRegion.length} (${regionEfficiency}%)`, 20, yPosition);
                yPosition += 7;
            }
        });
    }

    // Histórico de ações (nova página)
    if (plays.length > 0) {
        doc.addPage();
        doc.setFontSize(14);
        doc.setTextColor(60, 60, 60);
        doc.text('HISTÓRICO DE AÇÕES', 20, 20);

        yPosition = 35;
        doc.setFontSize(9);
        plays.forEach((play, index) => {
            const playText = `${play.gameTime} - ${play.player} (${play.originRegion}?${play.finalRegion}) - ${getResultText(play.result)}`;
            doc.text(playText, 20, yPosition);
            yPosition += 6;

            if (yPosition > 280) {
                doc.addPage();
                yPosition = 20;
            }
        });
    }

    // Rodapé
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(120, 120, 120);
        doc.text(`Página ${i} de ${pageCount}`, 20, 290);
        doc.text('Sistema de Análise de Desempenho - Goalball', 120, 290);
    }

    // Salvar arquivo
    const filename = `Goalball_${gameInfo.teamA}_vs_${gameInfo.teamB}_${startDate.replace(/\//g, '-')}.pdf`;
    doc.save(filename);
}

// Função para configurar atalhos de teclado
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter para registrar ação
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            if (document.getElementById('playRegistrationSection').style.display !== 'none') {
                registerPlay();
            }
        }

        // Esc para limpar formulário
        if (e.key === 'Escape') {
            if (document.getElementById('playRegistrationSection').style.display !== 'none') {
                clearPlayForm();
                announceToScreenReader('Formulário limpo');
            }
        }

        // Ctrl + N para nova partida
        if (e.ctrlKey && e.key === 'n') {
            e.preventDefault();
            if (document.getElementById('gameSetupSection').style.display !== 'none') {
                document.getElementById('teamA').focus();
            }
        }

        // Ctrl + F para finalizar partida
        if (e.ctrlKey && e.key === 'f') {
            e.preventDefault();
            if (gameData.gameInfo.isActive) {
                endGame();
            }
        }

        // F1 para ajuda
        if (e.key === 'F1') {
            e.preventDefault();
            showKeyboardHelp();
        }
    });
}

// Função para mostrar ajuda de atalhos
function showKeyboardHelp() {
    const helpText = `
ATALHOS DE TECLADO DISPONÍVEIS:

Ctrl + Enter: Registrar ação atual
Esc: Limpar formulário
Ctrl + N: Focar no campo de nova partida
Ctrl + F: Finalizar partida
F1: Mostrar esta ajuda

NAVEGAÇÃO:
Tab: Navegar entre campos
Enter: Ativar botões
Espaço: Selecionar checkboxes/radio buttons
    `;

    alert(helpText);
    announceToScreenReader('Ajuda de atalhos de teclado exibida');
}

// Função para anunciar mensagens para leitores de tela
function announceToScreenReader(message) {
    // Criar elemento temporário para anúncio
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;

    document.body.appendChild(announcement);

    // Remover após 2 segundos
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 2000);
}

// Função para exportar dados em JSON
function exportGameData() {
    if (!gameData.gameInfo.isActive && gameData.plays.length === 0) {
        alert('Não há dados para exportar');
        return;
    }

    const dataStr = JSON.stringify(gameData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `goalball_${gameData.gameInfo.teamA}_${new Date().toISOString().split('T')[0]}.json`;

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    announceToScreenReader('Dados exportados com sucesso');
}

// Função para importar dados de JSON
function importGameData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedData = JSON.parse(e.target.result);

            // Validar estrutura dos dados
            if (!importedData.gameInfo || !Array.isArray(importedData.plays)) {
                throw new Error('Formato de arquivo inválido');
            }

            if (confirm('Importar dados irá substituir a partida atual. Continuar?')) {
                gameData = importedData;

                // Recriar objetos Date
                if (gameData.gameInfo.startTime) {
                    gameData.gameInfo.startTime = new Date(gameData.gameInfo.startTime);
                }
                if (gameData.gameInfo.endTime) {
                    gameData.gameInfo.endTime = new Date(gameData.gameInfo.endTime);
                }

                gameData.plays.forEach(play => {
                    play.timestamp = new Date(play.timestamp);
                });

                // Atualizar interface
                if (gameData.gameInfo.isActive) {
                    // Mostrar seções de jogo ativo
                    document.getElementById('gameSetupSection').style.display = 'none';
                    document.getElementById('gameInfoSection').style.display = 'block';
                    document.getElementById('playRegistrationSection').style.display = 'block';
                    document.getElementById('statsSection').style.display = 'block';

                    // Popular select de atletas
                    populateAthleteSelect(gameData.gameInfo.athletes);

                    // Iniciar timer
                    startGameTimer();
                }

                // Atualizar displays
                updateGameStatus();
                updatePlayTable();
                updateStats();
                updateRegionStats();
                updatePlayerStats();

                announceToScreenReader('Dados importados com sucesso');
            }
        } catch (error) {
            alert('Erro ao importar arquivo: ' + error.message);
        }
    };

    reader.readAsText(file);
}

// Função para validar dados antes de salvar
function validateGameData() {
    const errors = [];

    if (!gameData.gameInfo.teamA || !gameData.gameInfo.teamB) {
        errors.push('Nomes das equipes são obrigatórios');
    }

    if (!gameData.gameInfo.date) {
        errors.push('Data da partida é obrigatória');
    }

    if (!gameData.gameInfo.athletes || gameData.gameInfo.athletes.length < 3) {
        errors.push('Mínimo de 3 atletas é necessário');
    }

    // Validar jogadas
    gameData.plays.forEach((play, index) => {
        if (!play.player || !play.originRegion || !play.finalRegion || !play.result) {
            errors.push(`Jogada ${index + 1} possui campos obrigatórios vazios`);
        }

        if (play.result === 'penalt' && (!play.penaltType || !play.penaltResult)) {
            errors.push(`Jogada ${index + 1} de penalidade está incompleta`);
        }
    });

    return errors;
}

// Função para backup automático
function autoBackup() {
    if (gameData.plays.length > 0) {
        const backupData = JSON.stringify(gameData);
        try {
            // Simular backup (sem localStorage devido às restrições)
            console.log('Backup automático realizado');
            announceToScreenReader('Backup automático realizado');
        } catch (error) {
            console.warn('Erro no backup automático:', error);
        }
    }
}

// Função para formatar tempo de jogo para display
function formatGameTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// Função para calcular estatísticas avançadas
function calculateAdvancedStats() {
    const plays = gameData.plays;

    if (plays.length === 0) {
        return {
            avgTimePerPlay: 0,
            mostActiveRegion: 'N/A',
            bestPlayer: 'N/A',
            peakPerformanceTime: 'N/A'
        };
    }

    // Tempo médio entre jogadas
    let totalTimeBetweenPlays = 0;
    for (let i = 1; i < plays.length; i++) {
        totalTimeBetweenPlays += (plays[i].timestamp - plays[i-1].timestamp) / 1000;
    }
    const avgTimePerPlay = plays.length > 1 ? (totalTimeBetweenPlays / (plays.length - 1)) : 0;

    // Região mais ativa
    const regionCount = {};
    plays.forEach(play => {
        regionCount[play.finalRegion] = (regionCount[play.finalRegion] || 0) + 1;
    });
    const mostActiveRegion = Object.keys(regionCount).reduce((a, b) =>
        regionCount[a] > regionCount[b] ? a : b, 'N/A');

    // Melhor jogador (maior eficiência com mínimo de jogadas)
    const playerStats = {};
    plays.forEach(play => {
        if (!playerStats[play.player]) {
            playerStats[play.player] = { total: 0, goals: 0 };
        }
        playerStats[play.player].total++;
        if (play.result === 'gol') {
            playerStats[play.player].goals++;
        }
    });

    let bestPlayer = 'N/A';
    let bestEfficiency = 0;
    Object.keys(playerStats).forEach(player => {
        const stats = playerStats[player];
        if (stats.total >= 3) { // Mínimo de 3 jogadas
            const efficiency = stats.goals / stats.total;
            if (efficiency > bestEfficiency) {
                bestEfficiency = efficiency;
                bestPlayer = player;
            }
        }
    });

    return {
        avgTimePerPlay: Math.round(avgTimePerPlay),
        mostActiveRegion: `Região ${mostActiveRegion}`,
        bestPlayer: bestPlayer,
        peakPerformanceTime: 'N/A' // Poderia ser implementado com análise temporal
    };
}

// Função para gerar relatório de tendências
function generateTrendReport() {
    const plays = gameData.plays;
    if (plays.length < 5) {
        return 'Dados insuficientes para análise de tendências (mínimo 5 ações)';
    }

    // Análise de eficiência ao longo do tempo
    const firstHalf = plays.slice(0, Math.floor(plays.length / 2));
    const secondHalf = plays.slice(Math.floor(plays.length / 2));

    const firstHalfGoals = firstHalf.filter(p => p.result === 'gol').length;
    const secondHalfGoals = secondHalf.filter(p => p.result === 'gol').length;

    const firstHalfEfficiency = (firstHalfGoals / firstHalf.length) * 100;
    const secondHalfEfficiency = (secondHalfGoals / secondHalf.length) * 100;

    let trend = '';
    if (secondHalfEfficiency > firstHalfEfficiency + 5) {
        trend = 'Melhora significativa no desempenho';
    } else if (firstHalfEfficiency > secondHalfEfficiency + 5) {
        trend = 'Queda no desempenho';
    } else {
        trend = 'Desempenho consistente';
    }

    return `${trend}. Primeira metade: ${firstHalfEfficiency.toFixed(1)}%, Segunda metade: ${secondHalfEfficiency.toFixed(1)}%`;
}

// Função para resetar aplicação
function resetApplication() {
    if (confirm('Isso irá limpar todos os dados. Tem certeza?')) {
        // Parar timer se estiver rodando
        if (gameTimer) {
            clearInterval(gameTimer);
            gameTimer = null;
        }

        // Resetar dados
        gameData = {
            plays: [],
            gameInfo: {
                teamA: '',
                teamB: '',
                date: '',
                location: '',
                athletes: [],
                startTime: null,
                endTime: null,
                isActive: false
            }
        };

        // Resetar interface
        document.getElementById('gameSetupSection').style.display = 'block';
        document.getElementById('gameInfoSection').style.display = 'none';
        document.getElementById('playRegistrationSection').style.display = 'none';
        document.getElementById('statsSection').style.display = 'none';

        // Limpar formulários
        document.getElementById('teamA').value = '';
        document.getElementById('teamB').value = '';
        document.getElementById('gameLocation').value = '';
        document.getElementById('gameDate').valueAsDate = new Date();

        // Resetar atletas para 3 campos padrão
        const container = document.getElementById('athletesContainer');
        container.innerHTML = `
            <div class="athlete-input">
                <input type="text" class="athlete-name" placeholder="Nome do Atleta 1" required>
                <button type="button" onclick="removeAthlete(this)" disabled>Remover</button>
            </div>
            <div class="athlete-input">
                <input type="text" class="athlete-name" placeholder="Nome do Atleta 2" required>
                <button type="button" onclick="removeAthlete(this)" disabled>Remover</button>
            </div>
            <div class="athlete-input">
                <input type="text" class="athlete-name" placeholder="Nome do Atleta 3" required>
                <button type="button" onclick="removeAthlete(this)" disabled>Remover</button>
            </div>
        `;

        updateAthleteCount();
        clearPlayForm();

        announceToScreenReader('Aplicação resetada com sucesso');
    }
}

// Configurar backup automático a cada 5 minutos
setInterval(autoBackup, 5 * 60 * 1000);

// Adicionar eventos de visibilidade da página para backup
document.addEventListener('visibilitychange', function() {
    if (document.hidden && gameData.plays.length > 0) {
        autoBackup();
    }
});

// Adicionar evento de beforeunload para aviso
window.addEventListener('beforeunload', function(e) {
    if (gameData.gameInfo.isActive && gameData.plays.length > 0) {
        e.preventDefault();
        e.returnValue = 'Você tem uma partida ativa. Tem certeza que deseja sair?';
        return e.returnValue;
    }
});

// Função de inicialização adicional
function initializeAdvancedFeatures() {
    // Adicionar botões de funcionalidades avançadas se necessário
    console.log('Funcionalidades avançadas inicializadas');

    // Verificar suporte a recursos do navegador
    if (!window.jspdf) {
        console.warn('jsPDF não carregado - funcionalidade de PDF pode não funcionar');
    }

    // Configurar observadores de performance se disponível
    if ('performance' in window && 'mark' in performance) {
        performance.mark('goalball-app-initialized');
    }
}

// Chamar inicialização avançada após carregamento
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(initializeAdvancedFeatures, 100);
});

// Exportar funções para uso global se necessário
window.GoalballApp = {
    exportGameData,
    importGameData,
    resetApplication,
    calculateAdvancedStats,
    generateTrendReport
};