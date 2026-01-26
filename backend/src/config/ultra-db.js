import mongoose from 'mongoose';
import { performance } from 'perf_hooks';

class UltraDatabase {
  constructor() {
    this.queryCache = new Map();
    this.connectionPool = null;
    this.queryStats = {
      totalQueries: 0,
      slowQueries: 0,
      cacheHits: 0,
      averageQueryTime: 0
    };
    
    this.setupOptimizedConnection();
    this.startCacheCleanup();
    this.startPerformanceMonitoring();
  }
  
  async setupOptimizedConnection() {
    try {
      // Ultra-optimized MongoDB connection
      this.connectionPool = await mongoose.connect(process.env.MONGODB_URI, {
        // Connection pool optimization
        maxPoolSize: 100,        // Maximum connections for high load
        minPoolSize: 20,         // Minimum connections always ready
        maxIdleTimeMS: 30000,    // Close connections after 30s idle
        waitQueueTimeoutMS: 5000, // Wait 5s for connection
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        
        // Ultra-performance options
        bufferMaxEntries: 0,     // Disable mongoose buffering
        bufferCommands: false,   // Disable mongoose buffering
        
        // Read/Write optimization
        readPreference: 'primaryPreferred',
        readConcern: { level: 'local' },
        writeConcern: { w: 1, j: false }, // Fast writes, less durability
        
        // Connection optimization
        keepAlive: true,
        keepAliveInitialDelay: 300000,
        
        // Compression for network optimization
        compressors: ['snappy', 'zlib'],
        
        // Additional performance settings
        retryWrites: true,
        retryReads: true,
        maxStalenessSeconds: 90,
        
        // Ultra-fast connection settings
        connectTimeoutMS: 10000,
        heartbeatFrequencyMS: 10000,
        
        // Optimize for high throughput
        authSource: 'admin',
        ssl: false, // Disable SSL for local connections (faster)
        
        // Advanced options
        maxConnecting: 10,
        directConnection: false,
        loadBalanced: false
      });
      
      console.log('✅ Ultra-performance MongoDB connection established');
      
      // Set up connection event handlers
      mongoose.connection.on('connected', () => {
        console.log('📊 MongoDB connected with ultra-performance settings');
      });
      
      mongoose.connection.on('error', (err) => {
        console.error('❌ MongoDB connection error:', err);
      });
      
      mongoose.connection.on('disconnected', () => {
        console.warn('⚠️ MongoDB disconnected');
      });
      
      // Monitor connection pool
      setInterval(() => {
        const poolStats = mongoose.connection.db?.admin().serverStatus();
        if (poolStats) {
          console.log(`📊 Connection Pool: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
        }
      }, 60000);
      
    } catch (error) {
      console.error('❌ Failed to setup ultra-performance database connection:', error);
      throw error;
    }
  }
  
  // Ultra-fast aggregation with intelligent caching
  async ultraAggregate(collection, pipeline, cacheKey, ttl = 300000) {
    const startTime = performance.now();
    this.queryStats.totalQueries++;
    
    // Check cache first
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      this.queryStats.cacheHits++;
      return cached.data;
    }
    
    try {
      // Execute with ultra-performance optimizations
      const result = await collection.aggregate(pipeline, {
        allowDiskUse: false,  // Force in-memory processing (faster)
        cursor: { batchSize: 1000 },
        maxTimeMS: 5000,      // 5 second timeout
        hint: this.getBestIndex(collection, pipeline),
        
        // Additional performance options
        bypassDocumentValidation: true,
        collation: { locale: 'simple' }, // Faster string comparisons
        
        // Read concern optimization
        readConcern: { level: 'local' }
      }).exec();
      
      const queryTime = performance.now() - startTime;
      this.updateQueryStats(queryTime);
      
      // Cache result with intelligent TTL
      const intelligentTTL = this.calculateIntelligentTTL(queryTime, result.length);
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        queryTime,
        size: result.length
      });
      
      // Log slow queries for optimization
      if (queryTime > 100) {
        this.queryStats.slowQueries++;
        console.warn(`🐌 Slow aggregation: ${cacheKey} took ${queryTime.toFixed(2)}ms`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Aggregation error for ${cacheKey}:`, error);
      throw error;
    }
  }
  
  // Ultra-fast find with optimizations
  async ultraFind(collection, query, options = {}, cacheKey, ttl = 60000) {
    const startTime = performance.now();
    this.queryStats.totalQueries++;
    
    // Check cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      this.queryStats.cacheHits++;
      return cached.data;
    }
    
    try {
      // Optimize query options
      const optimizedOptions = {
        ...options,
        lean: true,           // Return plain objects (faster)
        maxTimeMS: 3000,      // 3 second timeout
        batchSize: 1000,      // Optimize batch size
        hint: this.getBestIndex(collection, query),
        
        // Additional optimizations
        allowPartialResults: false,
        noCursorTimeout: false,
        
        // Read optimization
        readConcern: { level: 'local' }
      };
      
      const result = await collection.find(query, null, optimizedOptions).exec();
      const queryTime = performance.now() - startTime;
      this.updateQueryStats(queryTime);
      
      // Cache result
      this.queryCache.set(cacheKey, {
        data: result,
        timestamp: Date.now(),
        queryTime,
        size: result.length
      });
      
      if (queryTime > 50) {
        this.queryStats.slowQueries++;
        console.warn(`🐌 Slow find: ${cacheKey} took ${queryTime.toFixed(2)}ms`);
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ Find error for ${cacheKey}:`, error);
      throw error;
    }
  }
  
  // Ultra-fast bulk operations
  async ultraBulkWrite(collection, operations, options = {}) {
    const startTime = performance.now();
    
    const optimizedOptions = {
      ordered: false,       // Parallel execution (faster)
      bypassDocumentValidation: true, // Skip validation (faster)
      writeConcern: { w: 1, j: false }, // Fast writes
      ...options
    };
    
    try {
      // Split large operations into optimal batches
      const batchSize = 1000;
      const batches = [];
      
      for (let i = 0; i < operations.length; i += batchSize) {
        batches.push(operations.slice(i, i + batchSize));
      }
      
      // Execute batches in parallel for maximum performance
      const promises = batches.map(batch => 
        collection.bulkWrite(batch, optimizedOptions)
      );
      
      const results = await Promise.all(promises);
      const queryTime = performance.now() - startTime;
      
      console.log(`⚡ Bulk write completed: ${operations.length} operations in ${queryTime.toFixed(2)}ms`);
      
      return results;
      
    } catch (error) {
      console.error('❌ Bulk write error:', error);
      throw error;
    }
  }
  
  // Ultra-fast single document operations
  async ultraFindOne(collection, query, options = {}, cacheKey, ttl = 30000) {
    const startTime = performance.now();
    
    // Check cache
    const cached = this.queryCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < ttl) {
      return cached.data;
    }
    
    try {
      const result = await collection.findOne(query, null, {
        ...options,
        lean: true,
        maxTimeMS: 1000, // 1 second timeout for single docs
        hint: this.getBestIndex(collection, query)
      }).exec();
      
      const queryTime = performance.now() - startTime;
      
      // Cache single document results
      if (result) {
        this.queryCache.set(cacheKey, {
          data: result,
          timestamp: Date.now(),
          queryTime
        });
      }
      
      return result;
      
    } catch (error) {
      console.error(`❌ FindOne error for ${cacheKey}:`, error);
      throw error;
    }
  }
  
  // Intelligent index selection
  getBestIndex(collection, queryOrPipeline) {
    // Simple but effective index hint logic
    let queryKeys = [];
    
    if (Array.isArray(queryOrPipeline)) {
      // Aggregation pipeline
      const matchStage = queryOrPipeline.find(stage => stage.$match);
      if (matchStage) {
        queryKeys = Object.keys(matchStage.$match);
      }
    } else {
      // Regular query
      queryKeys = Object.keys(queryOrPipeline);
    }
    
    // Priority-based index selection
    if (queryKeys.includes('createdAt')) return { createdAt: -1 };
    if (queryKeys.includes('author')) return { author: 1, createdAt: -1 };
    if (queryKeys.includes('conversationId')) return { conversationId: 1, createdAt: -1 };
    if (queryKeys.includes('email')) return { email: 1 };
    if (queryKeys.includes('_id')) return { _id: 1 };
    if (queryKeys.includes('userId')) return { userId: 1 };
    if (queryKeys.includes('companyId')) return { companyId: 1 };
    if (queryKeys.includes('status')) return { status: 1, createdAt: -1 };
    
    return null; // Let MongoDB choose
  }
  
  // Calculate intelligent TTL based on query performance and result size
  calculateIntelligentTTL(queryTime, resultSize) {
    // Slower queries get cached longer
    let ttl = 300000; // Base 5 minutes
    
    if (queryTime > 1000) ttl = 1800000; // 30 minutes for very slow queries
    else if (queryTime > 500) ttl = 900000; // 15 minutes for slow queries
    else if (queryTime > 100) ttl = 600000; // 10 minutes for medium queries
    
    // Larger results get cached longer
    if (resultSize > 1000) ttl *= 2;
    else if (resultSize > 100) ttl *= 1.5;
    
    return Math.min(ttl, 3600000); // Max 1 hour
  }
  
  // Update query statistics
  updateQueryStats(queryTime) {
    this.queryStats.averageQueryTime = 
      (this.queryStats.averageQueryTime * (this.queryStats.totalQueries - 1) + queryTime) / 
      this.queryStats.totalQueries;
  }
  
  // Cache cleanup with intelligent eviction
  startCacheCleanup() {
    setInterval(() => {
      const now = Date.now();
      let evicted = 0;
      
      for (const [key, value] of this.queryCache.entries()) {
        // Evict expired entries
        if (now - value.timestamp > 600000) { // 10 minutes max
          this.queryCache.delete(key);
          evicted++;
        }
      }
      
      // If cache is too large, evict oldest entries
      if (this.queryCache.size > 10000) {
        const entries = Array.from(this.queryCache.entries());
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        
        const toEvict = entries.slice(0, 2000); // Evict oldest 2000
        toEvict.forEach(([key]) => {
          this.queryCache.delete(key);
          evicted++;
        });
      }
      
      if (evicted > 0) {
        console.log(`🧹 Cache cleanup: evicted ${evicted} entries, ${this.queryCache.size} remaining`);
      }
    }, 60000); // Clean every minute
  }
  
  // Performance monitoring
  startPerformanceMonitoring() {
    setInterval(() => {
      const cacheHitRate = this.queryStats.totalQueries > 0 ? 
        (this.queryStats.cacheHits / this.queryStats.totalQueries * 100).toFixed(2) : 0;
      
      const slowQueryRate = this.queryStats.totalQueries > 0 ?
        (this.queryStats.slowQueries / this.queryStats.totalQueries * 100).toFixed(2) : 0;
      
      console.log(`📊 Database Performance:`);
      console.log(`├─ Total Queries: ${this.queryStats.totalQueries}`);
      console.log(`├─ Cache Hit Rate: ${cacheHitRate}%`);
      console.log(`├─ Slow Query Rate: ${slowQueryRate}%`);
      console.log(`├─ Avg Query Time: ${this.queryStats.averageQueryTime.toFixed(2)}ms`);
      console.log(`├─ Cache Size: ${this.queryCache.size} entries`);
      console.log(`└─ Connection State: ${mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected'}`);
      
      // Reset stats periodically to prevent overflow
      if (this.queryStats.totalQueries > 100000) {
        this.queryStats.totalQueries = Math.floor(this.queryStats.totalQueries / 2);
        this.queryStats.slowQueries = Math.floor(this.queryStats.slowQueries / 2);
        this.queryStats.cacheHits = Math.floor(this.queryStats.cacheHits / 2);
      }
    }, 300000); // Report every 5 minutes
  }
  
  // Get performance statistics
  getStats() {
    const cacheHitRate = this.queryStats.totalQueries > 0 ? 
      (this.queryStats.cacheHits / this.queryStats.totalQueries * 100) : 0;
    
    return {
      ...this.queryStats,
      cacheHitRate,
      cacheSize: this.queryCache.size,
      connectionState: mongoose.connection.readyState
    };
  }
  
  // Force cache clear
  clearCache() {
    this.queryCache.clear();
    console.log('🧹 Database cache cleared');
  }
  
  // Optimize database with indexes
  async createOptimalIndexes() {
    try {
      console.log('🔧 Creating optimal database indexes...');
      
      // User indexes
      await mongoose.connection.db.collection('users').createIndex({ email: 1 }, { unique: true });
      await mongoose.connection.db.collection('users').createIndex({ followers: 1 });
      await mongoose.connection.db.collection('users').createIndex({ following: 1 });
      
      // Post indexes
      await mongoose.connection.db.collection('posts').createIndex({ createdAt: -1 });
      await mongoose.connection.db.collection('posts').createIndex({ author: 1, createdAt: -1 });
      await mongoose.connection.db.collection('posts').createIndex({ likes: 1 });
      
      // Message indexes
      await mongoose.connection.db.collection('messagenews').createIndex({ conversationId: 1, createdAt: -1 });
      await mongoose.connection.db.collection('messagenews').createIndex({ sender: 1, createdAt: -1 });
      
      // Job indexes
      await mongoose.connection.db.collection('jobs').createIndex({ companyId: 1, status: 1 });
      await mongoose.connection.db.collection('jobs').createIndex({ title: 'text', description: 'text' });
      await mongoose.connection.db.collection('jobs').createIndex({ createdAt: -1 });
      
      // Connection indexes
      await mongoose.connection.db.collection('connections').createIndex({ requester: 1, status: 1 });
      await mongoose.connection.db.collection('connections').createIndex({ recipient: 1, status: 1 });
      
      // Notification indexes
      await mongoose.connection.db.collection('notifications').createIndex({ user: 1, createdAt: -1 });
      await mongoose.connection.db.collection('notifications').createIndex({ read: 1, createdAt: -1 });
      
      // Interview indexes
      await mongoose.connection.db.collection('interviews').createIndex({ user: 1, status: 1 });
      await mongoose.connection.db.collection('interviews').createIndex({ company: 1, createdAt: -1 });
      
      // Application indexes
      await mongoose.connection.db.collection('applications').createIndex({ userId: 1, status: 1 });
      await mongoose.connection.db.collection('applications').createIndex({ jobId: 1, createdAt: -1 });
      
      console.log('✅ Optimal database indexes created');
      
    } catch (error) {
      console.error('❌ Error creating indexes:', error);
    }
  }
}

export default new UltraDatabase();