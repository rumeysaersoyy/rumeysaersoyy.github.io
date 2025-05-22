const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Görseller
const backgroundImg = new Image(); backgroundImg.src = "resimler/back.png"; //1. bölüm
const backgroundImg2 = new Image(); backgroundImg2.src = "resimler/back2.png";   // 2. bölüm
const backgroundImg3 = new Image(); backgroundImg3.src = "resimler/back3.png";   // 3. bölüm
const penguenImg    = new Image(); penguenImg.src    = "resimler/penguen.png"; //karakter
const blockImg      = new Image(); blockImg.src      = "resimler/block.png"; //platform bloğu
const soruBlokImg   = new Image(); soruBlokImg.src   = "resimler/soruisareti.png"; //soru bloğu -> balık verir.
const balikImg      = new Image(); balikImg.src      = "resimler/balik.png"; //can veren balık
const coinImg       = new Image(); coinImg.src       = "resimler/coin.png"; //skor arttıran coin
const canavarImg    = new Image(); canavarImg.src    = "resimler/monster.png"; //1.bölüm canavarı
const canavarImg2 = new Image(); canavarImg2.src = "resimler/monster2.png";//2.bölüm canavarı
const canavarImg3 = new Image(); canavarImg3.src = "resimler/monster3.png";//3.bölüm canavarı

const kilicImg      = new Image(); kilicImg.src      = "resimler/kilic.png";//fırlatılan kılıç
const igloImg       = new Image(); igloImg.src       = "resimler/iglo.png";//her bölüm bittiğinde girilen iglo

//Sesler
const soruBlokSesi = new Audio("sesler/ses.mp3");//soru bloğuna vurulunca çıkan ses
const aciSesi = new Audio("sesler/acı.mp3");//oyuncu can kaybettiğinde çalan ses
const arkaPlanSesi = new Audio("sesler/arkases.mp3");//arka plan sesi
arkaPlanSesi.loop = true;       // sürekli çalması için
arkaPlanSesi.volume = 0.3;      // sesi biraz kıs (0.0 - 1.0 arası)

// --- NESNE VE DURUM TANIMLARI ---
const iglo = { width:150, height:150, x:canvas.width-80-64, y:10 };// iglo başlangıç konumu
let bolum = 1;
// Oyuncu karakterin özellikleri
let player = {
  x:50, y:400, width:60, height:65,
  vx:0, vy:0, gravity:0.6, jumpPower:-16,
  onGround:false, can:1, skor:0, oldu:false,
  hasarZamani: 0
};
// Oyun içi nesneler 
let blocks = [];
let coins = [];
let soruBlok = null;
let baliklar = [];
let canavarlar = [];
let kiliclar = [];

let keys = {};// klavye tuşlarının durumu


