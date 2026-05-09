'use strict';

const API_BASE_URL = "https://project3-494903.wl.r.appspot.com";

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
}

// ── Add Business ──────────────────────────────────────────
const businessForm = document.getElementById("businessForm");
const businessMessage = document.getElementById("businessMessage");

businessForm.addEventListener("submit", async function (event) {
  event.preventDefault();

  const businessData = {
    owner_id: Number(document.getElementById("owner_id").value),
    name: document.getElementById("name").value,
    street_address: document.getElementById("street_address").value,
    city: document.getElementById("city").value,
    state: document.getElementById("state").value,
    zip_code: Number(document.getElementById("zip_code").value)
  };

  try {
    const response = await fetch(`${API_BASE_URL}/businesses`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(businessData)
    });

    const data = await response.json();

    if (!response.ok) {
      showMessage(businessMessage, data.Error, "error");
      return;
    }

    showMessage(businessMessage, "Business added! Welcome to the village 🎉", "success");
    businessForm.reset();
    loadBusinesses();

  } catch (error) {
    showMessage(businessMessage, "Could not connect to the API.", "error");
  }
});

// ── Load Businesses ───────────────────────────────────────
const businessGrid = document.getElementById("businessGrid");
const loadBusinessesBtn = document.getElementById("loadBusinessesBtn");

async function loadBusinesses() {
  businessGrid.innerHTML = `<p style="color: var(--brown-mid); font-size: 14px;">Loading...</p>`;

  try {
    const [bizResponse, reviewResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/businesses`),
      fetch(`${API_BASE_URL}/reviews`)
    ]);

    const businesses = await bizResponse.json();
    const allReviews = await reviewResponse.json();

    if (businesses.length === 0) {
      businessGrid.innerHTML = `<p style="color: var(--brown-mid); font-size: 14px;">No businesses yet — be the first to join the village!</p>`;
      return;
    }

    businessGrid.innerHTML = "";

    businesses.forEach(function (business) {
      const bizReviews = allReviews.filter(r => r.business_id === business.id);
      const reviewCount = bizReviews.length;
      const avgStars = reviewCount > 0
        ? (bizReviews.reduce((sum, r) => sum + r.stars, 0) / reviewCount).toFixed(1)
        : null;

      const starsHTML = avgStars
        ? `<span class="card-stars">⭐ ${avgStars} <span style="color:var(--brown-light); font-weight:400;">(${reviewCount} review${reviewCount !== 1 ? "s" : ""})</span></span>`
        : `<span class="card-stars no-reviews">No reviews yet</span>`;

      const card = document.createElement("div");
      card.className = "business-card clickable-card";
      card.innerHTML = `
        <div class="business-card-header">
          <h3>${business.name}</h3>
          <button class="edit-btn" title="Edit business">✏️</button>
        </div>
        <p>${business.street_address}</p>
        <p>${business.city}, ${business.state} ${business.zip_code}</p>
        <div class="card-footer">
          ${starsHTML}
          <span class="business-id card-cta">View &amp; Review →</span>
        </div>
      `;

      card.addEventListener("click", function () {
        window.location.href = `/business.html?id=${business.id}`;
      });

      card.querySelector(".edit-btn").addEventListener("click", function (e) {
        e.stopPropagation();
        openEditModal(business);
      });

      businessGrid.appendChild(card);
    });

  } catch (error) {
    businessGrid.innerHTML = `<p style="color: #9b2c2c; font-size: 14px;">Could not load businesses.</p>`;
  }
}

loadBusinessesBtn.addEventListener("click", loadBusinesses);
loadBusinesses();

// ── Edit Business Modal ───────────────────────────────────
const editModal = document.getElementById("editModal");
const closeEditModal = document.getElementById("closeEditModal");
const editBusinessForm = document.getElementById("editBusinessForm");
const editBusinessMessage = document.getElementById("editBusinessMessage");

function openEditModal(business) {
  document.getElementById("edit_business_id").value = business.id;
  document.getElementById("edit_owner_id").value = business.owner_id;
  document.getElementById("edit_name").value = business.name;
  document.getElementById("edit_street_address").value = business.street_address;
  document.getElementById("edit_city").value = business.city;
  document.getElementById("edit_state").value = business.state;
  document.getElementById("edit_zip_code").value = business.zip_code;
  editBusinessMessage.className = "message";
  editModal.style.display = "flex";
}

closeEditModal.addEventListener("click", function () {
  editModal.style.display = "none";
});

editModal.addEventListener("click", function (e) {
  if (e.target === editModal) editModal.style.display = "none";
});

editBusinessForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("edit_business_id").value;
  const data = {
    owner_id: Number(document.getElementById("edit_owner_id").value),
    name: document.getElementById("edit_name").value,
    street_address: document.getElementById("edit_street_address").value,
    city: document.getElementById("edit_city").value,
    state: document.getElementById("edit_state").value,
    zip_code: Number(document.getElementById("edit_zip_code").value)
  };

  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      showMessage(editBusinessMessage, result.Error, "error");
      return;
    }

    showMessage(editBusinessMessage, "Business updated!", "success");
    setTimeout(() => {
      editModal.style.display = "none";
      loadBusinesses();
    }, 800);

  } catch (error) {
    showMessage(editBusinessMessage, "Could not connect to the API.", "error");
  }
});