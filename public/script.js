const toggleBtn = document.getElementById("themeToggle");
const html = document.documentElement;

// Load saved preference
const savedTheme = localStorage.getItem("theme");
if (savedTheme) {
  html.setAttribute("data-theme", savedTheme);
  toggleBtn.textContent = savedTheme === "dark" ? "Light Mode" : "Dark Mode";
}

toggleBtn.addEventListener("click", () => {
  const currentTheme = html.getAttribute("data-theme");
  const newTheme = currentTheme === "dark" ? "light" : "dark";

  html.setAttribute("data-theme", newTheme);
  localStorage.setItem("theme", newTheme);
  toggleBtn.textContent = newTheme === "dark" ? "Light Mode" : "Dark Mode";
});

// Load stored data-theme from bfCache

window.addEventListener("pageshow", (event) => {
  if (event.persisted){
  const savedTheme = localStorage.getItem("theme");
  if (!savedTheme) return;

  document.documentElement.setAttribute("data-theme", savedTheme);

  if (toggleBtn) {
    toggleBtn.textContent =
      savedTheme === "dark" ? "Light Mode" : "Dark Mode";
  }
}});

// Animation logic

(function () {
  document.addEventListener("DOMContentLoaded", function () {

    /* ===============================
       PAGE SLIDE-IN
       =============================== */
    const main = document.querySelector("main");
    if (main) {
      main.classList.add("page-enter");
    }

    /* ===============================
       STAGGERED CARD ANIMATION
       =============================== */
    const cards = document.querySelectorAll(".analysis-card");
    cards.forEach((card, index) => {
      delayPeriod= String( index * 90) + "ms"
      card.style.setProperty("--delay", delayPeriod);
    });



    /* ===============================
       STRING TOGGLE LOGIC
       =============================== */

    const LIMIT = 180;

    /* ===============================
       INITIAL VISIBILITY CHECK
       =============================== */ 
  
    document.querySelectorAll(".string-preview").forEach(preview => {
      const fullText = preview.dataset.full;
      const toggle = preview.nextElementSibling;

      if (!fullText || !toggle) return;

      // Hide toggle if string is short enough
      if (fullText.length > LIMIT) {
          preview.textContent = fullText.slice(0, LIMIT) + "...";
      } else {
         toggle.style.display = "none";
        preview.textContent = fullText;
      }
    });  



    /* ===============================
       STRING TOGGLE LOGIC
       =============================== */
    document.addEventListener("click", function (e) {
      if (!e.target.classList.contains("js-toggle")) return;

      const preview = e.target.previousElementSibling;
      if (!preview) return;

      const fullText = preview.dataset.full;
      const expanded = preview.classList.contains("expanded");

      if (expanded) {
        preview.classList.remove("expanded");
        preview.textContent = fullText.slice(0, LIMIT) + "...";
        e.target.textContent = "See more";
      } else {
        preview.classList.add("expanded");
        preview.textContent = fullText;
        e.target.textContent = "See less";
      }
    });
    //======================== 
    // LAZY REVEAL LOGIC
    // =======================
 const revealElements = document.querySelectorAll(".analysis-card");

    if (!("IntersectionObserver" in window) || revealElements.length === 0) {
      // Fallback: show everything immediately
      revealElements.forEach(el => el.classList.add("reveal"));
      return;
    }

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal");
            obs.unobserve(entry.target);
          }
        });
      },
      {
        root: null,        // viewport
        threshold: 0.15,   // 15% visible triggers animation
        rootMargin: "0px 0px -40px 0px"
      }
    );

    revealElements.forEach(el => observer.observe(el)); 
  });
})();



// =========================================
// DELETE LOGIC
// =========================================

document.addEventListener("click", async (e) => {
  const btn = e.target.closest(".del");
  if (!btn) return;

  const id = btn.dataset.id;
  const card = btn.closest(".analysis-card");

  if(!confirm("Do you really want to delete this?")) return;

  try { url= "/strings/" + id;
    const res = await fetch(url, { method: "DELETE" });

    if (!res.ok) {
      const err = await res.text();
      console.error("Delete failed:", err.message);
      alert("Could not delete item");
      return;
    }

    // Remove only on confirmed success
    alert("Deletion Successful!");
    count= Number(document.querySelector(".count").textContent);
    document.querySelector(".count").textContent= --count;
    card.remove();

  } catch (err) {
    console.error("Network error:", err.message);
    alert("Network error while deleting");
  }
});


