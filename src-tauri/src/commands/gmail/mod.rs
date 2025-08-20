//! Gmail Commands Module
//!
//! This module contains all Gmail-related Tauri commands, organized by functionality.

pub mod auth;
pub mod api;
#[cfg(feature = "gmail-compose")]
pub mod compose;
#[cfg(feature = "gmail-compose")]
pub mod contacts;
pub mod sync;
pub mod cache;
pub mod migration;
pub mod image_proxy;

// Do not re-export wildcard modules here to avoid unused import warnings.
// Commands are imported explicitly at call sites (e.g., in lib.rs generate_handler!).