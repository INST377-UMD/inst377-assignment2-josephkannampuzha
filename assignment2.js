// ----------------- PAGE NAVIGATION -----------------
function showPage(pageId) {
    document.querySelectorAll(".page").forEach(page => page.style.display = "none");
    document.getElementById(pageId).style.display = "block";
}
showPage('home');

// ----------------- RANDOM QUOTE ON HOME -----------------
const quoteUrl = "https://zenquotes.io/api/random";
async function loadQuote(url) {
    const response = await fetch(url);
    const data = await response.json();
    document.getElementById("quote").innerText = `"${data[0].q}" — ${data[0].a}`;
}
loadQuote(quoteUrl);

// ----------------- FETCH STOCK CHART -----------------
function fetchStock() {
    const ticker = document.getElementById("ticker").value.toUpperCase();
    const duration = parseInt(document.getElementById("duration").value) || 30;

    // Find the most recent weekday (skip weekends)
    let endDateObj = new Date();
    while (endDateObj.getDay() === 0 || endDateObj.getDay() === 6) {
        endDateObj.setDate(endDateObj.getDate() - 1); // back to Friday or earlier
    }

    const endDate = endDateObj.toISOString().split("T")[0];
    const startDate = new Date(endDateObj.getTime() - duration * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    const API_KEY = "aMgaXiS6wLuA3nKNgVEKGer3rtfCGW4F";
    const url = `https://api.polygon.io/v2/aggs/ticker/${ticker}/range/1/day/${startDate}/${endDate}?adjusted=true&sort=asc&limit=120&apiKey=${API_KEY}`;

    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error: ${response.status}`);
            }
            return response.json();
        })
        .then(data => {
            if (!data.results || data.results.length === 0) {
                alert("No data found for this ticker. Please check the symbol and try again.");
                return;
            }

            const labels = data.results.map(day => new Date(day.t).toLocaleDateString());
            const prices = data.results.map(day => day.c);

            generateChart(labels, prices);
        })
        .catch(error => {
            console.error("Fetch error:", error);
            alert(`Error fetching stock data: ${error.message}`);
        });
}

function generateChart(labels, prices) {
    const ctx = document.getElementById("stockChart").getContext('2d');

    // Only call destroy if it's a Chart instance
    if (window.stockChart instanceof Chart) {
        window.stockChart.destroy();
    }

    window.stockChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: "Stock Price",
                data: prices,
                borderColor: "#FF5733",
                fill: false
            }]
        }
    });
}


// ----------------- LOAD REDDIT STOCKS -----------------
function loadTopRedditStocks() {
    fetch("https://tradestie.com/api/v1/apps/reddit?date=2022-04-03")
        .then(response => response.json())
        .then(data => {
            const top5 = data.slice(0, 5);
            const table = document.getElementById("stocksTable");

            top5.forEach(stock => {
                const row = document.createElement("tr");
                row.innerHTML = `
                    <td><a href="https://finance.yahoo.com/quote/${stock.ticker}" target="_blank">${stock.ticker}</a></td>
                    <td>${stock.no_of_comments}</td>
                    <td>${stock.sentiment === "Bullish" ? "📈" : "📉"} ${stock.sentiment}</td>
                `;
                table.appendChild(row);
            });
        });
}
loadTopRedditStocks();

// ----------------- LOAD DOG CAROUSEL -----------------
fetch("https://dog.ceo/api/breeds/image/random/10")
    .then(response => response.json())
    .then(data => {
      const carousel = document.getElementById("dogCarousel");
        data.message.forEach(src => {
            let img = `<img src="${src}" class="carousel-image">`;
            carousel.innerHTML += img;
        });
    });

// ----------------- LOAD DOG BREEDS + BUTTONS -----------------
function loadBreeds() {
    fetch("https://api.thedogapi.com/v1/breeds")
        .then(response => response.json())
        .then(breeds => {
            const container = document.getElementById("breedsContainer");
            breeds.forEach(breed => {
                const btn = document.createElement("button");
                btn.textContent = breed.name;
                btn.setAttribute("class", "custom-button");
                btn.addEventListener("click", () => showBreedInfo(breed));
                container.appendChild(btn);
            });
            window.allBreeds = breeds; // Store for voice command
        });
}
loadBreeds();

function showBreedInfo(breed) {
    const infoBox = document.getElementById("breedInfo");
    infoBox.innerHTML = `
        <h2>${breed.name}</h2>
        <p><strong>Description:</strong> ${breed.temperament || "N/A"}</p>
        <p><strong>Life Span:</strong> ${breed.life_span}</p>
    `;
    infoBox.style.display = "block";
}

// ----------------- VOICE COMMANDS -----------------
if (annyang) {
    const commands = {
        "hello": () => alert("Hello World!"),
        "change the color to *color": color => document.body.style.backgroundColor = color,
        "navigate to *page": page => showPage(page.toLowerCase()),
        "lookup *stock": stock => {
            document.getElementById("ticker").value = stock.toUpperCase();
            document.getElementById("duration").value = "30";
            fetchStock();
        },
        "load dog breed *breedName": breedName => {
            const match = window.allBreeds.find(b => b.name.toLowerCase() === breedName.toLowerCase());
            if (match) {
                showBreedInfo(match);
            } else {
                alert(`Breed "${breedName}" not found`);
            }
        }
    };
    annyang.addCommands(commands);
    annyang.start();
}

