const EventEmitter = require('events');

class MockSocket extends EventEmitter {
  constructor() {
    super();
    this.connected = true;
    this.id = 'mock-socket-id';
    this.listeners = {};
  }

  emit(event, data, callback) {
    // Store the callback if provided
    if (callback) {
      if (!this.listeners[event]) {
        this.listeners[event] = [];
      }
      this.listeners[event].push(callback);
    }
    
    // Emit the event for testing
    this.emit(event, data);
  }

  on(event, callback) {
    super.on(event, callback);
    return this;
  }

  off(event, callback) {
    super.off(event, callback);
    return this;
  }

  connect() {
    this.connected = true;
    this.emit('connect');
    return this;
  }

  disconnect() {
    this.connected = false;
    this.emit('disconnect');
    return this;
  }

  // Mock method to simulate responses
  simulateResponse(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        callback(data);
      });
    }
  }
}

module.exports = {
  io: jest.fn(() => new MockSocket()),
  Socket: MockSocket,
};