// --- BÖLÜM YÜKLEME FONKSİYONU ---
// her bölümdeki blok, canavar, coin, soru blokları burada tanımlanır
function setupLevel(bolum) {
  // Bölüme göre bloklar, canavarlar, coin ve soru bloklarını ayarla

  if (bolum === 1) {
    blocks = [
      { x:250, y:400, width:80, height:40 },
      { x:450, y:300, width:80, height:40 },
      { x:650, y:200, width:80, height:40 }
    ];
    canavarlar = [
      { x:500, y:250, width:50, height:50, vx:-1 },
      { x:650, y:350, width:50, height:50, vx:-1.5 }
    ];
    soruBlok = { x:300, y:200, width:50, height:50, aktif:true };
  } 
  else if (bolum === 2) {
    blocks = [
      { x: 150, y: 450, width: 100, height: 40 },
      { x: 350, y: 380, width: 100, height: 40 },
      { x: 550, y: 310, width: 100, height: 40 },
      { x: 750, y: 260, width: 100, height: 40 },
      { x: 900, y: 210, width: 80, height: 40 }  // igloya çıkan son blok
    ];
    
    canavarlar = [
      { x: 200, y: 400, width: 55, height: 55, vx: -1 },
      { x: 600, y: 280, width: 55, height: 55, vx: -1.2 },
      { x: 850, y: 180, width: 55, height: 55, vx: -0.8 }
    ];
    
    soruBlok = { x: 600, y: 140, width: 50, height: 50, aktif: true };
  }
  
  
  else if (bolum === 3) {
    blocks = [
      { x:200, y:400, width:80, height:40 },
      { x:350, y:300, width:80, height:40 },
      { x:500, y:200, width:80, height:40 },
      { x:650, y:300, width:80, height:40 },
      { x:800, y:400, width:80, height:40 }
    ];
  
    canavarlar = [
      { x:250, y:350, width:50, height:50, vx:-1.6 },
      { x:450, y:250, width:50, height:50, vx:-1.4 },
      { x:700, y:100, width:50, height:50, vx:-1.8 }
    ];
  
    soruBlok = { x:500, y:70, width:50, height:50, aktif:true };
  
    // igloyu sağ orta konuma koy
    iglo.x = canvas.width - iglo.width - 10;
    iglo.y = canvas.height / 2 - iglo.height - 30;

  }
  
  
  // coinleri blokların üzerine yerleştir
  coins = [];
  const coinWidth=20, coinHeight=20, coinSpacing=5;
  for (let block of blocks) {
    let n = Math.floor(block.width/(coinWidth+coinSpacing));
    for (let i=0; i<n; i++) {
      coins.push({
        x: block.x + i*(coinWidth+coinSpacing) + (block.width - (n*(coinWidth+coinSpacing)-coinSpacing))/2,
        y: block.y - coinHeight - 5,
        width:coinWidth, height:coinHeight,
        aktif:true
      });
    }
  }

  baliklar = []; // her bölüm başında mevcut balıklar temizlenir
  kiliclar = [];  // kılıçlar da sıfırlanır
}
// --- OYUNU BAŞTAN BAŞLATMA ---
function resetGame() {
    const mevcutSkor = player.skor || 0;
  
    player = {
      x: 50,
      y: 400,
      width: 60,
      height: 65,
      vx: 0,
      vy: 0,
      gravity: 0.9,
      jumpPower: -18,
      onGround: false,
      can: 1,             // CAN HER ZAMAN 1 OLARAK BAŞLASIN
      skor: mevcutSkor,   // SKOR KORUNSUN
      oldu: false
    };
  
    setupLevel(bolum);  //iglo konumu burada ayarlanıyor
  }
  
// --- KLAVYE VE FARE ETKİLEŞİMLERİ ---
document.addEventListener("keydown", e => {
  keys[e.key] = true;
   // F tuşuna basılırsa kılıç fırlat
  if ((e.key==="f"||e.key==="F") && !player.oldu) {
    kiliclar.push({
      x:player.x+player.width/2,
      y:player.y+player.height/2,
      width:30, height:30, vx:6, angle:0
    });
  }
});
document.addEventListener("keyup", e=> keys[e.key]=false);
// Oyuncu öldüğünde "Yeniden Oyna" butonuna tıklanırsa

canvas.addEventListener("click", e=>{
    if (!player.oldu) return;
    const rect = canvas.getBoundingClientRect(),
          mx = e.clientX-rect.left,
          my = e.clientY-rect.top,
          bx = canvas.width/2-75,
          by = canvas.height/2+40;
    if (mx>=bx && mx<=bx+150 && my>=by && my<=by+40) {
      resetGame();  // location.reload() yerine bunu çağır
    }
  });
  
