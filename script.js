function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    // Statusy kolorów
    const st = [
        (guess.code === targetDriver.code) ? 'correct' : 'wrong',
        (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong',
        (guess.team === targetDriver.team) ? 'correct' : (targetDriver.past_teams.includes(guess.team) ? 'near' : 'wrong'),
        compareNumbers(guess.number, targetDriver.number),
        compareNumbers(guess.debut, targetDriver.debut),
        compareNumbers(guess.wins, targetDriver.wins)
    ];

    // Wartości do wyświetlenia
    const vals = [guess.code, guess.nationality, guess.team, guess.number, guess.debut, guess.wins];
    
    vals.forEach((v, i) => {
        const t = document.createElement('div');
        t.className = `tile ${st[i]}`;
        t.style.animationDelay = (i * 0.1) + 's';

        // i >= 3 to kolumny liczbowe: Numer, Debiut, Wygrane
        if (i >= 3) {
            if (st[i] === 'near') {
                t.innerHTML = `${v} <span class="arrow">↑</span>`;
            } else if (st[i] === 'higher') {
                t.innerHTML = `${v} <span class="arrow">↓</span>`;
            } else {
                t.innerHTML = v; 
            }
        } else {
            t.innerHTML = v;
        }
        row.appendChild(t);
    });

    board.appendChild(row);
}

function pokazWynik(czyWygrana) {
    const modal = document.getElementById('resultModal');
    const title = document.getElementById('modalTitle');
    const badge = document.getElementById('modalStatusBadge');
    const msg = document.getElementById('modalMessage');
    const target = document.getElementById('targetDisplay');

    if (czyWygrana) {
        title.innerText = "GRATULACJE!";
        badge.innerText = "WYGRAŁEŚ";
        badge.className = "win-badge"; // To połączy się z Twoim CSS
        msg.innerText = `Świetny instynkt! Potrzebowałeś tylko ${guessesCount} prób.`;
    } else {
        title.innerText = "COŚ NIE POSZŁO...";
        badge.innerText = "PRZEGRAŁEŚ";
        badge.className = "lose-badge"; // To połączy się z Twoim CSS
        msg.innerText = "Inżynierowie wyścigowi nie będą zadowoleni.";
    }

    target.innerHTML = `Dzisiejszy kierowca to:<br><span style="font-size: 1.8rem; color: white;">${targetDriver.name}</span>`;
    modal.style.display = "block";
}