// =============================================================
// ALL SEARCH AND SORT CODE TO BE EFFECTIVE ON LISTING PAGE ONLY
// =============================================================



// =========================================
// LOGIC FOR SEARCH
// ========================================


document.addEventListener("DOMContentLoaded", () => {
  const input = document.getElementById("liveSearch");
  const searchBtn = document.getElementById("searchBtn");
 

  // Function to fetch search results
  const searchStrings = async (value) => { 
    if (!value){ 
    // find the whole database
    try {
      url= "/Strings" ;
      window.location.href= url;
     } catch (err){alert(err.message);}
    } else {
    try {
      url= "/Strings/" + encodeURIComponent(value);
      const res = await fetch(url);
      const html = await res.text(); // expect server to return rendered HTML
      const container = document.getElementById("stringsContainer"); // container of your cards
      if (container) container.innerHTML = html;
    } catch (err) {
      console.error("Search failed:", err.message);
    }
    } };
  

  // Debounce function to reduce excessive requests
  const debounce = (fn, delay = 300) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => fn(...args), delay);
    };
  };

  // Trigger search on input
  input.addEventListener("input", debounce((e) => {
    searchStrings(e.target.value);
  }));

  // Optional: trigger search on button click
  searchBtn.addEventListener("click", () => {
    searchStrings(input.value);
  });
});



// ======================================
// SORT AND FILTER LOGIC
// ======================================
    
// ===========================================================
// BINDING ALL DOM TO A STABLE PARENT DOM TO SURVIVE INJECTION
// ===========================================================

 const CardContainer = document.getElementById("stringsContainer");

// ====================================================================

  getDom = ()=>{
    return{
sortToggle   : CardContainer.querySelector("#sortToggle"),
filterToggle : CardContainer.querySelector("#filterToggle"),
sortRadios   : CardContainer.querySelectorAll('input[name="sort"]'),
filterInputs : CardContainer.querySelectorAll(".filter-input"),
currentRadio : CardContainer.querySelector('input[value="${currentSort}"]'),
isPalindrome : CardContainer.querySelector("#isPalindrome"),
filterMaster : CardContainer.querySelector("#filterToggle"),
badge        : CardContainer.querySelector("#filterCount"),
filterBadge  : CardContainer.querySelector("#filterCount"),
sortOptions  : CardContainer.querySelector(".sort-options"),
filterOptions: CardContainer.querySelector(".filter-options"),
container    : document.getElementById("analysisResults"),
inputs       :{
    minLength          : CardContainer.querySelector("#minLength"),
    maxLength          : CardContainer.querySelector("#maxLength"),
    wordCount          : CardContainer.querySelector("#wordCount"),
    contains_character : CardContainer.querySelector("#containsChar"),
    palindrome         : CardContainer.querySelector("#isPalindrome")
  }
};
    }

Dom           = getDom();

  // ========================================================================





/* ===============================
   SORT
   =============================== */
   
let currentSort = sessionStorage.getItem("sort");

function applySort(type) {
  if (!type) return;

  const cards = [...Dom.container.children];


  cards.sort((a, b) => {
    switch (type) {
      case "az": 
      return a.dataset.text.localeCompare(b.dataset.text); 
      // console.log( a.dataset);
      case "za": return b.dataset.text.localeCompare(a.dataset.text);
      case "wc_desc": return Number(b.dataset.wordcount) - Number(a.dataset.wordcount);
      case "wc_asc": return Number(a.dataset.wordcount) - Number(b.dataset.wordcount);
      case "len_desc": return Number(b.dataset.length) - Number(a.dataset.length);
      case "len_asc": return Number(a.dataset.length) - Number(b.dataset.length);
      case "oldest": return a.dataset.date.localeCompare(b.dataset.date);
      default: return 0;
    }
  });

  Dom.container.replaceChildren(...cards);
}
 



/* Guarded sort option handler */

Dom.sortRadios.forEach(radio => {
  radio.addEventListener("change", () => {
    if (!Dom.sortToggle.checked) return;

    currentSort = radio.value;
    sessionStorage.setItem("sort", currentSort);
    applySort(currentSort);
    updateCounts();
  });
});

/* Sort master */
Dom.sortToggle.addEventListener("change", () => {
  if (!Dom.sortToggle.checked) {
    sessionStorage.removeItem("sort");
    currentSort = null;
    Dom.sortRadios.forEach(r => r.checked = false);
  } else if (currentSort) {
    applySort(currentSort);
  }
  updateCounts();
});

