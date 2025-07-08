//! Utility Functions Module
//!
//! This module provides comprehensive utility functions for various system operations.
//! Some functions are used by current features, others are infrastructure for future use.

// Allow unused functions as this is infrastructure for comprehensive utility operations
#![allow(dead_code)]

// Utility modules
pub mod cache;
pub mod crypto;
pub mod networking;
pub mod time;

// Re-export all utilities for convenience
// Note: These are infrastructure utilities - some are used by current features,
// others are available for future development
// Utils are imported directly where needed to avoid unused warnings
// pub use cache::*;
  // Used by Gmail auth service
// pub use networking::*;
// pub use time::*; 