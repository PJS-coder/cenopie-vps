// Simple in-memory cache for API responses
class SimpleCache {
  constructor() {
    this.cache = new Map();
    this.ttl = new Map(); // Time to live for each key
  }

  // Set cache with TTL (time to live in seconds)
  set(key, value, ttlSeconds = 300) { // Default 5 minutes
    const expirationTime = Date.now() + (ttlSeconds * 1000);
    this.cache.set(key, value);
    this.ttl.set(key, expirationTime);
  }

  // Get from cache
  get(key) {
    const expirationTime = this.ttl.get(key);
    
    // Check if key exists and hasn't expired
    if (expirationTime && Date.now() < expirationTime) {
      return this.cache.get(key);
    }
    
    // Clean up expired entry
    if (this.cache.has(key)) {
      this.cache.delete(key);
      this.ttl.delete(key);
    }
    
    return null;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Clear specific key
  delete(key) {
    this.cache.delete(key);
    this.ttl.delete(key);
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.ttl.clear();
  }

  // Clean up expired entries
  cleanup() {
    const now = Date.now();
    for (const [key, expirationTime] of this.ttl.entries()) {
      if (now >= expirationTime) {
        this.cache.delete(key);
        this.ttl.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

// Create a global cache instance
const cache = new SimpleCache();

// Clean up expired entries every 5 minutes
setInterval(() => {
  cache.cleanup();
}, 5 * 60 * 1000);

export default cache;
