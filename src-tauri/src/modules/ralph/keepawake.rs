//! Keeping the machine awake while a run is live. Linux only: macOS keeps the script's own
//! `caffeinate`, which outlives the app, and Windows is the WSL ticket.
//!
//! The hold is a `systemd-inhibit` child that sleeps until it is dropped. It carries a parent-death
//! signal, so an app that is killed does not leave the lock behind. Each watch of a loop reports
//! whether the run it sees is live; the hold is taken when any report says live and released when
//! none does. The decision is a pure function over those two facts.

use std::collections::HashSet;
use std::sync::{Mutex, OnceLock};

/// What to do with the hold, given whether we hold it and whether any run is live.
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
pub enum Hold {
    Take,
    Release,
    Keep,
}

pub fn decide(holding: bool, any_live: bool) -> Hold {
    match (holding, any_live) {
        (false, true) => Hold::Take,
        (true, false) => Hold::Release,
        _ => Hold::Keep,
    }
}

#[derive(Default)]
struct State {
    live: HashSet<u32>,
    #[cfg(target_os = "linux")]
    child: Option<std::process::Child>,
}

fn state() -> &'static Mutex<State> {
    static STATE: OnceLock<Mutex<State>> = OnceLock::new();
    STATE.get_or_init(|| Mutex::new(State::default()))
}

/// A watch (`id`) says whether the run it sees is live; an ended watch reports false.
pub fn report(id: u32, live: bool) {
    let Ok(mut s) = state().lock() else { return };
    let changed = if live {
        s.live.insert(id)
    } else {
        s.live.remove(&id)
    };
    if changed {
        apply(&mut s);
    }
}

#[cfg(target_os = "linux")]
fn apply(s: &mut State) {
    match decide(s.child.is_some(), !s.live.is_empty()) {
        Hold::Take => s.child = inhibit(),
        Hold::Release => {
            if let Some(mut child) = s.child.take() {
                let _ = child.kill();
                let _ = child.wait();
            }
        }
        Hold::Keep => {}
    }
}

#[cfg(not(target_os = "linux"))]
fn apply(_s: &mut State) {}

#[cfg(target_os = "linux")]
fn inhibit() -> Option<std::process::Child> {
    use std::os::unix::process::CommandExt;
    use std::process::{Command, Stdio};
    let mut cmd = Command::new("systemd-inhibit");
    cmd.args([
        "--what=idle:sleep",
        "--who=WayPoint",
        "--why=A loop run is live",
        "--mode=block",
        "sleep",
        "infinity",
    ])
    .stdin(Stdio::null())
    .stdout(Stdio::null())
    .stderr(Stdio::null());
    // SAFETY: prctl only sets this process's parent-death signal.
    unsafe {
        cmd.pre_exec(|| {
            libc::prctl(libc::PR_SET_PDEATHSIG, libc::SIGTERM as libc::c_ulong);
            Ok(())
        });
    }
    cmd.spawn().ok()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_hold_follows_whether_any_run_is_live() {
        assert_eq!(decide(false, true), Hold::Take);
        assert_eq!(decide(true, true), Hold::Keep);
        assert_eq!(decide(true, false), Hold::Release);
        assert_eq!(decide(false, false), Hold::Keep);
    }
}
