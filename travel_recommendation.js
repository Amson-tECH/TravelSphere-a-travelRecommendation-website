// Travel API URL
    const TRAVEL_API_URL = 'https://cf-courses-data.s3.us.cloud-object-storage.appdomain.cloud/IBMSkillsNetwork-JS0101EN-SkillsNetwork/travel1.json';

    // Keyword variations for different categories
    const KEYWORD_VARIATIONS = {
      beaches: [
        'beach', 'beaches', 'shore', 'shores', 'coastal', 'coast', 
        'seaside', 'waterfront', 'oceanfront', 'sand', 'sandy'
      ],
      temples: [
        'temple', 'temples', 'shrine', 'shrines', 'monument', 'monuments',
        'religious', 'sacred', 'holy', 'worship', 'heritage'
      ],
      countries: [
        'country', 'countries', 'nation', 'nations', 'destination', 
        'destinations', 'place', 'places','tokoyo'
      ]
    };

    // Country name variations
    const COUNTRY_VARIATIONS = {
      'australia': ['australia', 'aussie', 'oz'],
      'japan': ['japan', 'nippon', 'japanese'],
      'brazil': ['brazil', 'brasil', 'brazilian'],
      'cambodia': ['cambodia', 'khmer'],
      'india': ['india', 'indian', 'bharat'],
      'french polynesia': ['french polynesia', 'tahiti', 'polynesia']
    };

    let travelData = null;

    // Fetch travel data from API
    async function fetchTravelData() {
      try {
        const response = await fetch(TRAVEL_API_URL);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        travelData = await response.json();
        return travelData;
      } catch (error) {
        console.error('Error fetching travel data:', error);
        throw error;
      }
    }

    // Normalize search term (lowercase and trim)
    function normalizeSearchTerm(term) {
      return term.toLowerCase().trim();
    }

    // Check if keyword matches any variations
    function matchesKeywordVariations(searchTerm, category) {
      const variations = KEYWORD_VARIATIONS[category] || [];
      return variations.some(variation => 
        searchTerm.includes(variation) || variation.includes(searchTerm)
      );
    }

    // Check if search term matches country variations
    function matchesCountryVariations(searchTerm, countryName) {
      const countryKey = countryName.toLowerCase();
      const variations = COUNTRY_VARIATIONS[countryKey] || [countryKey];
      
      return variations.some(variation => 
        searchTerm.includes(variation) || 
        variation.includes(searchTerm) ||
        countryName.toLowerCase().includes(searchTerm)
      );
    }

    // Enhanced search function with guaranteed minimum results and proper image handling
    function searchDestinations(searchTerm) {
      if (!travelData || !searchTerm) return [];

      const normalizedTerm = normalizeSearchTerm(searchTerm);
      const results = [];

      // Search beaches - guarantee at least 2 results
      if (matchesKeywordVariations(normalizedTerm, 'beaches')) {
        travelData.beaches.forEach(beach => {
          results.push({
            ...beach,
            type: 'Beach',
            category: 'beaches',
            imageUrl: getPlaceholderImage('beach', beach.name)
          });
        });

        // If we have beach-related cities, add them too
        travelData.countries.forEach(country => {
          country.cities.forEach(city => {
            if (city.description.toLowerCase().includes('beach')) {
              results.push({
                ...city,
                type: 'Coastal City',
                category: 'beaches',
                country: country.name,
                imageUrl: getPlaceholderImage('city', city.name)
              });
            }
          });
        });
      }

      // Search temples - guarantee at least 2 results
      if (matchesKeywordVariations(normalizedTerm, 'temples')) {
        travelData.temples.forEach(temple => {
          results.push({
            ...temple,
            type: 'Temple',
            category: 'temples',
            imageUrl: getPlaceholderImage('temple', temple.name)
          });
        });

        // Add cities with cultural/historic significance
        travelData.countries.forEach(country => {
          country.cities.forEach(city => {
            if (city.description.toLowerCase().includes('temple') || 
                city.description.toLowerCase().includes('traditional') ||
                city.description.toLowerCase().includes('historic')) {
              results.push({
                ...city,
                type: 'Historic City',
                category: 'temples',
                country: country.name,
                imageUrl: getPlaceholderImage('city', city.name)
              });
            }
          });
        });
      }

      // Search countries - guarantee at least 2 results
      if (matchesKeywordVariations(normalizedTerm, 'countries')) {
        travelData.countries.forEach(country => {
          results.push({
            id: country.id,
            name: country.name,
            description: `A beautiful country with ${country.cities.length} featured cities including ${country.cities.map(c => c.name.split(',')[0]).join(', ')}`,
            type: 'Country',
            category: 'countries',
            cities: country.cities,
            imageUrl: getPlaceholderImage('country', country.name)
          });
        });
      } else {
        // Search for specific country names and cities
        travelData.countries.forEach(country => {
          if (matchesCountryVariations(normalizedTerm, country.name)) {
            results.push({
              id: country.id,
              name: country.name,
              description: `A beautiful country with ${country.cities.length} featured cities including ${country.cities.map(c => c.name.split(',')[0]).join(', ')}`,
              type: 'Country',
              category: 'countries',
              cities: country.cities,
              imageUrl: getPlaceholderImage('country', country.name)
            });
          }

          country.cities.forEach(city => {
            if (city.name.toLowerCase().includes(normalizedTerm) ||
                city.description.toLowerCase().includes(normalizedTerm)) {
              results.push({
                ...city,
                type: 'City',
                category: 'cities',
                country: country.name,
                imageUrl: getPlaceholderImage('city', city.name)
              });
            }
          });
        });
      }

      // Direct name/description search for all items
      ['temples', 'beaches'].forEach(category => {
        travelData[category].forEach(item => {
          const alreadyAdded = results.some(result => 
            result.id === item.id && result.category === category
          );
          
          if (!alreadyAdded && 
              (item.name.toLowerCase().includes(normalizedTerm) ||
               item.description.toLowerCase().includes(normalizedTerm))) {
            results.push({
              ...item,
              type: category === 'temples' ? 'Temple' : 'Beach',
              category: category,
              imageUrl: getPlaceholderImage(category.slice(0, -1), item.name)
            });
          }
        });
      });

      return results;
    }

    // Generate appropriate placeholder images based on category and location
    function getPlaceholderImage(category, name) {
      const imageMap = {
        // Beaches
        'Bora Bora, French Polynesia': 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=800&q=80',
        'Copacabana Beach, Brazil': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        
        // Temples
        'Angkor Wat, Cambodia': 'https://images.unsplash.com/photo-1540611025311-01df3cef54b5?auto=format&fit=crop&w=800&q=80',
        'Taj Mahal, India': 'https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=800&q=80',
        
        // Countries
        'Australia': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=800&q=80',
        'Japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        'Brazil': 'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=800&q=80',
        
        // Cities
        'Sydney, Australia': 'https://images.unsplash.com/photo-1506973035872-a4ec16b8e8d9?auto=format&fit=crop&w=800&q=80',
        'Melbourne, Australia': 'https://images.unsplash.com/photo-1514395462725-fb4566210144?auto=format&fit=crop&w=800&q=80',
        'Tokyo, Japan': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?auto=format&fit=crop&w=800&q=80',
        'Kyoto, Japan': 'https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=800&q=80',
        'Rio de Janeiro, Brazil': 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=800&q=80',
        'São Paulo, Brazil': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?auto=format&fit=crop&w=800&q=80'
      };

      // Return specific image if exists, otherwise generate category-based placeholder
      if (imageMap[name]) {
        return imageMap[name];
      }

      // Category-based fallback images
      const fallbackImages = {
        'beach': 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
        'temple': 'https://images.unsplash.com/photo-1539650116574-75c0c6d0da78?auto=format&fit=crop&w=800&q=80',
        'country': 'https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80',
        'city': 'https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&w=800&q=80'
      };

      return fallbackImages[category] || fallbackImages['city'];
    }

    // Display search results
    function displayResults(results, searchTerm) {
      const resultsContent = document.getElementById('resultsContent');
      const searchResults = document.getElementById('searchResults');
      
      // Show search results section
      searchResults.classList.add('active');
      
      if (results.length === 0) {
        resultsContent.innerHTML = `
          <div class="no-results">
            <h3>No results found for "${searchTerm}"</h3>
            <p>Try searching for:</p>
            <ul style="list-style: none; padding: 20px 0; text-align: left; display: inline-block;">
              <li style="margin: 10px 0;">🏖️ <strong>Beaches:</strong> beach, beaches, shore, coastal</li>
              <li style="margin: 10px 0;">🏛️ <strong>Temples:</strong> temple, temples, shrine, monument</li>
              <li style="margin: 10px 0;">🌍 <strong>Countries:</strong> Australia, Japan, Brazil, countries</li>
            </ul>
          </div>
        `;
        return;
      }

      let resultsHTML = `
        <div class="results-header">
          <h2 class="results-title">Search Results for "${searchTerm}"</h2>
          <div class="results-count">${results.length} result${results.length > 1 ? 's' : ''} found</div>
        </div>
      `;

      results.forEach(result => {
        resultsHTML += `
          <div class="result-item">
            <div class="result-image-container">
              <img src="${result.imageUrl}" alt="${result.name}" class="result-image" 
                   onerror="this.src='https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=800&q=80'">
              <div class="result-type-overlay">${result.type}</div>
            </div>
            <div class="result-content">
              <div class="result-header">
                <h3 class="result-name">${result.name}</h3>
                <span class="result-rating">⭐ 4.${Math.floor(Math.random() * 9 + 1)}</span>
              </div>
              <p class="result-description">${result.description}</p>
              ${result.country ? `<p class="result-country">📍 ${result.country}</p>` : ''}
              ${result.cities ? `<p class="result-country">🏙️ Featured cities: ${result.cities.length}</p>` : ''}
              <div class="result-actions">
                <button class="explore-btn" onclick="exploreDestination('${result.name}')">Explore Now</button>
                <button class="bookmark-btn" onclick="bookmarkDestination('${result.name}')">💖 Save</button>
              </div>
            </div>
          </div>
        `;
      });

      resultsContent.innerHTML = resultsHTML;
      
      // Smooth scroll to results
      searchResults.scrollIntoView({ behavior: 'smooth' });
    }

    // Show loading state
    function showLoading() {
      const resultsContent = document.getElementById('resultsContent');
      const searchResults = document.getElementById('searchResults');
      searchResults.classList.add('active');
      resultsContent.innerHTML = '<div class="loading">🔍 Searching for destinations...</div>';
    }

    // Show error state
    function showError(message) {
      const resultsContent = document.getElementById('resultsContent');
      const searchResults = document.getElementById('searchResults');
      searchResults.classList.add('active');
      resultsContent.innerHTML = `
        <div class="error">
          <strong>Error:</strong> ${message}
        </div>
        <div class="no-results">
          Please try again or check your internet connection.
        </div>
      `;
    }

    // Search action function (your existing onclick function)
    async function searchAction(button) {
      const searchInput = document.querySelector('.search-input-1');
      const searchTerm = searchInput.value.trim();

      if (!searchTerm) {
        alert('Please enter a search term!');
        return;
      }

      // Add loading state to button
      const originalText = button.textContent;
      button.textContent = 'Searching...';
      button.disabled = true;

      showLoading();

      try {
        // Fetch data if not already loaded
        if (!travelData) {
          await fetchTravelData();
        }

        // Perform search
        const results = searchDestinations(searchTerm);
        
        // Display results after a brief delay for better UX
        setTimeout(() => {
          displayResults(results, searchTerm);
          // Reset button
          button.textContent = originalText;
          button.disabled = false;
        }, 800);

      } catch (error) {
        showError('Failed to fetch travel data. Please try again.');
        console.error('Search error:', error);
        // Reset button
        button.textContent = originalText;
        button.disabled = false;
      }
    }

    // Clear action function (your existing onclick function)
    function clearAction(button) {
      const searchInput = document.querySelector('.search-input-1');
      const searchResults = document.getElementById('searchResults');
      const resultsContent = document.getElementById('resultsContent');
      
      // Clear input
      searchInput.value = '';
      
      // Hide search results
      searchResults.classList.remove('active');
      
      // Reset results content
      resultsContent.innerHTML = `
        <div class="no-results">
          🎯 Enter a search term and click "Search" to find amazing destinations!
        </div>
      `;
      
      // Focus back on input
      searchInput.focus();
      
      // Scroll back to top
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // Enhanced enter key support and additional functions
    document.addEventListener('DOMContentLoaded', function() {
      const searchInput = document.querySelector('.search-input-1');
      
      searchInput.addEventListener('keypress', function(event) {
        if (event.key === 'Enter') {
          const searchButton = document.querySelector('.search-btn-1');
          searchAction(searchButton);
        }
      });

      // Preload data when page loads
      fetchTravelData().then(() => {
        console.log('Travel data preloaded successfully');
      }).catch(error => {
        console.error('Failed to preload travel data:', error);
      });
    });

    // Function for explore destination button
    function exploreDestination(destinationName) {
      // You can customize this function to redirect to a detailed page or show more info
      alert(`Exploring ${destinationName}! 🌍\n\nThis would normally redirect to a detailed page with more information, booking options, and travel packages.`);
      
      // Example: Redirect to a details page
      // window.location.href = `destination-details.html?place=${encodeURIComponent(destinationName)}`;
    }

    // Function for bookmark/save destination
    function bookmarkDestination(destinationName) {
      // You can customize this to save to local storage or user account
      const bookmarked = localStorage.getItem('bookmarkedDestinations') || '[]';
      const bookmarkedArray = JSON.parse(bookmarked);
      
      if (!bookmarkedArray.includes(destinationName)) {
        bookmarkedArray.push(destinationName);
        localStorage.setItem('bookmarkedDestinations', JSON.stringify(bookmarkedArray));
        
        // Show success message
        const button = event.target;
        const originalText = button.innerHTML;
        button.innerHTML = '💖 Saved!';
        button.style.background = 'rgba(34, 197, 94, 0.3)';
        
        setTimeout(() => {
          button.innerHTML = originalText;
          button.style.background = 'rgba(255, 255, 255, 0.1)';
        }, 2000);
      } else {
        alert(`${destinationName} is already in your bookmarks! ⭐`);
      }
    }


    