/* Restore */
if (currentSort) {
  Dom.sortToggle.checked = true;
 if (Dom.currentRadio){
  Dom.currentRadio.click();
  Dom.currentRadio.checked= true;
}
}

/* ===============================
   FILTER
   =============================== */


// Logic for palindrome input check
  Dom.isPalindrome.addEventListener('input', () => {

  const val = Dom.isPalindrome.value.toLowerCase();

  if (val && val !== 'true' && val !== 'false') {
     Dom.isPalindrome.classList.add('input-error');
  } else {
   Dom.isPalindrome.classList.remove('input-error');
  }
});


(() => {
  /* ===============================
     FILTER STATE (Single Source)
  =============================== */

  let filterState = {
    is_palindrome     : null,
    min_length        : null,
    max_length        : null,
    word_count        : null,
    contains_character: null
  };

  
  /* ===============================
     ENABLE / DISABLE FILTER UI
  =============================== */
inputs    =   Dom.inputs;

  function setFilterUI(enabled) {
    Object.values(inputs).forEach(input => {
      input.disabled = !enabled;
      input.classList.toggle('disabled', !enabled);
    });

    if (!enabled) {
      resetFilters(false);
    }
  }

/* ============================================================
   FILTER STATE HELPERS
============================================================ */

function persistFilterState() {
  sessionStorage.setItem("filterState", JSON.stringify(filterState));
}

function restoreFilterStateFromStorage() {
  const saved = sessionStorage.getItem("filterState");
  if (!saved) return;

  try {
    filterState = JSON.parse(saved);
  } catch {
    return;
  }
}


  /* ===============================
     BUILD FILTER OBJECT
  =============================== */

  function buildFilterState() {
    if (!Dom.filterMaster.checked) {
      filterState = {
        is_palindrome    : null,
        min_length       : null,
        max_length       : null,
        word_count       : null,
       contains_character: null
      };
      persistFilterState();
      return;
    }

    filterState = {
      is_palindrome: inputs.palindrome.value ? inputs.palindrome.value : null,

      min_length: inputs.minLength.value
        ? Number(inputs.minLength.value)
        : null,

      max_length: inputs.maxLength.value
        ? Number(inputs.maxLength.value)
        : null,

      word_count: inputs.wordCount.value
        ? Number(inputs.wordCount.value)
        : null,

      contains_character: inputs.contains_character.value.trim() || null
    };
     persistFilterState();
  }


  /* ============================================================
   UI RESTORATION (FILTER PLATE)
============================================================ */

function restoreFilterUI() {
  if (!Dom.filterToggle) return;

  const hasActiveFilters = Object.values(filterState)
    .some(v => v !== null && v !== "");

  Dom.filterToggle.checked = hasActiveFilters;

  const map = {
    is_palindrome: "isPalindrome",
    min_length: "minLength",
    max_length: "maxLength",
    word_count: "wordCount",
    contains_character: "containsChar"
  };

  Object.entries(map).forEach(([stateKey, inputId]) => {
    idVar= "#"+ inputId;
    const input =CardContainer.querySelector(idVar);
    if (!input) return;

    input.disabled = !hasActiveFilters;
    input.classList.toggle("disabled", !hasActiveFilters);
    input.value = filterState[stateKey] ?? "";
  });

  // const badge = CardContainer.querySelector("#filterCount");
  if (Dom.badge) {
    const count = Object.values(filterState)
      .filter(v => v !== null && v !== "")
      .length;

    Dom.badge.textContent = count;
    Dom.badge.style.display = count ? "inline-flex" : "none";
  }
}



// ==============================================
// OPENING AND CLOSING OF THE FILTER/SORT PLATE
// ===============================================

document.addEventListener("DOMContentLoaded", () => {
  document.addEventListener("click", (e) => {
    const trigger = e.target.closest(".menu-trigger");
    const dropdown = CardContainer.querySelector(".menu-dropdown");

    if (!dropdown) return;

    /* Click on kebab */
    if (trigger) {
      e.preventDefault();
      dropdown.classList.toggle("open");
 if (dropdown.classList.contains("open")) {
      restoreFilterUI(); // restore inputs when opening
    }
    return;
      return;
    }

    /* Click inside dropdown → do nothing */
    if (e.target.closest(".menu-dropdown")) {
      return;
    }

    /* Click outside → close */
    dropdown.classList.remove("open");
  });
});



  /* ===============================
     SERIALIZE FILTERS → QUERY
  =============================== */

  function buildFilterQuery() {
    const params = new URLSearchParams();

    Object.entries(filterState).forEach(([key, value]) => {
      if (value !== null && value !== '') {
        params.append(key, value);
      }
    });

    return params.toString();
  }

  /* ===============================
     FILTER COUNT BADGE
  =============================== */

  function updateFilterBadge() {
    const activeCount = Object.values(filterState)
      .filter(v => v !== null && v !== '')
      .length;

    if (!Dom.filterBadge) return;

    Dom.filterBadge.textContent = activeCount;
    Dom.filterBadge.style.display = activeCount ? 'inline-flex' : 'none';
  }

  /* ===============================
     APPLY FILTERS (FETCH)
  =============================== */

  async function applyFilters() {

  

    buildFilterState();
    updateFilterBadge();

    const filterquery = buildFilterQuery();

    const initialUrl = "/Strings";
   if (filterquery){
     finalUrl = initialUrl + "?" + filterquery;
   } else {
    return
   }

  
 const res = await fetch(finalUrl);
      const html = await res.text(); // expect server to return rendered HTML
      // const container = document.getElementById("stringsContainer"); // container of your cards
      if (Dom.container) {
        Dom.container.innerHTML = html;
      } else {return;};
 
 restoreFilterUI();
 if (currentSort) applySort(currentSort);

  }


  /* ============================================================
   INITIAL LOAD (FULL RESTORATION)
============================================================ */

document.addEventListener("DOMContentLoaded", () => {
  restoreFilterStateFromStorage();
  restoreFilterUI();

  if (Object.values(filterState).some(v => v !== null && v !== "")) {
    applyFilters();
    Dom = getDom();
  }

  if (currentSort) {
   Dom.sortToggle?.setAttribute("checked", true);
  CardContainer
  .querySelector('input[name="sort"][value="${currentSort}"]')
      ?.setAttribute("checked", true);
  }
});


  /* ===============================
     RESET FILTERS
  =============================== */

  function resetFilters(refetch = true) {
    Object.values(inputs).forEach(input => {
        input.value = '';
    });

    filterState = {
      is_palindrome: null,
      min_length: null,
      max_length: null,
      word_count: null,
      contains: null
    };

    updateFilterBadge();

    if (refetch) {
      applyFilters();
      Dom = getDom();
    };
  }


  /* ===============================
     EVENT BINDINGS
  =============================== */

  Dom.filterMaster?.addEventListener('change', () => {
    setFilterUI(Dom.filterMaster.checked);
    applyFilters();
    Dom = getDom();
  });


  // Object.values(inputs).forEach(input => {
  //   input.addEventListener('input', debounce (applyFilters));
  // });


document.addEventListener("click", (e) => {
  if (e.target.id === "activation") {
    applyFilters();
    Dom = getDom();
  }
});


  /* ===============================
     INITIAL STATE
  =============================== */

  setFilterUI(Dom.filterMaster?.checked ?? false);
})();



