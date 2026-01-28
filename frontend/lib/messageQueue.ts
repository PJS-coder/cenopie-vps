// Message queue for handling offline/failed messages
interface QueuedMessage {
  id: string;
  data: any;
  timestamp: number;
  retries: number;
  maxRetries: number;
}

class MessageQueue {
  private queue: QueuedMessage[] = [];
  private processing = false;
  private maxRetries = 3;
  private retryDelay = 1000; // Start with 1 second

  // Add message to queue
  enqueue(data: any): string {
    const id = `queue-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const queuedMessage: QueuedMessage = {
      id,
      data,
      timestamp: Date.now(),
      retries: 0,
      maxRetries: this.maxRetries
    };
    
    this.queue.push(queuedMessage);
    this.processQueue();
    return id;
  }

  // Process queued messages
  private async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    
    while (this.queue.length > 0) {
      const message = this.queue[0];
      
      try {
        // Try to send the message
        await this.sendMessage(message.data);
        
        // Success - remove from queue
        this.queue.shift();
        
        // Emit success event
        window.dispatchEvent(new CustomEvent('messageQueue:sent', { 
          detail: { id: message.id, data: message.data } 
        }));
        
      } catch (error) {
        message.retries++;
        
        if (message.retries >= message.maxRetries) {
          // Max retries reached - remove from queue and emit failure
          this.queue.shift();
          window.dispatchEvent(new CustomEvent('messageQueue:failed', { 
            detail: { id: message.id, data: message.data, error } 
          }));
        } else {
          // Wait before retry with exponential backoff
          const delay = this.retryDelay * Math.pow(2, message.retries - 1);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }
    
    this.processing = false;
  }

  // Send message function (to be overridden)
  private async sendMessage(data: any): Promise<void> {
    // This will be set by the messaging hook
    throw new Error('Send function not set');
  }

  // Set the send function
  setSendFunction(sendFn: (data: any) => Promise<void>) {
    this.sendMessage = sendFn;
  }

  // Get queue status
  getQueueStatus() {
    return {
      length: this.queue.length,
      processing: this.processing,
      messages: this.queue.map(m => ({
        id: m.id,
        retries: m.retries,
        timestamp: m.timestamp
      }))
    };
  }

  // Clear queue
  clear() {
    this.queue = [];
    this.processing = false;
  }
}

export const messageQueue = new MessageQueue();