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
    })
    .catch(err => console.error("BŁĄD: Nie znaleziono pliku kierowcy.json!", err));

// 2. LOGIKA PODPOWIEDZI
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
                    input.value = driver.name;
                    suggBox.style.display = 'none';
                    makeGuess();
                };
                suggBox.appendChild(div);
            });
        } else {
            suggBox.style.display = 'none';
        }
    });
}

// 3. LOGIKA STRZAŁU (POPRAWIONA)
function makeGuess() {
    const input = document.getElementById('driverInput');
    const val = input.value.trim().toLowerCase();

    const guess = allDrivers.find(d => d.name.toLowerCase() === val || d.name.toLowerCase().includes(val));

    if (!guess) return;

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

// 4. WYŚWIETLANIE KAFELKÓW (Z ŻÓŁTYM KOLOREM DLA ZESPOŁÓW)
function renderRow(guess) {
    const board = document.getElementById('board');
    const row = document.createElement('div');
    row.className = 'row';

    const config = [
        { f: 'code', l: 'CODE' },
        { f: 'nationality', l: 'NAT' },
        { f: 'number', l: 'NO' },
        { f: 'debut', l: 'YEAR' },
        { f: 'team', l: 'TEAM' }
    ];

    config.forEach((c, index) => {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.style.animationDelay = (index * 0.1) + 's';

        let val = guess[c.f];
        let status = 'wrong';

        if (val === targetDriver[c.f]) {
            status = 'correct';
        } else {
            // Logika żółtego koloru dla liczb (strzałki)
            if (typeof val === 'number') {
                val += (val < targetDriver[c.f] ? ' ↑' : ' ↓');
                status = 'near';
            }
            // Logika żółtego koloru dla zespołów (silnik/historia)
            else if (c.f === 'team') {
                const sameEngine = (guess.engine === targetDriver.engine);
                const wasInTeam = (targetDriver.past_teams && targetDriver.past_teams.includes(val));
                const targetWasInThisTeam = (guess.past_teams && guess.past_teams.includes(targetDriver.team));

                if (sameEngine || wasInTeam || targetWasInThisTeam) {
                    status = 'near';
                }
            }
        }

        tile.classList.add(status);
        tile.innerHTML = `<div class="label">${c.l}</div><div class="value">${val}</div>`;
        row.appendChild(tile);
    });

    board.prepend(row);
}
