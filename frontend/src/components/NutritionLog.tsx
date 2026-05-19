import { useState, useEffect } from "react";
import { API_BASE } from "../apiBase";

type FoodEntry = {
  _id?: string;
  name: string;
  calories: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  servingSize?: string;
  timestamp: Date;
};

type FoodSearchResult = {
  fdcId?: number;
  name: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  servingSize: string;
  source: string;
};

interface NutritionLogProps {
  onClose: () => void;
  jwt: string | null;
  caloriesConsumed: number;
  caloriesBurned: number;
  dailyGoal: number;
}

export default function NutritionLog({ 
  onClose, 
  jwt 
}: NutritionLogProps) {
  const [foodEntries, setFoodEntries] = useState<FoodEntry[]>([]);
  const [showAddFood, setShowAddFood] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchResults, setSearchResults] = useState<FoodSearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  
  // Selected food for adding
  const [selectedFood, setSelectedFood] = useState<FoodSearchResult | null>(null);
  const [servingMultiplier, setServingMultiplier] = useState("1");

  // Log configuration on mount
  useEffect(() => {
    console.log('🔧 NutritionLog mounted');
    console.log('🔑 JWT present:', !!jwt);
    console.log('🌐 API_BASE:', API_BASE);
  }, []);

  // Load existing food entries
  useEffect(() => {
    loadFoodEntries();
  }, []);

  async function loadFoodEntries() {
    if (!jwt) return;
    
    try {
      console.log('📋 Loading food entries...');
      const resp = await fetch(`${API_BASE}/api/nutrition/today`, {
        headers: { Authorization: `Bearer ${jwt}` }
      });
      
      console.log('📥 Load entries response:', resp.status, resp.ok);
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Food entries loaded:', data);
        setFoodEntries(data.entries || []);
      } else {
        const errorText = await resp.text();
        console.error('❌ Failed to load entries:', resp.status, errorText);
      }
    } catch (e) {
      console.error("❌ Failed to load food entries:", e);
    }
  }

  async function searchFood() {
    if (!searchQuery || searchQuery.trim().length < 2) {
      alert("Please enter at least 2 characters to search");
      return;
    }

    setSearching(true);
    setSearchResults([]);
    
    try {
      console.log('🔍 Searching for:', searchQuery);
      console.log('📡 API endpoint:', `${API_BASE}/api/nutrition/search-food?query=${encodeURIComponent(searchQuery)}`);
      
      const resp = await fetch(`${API_BASE}/api/nutrition/search-food?query=${encodeURIComponent(searchQuery)}`);
      
      console.log('📥 Response status:', resp.status);
      console.log('📥 Response ok:', resp.ok);
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Search results:', data);
        setSearchResults(data.results || []);
        if (data.results.length === 0) {
          alert("No results found. Try a different search term.");
        }
      } else {
        const errorText = await resp.text();
        console.error('❌ API Error:', resp.status, errorText);
        alert(`Failed to search food database: ${resp.status} ${errorText}`);
      }
    } catch (e) {
      console.error("❌ Error searching food:", e);
      alert(`Error searching food database: ${e instanceof Error ? e.message : 'Network error'}`);
    } finally {
      setSearching(false);
    }
  }

  function selectFood(food: FoodSearchResult) {
    setSelectedFood(food);
    setServingMultiplier("1");
    setSearchResults([]);
    setSearchQuery("");
  }

  async function addSelectedFood() {
    if (!jwt || !selectedFood) {
      console.error('❌ Cannot add food: JWT or selectedFood missing', { jwt: jwt ? 'present' : 'missing', selectedFood: !!selectedFood });
      alert("Please connect to Google Fit first or select a food item");
      return;
    }

    const multiplier = parseFloat(servingMultiplier) || 1;
    
    setLoading(true);
    try {
      console.log('🍽️ Adding food entry:', selectedFood.name);
      console.log('🔑 JWT token (first 20 chars):', jwt.substring(0, 20) + '...');
      
      const resp = await fetch(`${API_BASE}/api/nutrition/add`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${jwt}`
        },
        body: JSON.stringify({
          name: selectedFood.name,
          calories: Math.round(selectedFood.calories * multiplier),
          protein: Math.round(selectedFood.protein * multiplier * 10) / 10,
          carbs: Math.round(selectedFood.carbs * multiplier * 10) / 10,
          fat: Math.round(selectedFood.fat * multiplier * 10) / 10,
          servingSize: `${multiplier} x ${selectedFood.servingSize}`
        })
      });

      console.log('📥 Response status:', resp.status, resp.ok);
      
      if (resp.ok) {
        const data = await resp.json();
        console.log('✅ Food entry added successfully:', data);
        setFoodEntries([...foodEntries, data.entry]);
        setSelectedFood(null);
        setServingMultiplier("1");
        setShowAddFood(false);
        window.location.reload();
      } else {
        const errorText = await resp.text();
        console.error('❌ Failed to add food entry:', resp.status, errorText);
        alert(`Failed to add food entry: ${resp.status} - ${errorText}`);
      }
    } catch (e) {
      console.error("❌ Error adding food:", e);
      alert(`Error adding food entry: ${e instanceof Error ? e.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  }

  async function deleteEntry(id: string) {
    if (!jwt || !confirm("Delete this entry?")) return;

    try {
      console.log(`🗑️ Attempting to delete entry ${id}...`);
      const resp = await fetch(`${API_BASE}/api/nutrition/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${jwt}` }
      });

      console.log('Delete response status:', resp.status, resp.statusText);

      if (resp.ok) {
        setFoodEntries(foodEntries.filter(e => e._id !== id));
        alert("Entry deleted successfully!");
      } else {
        const error = await resp.json();
        alert(`Failed to delete: ${error.message || error.error || 'Unknown error'}`);
        console.error("Delete failed:", error);
      }
    } catch (e) {
      console.error("Error deleting:", e);
      const errorMsg = e instanceof Error ? e.message : String(e);
      alert(`Error deleting entry: ${errorMsg}\n\nMake sure the backend server is running on port 5000`);
    }
  }

  const totalCalories = foodEntries.reduce((sum, entry) => sum + entry.calories, 0);
  const totalProtein = foodEntries.reduce((sum, entry) => sum + (entry.protein || 0), 0);
  const totalCarbs = foodEntries.reduce((sum, entry) => sum + (entry.carbs || 0), 0);
  const totalFat = foodEntries.reduce((sum, entry) => sum + (entry.fat || 0), 0);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>🍽️ Nutrition Log</h2>
          <button className="btn-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Summary */}
          <div className="nutrition-summary">
            <div className="summary-card">
              <div className="summary-label">🔥 Calories</div>
              <div className="summary-value">{Math.round(totalCalories)}</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">💪 Protein</div>
              <div className="summary-value">{Math.round(totalProtein)}g</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">🍞 Carbs</div>
              <div className="summary-value">{Math.round(totalCarbs)}g</div>
            </div>
            <div className="summary-card">
              <div className="summary-label">🥑 Fat</div>
              <div className="summary-value">{Math.round(totalFat)}g</div>
            </div>
          </div>

          {/* Food Entries Section */}
          <div className="food-entries-section">
            <div className="section-header">
              <h3>📋 Today's Food ({foodEntries.length} items)</h3>
              <button 
                className="btn-primary btn-sm" 
                style={showAddFood ? { background: '#86efac', borderColor: '#22c55e' } : {}}
                onClick={() => {
                  setShowAddFood(!showAddFood);
                  setSelectedFood(null);
                  setSearchResults([]);
                  setSearchQuery("");
                }}
              >
                {showAddFood ? "✕ Cancel" : <span><span className="emoji-dark-grey">➕</span> Add Food</span>}
              </button>
            </div>

            {/* Add Food Form */}
            {showAddFood && (
              <div className="add-food-form">
                <div className="search-section">
                  <h4>🔍 Search Food Database</h4>
                  
                  <div className="search-input-group">
                    <input
                      type="text"
                      placeholder="Enter food name..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && searchFood()}
                      className="form-input"
                    />
                    <button 
                      className="btn-primary" 
                      onClick={searchFood}
                      disabled={searching}
                    >
                      {searching ? "Searching..." : "Search"}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="search-results">
                      <h5>Select a food:</h5>
                      {searchResults.map((food, idx) => (
                        <div 
                          key={idx} 
                          className="search-result-item"
                          onClick={() => selectFood(food)}
                        >
                          <div className="result-header">
                            <span className="result-name">{food.name}</span>
                            <span className="result-source">{food.source}</span>
                          </div>
                          <div className="result-nutrition">
                            <span>{Math.round(food.calories)} kcal</span>
                            <span>P: {Math.round(food.protein)}g</span>
                            <span>C: {Math.round(food.carbs)}g</span>
                            <span>F: {Math.round(food.fat)}g</span>
                            <span className="result-serving">{food.servingSize}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Selected Food */}
                  {selectedFood && (
                    <div className="selected-food">
                      <h5>✅ Selected: {selectedFood.name}</h5>
                      <div className="selected-details">
                        <div className="selected-nutrition">
                          <div>Calories: {Math.round(selectedFood.calories)} kcal</div>
                          <div>Protein: {Math.round(selectedFood.protein)}g</div>
                          <div>Carbs: {Math.round(selectedFood.carbs)}g</div>
                          <div>Fat: {Math.round(selectedFood.fat)}g</div>
                          <div>Per serving: {selectedFood.servingSize}</div>
                        </div>
                        
                        <div className="serving-adjuster">
                          <label>Number of servings:</label>
                          <div className="serving-controls">
                            <button 
                              className="btn-serving"
                              onClick={() => setServingMultiplier((parseFloat(servingMultiplier) - 0.5).toString())}
                              disabled={parseFloat(servingMultiplier) <= 0.5}
                            >
                              -
                            </button>
                            <input
                              type="number"
                              step="0.5"
                              min="0.5"
                              value={servingMultiplier}
                              onChange={(e) => setServingMultiplier(e.target.value)}
                              className="serving-input"
                            />
                            <button 
                              className="btn-serving"
                              onClick={() => setServingMultiplier((parseFloat(servingMultiplier) + 0.5).toString())}
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="total-nutrition">
                          <h6>📊 Total for {servingMultiplier} serving(s):</h6>
                          <div className="total-values">
                            <span>🔥 {Math.round(selectedFood.calories * parseFloat(servingMultiplier))} kcal</span>
                            <span>💪 {Math.round(selectedFood.protein * parseFloat(servingMultiplier) * 10) / 10}g</span>
                            <span>🍞 {Math.round(selectedFood.carbs * parseFloat(servingMultiplier) * 10) / 10}g</span>
                            <span>🥑 {Math.round(selectedFood.fat * parseFloat(servingMultiplier) * 10) / 10}g</span>
                          </div>
                        </div>

                        <button 
                          className="btn-primary btn-add" 
                          onClick={addSelectedFood}
                          disabled={loading}
                        >
                          {loading ? "Adding..." : "Add to Log"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Entries List */}
            <div className="food-entries-list">
              {foodEntries.length === 0 ? (
                <div className="empty-state">
                  <div style={{ fontSize: '48px', marginBottom: '12px' }}>🍽️</div>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-main)' }}>No food entries yet today</p>
                  <p className="empty-subtitle">Click "<span className="emoji-dark-grey">➕</span> Add Food" to start logging your meals</p>
                </div>
              ) : (
                foodEntries.map((entry, idx) => (
                  <div key={entry._id || idx} className="food-entry-card">
                    <div className="food-entry-main">
                      <div className="food-name">🍴 {entry.name}</div>
                      <div className="food-calories">{Math.round(entry.calories)} kcal</div>
                    </div>
                    {(entry.protein || entry.carbs || entry.fat) && (
                      <div className="food-macros">
                        {entry.protein ? <span>💪 {Math.round(entry.protein * 10) / 10}g</span> : null}
                        {entry.carbs ? <span>🍞 {Math.round(entry.carbs * 10) / 10}g</span> : null}
                        {entry.fat ? <span>🥑 {Math.round(entry.fat * 10) / 10}g</span> : null}
                      </div>
                    )}
                    {entry.servingSize && (
                      <div className="food-serving">📏 {entry.servingSize}</div>
                    )}
                    <button 
                      className="btn-delete" 
                      onClick={() => deleteEntry(entry._id!)}
                      title="Delete entry"
                    >
                      🗑️
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
