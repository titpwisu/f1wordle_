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

        // LOGIKA DODAWANIA STRZAŁEK
        // i >= 3 oznacza kolumny: Numer, Debiut, Wygrane (tam gdzie mamy liczby)
        if (i >= 3) {
            if (st[i] === 'near') {
                t.innerHTML = `${v} <span class="arrow">↑</span>`;
            } else if (st[i] === 'higher') {
                t.innerHTML = `${v} <span class="arrow">↓</span>`;
            } else {
                t.innerHTML = v; // Dla 'correct' zostaje sama liczba
            }
        } else {
            t.innerHTML = v; // Dla tekstu (Nationality, Team itp.) zostaje sama wartość
        }

        row.appendChild(t);
    });

    board.appendChild(row);
}
