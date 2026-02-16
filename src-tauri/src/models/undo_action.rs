use serde::{Deserialize, Serialize};
use std::collections::VecDeque;
use std::sync::Mutex;

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct TrashAction {
    pub file_path: String,
    pub file_name: String,
    pub original_size: u64,
    pub trash_timestamp: u64,
}

pub struct UndoStack {
    actions: Mutex<VecDeque<TrashAction>>,
    max_size: usize,
    total_deleted_count: Mutex<u64>,
    total_deleted_bytes: Mutex<u64>,
}

impl UndoStack {
    pub fn new(max_size: usize) -> Self {
        Self {
            actions: Mutex::new(VecDeque::with_capacity(max_size)),
            max_size,
            total_deleted_count: Mutex::new(0),
            total_deleted_bytes: Mutex::new(0),
        }
    }

    pub fn push(&self, action: TrashAction) {
        let mut actions = self.actions.lock().unwrap();

        // If at max capacity, remove oldest action
        if actions.len() >= self.max_size {
            actions.pop_front();
        }

        actions.push_back(action);
    }

    pub fn pop(&self) -> Option<TrashAction> {
        let mut actions = self.actions.lock().unwrap();
        actions.pop_back()
    }

    pub fn increment_stats(&self, size: u64) {
        let mut count = self.total_deleted_count.lock().unwrap();
        let mut bytes = self.total_deleted_bytes.lock().unwrap();
        *count += 1;
        *bytes += size;
    }

    pub fn decrement_stats(&self, size: u64) {
        let mut count = self.total_deleted_count.lock().unwrap();
        let mut bytes = self.total_deleted_bytes.lock().unwrap();
        if *count > 0 {
            *count -= 1;
        }
        if *bytes >= size {
            *bytes -= size;
        } else {
            *bytes = 0;
        }
    }

    pub fn stats(&self) -> (u64, u64) {
        let count = self.total_deleted_count.lock().unwrap();
        let bytes = self.total_deleted_bytes.lock().unwrap();
        (*count, *bytes)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_push_pop() {
        let stack = UndoStack::new(3);

        let action1 = TrashAction {
            file_path: "/test/file1.txt".to_string(),
            file_name: "file1.txt".to_string(),
            original_size: 100,
            trash_timestamp: 1000,
        };

        stack.push(action1.clone());
        let popped = stack.pop();

        assert!(popped.is_some());
        assert_eq!(popped.unwrap().file_name, "file1.txt");
    }

    #[test]
    fn test_max_size_eviction() {
        let stack = UndoStack::new(2);

        let action1 = TrashAction {
            file_path: "/test/file1.txt".to_string(),
            file_name: "file1.txt".to_string(),
            original_size: 100,
            trash_timestamp: 1000,
        };

        let action2 = TrashAction {
            file_path: "/test/file2.txt".to_string(),
            file_name: "file2.txt".to_string(),
            original_size: 200,
            trash_timestamp: 2000,
        };

        let action3 = TrashAction {
            file_path: "/test/file3.txt".to_string(),
            file_name: "file3.txt".to_string(),
            original_size: 300,
            trash_timestamp: 3000,
        };

        stack.push(action1);
        stack.push(action2);
        stack.push(action3); // Should evict action1

        // Pop should give us action3
        let popped1 = stack.pop().unwrap();
        assert_eq!(popped1.file_name, "file3.txt");

        // Pop should give us action2
        let popped2 = stack.pop().unwrap();
        assert_eq!(popped2.file_name, "file2.txt");

        // Stack should be empty (action1 was evicted)
        let popped3 = stack.pop();
        assert!(popped3.is_none());
    }

    #[test]
    fn test_stats_counting() {
        let stack = UndoStack::new(10);

        stack.increment_stats(100);
        stack.increment_stats(200);

        let (count, bytes) = stack.stats();
        assert_eq!(count, 2);
        assert_eq!(bytes, 300);

        stack.decrement_stats(100);
        let (count, bytes) = stack.stats();
        assert_eq!(count, 1);
        assert_eq!(bytes, 200);
    }
}
