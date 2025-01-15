// src/utils/customErrors.js

class MemoryProcessingError extends Error {
  constructor(message) {
    super(message);
    this.name = 'MemoryProcessingError';
  }
}

class FileOperationError extends MemoryProcessingError {
  constructor(message) {
    super(message);
    this.name = 'FileOperationError';
  }
}

class ValidationError extends MemoryProcessingError {
  constructor(message) {
    super(message);
    this.name = 'ValidationError';
  }
}

class WebhookError extends MemoryProcessingError {
  constructor(message) {
    super(message);
    this.name = 'WebhookError';
  }
}

// Add more custom error classes as needed

module.exports = {
  MemoryProcessingError,
  FileOperationError,
  ValidationError,
  WebhookError,
};
