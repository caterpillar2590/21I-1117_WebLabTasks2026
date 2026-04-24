// data/recipes.js
export const recipesData = [
  {
    id: 1,
    name: "Spaghetti Carbonara",
    cuisine: "Italian",
    prepTime: 20,
    difficulty: "Medium",
    image: "https://images.unsplash.com/photo-1612874742237-6526221588e3?w=300&h=300&fit=crop",
    description: "Creamy pasta dish with eggs, cheese, and pancetta. A classic Roman pasta dish that's rich and satisfying.",
    rating: 4.6,
    vegetarian: false,
    vegan: false,
    ingredients: [
      "200g spaghetti",
      "100g pancetta",
      "2 large eggs",
      "50g pecorino cheese",
      "Black pepper",
      "Salt to taste"
    ],
    instructions: [
      "Boil pasta in salted water until al dente.",
      "Fry pancetta until crispy and golden.",
      "Whisk eggs and grated pecorino cheese in a bowl.",
      "Drain pasta, reserving 1/2 cup pasta water.",
      "Combine hot pasta with pancetta, then add egg mixture quickly.",
      "Stir vigorously, adding pasta water to create creamy sauce.",
      "Serve immediately with black pepper."
    ],
    reviews: [
      { id: 1, user: "HomeChef", comment: "So authentic!", rating: 5, date: "2024-01-15" },
      { id: 2, user: "Foodie", comment: "Creamy and delicious.", rating: 4.5, date: "2024-01-20" }
    ]
  },
  {
    id: 2,
    name: "Vegetable Stir Fry",
    cuisine: "Asian",
    prepTime: 15,
    difficulty: "Easy",
    image: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=300&h=300&fit=crop",
    description: "Quick and healthy vegetable stir fry with a savory sauce.",
    rating: 4.3,
    vegetarian: true,
    vegan: true,
    ingredients: [
      "2 cups mixed vegetables (broccoli, bell peppers, carrots)",
      "2 tbsp soy sauce",
      "1 tbsp sesame oil",
      "2 cloves garlic",
      "1 tsp ginger",
      "Cooked rice for serving"
    ],
    instructions: [
      "Heat oil in a wok or large pan.",
      "Add garlic and ginger, stir for 30 seconds.",
      "Add vegetables and stir fry for 5-7 minutes.",
      "Add soy sauce and cook for 2 more minutes.",
      "Serve hot with rice."
    ],
    reviews: [
      { id: 1, user: "HealthyEater", comment: "Quick and tasty!", rating: 4.5, date: "2024-01-10" }
    ]
  },
  {
    id: 3,
    name: "Chicken Tikka Masala",
    cuisine: "Indian",
    prepTime: 45,
    difficulty: "Hard",
    image: "https://images.unsplash.com/photo-1565557623262-b5a132ecb148?w=300&h=300&fit=crop",
    description: "Creamy tomato-based curry with marinated grilled chicken.",
    rating: 4.8,
    vegetarian: false,
    vegan: false,
    ingredients: [
      "500g chicken breast",
      "1 cup yogurt",
      "2 tbsp tikka masala spice",
      "1 can tomato sauce",
      "1 cup heavy cream",
      "Onion, garlic, ginger"
    ],
    instructions: [
      "Marinate chicken in yogurt and spices for 2 hours.",
      "Grill or bake chicken until cooked.",
      "Sauté onions, garlic, ginger in a pan.",
      "Add tomato sauce and simmer for 10 minutes.",
      "Add cream and grilled chicken.",
      "Simmer for 5 more minutes. Serve with naan."
    ],
    reviews: [
      { id: 1, user: "CurryLover", comment: "Best homemade curry!", rating: 5, date: "2024-01-18" },
      { id: 2, user: "SpiceMaster", comment: "A bit too spicy but good.", rating: 4, date: "2024-01-19" }
    ]
  },
  {
    id: 4,
    name: "Avocado Toast",
    cuisine: "American",
    prepTime: 10,
    difficulty: "Easy",
    image: "https://images.unsplash.com/photo-1541519227352-08c7f13d5737?w=300&h=300&fit=crop",
    description: "Simple and nutritious breakfast with creamy avocado.",
    rating: 4.4,
    vegetarian: true,
    vegan: true,
    ingredients: [
      "2 slices sourdough bread",
      "1 ripe avocado",
      "Salt and pepper",
      "Red pepper flakes",
      "Lemon juice"
    ],
    instructions: [
      "Toast bread until golden brown.",
      "Mash avocado with fork, add lemon juice and salt.",
      "Spread avocado on toast.",
      "Top with pepper flakes and more salt."
    ],
    reviews: [
      { id: 1, user: "BrunchQueen", comment: "Perfect breakfast!", rating: 5, date: "2024-01-12" }
    ]
  },
  {
    id: 5,
    name: "Beef Burger",
    cuisine: "American",
    prepTime: 25,
    difficulty: "Medium",
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop",
    description: "Juicy homemade beef burger with all the fixings.",
    rating: 4.7,
    vegetarian: false,
    vegan: false,
    ingredients: [
      "500g ground beef",
      "4 burger buns",
      "Lettuce, tomato, onion",
      "4 slices cheese",
      "Burger sauce",
      "Pickles"
    ],
    instructions: [
      "Form beef into 4 patties, season with salt and pepper.",
      "Grill patties for 4-5 minutes each side.",
      "Toast buns on grill.",
      "Assemble: sauce, lettuce, patty, cheese, tomato, onion.",
      "Add pickles and top bun."
    ],
    reviews: [
      { id: 1, user: "BurgerFan", comment: "Better than takeout!", rating: 5, date: "2024-01-14" },
      { id: 2, user: "GrillMaster", comment: "Perfect juiciness.", rating: 4.5, date: "2024-01-16" }
    ]
  },
  {
    id: 6,
    name: "Greek Salad",
    cuisine: "Mediterranean",
    prepTime: 10,
    difficulty: "Easy",
    image: "https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=300&h=300&fit=crop",
    description: "Fresh Mediterranean salad with feta and olives.",
    rating: 4.5,
    vegetarian: true,
    vegan: false,
    ingredients: [
      "Cucumber, diced",
      "Tomatoes, diced",
      "Red onion, sliced",
      "Feta cheese, cubed",
      "Kalamata olives",
      "Olive oil and oregano"
    ],
    instructions: [
      "Chop all vegetables into bite-sized pieces.",
      "Combine in a large bowl.",
      "Add olives and feta cubes.",
      "Drizzle with olive oil and sprinkle oregano.",
      "Toss gently and serve."
    ],
    reviews: [
      { id: 1, user: "SaladLover", comment: "So fresh!", rating: 4.5, date: "2024-01-17" }
    ]
  }
];
