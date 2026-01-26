/**
 * Ultra-Performance Monitoring System
 * Real-time performance tracking for 150,000+ users
 */

import { performance } from 'perf_hooks';
import os from 'os';
import process from 'process';

class UltraPerformanceMonitor {
  constructor() {
    this.metrics = {
      requests: 0,
      responses: 0,
      errors: 0,
      totalResponseTime: 0,
      activeConnections: 0,
      memoryUsage: 0,
      cpuUsage: 0,
      dbQueries: 0,
      cacheHits: 0,
      cacheMisses: 0
    };
    
    this.startTime = Date.now();
    this.intervals = [];
    this.performanceThresholds = {
      responseTime: 100,    // 100ms max response time
      memoryUsage: 280,     // 280MB max memory per process
      errorRate: 0.01,      // 1% max error rate
      cpuUsage: 90          // 90% max CPU usage
    };
    
    this.alerts = [];
    this.lastCleanup = Date.now();
    
    this.startMonitoring();
  }
  
  // Middleware for request monitoring
  requestMonitor() {
    return (req, res, next) => {
      const startTime = performance.now();
      this.metrics.requests++;
      this.metrics.activeConnections++;
      
      // Add request metadata
      req.startTime = startTime;
      req.monitorId = this.generateId();
      
      // Monitor response
      res.on('finish', () => {
        const responseTime = performance.now() - startTime;
        this.metrics.responses++;
        this.metrics.totalResponseTime += responseTime;
        this.metrics.activeConnections--;
        
        // Track errors
        if (res.statusCode >= 400) {
          this.metrics.errors++;
          this.logError(req, res, responseTime);
        }
        
        // Alert on slow responses
        if (responseTime > this.performanceThresholds.responseTime) {
          this.alertSlowResponse(req, responseTime);
        }
        
        // Log ultra-slow responses
        if (responseTime > 500) {
          console.warn(`🐌 ULTRA-SLOW RESPONSE: ${req.method} ${req.path} took ${responseTime.toFixed(2)}ms`);
        }
      });
      
      // Monitor for request timeout
      const timeout = setTimeout(() => {
        if (!res.headersSent) {
          console.error(`⏰ REQUEST TIMEOUT: ${req.method} ${req.path} exceeded 30s`);
          this.alertTimeout(req);
        }
      }, 30000);
      
      res.on('finish', () => clearTimeout(timeout));
      
      next();
    };
  }
  
  // Database query monitoring
  trackDbQuery(operation, duration) {
    this.metrics.dbQueries++;
    
    if (duration > 50) { // Slow query threshold
      console.warn(`🗄️ SLOW DB QUERY: ${operation} took ${duration.toFixed(2)}ms`);
    }
    
    if (duration > 200) { // Critical slow query
      this.alertSlowQuery(operation, duration);
    }
  }
  
  // Cache monitoring
  trackCacheHit() {
    this.metrics.cacheHits++;
  }
  
  trackCacheMiss() {
    this.metrics.cacheMisses++;
  }
  
  // Start monitoring system
  startMonitoring() {
    // Monitor system metrics every second
    this.intervals.push(setInterval(() => {
      this.updateSystemMetrics();
      this.checkPerformanceThresholds();
    }, 1000));
    
    // Report metrics every 10 seconds
    this.intervals.push(setInterval(() => {
      this.reportMetrics();
    }, 10000));
    
    // Cleanup and optimization every minute
    this.intervals.push(setInterval(() => {
      this.performCleanup();
      this.optimizePerformance();
    }, 60000));
    
    // Generate performance report every 5 minutes
    this.intervals.push(setInterval(() => {
      this.generatePerformanceReport();
    }, 300000));
  }
  
  updateSystemMetrics() {
    // Memory usage
    const memUsage = process.memoryUsage();
    this.metrics.memoryUsage = memUsage.rss / 1024 / 1024; // MB
    
    // CPU usage
    const cpuUsage = process.cpuUsage();
    this.metrics.cpuUsage = (cpuUsage.user + cpuUsage.system) / 1000000; // seconds
    
    // System load
    const loadAvg = os.loadavg();
    this.metrics.systemLoad = loadAvg[0]; // 1-minute load average
  }
  
