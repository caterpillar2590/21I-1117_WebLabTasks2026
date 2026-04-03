import React, { useEffect, useRef } from 'react';
import './App.css';

function App() {
  // Refs for DOM elements
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Function to add item using DOM manipulation
  const addItem = () => {
    // Get the input element using useRef (alternative to getElementById)
    const inputElement = inputRef.current;
    const itemValue = inputElement.value.trim();
    
    // Validate input
    if (itemValue === '') {
      alert('Please enter an item!');
      return;
    }
    
    // Get the list element
    const listElement = listRef.current;
    
    // Create new list item using DOM manipulation
    const newListItem = document.createElement('li');
    newListItem.textContent = itemValue;
    newListItem.className = 'list-item';
    
    // Add click event to remove individual item
    newListItem.addEventListener('click', () => {
      if (confirm(`Remove "${newListItem.textContent}" from list?`)) {
        newListItem.remove();
        updateItemCount();
      }
    });
    
    // Append to the list
    listElement.appendChild(newListItem);
    
    // Clear the input box
    inputElement.value = '';
    
    // Focus back on input
    inputElement.focus();
    
    // Update item count
    updateItemCount();
  };

  // Function to remove last item using DOM manipulation
  const removeLastItem = () => {
    const listElement = listRef.current;
    const items = listElement.getElementsByTagName('li');
    
    if (items.length === 0) {
      alert('No items to remove!');
      return;
    }
    
    // Remove the last item
    const lastItem = items[items.length - 1];
    lastItem.remove();
    
    // Update item count
    updateItemCount();
  };

  // Function to remove all items
  const removeAllItems = () => {
    const listElement = listRef.current;
    const items = listElement.getElementsByTagName('li');
    
    if (items.length === 0) {
      alert('List is already empty!');
      return;
    }
    
    if (confirm(`Remove all ${items.length} items?`)) {
      // Clear the entire list using DOM manipulation
      while (listElement.firstChild) {
        listElement.removeChild(listElement.firstChild);
      }
      updateItemCount();
    }
  };

  // Function to update item count display
  const updateItemCount = () => {
    const listElement = listRef.current;
    const items = listElement.getElementsByTagName('li');
    const count = items.length;
    
    // Update or create count display
    let countDisplay = document.getElementById('itemCount');
    if (!countDisplay) {
      countDisplay = document.createElement('div');
      countDisplay.id = 'itemCount';
      countDisplay.className = 'item-count';
      const container = document.querySelector('.list-container');
      container.appendChild(countDisplay);
    }
    
    countDisplay.textContent = `Total items: ${count}`;
    
    // Change color based on count
    if (count === 0) {
      countDisplay.style.color = '#999';
    } else if (count > 10) {
      countDisplay.style.color = '#ff9800';
    } else {
      countDisplay.style.color = '#4caf50';
    }
  };

  // Function to handle enter key press
  const handleKeyPress = (event) => {
    if (event.key === 'Enter') {
      addItem();
    }
  };

  // Function to add sample items
  const addSampleItems = () => {
    const sampleItems = ['🍎 Apple', '📚 Book', '💻 Laptop', '🎵 Music', '🎮 Games'];
    const listElement = listRef.current;
    
    sampleItems.forEach(item => {
      const newListItem = document.createElement('li');
      newListItem.textContent = item;
      newListItem.className = 'list-item';
      newListItem.addEventListener('click', () => {
        if (confirm(`Remove "${newListItem.textContent}" from list?`)) {
          newListItem.remove();
          updateItemCount();
        }
      });
      listElement.appendChild(newListItem);
    });
    
    updateItemCount();
  };

  // Initialize on component mount
  useEffect(() => {
    // Focus on input
    inputRef.current.focus();
    
    // Add some styling to the list container
    const listElement = listRef.current;
    listElement.style.listStyle = 'none';
    listElement.style.padding = '0';
    listElement.style.margin = '0';
    
    // Initialize item count
    updateItemCount();
    
    // Add keyboard event listener
    const inputElement = inputRef.current;
    inputElement.addEventListener('keypress', handleKeyPress);
    
    // Cleanup event listener
    return () => {
      inputElement.removeEventListener('keypress', handleKeyPress);
    };
  }, []);

  return (
    <div className="app-container">
      <div className="main-card">
        <h1 className="title">✨ My Favorite Items ✨</h1>
        
        <div className="input-section">
          <input
            ref={inputRef}
            type="text"
            id="itemInput"
            className="item-input"
            placeholder="Enter your favorite item..."
            maxLength="50"
          />
          <div className="button-group">
            <button onClick={addItem} className="btn btn-primary">
              ➕ Add Item
            </button>
            <button onClick={removeLastItem} className="btn btn-secondary">
              ⬅️ Remove Last
            </button>
            <button onClick={removeAllItems} className="btn btn-danger">
              🗑️ Remove All
            </button>
            <button onClick={addSampleItems} className="btn btn-info">
              📝 Add Samples
            </button>
          </div>
        </div>

        <div className="list-container">
          <div className="list-header">
            <span>Your Items</span>
            <span className="list-hint">💡 Click on any item to remove it</span>
          </div>
          <ul ref={listRef} id="itemList" className="item-list"></ul>
        </div>

        <div className="footer-info">
          <p>Total items will appear here ⬆️</p>
          <small>Press Enter to quickly add an item</small>
        </div>
      </div>
    </div>
  );
}

export default App;