// --- OYUN MANTIĞI (FİZİK, ÇARPIŞMA, PUAN vb.) ---
function update() {
  if (player.oldu) return;

  // Hareket
  player.vx = keys["ArrowRight"]?5: keys["ArrowLeft"]?-5:0;
  if (keys[" "] && player.onGround) { player.vy = player.jumpPower; player.onGround=false; }
  player.vy += player.gravity;
  player.x += player.vx;
  player.y += player.vy;
  player.onGround=false;

  // Blok çarpışmaları
  for (let b of blocks) {
    if (player.x+player.width>b.x && player.x<b.x+b.width &&
        player.y+player.height>=b.y && player.y+player.height<=b.y+player.vy+10 &&
        player.vy>=0) {
      player.y = b.y-player.height; player.vy=0; player.onGround=true;
    }
    if (player.x+player.width>b.x && player.x<b.x+b.width &&
        player.y<=b.y+b.height && player.y>=b.y && player.vy<0) {
      player.vy=0;
    }
  }

  // Soru bloğa kafayla vuruş
  if (soruBlok.aktif &&
    player.x + player.width > soruBlok.x &&
    player.x < soruBlok.x + soruBlok.width &&
    player.y < soruBlok.y + soruBlok.height &&
    player.y + player.height >= soruBlok.y + soruBlok.height &&
    player.vy < 0) {
    
    soruBlok.aktif = false;
    player.vy = 0;

    soruBlokSesi.play();

    // Balık oluştur
    console.log("🐟 Balık oluşturuldu!");
    baliklar.push({
      x: soruBlok.x + soruBlok.width / 2 - 15,
      y: soruBlok.y - 30,
      width: 40,
      height: 40,
      vy: 2
    });
}


  // Balık düşüşü ve toplama
  for (let i=baliklar.length-1; i>=0; i--) {
    let b = baliklar[i];
    b.y += b.vy;
    // Penguen balığı yerse
    if (player.x < b.x+b.width && player.x+player.width>b.x &&
        player.y < b.y+b.height && player.y+player.height>b.y) {
      player.can++;
      baliklar.splice(i,1);
    }
    // ekranda kaybolan balık
    else if (b.y > canvas.height) baliklar.splice(i,1);
  }

  // Coin toplama
  for (let c of coins) {
    if (!c.aktif) continue;
    if (player.x < c.x+c.width && player.x+player.width>c.x &&
        player.y < c.y+c.height && player.y+player.height>c.y) {
      player.skor += 10;
      c.aktif = false;
    }
  }

// Kılıç
for (let i = kiliclar.length - 1; i >= 0; i--) {
    let k = kiliclar[i];
    k.x += k.vx;        // kılıcın ileri doğru hareketi
    k.angle += 0.2;     // kılıcın kendi etrafında dönmesi için açı artırımı
    
    // eğer kılıç ekran dışına çıktıysa listeden çıkar
    if (k.x > canvas.width) kiliclar.splice(i, 1);
  }
  
  // canavar hareketi ve çarpışmaları
  for (let mon of canavarlar) {
    mon.x += mon.vx;
    if (mon.x < 0 || mon.x + mon.width > canvas.width) mon.vx *= -1; // canavar duvara çarpınca yön değiştirir
  }
  
  for (let i = canavarlar.length - 1; i >= 0; i--) {
    let c = canavarlar[i];
    // player ile canavarın çarpışması
    if (player.x < c.x + c.width && player.x + player.width > c.x &&
        player.y < c.y + c.height && player.y + player.height > c.y) {
      player.can--;
      player.hasarZamani = Date.now();
      aciSesi.play(); 
      canavarlar.splice(i, 1);
      if (player.can <= 0) player.oldu = true;
    }
    
    //kılıçla canavarın çarpışması
    for (let j = kiliclar.length - 1; j >= 0; j--) {
      let k = kiliclar[j];
      if (k.x < c.x + c.width && k.x + k.width > c.x &&
          k.y < c.y + c.height && k.y + k.height > c.y) {
        canavarlar.splice(i, 1);
        kiliclar.splice(j, 1);
        break;
      }
    }
  }
  

  // zemin
  if (player.y+player.height>=canvas.height) {
    player.y = canvas.height-player.height;
    player.vy=0; player.onGround=true;
}

// --- OYUN BİTİŞİ ---
function oyunuBitir() {
    player.oldu = true;
    canvas.style.display = "none";
    document.getElementById("endScreen").style.display = "flex";
    document.getElementById("finalScore").textContent = "Skorunuz: " + player.skor;
  }

// igloya ulaşma (bölüm geçiş)
if (player.x + player.width > iglo.x && player.y < iglo.y + iglo.height) {
    if (bolum < 3) {
      bolum++;
      resetGame();
    } else {
      oyunuBitir(); 
    }
  }  
}

// --- YENİDEN BAŞLAT BUTONU ---
  document.getElementById("restartButton").addEventListener("click", () => {
    bolum = 1;
    player.skor = 0;
    player.can = 1;
    document.getElementById("endScreen").style.display = "none";
    canvas.style.display = "block";
    resetGame();
  });
    
