let allDrivers = [];
let targetDriver = null;

// 1. ŁADOWANIE DANYCH
fetch('kierowcy.json?v=' + new Date().getTime())
    .then(res => res.json())
    .then(data => {
        allDrivers = data;
        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];
        console.log("Dane załadowane. Cel na dziś:", targetDriver.name);
        inicjujPodpowiedzi();
        inicjujPrzycisk(); // Inicjalizacja przycisku i entera
    })
    .catch(err => console.error("BŁĄD: Nie znaleziono pliku kierowcy.json!", err));

// 2. LOGIKA PODPOWIEDZI (ZMIENIONA)
function inicjujPodpowiedzi() {
    const input = document.getElementById('driverInput');
    const suggBox = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        suggBox.innerHTML = '';

        if (val.length < 1) {
            suggBox.style.display = 'none';
            return;
        }

        const matches = allDrivers.filter(d => d.name.toLowerCase().includes(val));

        if (matches.length > 0) {
            suggBox.style.display = 'block';
            matches.forEach(driver => {
                const div = document.createElement('div');
                div.className = 'suggestion-item';
                div.innerText = driver.name;
                div.onclick = () => {
                    input.value = driver.name; // TYLKO uzupełnia pole
                    suggBox.style.display = 'none'; // Chowa podpowiedzi
                    input.focus(); // Zostawia kursor w polu tekstowym
                };
                suggBox.appendChild(div);
            });
        } else {
            suggBox.style.display = 'none';
        }
    });

    // Chowanie podpowiedzi kliknięciem poza nie
    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggBox) {
            suggBox.style.display = 'none';
        }
    });
}

// 3. INICJALIZACJA PRZYCISKU I ENTERA
function inicjujPrzycisk() {
    const btn = document.querySelector('button');
    const input = document.getElementById('driverInput');

    btn.onclick = makeGuess;

    input.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            makeGuess();
        }
    });
}

// 4. LOGIKA STRZAŁU
function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();
    const guess = allDrivers.find(d => d.name.toLowerCase() === val || d.name.toLowerCase().includes(val));

    if (!guess) {
        alert("Wybierz kierowcę z listy podpowiedzi!");
        return;
    }

    renderRow(guess);

    // SPRAWDZENIE WYGRANEJ
    if (guess.name === targetDriver.name) {
        setTimeout(() => {
            alert("BRAWO! 🎉 Dzisiejszy kierowca to: " + targetDriver.name);
            input.disabled = true;
            input.placeholder = "WYGRANA!";
            document.querySelector('button').disabled = true;
        }, 500);
    }

    input.value = '';
    document.getElementById('suggestions').style.display = 'none';
}

// POMOCNICZA FUNKCJA DO LICZB
function compareNumbers(guessValue, targetValue) {
    if (guessValue === targetValue) return 'correct';
    if (guessValue < targetValue) return 'lower-or-past'; // Mniej = Żółty
    return 'higher'; // Więcej = Fioletowy
}

// 5. WYŚWIETLANIE 6 KAFELKÓW
function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    // OBLICZANIE STATUSÓW DLA 6 KATEGORII
    const codeStatus = (guess.code === targetDriver.code) ? 'correct' : 'wrong';
    const natStatus = (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong';

    let teamStatus = 'wrong';
    if (guess.team === targetDriver.team) {
        teamStatus = 'correct';
    } else if (targetDriver.past_teams && targetDriver.past_teams.includes(guess.team)) {
        teamStatus = 'lower-or-past'; // Żółty dla byłego zespołu
    }

    const numStatus = compareNumbers(guess.number, targetDriver.number);
    const debStatus = compareNumbers(guess.debut, targetDriver.debut);
    const winsStatus = compareNumbers(guess.wins, targetDriver.wins);

    // FUNKCJA BUDUJĄCA KAFELEK
    function createTile(label, value, status, delay) {
        const tile = document.createElement('div');
        tile.className = `tile ${status}`;
        tile.style.animationDelay = delay + 's';
        tile.innerHTML = `<div class="label">${label}</div><div class="value">${value}</div>`;
        return tile;
    }

    // DODAWANIE KAFELKÓW DO RZĘDU
    row.appendChild(createTile('KOD', guess.code, codeStatus, 0));
    row.appendChild(createTile('NAT', guess.nationality, natStatus, 0.1));
    row.appendChild(createTile('TEAM', guess.team, teamStatus, 0.2));
    row.appendChild(createTile('NUM', guess.number, numStatus, 0.3));
    row.appendChild(createTile('ROK', guess.debut, debStatus, 0.4));
    row.appendChild(createTile('WINS', guess.wins, winsStatus, 0.5));

    board.prepend(row);
}
