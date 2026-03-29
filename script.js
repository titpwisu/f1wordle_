let allDrivers = [];
let targetDriver = null;
let guessesCount = 0;
const MAX_GUESSES = 6;
let currentFocus = -1;

// 1. START GRY
async function inicjujGre() {
    try {
        const res = await fetch('kierowcy.json?v=' + Date.now());
        allDrivers = await res.json();

        // Czekamy na dane z internetu przez bramkę proxy (omijamy kłódkę)
        await updateWinsFromAPI();

        const today = new Date();
        const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
        targetDriver = allDrivers[seed % allDrivers.length];

        console.log("Gra gotowa! Cel: " + targetDriver.name + " (Wygrane: " + targetDriver.wins + ")");

        aktualizujPlaceholder();
        inicjujPodpowiedzi();
        inicjujPrzycisk();
    } catch (err) {
        console.error("Błąd startu:", err);
    }
}

// 2. AKTUALIZACJA WYGRANYCH (Career Wins przez Proxy)
async function updateWinsFromAPI() {
    try {
        const proxyUrl = "https://api.allorigins.win/get?url=";
        const targetUrl = encodeURIComponent("https://ergast.com/api/f1/driverStandings/1.json?limit=1000");

        const response = await fetch(proxyUrl + targetUrl);
        const rawData = await response.json();
        const data = JSON.parse(rawData.contents);
        
        const standings = data.MRData.StandingsTable.StandingsLists[0].DriverStandings;

        allDrivers.forEach(driver => {
            const apiData = standings.find(s => s.Driver.driverId === driver.id);
            if (apiData) {
                driver.wins = parseInt(apiData.wins);
            }
        });
        
        console.log("Dane z F1 zaktualizowane pomyślnie!");
    } catch (e) {
        console.warn("Błąd proxy, używam danych domyślnych z pliku.", e);
    }
}

// 3. LOGIKA PODPOWIEDZI
function inicjujPodpowiedzi() {
    const input = document.getElementById('driverInput');
    const suggBox = document.getElementById('suggestions');

    input.addEventListener('input', () => {
        const val = input.value.toLowerCase().trim();
        suggBox.innerHTML = '';
        currentFocus = -1;

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
                    input.value = driver.name;
                    suggBox.style.display = 'none';
                    input.focus();
                };
                suggBox.appendChild(div);
            });
        } else {
            suggBox.style.display = 'none';
        }
    });

    input.addEventListener('keydown', function(e) {
        let items = suggBox.getElementsByClassName('suggestion-item');
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            currentFocus++;
            if (currentFocus >= items.length) currentFocus = 0;
            addActive(items);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            currentFocus--;
            if (currentFocus < 0) currentFocus = (items.length - 1);
            addActive(items);
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (currentFocus > -1 && suggBox.style.display === 'block') {
                if (items[currentFocus]) items[currentFocus].click();
            } else {
                makeGuess();
            }
        }
    });

    function addActive(items) {
        if (!items || items.length === 0) return;
        for (let i = 0; i < items.length; i++) items[i].classList.remove('suggestion-active');
        items[currentFocus].classList.add('suggestion-active');
        items[currentFocus].scrollIntoView({ block: "nearest" });
    }

    document.addEventListener('click', (e) => {
        if (e.target !== input && e.target !== suggBox) suggBox.style.display = 'none';
    });
}

// 4. LOGIKA STRZAŁU
function inicjujPrzycisk() {
    const btn = document.querySelector('button');
    btn.onclick = makeGuess;
}

function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();
    const guess = allDrivers.find(d => d.name.toLowerCase() === val || d.name.toLowerCase().includes(val));

    if (guessesCount >= MAX_GUESSES) return;
    if (!guess) {
        alert("Wybierz kierowcę z listy podpowiedzi!");
        return;
    }

    guessesCount++;
    renderRow(guess);

    if (guess.name === targetDriver.name) {
        setTimeout(() => {
            alert(`BRAWO! 🎉 Zgadłeś za ${guessesCount} razem!\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("WYGRANA!");
        }, 500);
    } else if (guessesCount >= MAX_GUESSES) {
        setTimeout(() => {
            alert(`KONIEC GRY! 😢\nDzisiejszy kierowca to: ${targetDriver.name}`);
            zablokujGre("PRZEGRANA :(");
        }, 500);
    } else {
        aktualizujPlaceholder();
    }

    input.value = '';
    currentFocus = -1;
    document.getElementById('suggestions').style.display = 'none';
}

// 5. RYSOWANIE KAFELKÓW
function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    const codeStatus = (guess.code === targetDriver.code) ? 'correct' : 'wrong';
    const natStatus = (guess.nationality === targetDriver.nationality) ? 'correct' : 'wrong';

    let teamStatus = 'wrong';
    if (guess.team === targetDriver.team) {
        teamStatus = 'correct';
    } else if (targetDriver.past_teams && targetDriver.past_teams.includes(guess.team)) {
        teamStatus = 'near';
    }

    const numStatus = compareNumbers(guess.number, targetDriver.number);
    const debStatus = compareNumbers(guess.debut, targetDriver.debut);
    const winsStatus = compareNumbers(guess.wins, targetDriver.wins);

    function createTile(value, status, delay) {
        const tile = document.createElement('div');
        tile.className = `tile ${status}`;
        tile.style.animationDelay = delay + 's';
        tile.innerHTML = value;
        return tile;
    }

    row.appendChild(createTile(guess.code, codeStatus, 0));
    row.appendChild(createTile(guess.nationality, natStatus, 0.1));
    row.appendChild(createTile(guess.team, teamStatus, 0.2));
    row.appendChild(createTile(guess.number, numStatus, 0.3));
    row.appendChild(createTile(guess.debut, debStatus, 0.4));
    row.appendChild(createTile(guess.wins, winsStatus, 0.5));

    board.appendChild(row);
}

function compareNumbers(guessVal, targetVal) {
    const g = Number(guessVal);
    const t = Number(targetVal);
    if (g === t) return 'correct';
    if (g < t) return 'near';
    return 'higher';
}

function zablokujGre(wiadomosc) {
    const input = document.getElementById('driverInput');
    input.disabled = true;
    input.placeholder = wiadomosc;
    document.querySelector('button').disabled = true;
}

function aktualizujPlaceholder() {
    const input = document.getElementById('driverInput');
    if (guessesCount < MAX_GUESSES) {
        input.placeholder = `Wpisz kierowcę (Próba ${guessesCount + 1}/${MAX_GUESSES})`;
    }
}

// ODPALENIE
inicjujGre();
