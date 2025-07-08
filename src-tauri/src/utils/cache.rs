//! Cache utilities
//!
//! Provides basic caching functionality.

use std::collections::HashMap;
use std::time::{Duration, Instant};

/// Simple in-memory cache with TTL
pub struct SimpleCache<K, V> {
    data: HashMap<K, (V, Instant)>,
    ttl: Duration,
}

impl<K, V> SimpleCache<K, V>
where
    K: std::hash::Hash + Eq + Clone,
    V: Clone,
{
    pub fn new(ttl: Duration) -> Self {
        Self {
            data: HashMap::new(),
            ttl,
        }
    }

    pub fn insert(&mut self, key: K, value: V) {
        self.data.insert(key, (value, Instant::now()));
    }

    pub fn get(&mut self, key: &K) -> Option<V> {
        let now = Instant::now();
        
        if let Some((value, inserted_at)) = self.data.get(key) {
            if now.duration_since(*inserted_at) < self.ttl {
                Some(value.clone())
            } else {
                self.data.remove(key);
                None
            }
        } else {
            None
        }
    }

    pub fn remove(&mut self, key: &K) -> Option<V> {
        self.data.remove(key).map(|(value, _)| value)
    }

    pub fn clear(&mut self) {
        self.data.clear();
    }

    pub fn cleanup_expired(&mut self) {
        let now = Instant::now();
        self.data.retain(|_, (_, inserted_at)| {
            now.duration_since(*inserted_at) < self.ttl
        });
    }
} 