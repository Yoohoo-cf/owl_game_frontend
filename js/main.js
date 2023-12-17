"use strict";

// Using Google Map API setting up Magic map
async function initMap() {
  const { Map } = await google.maps.importLibrary("maps");
  const map = new Map(document.getElementById("map"), {
      center: { lat: 47.941389065741085, lng: 21.85 },
      zoom: 3.5,
      mapId: '5a0b148f678aee47',
      mapTypeControl:false,
      fullscreenControl:false,
      streetViewControl:false,
    });
  return map;
}

// Define Variables
const apiUrl = 'http://127.0.0.1:7000/';
const startLoc = 'EFHK';
const globalMagics = [];

// Form to obtain player name and energy condition
document.querySelector("#player-form").addEventListener("submit", function(e) {
  e.preventDefault();
  const playerName = document.getElementById("player-input").value;
  document.querySelector("#player-modal").classList.add('hide');
  gameSetUp(`${apiUrl}newgame?player=${playerName}&loc=${startLoc}`);
})

// Fetch data from API
async function getData(url) {
  const response = await fetch(url);
  if(!response.ok){
    throw new Error('Invalid server input!')
  }
  const data = await response.json();
  return data
}

// Update game status  (✔)
function updateStatus(status) {
  document.getElementById("player-name").innerHTML = `Player: ${status.name}`
  document.getElementById("consumed").innerHTML = `${status.energy.consumed}`
  document.getElementById("budget").innerHTML = `${status.energy.budget}`
}

// Check any magic has been collected
function checkMagics(meets_magics){
  if (meets_magics.length > 0) {
    for (let magic of meets_magics ) {
      if (!globalMagics.includes(magic)) {
          document.querySelector('.goal').classList.remove('hide');
          location.href = '#magics';
      }
    }
  } else {
      alert("Sorry, you missed it")
  }
}

// Check Game Over
function checkGameOver(budget){
  if (budget <= 0) {
      alert(`Game Over! ${globalMagics.length} magics collected`);
      return false;
  } else if ( globalMagics.length === 7) {
      alert('Congrats! The Magic World has been saved!');
      return false;
  }
  return true;
}

// Update Magic data
function updateCollection(magics) {
    document.querySelector("#magics").innerHTML = '';
    for (let magic of magics ) {
        const article = document.createElement('article');
        article.classList.add("magic_card");
        const h4 = document.createElement('h4');
        const figure = document.createElement('figure');
        const img = document.createElement('img');
        const figcaption = document.createElement('figcaption');
        const p = document.createElement('p');
        img.src = magic.icon;
        img.alt = `magic name: ${magic.name}`;
        figcaption.innerHTML = magic.description;
        h4.innerHTML = magic.name;
        p.innerHTML = `Hint: ${magic.hint}`;

        figure.append(img);
        figure.append(figcaption);
        article.append(h4);
        article.append(figure);
        article.append(p);

        if (magic.collected) {
            article.classList.add('done');
            globalMagics.includes(magic.magicid) || globalMagics.push(magic.magicid);
        }
        document.querySelector('#magics').append(article);
    }
 }

//set up the game
async function gameSetUp(url) {
  try {
    const map = await initMap();
    document.querySelector(".goal").classList.add("hide");
    const gameData = await getData(url);
    console.log(gameData);
    updateStatus(gameData.status);
    if(!checkGameOver(gameData.status.energy.budget)) return;

    for (let airport of gameData.location) {
        let marker = new google.maps.Marker({
              position: { lat: airport.latitude, lng: airport.longitude },
              map,
              icon: {
                url: "../img/marker1.png",
                scaledSize: new google.maps.Size(45, 40)
              },
           });

          if (airport.active) {
            const infowindow = new google.maps.InfoWindow({
              content: `<b>You are here</b>: ${airport.name}`,
            });
            google.maps.event.addListener(marker, 'click', () => {
              infowindow.open(map, marker);
            });
            checkMagics(airport.magics.meets_magics);
      } else {
            const popUp = document.createElement("div");
            popUp.classList.add("popUp");
            const h4 = document.createElement("h4");
            h4.innerHTML = `${airport.name}`;
            const goButton = document.createElement("button");
            goButton.classList.add("pop_button");
            goButton.innerHTML = `Explore this magic place`;
            const p = document.createElement('p');
            p.innerHTML = `Distance ${airport.distance} km`;

            popUp.append(h4);
            popUp.append(goButton);
            popUp.append(p);

            const magicInfowindow = new google.maps.InfoWindow({
              content: popUp,
            });

            google.maps.event.addListener(marker, 'click', () => {
              magicInfowindow.open(map, marker);
            });

            goButton.addEventListener("click", function () {
              gameSetUp(`${apiUrl}flyto?game=${gameData.status.id}&dest=${airport.ident}&consumption=${airport.energy_consumption}`);
            });
          }
       }
    updateCollection(gameData.magics);
  } catch (error) {
    console.log(error)
  }
}

// Event listener to hide magic collected popup
document.querySelector(".goal").addEventListener("click", function(e) {
   e.currentTarget.classList.add('hide');
})

