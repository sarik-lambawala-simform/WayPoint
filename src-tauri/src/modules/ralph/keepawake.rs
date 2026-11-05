//! Keeping the machine awake while a run is live. Linux and Windows: macOS keeps the script's own
//! `caffeinate`, which outlives the app.
//!
//! On Linux the hold is a `systemd-inhibit` child that sleeps until it is dropped. It carries a
//! parent-death signal, so an app that is killed does not leave the lock behind. On Windows it is a
//! thread that sets `ES_SYSTEM_REQUIRED` (a per-thread request) and parks until told to end; the
//! request dies with the thread, and with the process. Each watch of a loop reports
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
    #[cfg(windows)]
    holder: Option<win::Holder>,
}

fn state() -> &'static Mutex<State> {
    static STATE: OnceLock<Mutex<State>> = OnceLock::new();
    STATE.get_or_init(|| Mutex::new(State::default()))
}

/// A watch (`id`) says whether the run it sees is live; an ended watch reports false.
pub fn report(id: u32, live: bool) {
    let Ok(mut s) = state().lock() else { return };
    if live {
        s.live.insert(id);
    } else {
        s.live.remove(&id);
    }
    reap(&mut s);
    apply(&mut s);
}

/// The parent-death signal follows the thread that spawned the hold, so it can end while the app
/// lives; a hold that is gone is dropped here and taken again by `apply`.
#[cfg(target_os = "linux")]
fn reap(s: &mut State) {
    if s.child
        .as_mut()
        .is_some_and(|c| !matches!(c.try_wait(), Ok(None)))
    {
        s.child = None;
    }
}

#[cfg(windows)]
fn reap(s: &mut State) {
    if s.holder.as_ref().is_some_and(|h| h.ended()) {
        s.holder = None;
    }
}

#[cfg(not(any(target_os = "linux", windows)))]
fn reap(_s: &mut State) {}

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

#[cfg(windows)]
fn apply(s: &mut State) {
    match decide(s.holder.is_some(), !s.live.is_empty()) {
        Hold::Take => s.holder = Some(win::Holder::start()),
        Hold::Release => s.holder = None,
        Hold::Keep => {}
    }
}

#[cfg(not(any(target_os = "linux", windows)))]
fn apply(_s: &mut State) {}

#[cfg(windows)]
mod win {
    use std::sync::mpsc::{channel, Sender};
    use std::thread::JoinHandle;
    use windows_sys::Win32::System::Power::{
        SetThreadExecutionState, ES_CONTINUOUS, ES_SYSTEM_REQUIRED,
    };

    pub struct Holder {
        end: Option<Sender<()>>,
        thread: Option<JoinHandle<()>>,
    }

    impl Holder {
        pub fn start() -> Self {
            let (end, ended) = channel::<()>();
            let thread = std::thread::spawn(move || {
                // SAFETY: only sets this thread's execution-state request.
                unsafe { SetThreadExecutionState(ES_CONTINUOUS | ES_SYSTEM_REQUIRED) };
                // Parked until the sender goes away or sends.
                let _ = ended.recv();
                // SAFETY: clears this thread's request.
                unsafe { SetThreadExecutionState(ES_CONTINUOUS) };
            });
            Self {
                end: Some(end),
                thread: Some(thread),
            }
        }

        pub fn ended(&self) -> bool {
            self.thread.as_ref().is_none_or(|t| t.is_finished())
        }
    }

    impl Drop for Holder {
        fn drop(&mut self) {
            drop(self.end.take());
            if let Some(t) = self.thread.take() {
                let _ = t.join();
            }
        }
    }
}

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