/* ===============================
   SORT BADGES
   =============================== */

function updateCounts() {
  const activeFilters =
    [...Dom.filterInputs].filter(i => i.value).length 
    //  +[...filterChecks].filter(c => c.checked).length;

  // document.getElementById("filterCount").textContent =
  //   activeFilters ? (activeFilters) : "";

  CardContainer.querySelector("#sortCount").textContent =
    currentSort ? "(1)" : "";
}

updateCounts();


/* =======================================================
   VISUAL DISABLED STATE FOR INPUT FIELDS OF FILTER
   ==================================================== */

   function toggleVisualState(masterCheckbox, optionsContainer) {
  if (masterCheckbox.checked) {
    optionsContainer.classList.remove("disabled");
  } else {
    optionsContainer.classList.add("disabled");
  }
}

/* SORT VISUAL STATE */
toggleVisualState(Dom.sortToggle, Dom.sortOptions);

Dom.sortToggle.addEventListener("change", () => {
  toggleVisualState(Dom.sortToggle, Dom.sortOptions);
});

/* FILTER VISUAL STATE */
toggleVisualState(Dom.filterToggle, Dom.filterOptions);

Dom.filterToggle.addEventListener("change", () => {
  toggleVisualState(Dom.filterToggle, Dom.filterOptions);
});
