import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  // State for React DOM approach
  const [reactColor, setReactColor] = useState('lightblue');
  
  // Refs for HTML DOM approach
  const htmlColorInputRef = useRef(null);
  const reactColorInputRef = useRef(null);
  
  // Track last colors for display
  const [lastHtmlColor, setLastHtmlColor] = useState('lightgray');
  const [lastReactColor, setLastReactColor] = useState('lightblue');
  
  // HTML DOM Approach - Direct DOM manipulation
  const changeColorWithHTMLDOM = () => {
    // Get the input value using ref (similar to getElementById)
    const colorValue = htmlColorInputRef.current.value.trim();
    
    if (!colorValue) {
      alert('Please enter a color!');
      return;
    }
    
    // Direct DOM manipulation using vanilla JavaScript
    const colorBox = document.getElementById('htmlColorBox');
    
    if (colorBox) {
      // Change the background color directly
      colorBox.style.backgroundColor = colorValue;
      
      // Add a visual effect to show direct manipulation
      colorBox.style.transform = 'scale(1.05)';
      setTimeout(() => {
        colorBox.style.transform = 'scale(1)';
      }, 200);
      
      // Update last color display
      setLastHtmlColor(colorValue);
      
      // Clear the input
      htmlColorInputRef.current.value = '';
      
      // Show success message in the status area
      updateStatusMessage('HTML DOM', colorValue, 'Direct DOM manipulation');
    }
  };
  
  // React DOM Approach - State update causes re-render
  const changeColorWithReactDOM = () => {
    // Get the input value
    const colorValue = reactColorInputRef.current.value.trim();
    
    if (!colorValue) {
      alert('Please enter a color!');
      return;
    }
    
    // Update state - this triggers a re-render
    setReactColor(colorValue);
    
    // Update last color display
    setLastReactColor(colorValue);
    
    // Clear the input
    reactColorInputRef.current.value = '';
    
    // Show success message
    updateStatusMessage('React DOM', colorValue, 'State update → Virtual DOM → Real DOM');
  };
  
  // Function to update the comparison status messages
  const updateStatusMessage = (approach, color, method) => {
    const statusDiv = document.getElementById('statusMessages');
    if (statusDiv) {
      const message = document.createElement('div');
      message.className = 'status-message';
      message.innerHTML = `
        <strong>${approach}:</strong> Changed to "${color}" using ${method}
        <span class="timestamp">${new Date().toLocaleTimeString()}</span>
      `;
      statusDiv.insertBefore(message, statusDiv.firstChild);
      
      // Keep only last 5 messages
      while (statusDiv.children.length > 5) {
        statusDiv.removeChild(statusDiv.lastChild);
      }
    }
  };
  
  // Function to reset both boxes
  const resetColors = () => {
    // HTML DOM reset
    const htmlBox = document.getElementById('htmlColorBox');
    if (htmlBox) {
      htmlBox.style.backgroundColor = 'lightgray';
    }
    setLastHtmlColor('lightgray');
    
    // React DOM reset
    setReactColor('lightblue');
    setLastReactColor('lightblue');
    
    // Clear status messages
    const statusDiv = document.getElementById('statusMessages');
    if (statusDiv) {
      statusDiv.innerHTML = '';
    }
  };
  
  // Function to apply random color using HTML DOM
  const randomColorHTML = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    const colorBox = document.getElementById('htmlColorBox');
    if (colorBox) {
      colorBox.style.backgroundColor = randomColor;
      setLastHtmlColor(randomColor);
      updateStatusMessage('HTML DOM', randomColor, 'Random color via direct DOM');
    }
  };
  
  // Function to apply random color using React DOM
  const randomColorReact = () => {
    const randomColor = '#' + Math.floor(Math.random()*16777215).toString(16);
    setReactColor(randomColor);
    setLastReactColor(randomColor);
    updateStatusMessage('React DOM', randomColor, 'Random color via state update');
  };
  
  return (
    <div className="app-container">
      <h1 className="main-title">🎨 Interactive Color Changer</h1>
      <p className="subtitle">HTML DOM vs React DOM - Understanding the Difference</p>
      
      <div className="comparison-container">
        {/* Part 1: HTML DOM Approach */}
        <div className="approach-card">
          <div className="approach-header">
            <h2>📄 HTML DOM Manipulation</h2>
            <span className="badge imperative">Imperative Approach</span>
          </div>
          
          {/* HTML DOM Box - Will be manipulated directly */}
          <div 
            id="htmlColorBox" 
            className="color-box html-box"
            style={{ backgroundColor: 'lightgray' }}
          >
            <div className="box-content">
              <span>HTML DOM Box</span>
              <small>Direct manipulation</small>
            </div>
          </div>
          
          <div className="control-group">
            <input
              ref={htmlColorInputRef}
              type="text"
              className="color-input"
              placeholder="Enter color (e.g., red, #ff0000, rgb(255,0,0))"
              onKeyPress={(e) => e.key === 'Enter' && changeColorWithHTMLDOM()}
            />
            <div className="button-group">
              <button 
                onClick={changeColorWithHTMLDOM} 
                className="btn btn-html"
              >
                🎨 Change Color (HTML DOM)
              </button>
              <button 
                onClick={randomColorHTML} 
                className="btn btn-random"
              >
                🎲 Random Color
              </button>
            </div>
          </div>
          
          <div className="info-panel">
            <h4>How it works:</h4>
            <ul>
              <li>Uses <code>document.getElementById()</code> to get the div</li>
              <li>Directly modifies <code>style.backgroundColor</code></li>
              <li>Updates the DOM immediately (synchronous)</li>
              <li>React doesn't know about this change</li>
              <li>Imperative: "Find element and change its color"</li>
            </ul>
            <div className="last-action">
              Last color: <strong style={{ color: lastHtmlColor }}>{lastHtmlColor}</strong>
            </div>
          </div>
        </div>
        
        {/* Part 2: React DOM Approach */}
        <div className="approach-card">
          <div className="approach-header">
            <h2>⚛️ React DOM Rendering</h2>
            <span className="badge declarative">Declarative Approach</span>
          </div>
          
          {/* React DOM Box - Updated through state/re-render */}
          <div 
            className="color-box react-box"
            style={{ backgroundColor: reactColor }}
          >
            <div className="box-content">
              <span>React DOM Box</span>
              <small>Re-renders on state change</small>
            </div>
          </div>
          
          <div className="control-group">
            <input
              ref={reactColorInputRef}
              type="text"
              className="color-input"
              placeholder="Enter color (e.g., blue, #00ff00, rgb(0,0,255))"
              onKeyPress={(e) => e.key === 'Enter' && changeColorWithReactDOM()}
            />
            <div className="button-group">
              <button 
                onClick={changeColorWithReactDOM} 
                className="btn btn-react"
              >
                🎨 Change Color (React DOM)
              </button>
              <button 
                onClick={randomColorReact} 
                className="btn btn-random"
              >
                🎲 Random Color
              </button>
            </div>
          </div>
          
          <div className="info-panel">
            <h4>How it works:</h4>
            <ul>
              <li>Uses <code>useState</code> to manage color state</li>
              <li>Updates state with <code>setReactColor()</code></li>
              <li>Triggers component re-render</li>
              <li>React updates Virtual DOM then real DOM</li>
              <li>Declarative: "Color should be {color}"</li>
            </ul>
            <div className="last-action">
              Last color: <strong style={{ color: lastReactColor }}>{lastReactColor}</strong>
            </div>
          </div>
        </div>
      </div>
      
      {/* Part 3: Comparison Section */}
      <div className="comparison-section">
        <h2>📊 Comparison: HTML DOM vs React DOM</h2>
        
        <table className="comparison-table">
          <thead>
            <tr>
              <th>Aspect</th>
              <th>HTML DOM Approach</th>
              <th>React DOM Approach</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="aspect-label">How does it update the UI?</td>
              <td>Directly manipulates the DOM element using JavaScript methods like <code>getElementById()</code> and <code>style.backgroundColor</code></td>
              <td>Updates component state, which triggers a re-render. React then updates the Virtual DOM and efficiently updates the real DOM</td>
            </tr>
            <tr>
              <td className="aspect-label">Does it touch the DOM directly?</td>
              <td><span className="yes">✅ YES</span> - Directly accesses and modifies DOM nodes</td>
              <td><span className="no">❌ NO</span> - Only updates state; React handles DOM updates</td>
            </tr>
            <tr>
              <td className="aspect-label">What happens on re-render?</td>
              <td><span className="no">❌ No re-render concept</span> - Changes are applied immediately and persist until changed again</td>
              <td><span className="yes">✅ Component re-renders</span> - The function component runs again, JSX is re-evaluated, and Virtual DOM diffing occurs</td>
            </tr>
            <tr>
              <td className="aspect-label">Performance consideration</td>
              <td>Very fast for single updates but can be inefficient for complex UIs</td>
              <td>Batch updates and Virtual DOM diffing make it efficient for complex applications</td>
            </tr>
            <tr>
              <td className="aspect-label">Code maintainability</td>
              <td>Harder to maintain for large apps as DOM queries are scattered</td>
              <td>Easier to maintain as UI is a function of state (declarative)</td>
            </tr>
            <tr>
              <td className="aspect-label">React's knowledge of change</td>
              <td><span className="no">❌ React doesn't know</span> - Changes happen outside React's lifecycle</td>
              <td><span className="yes">✅ React manages it</span> - Changes go through React's update cycle</td>
            </tr>
          </tbody>
        </table>
        
        <div className="code-comparison">
          <h3>💻 Code Comparison</h3>
          <div className="code-blocks">
            <div className="code-block">
              <h4>HTML DOM Approach</h4>
              <pre><code>{`// Direct DOM manipulation
const box = document.getElementById('htmlColorBox');
box.style.backgroundColor = 'red';
// React doesn't know about this change!`}</code></pre>
            </div>
            <div className="code-block">
              <h4>React DOM Approach</h4>
              <pre><code>{`// State update triggers re-render
const [color, setColor] = useState('lightblue');
setColor('red');
// React handles the DOM update efficiently`}</code></pre>
            </div>
          </div>
        </div>
        
        <div className="live-demo-status">
          <h3>🔄 Live Action Log</h3>
          <div id="statusMessages" className="status-messages">
            <div className="status-message initial">
              <strong>Ready!</strong> Try changing colors using both approaches
            </div>
          </div>
        </div>
        
        <div className="action-buttons">
          <button onClick={resetColors} className="btn btn-reset">
            🔄 Reset Both Boxes
          </button>
        </div>
      </div>
      
      <div className="learning-tips">
        <h3>💡 Key Takeaways</h3>
        <ul>
          <li><strong>Imperative vs Declarative:</strong> HTML DOM tells the browser "how" to change (find element, set property), while React declares "what" should be shown based on state.</li>
          <li><strong>Direct vs Managed:</strong> HTML DOM manipulates the DOM directly, while React manages the DOM through the Virtual DOM.</li>
          <li><strong>Performance:</strong> React batches updates and only changes what's necessary, while direct DOM manipulation updates immediately.</li>
          <li><strong>Maintainability:</strong> React's declarative approach makes it easier to reason about UI state and changes.</li>
          <li><strong>React's Knowledge:</strong> React is unaware of direct DOM manipulations, which can lead to inconsistencies if mixed improperly.</li>
        </ul>
      </div>
    </div>
  );
}

export default App;
