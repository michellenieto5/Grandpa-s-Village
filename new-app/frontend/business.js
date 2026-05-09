'use strict';

const API_BASE_URL = "https://project3-494903.wl.r.appspot.com";
const params = new URLSearchParams(window.location.search);
const BUSINESS_ID = Number(params.get("id"));

if (!BUSINESS_ID) {
  window.location.href = "/";
}

function showMessage(element, text, type) {
  element.textContent = text;
  element.className = "message " + type;
}

function starsDisplay(count) {
  return "⭐".repeat(count);
}

// ── Load Business Info ────────────────────────────────────
async function loadBusiness() {
  const infoEl = document.getElementById("businessInfo");

  try {
    const response = await fetch(`${API_BASE_URL}/businesses/${BUSINESS_ID}`);

    if (!response.ok) {
      infoEl.innerHTML = `<p style="color:#9b2c2c;">Business not found.</p>`;
      return;
    }

    const b = await response.json();
    document.title = `${b.name} — Grandpa's Village`;

    infoEl.innerHTML = `
      <div class="biz-detail-top">
        <div>
          <span class="badge">Village Member</span>
          <h1 class="biz-detail-name">${b.name}</h1>
          <p class="biz-detail-address">${b.street_address}, ${b.city}, ${b.state} ${b.zip_code}</p>
          <p style="font-size:12px; color:var(--brown-light); margin-top:6px;">Owner ID: ${b.owner_id} · Business ID: ${b.id}</p>
        </div>
      </div>
    `;

    document.getElementById("business_id").value = BUSINESS_ID;

  } catch (error) {
    infoEl.innerHTML = `<p style="color:#9b2c2c;">Could not load business.</p>`;
  }
}

// ── Load Reviews ──────────────────────────────────────────
async function loadReviews() {
  const listEl = document.getElementById("reviewsList");
  listEl.innerHTML = `<p style="color:var(--brown-mid); font-size:14px;">Loading reviews...</p>`;

  try {
    const response = await fetch(`${API_BASE_URL}/reviews`);
    const allReviews = await response.json();
    const reviews = allReviews.filter(r => r.business_id === BUSINESS_ID);

    if (reviews.length === 0) {
      listEl.innerHTML = `<p style="color:var(--brown-mid); font-size:14px; padding: 16px 0;">No reviews yet — be the first!</p>`;
      return;
    }

    listEl.innerHTML = "";

    reviews.forEach(function (review) {
      const card = document.createElement("div");
      card.className = "review-card";
      card.innerHTML = `
        <div class="review-card-header">
          <span class="review-stars">${starsDisplay(review.stars)}</span>
          <div class="review-actions">
            <button class="edit-btn" title="Edit review">✏️</button>
            <button class="delete-btn" title="Delete review">✕</button>
          </div>
        </div>
        ${review.review_text
          ? `<p class="review-text">"${review.review_text}"</p>`
          : `<p class="review-text no-text">No written review.</p>`
        }
        <p class="review-meta">User ID: ${review.user_id} · Review ID: ${review.id}</p>
      `;

      card.querySelector(".edit-btn").addEventListener("click", function () {
        openEditReviewModal(review);
      });

      card.querySelector(".delete-btn").addEventListener("click", function () {
        deleteReview(review.id, card);
      });

      listEl.appendChild(card);
    });

  } catch (error) {
    listEl.innerHTML = `<p style="color:#9b2c2c; font-size:14px;">Could not load reviews.</p>`;
  }
}

// ── Submit Review ─────────────────────────────────────────
const reviewForm = document.getElementById("reviewForm");
const reviewMessage = document.getElementById("reviewMessage");

reviewForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const data = {
    user_id: Number(document.getElementById("user_id").value),
    business_id: BUSINESS_ID,
    stars: Number(document.getElementById("stars").value),
    review_text: document.getElementById("review_text").value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      showMessage(reviewMessage, result.Error, "error");
      return;
    }

    showMessage(reviewMessage, "Review submitted — thanks for sharing! 🙌", "success");
    reviewForm.reset();
    document.getElementById("business_id").value = BUSINESS_ID;
    loadReviews();

  } catch (error) {
    showMessage(reviewMessage, "Could not connect to the API.", "error");
  }
});

// ── Delete Review ─────────────────────────────────────────
async function deleteReview(id, cardElement) {
  const confirmed = confirm("Delete this review? This cannot be undone.");
  if (!confirmed) return;

  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "DELETE"
    });

    if (response.status === 204) {
      cardElement.style.transition = "opacity 0.3s, transform 0.3s";
      cardElement.style.opacity = "0";
      cardElement.style.transform = "scale(0.95)";
      setTimeout(() => cardElement.remove(), 300);
    } else {
      alert("Could not delete review. Try again.");
    }

  } catch (error) {
    alert("Could not connect to the API.");
  }
}

// ── Edit Review Modal ─────────────────────────────────────
const editReviewModal = document.getElementById("editReviewModal");
const closeEditReviewModal = document.getElementById("closeEditReviewModal");
const editReviewForm = document.getElementById("editReviewForm");
const editReviewMessage = document.getElementById("editReviewMessage");

function openEditReviewModal(review) {
  document.getElementById("edit_review_id").value = review.id;
  document.getElementById("edit_stars").value = review.stars;
  document.getElementById("edit_review_text").value = review.review_text || "";
  editReviewMessage.className = "message";
  editReviewModal.style.display = "flex";
}

closeEditReviewModal.addEventListener("click", function () {
  editReviewModal.style.display = "none";
});

editReviewModal.addEventListener("click", function (e) {
  if (e.target === editReviewModal) editReviewModal.style.display = "none";
});

editReviewForm.addEventListener("submit", async function (e) {
  e.preventDefault();

  const id = document.getElementById("edit_review_id").value;
  const data = {
    stars: Number(document.getElementById("edit_stars").value),
    review_text: document.getElementById("edit_review_text").value
  };

  try {
    const response = await fetch(`${API_BASE_URL}/reviews/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    if (!response.ok) {
      showMessage(editReviewMessage, result.Error, "error");
      return;
    }

    showMessage(editReviewMessage, "Review updated!", "success");
    setTimeout(() => {
      editReviewModal.style.display = "none";
      loadReviews();
    }, 800);

  } catch (error) {
    showMessage(editReviewMessage, "Could not connect to the API.", "error");
  }
});

// ── Init ──────────────────────────────────────────────────
loadBusiness();
loadReviews();
