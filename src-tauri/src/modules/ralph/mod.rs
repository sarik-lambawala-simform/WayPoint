//! WayPoint's Rust port of the Ralph ticket engine. Pure, dependency-light pieces live in the
//! submodules; Tauri commands stay thin wrappers over them.

pub mod keepawake;
pub mod launch;
pub mod runs;
pub mod ticket_read;
pub mod tickets;
pub mod watch;
