/* ==========================================================================
   VOSSENBERG VEGAN FARM - GAME ENGINE & LOGIC (CARMEN'S 28E VERJAARDAG EDITIE)
   ========================================================================== */

document.addEventListener('DOMContentLoaded', () => {
  
  // Game State (All inventory initialized to 0 for authentic farming progression!)
  const state = {
    totalLand: 100, // m²
    usedLand: 0,    // m²
    stars: 280,
    humus: 0,
    selectedCrop: 'paprika',
    inventory: {
      haver: 0,
      zonnebloem: 0,
      spelt: 0,
      lijnzaad: 0,
      kikkererwt: 0,
      paprika: 0,
      knoflook: 0,
      walnoot: 0,
      linzen: 0,
      tuinkruiden: 0,
      aubergine: 0,
      cassave: 0,
      citroen: 0
    },
    unlockedRecipes: [],
    quizIndex: 0,
    tiles: Array(10).fill(null).map((_, i) => ({
      id: i,
      crop: null,
      stage: 'empty',
      progress: 0,
      timer: null
    }))
  };

  // Crop Metadata Definition (With Greenhouse Climate Badges)
  const CROP_DATA = {
    paprika: { name: "Rode Paprika & Pepers", emoji: "🫑", growTime: 5000, desc: "Voor Maza Muhammara & Kroepoek", climate: "Weide" },
    knoflook: { name: "Knoflook & Uien", emoji: "🧄", growTime: 4000, desc: "Smaakmaker voor Heks'nkaas & Dips", climate: "Weide" },
    walnoot: { name: "Walnotenboom", emoji: "🌰", growTime: 7000, desc: "Voor verse walnoten in Muhammara", climate: "Weide" },
    tuinkruiden: { name: "Bieslook & Peterselie", emoji: "🌿", growTime: 3000, desc: "Voor Heks'nkaas & Party Toastjes", climate: "Weide" },
    linzen: { name: "Linzen (Peulvruchten)", emoji: "🫘", growTime: 5000, desc: "Voor BioToday Linzenchips", climate: "Weide" },
    aubergine: { name: "Aubergines", emoji: "🍆", growTime: 6000, desc: "Voor AH Terra Baba Ganoush", climate: "🌡️ De Vossenberg Kas" },
    cassave: { name: "Cassave Wortelknol", emoji: "🍠", growTime: 8000, desc: "Voor Samasaya Toku Kroepoek", climate: "🌡️ De Vossenberg Kas" },
    citroen: { name: "Citroenbomen", emoji: "🍋", growTime: 6000, desc: "Voor frisse zuren in dips", climate: "🌡️ De Vossenberg Kas" },
    haver: { name: "Haver", emoji: "🌾", growTime: 4000, desc: "Voor havermelk & cappuccino", climate: "Weide" },
    zonnebloem: { name: "Zonnebloemen", emoji: "🌻", growTime: 6000, desc: "Voor koudgeperste zonnebloemolie", climate: "Weide" },
    spelt: { name: "Spelt & Tarwe", emoji: "🥖", growTime: 5000, desc: "Meel voor LU Crackers & Toastjes", climate: "Weide" },
    lijnzaad: { name: "Lijnzaad", emoji: "🟤", growTime: 5000, desc: "Vegan ei-vervanger (binding)", climate: "Weide" },
    kikkererwt: { name: "Kikkererwten", emoji: "🧆", growTime: 7000, desc: "Voor Aquafaba & Vegan Mayo", climate: "Weide" }
  };

  // E-Number & Hidden Ingredient Detective Questions
  const QUIZ_QUESTIONS = [
    {
      question: "Veel borreltoastjes en broden gebruiken E920 (L-cysteïne) als deegverbeteraar. Waar komt dit vaak vandaan?",
      options: [
        { text: "A) Uit varkensharen of eendenveren (dierlijk!)", correct: true },
        { text: "B) Uit biologisch lijnzaad", correct: false },
        { text: "C) Uit gedroogde zonnebloempitten", correct: false }
      ],
      explanation: "E920 L-cysteïne kan gewonnen worden uit eendenveren of dierlijk haar. Carmen vervangt dit in de game door 100% plantaardig meel!"
    },
    {
      question: "In veel niet-vegan kazen zit 'stremsel'. Waarom gebruikt Heks'nkaas Vegan dit NIET?",
      options: [
        { text: "A) Omdat stremsel uit de maag van een kalfje komt (dierlijk!)", correct: true },
        { text: "B) Omdat stremsel zout is", correct: false },
        { text: "C) Omdat stremsel van de olijfboom komt", correct: false }
      ],
      explanation: "Traditioneel stremsel komt uit de maag van kalfjes. Heks'nkaas Vegan gebruikt plantaardige fermentatie uit neute/zonnebloemzuivel!"
    },
    {
      question: "Wat maakt Samasaya Cassave Kroepoek 100% vegan in vergelijking met gewone garnalenkroepoek?",
      options: [
        { text: "A) Gewone kroepoek gebruikt gemalen garnalen; Cassave is een tropische wortelknol!", correct: true },
        { text: "B) Er zit geen zout in cassave", correct: false },
        { text: "C) Cassave groeit onder de zeespiegel", correct: false }
      ],
      explanation: "Traditionele kroepoek bevat garnaal. Cassave kroepoek is gemaakt van de knapperige cassavewortel uit de tropische kas!"
    }
  ];

  // DOM Elements
  const landGridEl = document.getElementById('land-grid');
  const landUsedValEl = document.getElementById('land-used-val');
  const landBarEl = document.getElementById('land-bar');
  const starsValEl = document.getElementById('stars-val');
  const humusValEl = document.getElementById('humus-val');
  const inventoryTagsEl = document.getElementById('inventory-tags');
  const gameLogEl = document.getElementById('game-log');

  // Tab Switching
  const tabLinks = document.querySelectorAll('.tab-link');
  const tabContents = document.querySelectorAll('.tab-content');

  tabLinks.forEach(btn => {
    btn.addEventListener('click', () => {
      tabLinks.forEach(b => b.classList.remove('active'));
      tabContents.forEach(c => c.classList.remove('active'));

      btn.classList.add('active');
      const targetId = `tab-${btn.dataset.tab}`;
      document.getElementById(targetId).classList.add('active');
    });
  });

  // Render Crop Selector Buttons Dynamically
  const cropSelectorEl = document.getElementById('crop-selector');
  function renderCropSelector() {
    cropSelectorEl.innerHTML = '';
    Object.keys(CROP_DATA).forEach(key => {
      const crop = CROP_DATA[key];
      const btn = document.createElement('button');
      btn.className = `crop-card ${state.selectedCrop === key ? 'active' : ''}`;
      btn.dataset.crop = key;

      btn.innerHTML = `
        <span class="crop-emoji">${crop.emoji}</span>
        <div class="crop-details">
          <span class="crop-name">${crop.name} <small class="climate-badge">${crop.climate}</small></span>
          <span class="crop-cost">10 m² • ${crop.growTime / 1000} sec</span>
          <span class="crop-desc">${crop.desc}</span>
        </div>
      `;

      btn.addEventListener('click', () => {
        document.querySelectorAll('.crop-card').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.selectedCrop = key;
        logMessage(`Geselecteerd: ${crop.name} (${crop.climate}). Klik op de 10 m² weide-kavel!`);
      });

      cropSelectorEl.appendChild(btn);
    });
  }

  // Initialize Land Grid Tiles (10 Tiles x 10 m² = 100 m²)
  function renderLandGrid() {
    landGridEl.innerHTML = '';
    
    state.tiles.forEach(tile => {
      const tileEl = document.createElement('div');
      tileEl.className = `land-tile ${tile.stage}`;
      tileEl.dataset.id = tile.id;

      if (tile.stage === 'empty') {
        tileEl.innerHTML = `
          <span class="tile-emoji">🌱</span>
          <span class="tile-label">Weide Kavel #${tile.id + 1}</span>
          <span class="tile-m2">10 m² Vrij</span>
        `;
      } else if (tile.stage === 'growing') {
        const crop = CROP_DATA[tile.crop];
        tileEl.innerHTML = `
          <span class="tile-emoji">🌱</span>
          <span class="tile-label">${crop.name}</span>
          <span class="tile-m2">Groeit...</span>
          <div class="tile-progress">
            <div class="tile-progress-bar" style="width: ${tile.progress}%"></div>
          </div>
        `;
      } else if (tile.stage === 'ready') {
        const crop = CROP_DATA[tile.crop];
        tileEl.innerHTML = `
          <span class="tile-emoji">${crop.emoji}</span>
          <span class="tile-label">${crop.name}</span>
          <span class="tile-m2">✨ OOGSTBAAR!</span>
        `;
      }

      tileEl.addEventListener('click', () => handleTileClick(tile));
      landGridEl.appendChild(tileEl);
    });

    updateResourceUI();
  }

  // Handle Clicking a Land Tile
  function handleTileClick(tile) {
    if (tile.stage === 'empty') {
      if (state.usedLand + 10 > state.totalLand) {
        logMessage(`⚠️ Geen vrije m² meer in de weide! Oogst of composteer eerst gewassen.`, 'warning');
        return;
      }

      tile.crop = state.selectedCrop;
      tile.stage = 'growing';
      tile.progress = 0;
      state.usedLand += 10;

      const cropInfo = CROP_DATA[tile.crop];
      logMessage(`🌱 10 m² ${cropInfo.name} ingezaaid (${cropInfo.climate}).`);

      let duration = cropInfo.growTime;
      if (state.humus > 0) {
        duration = duration / 2;
      }

      const stepInterval = 100;
      const totalSteps = duration / stepInterval;
      let currentStep = 0;

      tile.timer = setInterval(() => {
        currentStep++;
        tile.progress = Math.min(100, Math.floor((currentStep / totalSteps) * 100));

        if (currentStep >= totalSteps) {
          clearInterval(tile.timer);
          tile.stage = 'ready';
          logMessage(`✨ 10 m² ${cropInfo.name} is volgroeid en klaar om te oogsten!`);
        }
        renderLandGrid();
      }, stepInterval);

      renderLandGrid();

    } else if (tile.stage === 'ready') {
      const cropKey = tile.crop;
      state.inventory[cropKey] = (state.inventory[cropKey] || 0) + 10;
      state.usedLand -= 10;
      tile.stage = 'empty';
      tile.crop = null;
      tile.progress = 0;

      logMessage(`🌾 10 m² ${CROP_DATA[cropKey].name} geoogst!`);
      renderLandGrid();
      updateCompostSelect();
    }
  }

  // Harvest All Ready Tiles
  document.getElementById('btn-harvest-all').addEventListener('click', () => {
    let harvestedCount = 0;
    state.tiles.forEach(tile => {
      if (tile.stage === 'ready') {
        state.inventory[tile.crop] = (state.inventory[tile.crop] || 0) + 10;
        state.usedLand -= 10;
        tile.stage = 'empty';
        tile.crop = null;
        tile.progress = 0;
        harvestedCount++;
      }
    });

    if (harvestedCount > 0) {
      logMessage(`🌾 ${harvestedCount * 10} m² gewassen succesvol geoogst!`);
      renderLandGrid();
      updateCompostSelect();
    } else {
      logMessage(`Er zijn nog geen gewassen klaar om te oogsten.`);
    }
  });

  // Update Inventory & Resources UI
  function updateResourceUI() {
    landUsedValEl.textContent = `${state.usedLand} / ${state.totalLand} m²`;
    landBarEl.style.width = `${(state.usedLand / state.totalLand) * 100}%`;
    starsValEl.textContent = state.stars;
    humusValEl.textContent = `${state.humus} zakken`;

    inventoryTagsEl.innerHTML = '';
    let hasItems = false;
    Object.keys(state.inventory).forEach(key => {
      const amount = state.inventory[key];
      if (amount > 0 && CROP_DATA[key]) {
        hasItems = true;
        const tag = document.createElement('span');
        tag.className = 'inv-tag';
        tag.textContent = `${CROP_DATA[key].emoji} ${CROP_DATA[key].name}: ${amount} m²`;
        inventoryTagsEl.appendChild(tag);
      }
    });

    if (!hasItems) {
      inventoryTagsEl.innerHTML = '<span class="inv-tag">Geen voorraad (Zaai eerst in de weide!)</span>';
    }
  }

  // Recipe Cooking Event Delegation
  document.getElementById('tab-recipes').addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-cook');
    if (!btn) return;

    const recipeKey = btn.dataset.recipe;
    if (recipeKey === 'heksnkaas') {
      cookRecipe('heksnkaas', { tuinkruiden: 20, knoflook: 20, citroen: 10, zonnebloem: 20 }, "Heks'nkaas Vegan");
    } else if (recipeKey === 'muhammara') {
      cookRecipe('muhammara', { paprika: 30, knoflook: 10, walnoot: 20 }, 'Maza Muhammara');
    } else if (recipeKey === 'babaganoush') {
      cookRecipe('babaganoush', { aubergine: 30, knoflook: 10, citroen: 10, tuinkruiden: 10 }, 'AH Terra Baba Ganoush');
    } else if (recipeKey === 'kroepoek') {
      cookRecipe('kroepoek', { cassave: 30, paprika: 20, knoflook: 10 }, 'Samasaya Cassave Kroepoek');
    } else if (recipeKey === 'toastjes') {
      cookRecipe('toastjes', { spelt: 40, zonnebloem: 20, tuinkruiden: 10 }, 'Haust Party Toastjes & LU Crackers');
    } else if (recipeKey === 'lentilchips') {
      cookRecipe('lentilchips', { linzen: 40, zonnebloem: 20 }, 'BioToday Lentil Chips');
    }
  });

  function cookRecipe(recipeKey, reqs, recipeName) {
    let canCook = true;
    let missingText = [];

    Object.keys(reqs).forEach(cropKey => {
      const needed = reqs[cropKey];
      const available = state.inventory[cropKey] || 0;
      if (available < needed) {
        canCook = false;
        missingText.push(`${needed - available} m² extra ${CROP_DATA[cropKey] ? CROP_DATA[cropKey].name : cropKey}`);
      }
    });

    if (!canCook) {
      logMessage(`❌ Onvoldoende voorraad voor ${recipeName}! Je mist nog: ${missingText.join(', ')}. Zaai & oogst eerst in de weide!`, 'warning');
      return;
    }

    Object.keys(reqs).forEach(cropKey => {
      state.inventory[cropKey] -= reqs[cropKey];
    });

    state.stars += 120;
    if (!state.unlockedRecipes.includes(recipeKey)) {
      state.unlockedRecipes.push(recipeKey);
    }

    document.getElementById('unlock-count').textContent = state.unlockedRecipes.length;
    logMessage(`🎉 BEREID! ${recipeName} is klaar voor Carmen's Verjaardags-Borrelplank! +120 Chef Sterren ⭐`);
    updateResourceUI();
    updateCompostSelect();

    showRecipeModal(recipeKey);
  }

  // E-Number Detective Quiz Logic
  function renderQuiz() {
    const qData = QUIZ_QUESTIONS[state.quizIndex];
    document.getElementById('quiz-num').textContent = state.quizIndex + 1;
    document.getElementById('quiz-question').textContent = qData.question;
    
    const optionsEl = document.getElementById('quiz-options');
    const feedbackEl = document.getElementById('quiz-feedback');
    const nextBtn = document.getElementById('btn-next-quiz');

    optionsEl.innerHTML = '';
    feedbackEl.className = 'quiz-feedback hidden';
    nextBtn.classList.add('hidden');

    qData.options.forEach(opt => {
      const btn = document.createElement('button');
      btn.className = 'quiz-opt';
      btn.textContent = opt.text;

      btn.addEventListener('click', () => {
        if (opt.correct) {
          feedbackEl.className = 'quiz-feedback correct';
          feedbackEl.textContent = `✅ GEWELDIG! ${qData.explanation} (+50 Sterren!)`;
          state.stars += 50;
          updateResourceUI();
        } else {
          feedbackEl.className = 'quiz-feedback wrong';
          feedbackEl.textContent = `❌ Helaas! Probeer het nog eens. ${qData.explanation}`;
        }
        feedbackEl.classList.remove('hidden');
        nextBtn.classList.remove('hidden');
      });

      optionsEl.appendChild(btn);
    });
  }

  document.getElementById('btn-next-quiz').addEventListener('click', () => {
    state.quizIndex = (state.quizIndex + 1) % QUIZ_QUESTIONS.length;
    renderQuiz();
  });

  // Composteerder Logic
  function updateCompostSelect() {
    const selectEl = document.getElementById('compost-crop-select');
    selectEl.innerHTML = '';
    
    let hasItems = false;
    Object.keys(state.inventory).forEach(key => {
      if (state.inventory[key] >= 20 && CROP_DATA[key]) {
        hasItems = true;
        const opt = document.createElement('option');
        opt.value = key;
        opt.textContent = `${CROP_DATA[key].name} (${state.inventory[key]} m² op voorraad)`;
        selectEl.appendChild(opt);
      }
    });

    if (!hasItems) {
      selectEl.innerHTML = '<option value="">Geen gewas met ≥ 20 m² voorraad</option>';
    }
  }

  document.getElementById('btn-compost-now').addEventListener('click', () => {
    const selectEl = document.getElementById('compost-crop-select');
    const cropKey = selectEl.value;

    if (!cropKey || state.inventory[cropKey] < 20) {
      logMessage(`Je hebt minstens 20 m² van één gewas nodig om te composteren.`);
      return;
    }

    state.inventory[cropKey] -= 20;
    state.humus += 1;
    logMessage(`♻️ 20 m² ${CROP_DATA[cropKey].name} omgezet in 1 zak Super-Humus! Groeitijden zijn nu 50% sneller!`);
    updateResourceUI();
    updateCompostSelect();
  });

  // Animal Sanctuary Feeding
  document.getElementById('btn-feed-animals').addEventListener('click', () => {
    const cropKey = Object.keys(state.inventory).find(k => state.inventory[k] >= 10);
    if (!cropKey || !CROP_DATA[cropKey]) {
      logMessage(`Je hebt minstens 10 m² gewas nodig om de dieren op De Vossenberg te voeren!`);
      return;
    }

    state.inventory[cropKey] -= 10;
    state.stars += 30;
    logMessage(`🐮 De boerderijdieren hebben smakelijk gegeten van 10 m² ${CROP_DATA[cropKey].name}! +30 Sterren!`);
    updateResourceUI();
    updateCompostSelect();
  });

  // Real Kitchen Modal Unlocks
  const modalEl = document.getElementById('recipe-modal');
  const modalContentEl = document.getElementById('modal-recipe-content');

  function showRecipeModal(recipeKey) {
    let content = '';

    if (recipeKey === 'heksnkaas') {
      content = `
        <h3>🧀 Vegan Heks'nkaas (Verse Kruidensmeerkaas)</h3>
        <p><strong>Ingrediënten voor 1 schaaltje:</strong></p>
        <div class="recipe-step-item">• 150g vegan basiszuivel / cashewnoten-smeersel</div>
        <div class="recipe-step-item">• 2 el verse bieslook, peterselie & dille (fijngehakt)</div>
        <div class="recipe-step-item">• 1 stengel lente-ui / bosui & 1 teentje knoflook</div>
        <div class="recipe-step-item">• 1 el vers citroensap & snuf peper en zout</div>
        <br>
        <p><strong>Bereidingswijze:</strong></p>
        <div class="recipe-step-item">1. Hak de verse kruiden, knoflook en lente-ui super fijn.</div>
        <div class="recipe-step-item">2. Meng met het romige smeersel en citroensap in een kom.</div>
        <div class="recipe-step-item">3. Laat 15 minuutjes intrekken in de koelkast en serveer met Haust party toastjes!</div>
      `;
    } else if (recipeKey === 'muhammara') {
      content = `
        <h3>🌶️ Maza Muhammara (Paprika-Walnoot Dip)</h3>
        <p><strong>Ingrediënten:</strong></p>
        <div class="recipe-step-item">• 2 grote rode zoete paprika's (gegrild) & 1 chilipeper</div>
        <div class="recipe-step-item">• 75g verse walnoten (gebrand in de pan)</div>
        <div class="recipe-step-item">• 1 teentje knoflook, 1 el granaatappelmelasse & 1 ts komijn</div>
        <br>
        <p><strong>Bereidingswijze:</strong></p>
        <div class="recipe-step-item">1. Grill de paprika's in de oven tot het velletje zwart bladdert. Ontvel ze.</div>
        <div class="recipe-step-item">2. Maal de walnoten, knoflook, paprika, chilipeper en granaatappelmelasse in de keukenmachine.</div>
        <div class="recipe-step-item">3. Giet een scheutje zonnebloemolie erbij en meng tot een goddelijke dip!</div>
      `;
    } else if (recipeKey === 'babaganoush') {
      content = `
        <h3>🍆 AH Terra Baba Ganoush (Rokerige Auberginedip)</h3>
        <p><strong>Ingrediënten:</strong></p>
        <div class="recipe-step-item">• 2 grote aubergines (uit De Vossenberg Kas)</div>
        <div class="recipe-step-item">• 2 el tahin (sesampasta) & 1 teentje knoflook</div>
        <div class="recipe-step-item">• 2 el vers citroensap & peterselie voor de garnituur</div>
        <br>
        <p><strong>Bereidingswijze:</strong></p>
        <div class="recipe-step-item">1. Prik gaatjes in de aubergines en rooster ze in de oven/barbecue totdat ze helemaal zacht en rokerig zijn.</div>
        <div class="recipe-step-item">2. Lepel het vruchtvlees eruit en prak fijn met knoflook, tahin en citroensap.</div>
      `;
    } else if (recipeKey === 'kroepoek') {
      content = `
        <h3>🍘 Samasaya Cassave Kroepoek</h3>
        <p><strong>Ingrediënten:</strong></p>
        <div class="recipe-step-item">• 250g cassave knol meel / schijfjes</div>
        <div class="recipe-step-item">• 1 ts fijngemalen Spaanse chilipeper & knoflookpoeder</div>
        <div class="recipe-step-item">• Zonnebloemolie om te frituren/afbakken</div>
        <br>
        <p><strong>Bereidingswijze:</strong></p>
        <div class="recipe-step-item">1. Meng het cassavebeslag met de chili en knoflook.</div>
        <div class="recipe-step-item">2. Bak in hete zonnebloemolie totdat de kroepoek heerlijk knapperig opboldert!</div>
      `;
    } else {
      content = `
        <h3>🥖 Vegan Borrelplank Toastjes & Crackers</h3>
        <p><strong>Ingrediënten:</strong></p>
        <div class="recipe-step-item">• Volkoren speltmeel, zonnebloemolie, zeezout, bieslook en dille.</div>
        <br>
        <p><strong>Bereidingswijze:</strong></p>
        <div class="recipe-step-item">1. Meng het meel met de tuinkruiden, zonnebloemolie en water. Rol dun uit en bak knapperig af op 180°C!</div>
      `;
    }

    modalContentEl.innerHTML = content;
    modalEl.classList.remove('hidden');
  }

  document.getElementById('btn-real-recipe').addEventListener('click', () => {
    if (state.unlockedRecipes.length > 0) {
      showRecipeModal(state.unlockedRecipes[0]);
    } else {
      logMessage(`Bereid eerst een borrelplank gerecht in de game om de Echte Keuken Receptkaart te ontgrendelen!`);
    }
  });

  document.getElementById('modal-close-btn').addEventListener('click', () => modalEl.classList.add('hidden'));
  document.getElementById('btn-close-modal').addEventListener('click', () => modalEl.classList.add('hidden'));
  document.getElementById('btn-print-recipe').addEventListener('click', () => window.print());

  function logMessage(msg) {
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    gameLogEl.innerHTML = `<span class="log-time">${timeStr}</span> <span class="log-text">${msg}</span>`;
  }

  // Initial Boot
  renderCropSelector();
  renderLandGrid();
  renderQuiz();
  updateCompostSelect();
  logMessage(`🎉 Van harte gefeliciteerd Carmen met je 28e verjaardag! Welkom op Landgoed De Vossenberg.`);
});
