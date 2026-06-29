class LexiTrieAPI {
    constructor() {
        this.baseUrl = "http://localhost:8080"; // Configurable C++ backend URL
        this.useMock = true; // Toggle to false to use actual API calls
        
        // Initial mock dictionary data (simulating our Trie storage)
        this.mockDictionary = {
            "algorithm": "A process or set of rules to be followed in calculations or other problem-solving operations, especially by a computer.",
            "binary": "Relating to, composed of, or involving two things, or using a system of numerical notation with base 2.",
            "compiler": "A program that translates source code written in a high-level programming language into machine code.",
            "database": "A structured set of data held in a computer, especially one that is accessible in various ways.",
            "encryption": "The process of converting information or data into a code, especially to prevent unauthorized access.",
            "framework": "A basic structure underlying a system, concept, or text, specifically in software development.",
            "graph": "A diagram showing the relation between variable quantities, or a data structure consisting of nodes and edges.",
            "hash": "A function that converts an input of letters and numbers into an encrypted output of a fixed length.",
            "interface": "A point where two systems, subjects, organizations, etc., meet and interact.",
            "javascript": "An object-oriented computer programming language commonly used to create interactive effects within web browsers.",
            "kernel": "The core program of an operating system, managing system resources and communication between hardware and software.",
            "linear": "Arranged in or extending along a straight or nearly straight line, or a data structure like an array.",
            "matrix": "A rectangular array of quantities or expressions in rows and columns treated as a single entity.",
            "node": "A point in a network or diagram at which lines or pathways intersect or branch, specifically in trees/graphs.",
            "overflow": "The generation of a number or some other data item that is too large to fit in the allocated space.",
            "pointer": "A variable whose value is the address of another variable, i.e., a direct address of the memory location.",
            "queue": "A list of data items, commands, etc., stored so as to be retrievable in a first-in, first-out (FIFO) order.",
            "recursion": "The repeated application of a recursive procedure or definition, specifically a function calling itself.",
            "stack": "A pile of objects, or a data structure in which items are added and removed from the top (LIFO).",
            "trie": "An ordered tree data structure (prefix tree) used to store a dynamic set or associative array where the keys are usually strings."
        };

        // Initialize mock statistics
        this.mockStats = {
            totalSearches: 42,
            autocompleteRequests: 187,
            searchFrequency: {
                "trie": 15,
                "algorithm": 8,
                "pointer": 6,
                "recursion": 5,
                "stack": 4,
                "queue": 4
            }
        };

        // Initialize mock search history
        this.mockHistory = [
            { time: new Date(Date.now() - 4 * 60 * 1000).toISOString(), word: "trie", status: "Found" },
            { time: new Date(Date.now() - 15 * 60 * 1000).toISOString(), word: "pointer", status: "Found" },
            { time: new Date(Date.now() - 42 * 60 * 1000).toISOString(), word: "recursion", status: "Found" },
            { time: new Date(Date.now() - 120 * 60 * 1000).toISOString(), word: "bst", status: "Not Found" },
            { time: new Date(Date.now() - 180 * 60 * 1000).toISOString(), word: "algorithm", status: "Found" }
        ];
    }

    /**
     * Helper to simulate network latency for realistic demonstrations
     */
    async _delay(ms = 250) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Add a word and its meaning/status to the dictionary
     * @param {string} word 
     * @param {string} meaning 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async addWord(word, meaning) {
        await this._delay(300);
        const cleanWord = word.trim().toLowerCase();
        
        if (!cleanWord) {
            return { success: false, message: "Word cannot be empty." };
        }

        if (this.useMock) {
            const exists = this.mockDictionary.hasOwnProperty(cleanWord);
            this.mockDictionary[cleanWord] = meaning || "No meaning provided.";
            return {
                success: true,
                message: exists ? `Word "${cleanWord}" updated successfully.` : `Word "${cleanWord}" added successfully to the Trie.`
            };
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/words`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ word: cleanWord, meaning: meaning })
                });
                return await response.json();
            } catch (error) {
                return { success: false, message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Search for a word in the dictionary
     * @param {string} word 
     * @returns {Promise<{success: boolean, found: boolean, word: string, meaning?: string, message: string, suggestions?: string[]}>}
     */
    async searchWord(word) {
        await this._delay(250);
        const cleanWord = word.trim().toLowerCase();
        
        if (!cleanWord) {
            return { success: false, found: false, word: "", message: "Search query is empty." };
        }

        // Record search in stats & history
        this._recordSearch(cleanWord);

        if (this.useMock) {
            const found = this.mockDictionary.hasOwnProperty(cleanWord);
            
            // Record history item
            this.mockHistory.unshift({
                time: new Date().toISOString(),
                word: cleanWord,
                status: found ? "Found" : "Not Found"
            });
            if (this.mockHistory.length > 50) this.mockHistory.pop();

            if (found) {
                return {
                    success: true,
                    found: true,
                    word: cleanWord,
                    meaning: this.mockDictionary[cleanWord],
                    message: `Word "${cleanWord}" found in the Trie.`
                };
            } else {
                // Generate simple spell suggestions for mock based on Levenshtein-like distance or prefix matching
                const spellSuggestions = this._getSpellSuggestions(cleanWord);
                return {
                    success: true,
                    found: false,
                    word: cleanWord,
                    suggestions: spellSuggestions,
                    message: `Word "${cleanWord}" not found in the Trie.`
                };
            }
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/search?word=${encodeURIComponent(cleanWord)}`);
                const result = await response.json();
                return result;
            } catch (error) {
                return { success: false, found: false, word: cleanWord, message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Delete a word from the dictionary
     * @param {string} word 
     * @returns {Promise<{success: boolean, message: string}>}
     */
    async deleteWord(word) {
        await this._delay(300);
        const cleanWord = word.trim().toLowerCase();

        if (!cleanWord) {
            return { success: false, message: "Word cannot be empty." };
        }

        if (this.useMock) {
            if (this.mockDictionary.hasOwnProperty(cleanWord)) {
                delete this.mockDictionary[cleanWord];
                return { success: true, message: `Word "${cleanWord}" deleted successfully from the Trie.` };
            } else {
                return { success: false, message: `Word "${cleanWord}" not found in the dictionary.` };
            }
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/words?word=${encodeURIComponent(cleanWord)}`, {
                    method: 'DELETE'
                });
                return await response.json();
            } catch (error) {
                return { success: false, message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Get autocomplete suggestions for a given prefix (Trie core feature)
     * @param {string} prefix 
     * @returns {Promise<{success: boolean, prefix: string, suggestions: string[]}>}
     */
    async getAutocompleteSuggestions(prefix) {
        // Fast response for autocomplete to feel snappy
        await this._delay(50);
        const cleanPrefix = prefix.trim().toLowerCase();

        if (!cleanPrefix) {
            return { success: true, prefix: "", suggestions: [] };
        }

        this.mockStats.autocompleteRequests++;

        if (this.useMock) {
            // Simulate Trie prefix matching: filter keys that start with the prefix
            const matches = Object.keys(this.mockDictionary)
                .filter(word => word.startsWith(cleanPrefix))
                .sort()
                .slice(0, 8); // Limit to top 8 suggestions

            return {
                success: true,
                prefix: cleanPrefix,
                suggestions: matches
            };
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/autocomplete?prefix=${encodeURIComponent(cleanPrefix)}`);
                return await response.json();
            } catch (error) {
                return { success: false, prefix: cleanPrefix, suggestions: [] };
            }
        }
    }

    /**
     * Fetch all words currently in the dictionary (Display Dictionary)
     * @returns {Promise<{success: boolean, dictionary: {[key: string]: string}}>}
     */
    async displayDictionary() {
        await this._delay(400);

        if (this.useMock) {
            return {
                success: true,
                dictionary: { ...this.mockDictionary }
            };
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/words`);
                return await response.json();
            } catch (error) {
                return { success: false, dictionary: {}, message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Fetch statistical information from the backend
     * @returns {Promise<{success: boolean, stats: {totalWords: number, totalSearches: number, autocompleteRequests: number, mostSearchedWord: string, dictionaryStatus: string, searchFrequency: {[key: string]: number}}}>}
     */
    async getStatistics() {
        await this._delay(200);

        if (this.useMock) {
            const totalWords = Object.keys(this.mockDictionary).length;
            
            // Get most searched word
            let mostSearchedWord = "None";
            let maxSearches = 0;
            for (const [word, count] of Object.entries(this.mockStats.searchFrequency)) {
                if (count > maxSearches && this.mockDictionary.hasOwnProperty(word)) {
                    maxSearches = count;
                    mostSearchedWord = word;
                }
            }

            const dictionaryStatus = totalWords > 0 ? "Healthy (Active)" : "Empty";

            return {
                success: true,
                stats: {
                    totalWords,
                    totalSearches: this.mockStats.totalSearches,
                    autocompleteRequests: this.mockStats.autocompleteRequests,
                    mostSearched: mostSearchedWord !== "None" ? `${mostSearchedWord} (${maxSearches})` : "None",
                    mostSearchedRaw: mostSearchedWord,
                    dictionaryStatus,
                    searchFrequency: { ...this.mockStats.searchFrequency }
                }
            };
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/stats`);
                return await response.json();
            } catch (error) {
                return { success: false, stats: null, message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Fetch search history records
     * @returns {Promise<{success: boolean, history: Array<{time: string, word: string, status: string}>}>}
     */
    async getSearchHistory() {
        await this._delay(150);

        if (this.useMock) {
            return {
                success: true,
                history: [...this.mockHistory]
            };
        } else {
            // C++ API Integration Call
            try {
                const response = await fetch(`${this.baseUrl}/api/history`);
                return await response.json();
            } catch (error) {
                return { success: false, history: [], message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Clear search history
     * @returns {Promise<{success: boolean}>}
     */
    async clearSearchHistory() {
        await this._delay(150);
        if (this.useMock) {
            this.mockHistory = [];
            return { success: true };
        } else {
            try {
                const response = await fetch(`${this.baseUrl}/api/history`, { method: 'DELETE' });
                return await response.json();
            } catch (error) {
                return { success: false, message: `Backend connection failed: ${error.message}` };
            }
        }
    }

    /**
     * Internal helper to record searches and increment counts
     */
    _recordSearch(word) {
        this.mockStats.totalSearches++;
        if (this.mockStats.searchFrequency[word]) {
            this.mockStats.searchFrequency[word]++;
        } else {
            this.mockStats.searchFrequency[word] = 1;
        }
    }

    /**
     * Internal helper to simulate spell check suggestions (simple string similarities)
     */
    _getSpellSuggestions(target) {
        const words = Object.keys(this.mockDictionary);
        
        // Return words that contain part of the search query, or edit distance 1 or 2
        return words.filter(word => {
            // Check if edit distance is small, or string overlaps significantly
            if (word.startsWith(target.substring(0, Math.max(1, Math.floor(target.length / 2))))) {
                return true;
            }
            // Simple check: shared prefixes or suffixes
            if (target.length > 3 && (word.includes(target) || target.includes(word))) {
                return true;
            }
            return false;
        }).slice(0, 3); // Return max 3 suggestions
    }
}

// Instantiate and expose the API globally
const api = new LexiTrieAPI();
export default api;