  checkPerformanceThresholds() {
    const now = Date.now();
    const uptime = now - this.startTime;
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.responses, 1);
    const cacheHitRate = this.metrics.cacheHits / Math.max(this.metrics.cacheHits + this.metrics.cacheMisses, 1);
    
    // Memory threshold check
    if (this.metrics.memoryUsage > this.performanceThresholds.memoryUsage) {
      this.alertHighMemory();
      
      // Force garbage collection if available
      if (global.gc) {
        console.log('🧹 Forcing garbage collection due to high memory usage');
        global.gc();
      }
    }
    
    // Response time threshold check
    if (avgResponseTime > this.performanceThresholds.responseTime) {
      this.alertHighResponseTime(avgResponseTime);
    }
    
    // Error rate threshold check
    if (errorRate > this.performanceThresholds.errorRate) {
      this.alertHighErrorRate(errorRate);
    }
    
    // Cache hit rate check
    if (cacheHitRate < 0.95 && this.metrics.cacheHits + this.metrics.cacheMisses > 100) {
      this.alertLowCacheHitRate(cacheHitRate);
    }
    
    // Connection threshold check
    if (this.metrics.activeConnections > 1000) {
      this.alertHighConnections();
    }
    
    // System load check
    if (this.metrics.systemLoad > 4.0) { // High load for 5-core system
      this.alertHighSystemLoad();
    }
  }
  
  reportMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.responses, 1);
    const requestsPerSecond = this.metrics.requests / (uptime / 1000);
    const cacheHitRate = this.metrics.cacheHits / Math.max(this.metrics.cacheHits + this.metrics.cacheMisses, 1);
    
    const status = this.getPerformanceStatus();
    const statusEmoji = this.getStatusEmoji(status);
    
    console.log(`
${statusEmoji} ULTRA PERFORMANCE METRICS - ${new Date().toISOString()}
├─ Uptime: ${Math.floor(uptime / 1000)}s
├─ Requests: ${this.metrics.requests.toLocaleString()} (${requestsPerSecond.toFixed(2)}/s)
├─ Avg Response: ${avgResponseTime.toFixed(2)}ms
├─ Error Rate: ${(errorRate * 100).toFixed(3)}%
├─ Active Connections: ${this.metrics.activeConnections}
├─ Memory: ${this.metrics.memoryUsage.toFixed(2)}MB
├─ CPU Load: ${this.metrics.systemLoad?.toFixed(2) || 'N/A'}
├─ DB Queries: ${this.metrics.dbQueries.toLocaleString()}
├─ Cache Hit Rate: ${(cacheHitRate * 100).toFixed(1)}%
└─ Status: ${status}
    `);
    
    // Show recent alerts
    if (this.alerts.length > 0) {
      console.log('⚠️  Recent Alerts:');
      this.alerts.slice(-3).forEach(alert => {
        console.log(`   ${alert.emoji} ${alert.message} (${alert.time})`);
      });
    }
  }
  
  getPerformanceStatus() {
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.responses, 1);
    const memoryUsage = this.metrics.memoryUsage;
    
    if (avgResponseTime < 50 && errorRate < 0.001 && memoryUsage < 200) {
      return '🟢 EXCELLENT';
    } else if (avgResponseTime < 100 && errorRate < 0.01 && memoryUsage < 250) {
      return '🟡 GOOD';
    } else if (avgResponseTime < 200 && errorRate < 0.05 && memoryUsage < 280) {
      return '🟠 ACCEPTABLE';
    } else {
      return '🔴 NEEDS ATTENTION';
    }
  }
  
  getStatusEmoji(status) {
    if (status.includes('EXCELLENT')) return '🚀';
    if (status.includes('GOOD')) return '✅';
    if (status.includes('ACCEPTABLE')) return '⚠️';
    return '🚨';
  }
  
  // Alert methods
  alertSlowResponse(req, responseTime) {
    const alert = {
      type: 'SLOW_RESPONSE',
      message: `Slow response: ${req.method} ${req.path} (${responseTime.toFixed(2)}ms)`,
      time: new Date().toISOString(),
      emoji: '🐌'
    };
    this.addAlert(alert);
  }
  
  alertHighMemory() {
    const alert = {
      type: 'HIGH_MEMORY',
      message: `High memory usage: ${this.metrics.memoryUsage.toFixed(2)}MB`,
      time: new Date().toISOString(),
      emoji: '💾'
    };
    this.addAlert(alert);
  }
  
  alertHighResponseTime(avgResponseTime) {
    const alert = {
      type: 'HIGH_RESPONSE_TIME',
      message: `High avg response time: ${avgResponseTime.toFixed(2)}ms`,
      time: new Date().toISOString(),
      emoji: '⏱️'
    };
    this.addAlert(alert);
  }
  
  alertHighErrorRate(errorRate) {
    const alert = {
      type: 'HIGH_ERROR_RATE',
      message: `High error rate: ${(errorRate * 100).toFixed(2)}%`,
      time: new Date().toISOString(),
      emoji: '❌'
    };
    this.addAlert(alert);
  }
  
  alertLowCacheHitRate(cacheHitRate) {
    const alert = {
      type: 'LOW_CACHE_HIT_RATE',
      message: `Low cache hit rate: ${(cacheHitRate * 100).toFixed(1)}%`,
      time: new Date().toISOString(),
      emoji: '📦'
    };
    this.addAlert(alert);
  }
  
  alertHighConnections() {
    const alert = {
      type: 'HIGH_CONNECTIONS',
      message: `High connection count: ${this.metrics.activeConnections}`,
      time: new Date().toISOString(),
      emoji: '🔗'
    };
    this.addAlert(alert);
  }
  
  alertSlowQuery(operation, duration) {
    const alert = {
      type: 'SLOW_QUERY',
      message: `Slow DB query: ${operation} (${duration.toFixed(2)}ms)`,
      time: new Date().toISOString(),
      emoji: '🗄️'
    };
    this.addAlert(alert);
  }
  
  alertTimeout(req) {
    const alert = {
      type: 'REQUEST_TIMEOUT',
      message: `Request timeout: ${req.method} ${req.path}`,
      time: new Date().toISOString(),
      emoji: '⏰'
    };
    this.addAlert(alert);
  }
  
  alertHighSystemLoad() {
    const alert = {
      type: 'HIGH_SYSTEM_LOAD',
      message: `High system load: ${this.metrics.systemLoad?.toFixed(2)}`,
      time: new Date().toISOString(),
      emoji: '⚡'
    };
    this.addAlert(alert);
  }
  
  addAlert(alert) {
    this.alerts.push(alert);
    
    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts = this.alerts.slice(-50);
    }
    
    // Log critical alerts immediately
    if (alert.type === 'REQUEST_TIMEOUT' || alert.type === 'HIGH_ERROR_RATE') {
      console.error(`🚨 CRITICAL ALERT: ${alert.message}`);
    }
  }
  
  performCleanup() {
    const now = Date.now();
    
    // Reset counters periodically to prevent overflow
    if (this.metrics.requests > 1000000) {
      console.log('🧹 Resetting performance counters to prevent overflow');
      this.metrics.requests = Math.floor(this.metrics.requests / 2);
      this.metrics.responses = Math.floor(this.metrics.responses / 2);
      this.metrics.errors = Math.floor(this.metrics.errors / 2);
      this.metrics.totalResponseTime = this.metrics.totalResponseTime / 2;
      this.metrics.dbQueries = Math.floor(this.metrics.dbQueries / 2);
      this.metrics.cacheHits = Math.floor(this.metrics.cacheHits / 2);
      this.metrics.cacheMisses = Math.floor(this.metrics.cacheMisses / 2);
    }
    
    // Clean old alerts
    this.alerts = this.alerts.filter(alert => 
      now - new Date(alert.time).getTime() < 3600000 // Keep alerts for 1 hour
    );
    
    this.lastCleanup = now;
  }
  
  optimizePerformance() {
    // Force garbage collection if memory is high
    if (this.metrics.memoryUsage > 250 && global.gc) {
      console.log('🧹 Auto-optimizing: Running garbage collection');
      global.gc();
    }
    
    // Log optimization suggestions
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    if (avgResponseTime > 150) {
      console.log('💡 OPTIMIZATION SUGGESTION: Consider enabling more aggressive caching');
    }
    
    const cacheHitRate = this.metrics.cacheHits / Math.max(this.metrics.cacheHits + this.metrics.cacheMisses, 1);
    if (cacheHitRate < 0.90) {
      console.log('💡 OPTIMIZATION SUGGESTION: Cache hit rate is low, review caching strategy');
    }
  }
  
  generatePerformanceReport() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.responses, 1);
    const requestsPerSecond = this.metrics.requests / (uptime / 1000);
    const cacheHitRate = this.metrics.cacheHits / Math.max(this.metrics.cacheHits + this.metrics.cacheMisses, 1);
    
    console.log(`
📊 ULTRA-PERFORMANCE REPORT - ${new Date().toISOString()}
═══════════════════════════════════════════════════════════
🎯 TARGET METRICS:
├─ Response Time: <100ms (Current: ${avgResponseTime.toFixed(2)}ms)
├─ Error Rate: <1% (Current: ${(errorRate * 100).toFixed(3)}%)
├─ Cache Hit Rate: >95% (Current: ${(cacheHitRate * 100).toFixed(1)}%)
├─ Memory Usage: <280MB (Current: ${this.metrics.memoryUsage.toFixed(2)}MB)
└─ Requests/sec: ${requestsPerSecond.toFixed(2)}

🚀 PERFORMANCE STATUS: ${this.getPerformanceStatus()}

📈 RECOMMENDATIONS:
${this.generateRecommendations()}
═══════════════════════════════════════════════════════════
    `);
  }
  
  generateRecommendations() {
    const recommendations = [];
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.responses, 1);
    const cacheHitRate = this.metrics.cacheHits / Math.max(this.metrics.cacheHits + this.metrics.cacheMisses, 1);
    
    if (avgResponseTime > 100) {
      recommendations.push('⚡ Enable more aggressive caching');
      recommendations.push('🗄️ Optimize database queries');
    }
    
    if (errorRate > 0.01) {
      recommendations.push('🔍 Investigate error sources');
      recommendations.push('🛡️ Add more error handling');
    }
    
    if (cacheHitRate < 0.95) {
      recommendations.push('📦 Improve cache strategy');
      recommendations.push('⏰ Increase cache TTL for stable data');
    }
    
    if (this.metrics.memoryUsage > 250) {
      recommendations.push('💾 Optimize memory usage');
      recommendations.push('🧹 Increase garbage collection frequency');
    }
    
    if (recommendations.length === 0) {
      recommendations.push('✅ Performance is optimal!');
    }
    
    return recommendations.join('\n├─ ');
  }
  
  // Utility methods
  generateId() {
    return Math.random().toString(36).substring(2, 15);
  }
  
  logError(req, res, responseTime) {
    console.error(`❌ ERROR: ${res.statusCode} ${req.method} ${req.path} (${responseTime.toFixed(2)}ms)`);
  }
  
  // Get current metrics
  getMetrics() {
    const uptime = Date.now() - this.startTime;
    const avgResponseTime = this.metrics.totalResponseTime / Math.max(this.metrics.responses, 1);
    const errorRate = this.metrics.errors / Math.max(this.metrics.responses, 1);
    const requestsPerSecond = this.metrics.requests / (uptime / 1000);
    const cacheHitRate = this.metrics.cacheHits / Math.max(this.metrics.cacheHits + this.metrics.cacheMisses, 1);
    
    return {
      ...this.metrics,
      uptime,
      avgResponseTime,
      errorRate,
      requestsPerSecond,
      cacheHitRate,
      status: this.getPerformanceStatus(),
      alerts: this.alerts.slice(-10) // Last 10 alerts
    };
  }
  
  // Stop monitoring
  stop() {
    this.intervals.forEach(interval => clearInterval(interval));
    console.log('🛑 Ultra-performance monitoring stopped');
  }
}

// Create singleton instance
const ultraMonitor = new UltraPerformanceMonitor();

export default ultraMonitor;