// --- ÇİZİM ---
function draw() {
ctx.clearRect(0, 0, canvas.width, canvas.height);
  // Bölüme göre doğru arka planı çiz
  let aktifBackImg = backgroundImg;  // 1. bölüm
  if (bolum === 2) aktifBackImg = backgroundImg2;
  else if (bolum === 3) aktifBackImg = backgroundImg3;

  ctx.drawImage(aktifBackImg, 0, 0, canvas.width, canvas.height);
 ctx.fillStyle = "rgba(0, 0, 0, 0.4)";
 ctx.beginPath();
 const centerX = iglo.x + iglo.width / 2 -6;
 const centerY = iglo.y + iglo.height / 2;
 const radius = Math.max(iglo.width, iglo.height) / 2 + 0.0001;
 ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
 ctx.fill();
 



ctx.drawImage(igloImg, iglo.x, iglo.y, iglo.width, iglo.height);

// Bloklar
for (let b of blocks) ctx.drawImage(blockImg, b.x, b.y, b.width, b.height);

// Soru bloğu
if (soruBlok.aktif)
ctx.drawImage(soruBlokImg, soruBlok.x, soruBlok.y, soruBlok.width, soruBlok.height);

// Balıklar
for (let b of baliklar) ctx.drawImage(balikImg, b.x, b.y, b.width, b.height);

// Coinler
for (let c of coins) if (c.aktif) ctx.drawImage(coinImg, c.x, c.y, c.width, c.height);

// Canavarlar
let aktifCanavarImg = canavarImg; // default: 1. bölüm

if (bolum === 2) aktifCanavarImg = canavarImg2;
else if (bolum === 3) aktifCanavarImg = canavarImg3;

for (let c of canavarlar) {
  ctx.drawImage(aktifCanavarImg, c.x, c.y, c.width, c.height);
}

// Kılıçlar (dönen olarak çizilecek)
for (let k of kiliclar) {
  ctx.save();
  ctx.translate(k.x + k.width / 2, k.y + k.height / 2);  // Kılıcın merkezine taşı
  ctx.rotate(k.angle);                                   // Kılıcın açı değerine göre döndür
  ctx.drawImage(kilicImg, -k.width / 2, -k.height / 2, k.width, k.height);  // Kılıcı merkezden çiz
  ctx.restore();
}
const hasarSuresi = 350; // ms
if (Date.now() - player.hasarZamani < hasarSuresi) {
  // kırmızı ton efekti için filtre uygula
  ctx.filter = "brightness(0.5) sepia(1) saturate(5) hue-rotate(-50deg)";
}
ctx.drawImage(penguenImg, player.x, player.y, player.width, player.height);
ctx.filter = "none"; // filtreyi sıfırla


// HUD: Can ve skor
ctx.fillStyle = "rgba(255, 105, 180, 0.6)"; 
ctx.fillRect(10, 10, 160, 90); 
ctx.fillStyle = "black";
ctx.font = "18px Arial";
ctx.fillText(" ❤︎Can: " + player.can, 20, 30);
ctx.fillText("💰Skor: " + player.skor, 20, 60);
ctx.fillText("✮ " + bolum + ". Bölüm ✮", 20, 90);


if (player.oldu) {
ctx.fillStyle = "rgba(0,0,0,0.7)";
ctx.fillRect(0, canvas.height/2-50, canvas.width, 120);
ctx.fillStyle = "white";
ctx.font = "50px Arial";
ctx.fillText("GAME OVER", canvas.width/2-140, canvas.height/2);
ctx.font = "30px Arial";
ctx.fillText("Tekrar oynamak için tıklayın", canvas.width/2-170, canvas.height/2+50);
}
}

function gameLoop() {
arkaPlanSesi.play().catch(e => {
// otomatik oynatmayı engelleyen tarayıcılar için hata yakala
console.log("Ses otomatik oynatılamadı. Kullanıcı etkileşimi gerekebilir.");
});   
update();
draw();
requestAnimationFrame(gameLoop);
}
let arkaPlanBasladi = false;
document.addEventListener("click", () => {
  if (!arkaPlanBasladi) {
    arkaPlanSesi.play();
    arkaPlanBasladi = true;
  }
});

balikImg.onload = () => {
    resetGame();
    gameLoop();
  };
  const startButton = document.getElementById("startButton");
const startScreen = document.getElementById("startScreen");
const music = document.getElementById("bgMusic");

startButton.addEventListener("click", () => {
  startScreen.style.display = "none";     // başlangıç ekranını gizle
  canvas.style.display = "block";         // canvas'ı göster
  music.play();                           // müzik çal
});

