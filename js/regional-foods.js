document.addEventListener("DOMContentLoaded", async () => {
  try {
    const response = await fetch("data/regional-foods.json");
    const foods = await response.json();

    renderFoodOfWeek(foods[0]);
    renderStates(foods);
    renderStories(foods);
    renderCarousel(foods);

  } catch (error) {
    console.error("Failed to load regional foods:", error);
  }
});

function renderFoodOfWeek(food) {
  const container = document.getElementById("food-week-card");

  container.innerHTML = `
    <div class="week-card">
      <img src="${food.image}" alt="${food.food}">
      
      <div class="week-content">
        <span class="badge">${food.popularity}</span>
        <h3>${food.food}</h3>
        <h4>${food.state}</h4>
        <p>${food.description}</p>

        <button class="btn-primary">Order Now</button>
      </div>
    </div>
  `;
}

function renderStates(foods) {
  const statesContainer = document.getElementById("states-container");
  const previewContainer = document.getElementById("state-food-preview");

  foods.forEach(food => {
    const stateBtn = document.createElement("button");

    stateBtn.classList.add("state-btn");
    stateBtn.textContent = food.state;

    stateBtn.addEventListener("click", () => {
      previewContainer.innerHTML = `
        <div class="preview-card">
          <img src="${food.image}" alt="${food.food}">
          
          <div>
            <h3>${food.food}</h3>
            <p>${food.description}</p>

            <ul>
              <li><strong>Category:</strong> ${food.category}</li>
              <li><strong>Spice Level:</strong> ${food.spiceLevel}</li>
              <li><strong>Rating:</strong> ⭐ ${food.rating}</li>
            </ul>
          </div>
        </div>
      `;
    });

    statesContainer.appendChild(stateBtn);
  });
}

function renderStories(foods) {
  const storyContainer = document.getElementById("story-cards");

  foods.forEach(food => {
    const storyCard = document.createElement("div");

    storyCard.classList.add("story-card");

    storyCard.innerHTML = `
      <h3>${food.food}</h3>
      <h4>${food.state}</h4>
      <p>${food.story}</p>
    `;

    storyContainer.appendChild(storyCard);
  });
}

function renderCarousel(foods) {
  const carousel = document.getElementById("carousel-container");

  foods.forEach(food => {
    const card = document.createElement("div");

    card.classList.add("carousel-card");

    card.innerHTML = `
      <img src="${food.image}" alt="${food.food}">
      
      <div class="carousel-content">
        <h3>${food.food}</h3>
        <p>${food.state}</p>

        <span>⭐ ${food.rating}</span>
      </div>
    `;

    carousel.appendChild(card);
  });
}