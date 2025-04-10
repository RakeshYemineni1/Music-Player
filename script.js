console.log("Hello"); // Initial log to check if script is loaded

let currentSong = new Audio();
let songs;
let lastVol = 0.8;
let currentFolder;

// Fetch and load songs from a folder
async function getSongs(folder) {
    currentFolder = folder;
    let a = await fetch(`http://127.0.0.1:3000/${currentFolder}/`);
    let response = await a.text();
    
    let div = document.createElement("div");
    div.innerHTML = response;
    let As = div.getElementsByTagName("a");
    songs = [];

    // Extract .mp3 file names
    for (let i = 0; i < As.length; i++) {
        const element = As[i];
        if (element.href.endsWith(".mp3")) {
            songs.push(element.href.split(`/${currentFolder}/`)[1]);
        }
    }
    
    // Populate the song list in UI
    let songUL = document.querySelector(".songslist").getElementsByTagName("ul")[0];
    songUL.innerHTML = "";
    for (const song of songs) {
        songUL.innerHTML += `<li> 
            <img class="invert" src="img/music.svg" alt="music">
            <div class="info">
                <div>${song.replaceAll("%20", " ").replaceAll("%", " ")}</div>
                <div>Artist</div>
            </div>
            <div class="playNow">
                <span>Play Now</span>
                <img class="invert" src="img/play.svg" alt="play">
            </div>
        </li>`;
    }

    // Add click event to each song
    Array.from(document.querySelector(".songslist").getElementsByTagName("li")).forEach(element => {
        element.addEventListener("click", e => {
            let songName = element.querySelector(".info").firstElementChild.innerHTML.trim();
            playMusic(songName);
        });
    });

    return songs;
}

// Format seconds into MM:SS
function formatTime(seconds) {
    if (isNaN(seconds) || seconds < 0) return "0:00";

    const minutes = Math.floor(seconds / 60);
    let secs = Math.floor(seconds % 60);
    if (secs < 10) secs = "0" + secs;
    
    return `${minutes}:${secs}`;
}

// Play selected music
const playMusic = (track, pause = false) => {
    currentSong.src = `/${currentFolder}/` + track;
    if (!pause) {
        currentSong.play();
        play.src = "img/pause.svg";
    }
    document.querySelector(".songinfo").innerHTML = decodeURI(track);
    document.querySelector(".songtime").innerHTML = "00:00/00:00";
}

// Load albums dynamically
async function dynamicAlbums() {
    let a = await fetch(`http://127.0.0.1:3000/songs`);
    let response = await a.text();
    
    let div = document.createElement("div");
    div.innerHTML = response;
    let array = Array.from(div.getElementsByTagName("a"));

    for (let index = 0; index < array.length; index++) {
        const e = array[index];
        if (e.href.includes("/songs")) {
            let folder = e.href.split("/").slice(-2)[0];
            let a = await fetch(`http://127.0.0.1:3000/songs/${folder}/info.json`);
            let response = await a.json();

            let cardContainer = document.querySelector(".cardContainer");
            cardContainer.innerHTML += `<div data-folder="${folder}" class="play-card rounded">
                <div class="play">
                    <img class="play-butn" src="img/play-button-svgrepo-com.svg" alt="play">
                </div>
                <img class="rounded" src="songs/${folder}/cover.jpg" alt="playlist">
                <h4>${response.title}</h4>
                <p>${response.description}</p>
            </div>`;
        }
    }

    // Add click event to each album card
    Array.from(document.getElementsByClassName("play-card")).forEach(e => {
        e.addEventListener("click", async item => {
            songs = await getSongs(`songs/${item.currentTarget.dataset.folder}`);
            playMusic(songs[0]);
        });
    });
}

// Main function to initialize everything
async function main() {
    songs = await getSongs("songs/yt");
    playMusic(songs[0], true);
    dynamicAlbums();

    // Play/Pause button event
    play.addEventListener("click", () => {
        if (currentSong.paused) {
            currentSong.play();
            play.src = "img/pause.svg";
        } else {
            currentSong.pause();
            play.src = "img/play.svg";
        }
    });

    // Update progress bar as song plays
    currentSong.addEventListener("timeupdate", () => {
        document.querySelector(".songtime").innerHTML = `${formatTime(currentSong.currentTime)} / ${formatTime(currentSong.duration)}`;
        let progress = (currentSong.currentTime / currentSong.duration) * 100;
        document.querySelector(".progress").style.width = `${progress}%`;
        document.querySelector(".circle").style.left = `${progress}%`;
    });

    // Seek in the song when clicking on seekbar
    document.querySelector(".seekbar").addEventListener("click", e => {
        let jump = (e.offsetX / e.target.getBoundingClientRect().width) * 100;
        document.querySelector(".circle").style.left = jump + "%";
        currentSong.currentTime = (currentSong.duration * jump) / 100;
    });

    // Hamburger menu open/close
    document.querySelector(".hamburger").addEventListener("click", () => {
        document.querySelector(".left").style.left = "0";
    });

    document.querySelector(".close").addEventListener("click", () => {
        document.querySelector(".left").style.left = "-130%";
    });

    // Previous song
    previous.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index - 1) >= 0) {
            playMusic(songs[index - 1]);
        }
    });

    // Next song
    next.addEventListener("click", () => {
        let index = songs.indexOf(currentSong.src.split("/").slice(-1)[0]);
        if ((index + 1) < songs.length) {
            playMusic(songs[index + 1]);
        }
    });

    // Volume control
    document.querySelector(".volume-container input").addEventListener("input", e => {
        let value = parseInt(e.target.value);
        let changeVol = value / 100;
        currentSong.volume = changeVol;
        lastVol = changeVol;

        document.querySelector(".range").style.background = 
            `linear-gradient(to right, rgb(255, 255, 255) 0%, rgb(255, 255, 255) ${value}%, #535353 ${value}%, #535353 100%)`;
    });

    // Mute/Unmute button
    Volume.addEventListener("click", () => {
        if (currentSong.volume != 0) {
            lastVol = currentSong.volume;
            currentSong.volume = 0;
            Volume.src = "img/mute.svg";
        } else {
            currentSong.volume = lastVol;
            Volume.src = "img/volume.svg";
        }

        const range = document.querySelector(".range");
        const volumePercent = currentSong.volume * 100;
        range.value = volumePercent;
        range.style.background = 
            `linear-gradient(to right, rgb(255, 255, 255) 0%, rgb(255, 255, 255) ${volumePercent}%, #535353 ${volumePercent}%, #535353 100%)`;
    });
}

main();
