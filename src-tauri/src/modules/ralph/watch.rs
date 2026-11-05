//! Watching a feature's runs. Linux and Windows: `notify` on `<repo>/logs` (new runs) and on the
//! newest run folder (its state, heartbeat, results and streams), plus a 1 s timer, which is what
//! notices a heartbeat going stale. macOS has no `notify` in this build, so the timer alone drives
//! it. Every wake-up reads the run model again and sends the view only when it changed.

use std::collections::HashMap;
use std::path::{Path, PathBuf};
use std::sync::atomic::{AtomicBool, AtomicU32, Ordering};
use std::sync::mpsc;
use std::sync::{Arc, Mutex, OnceLock};
use std::time::{Duration, SystemTime};

use super::keepawake;
use super::runs::{read_loop_view, script_alive, Env, LoopView, RunStatus};

const TICK: Duration = Duration::from_secs(1);
/// Polling (WSL): how many ticks apart a folder with no live run is looked at again for a new run.
const DISCOVERY_TICKS: u32 = 5;
/// Events of one burst (a stream line, a state swap) are read once.
const SETTLE: Duration = Duration::from_millis(80);

static NEXT: AtomicU32 = AtomicU32::new(1);

fn registry() -> &'static Mutex<HashMap<u32, Arc<AtomicBool>>> {
    static REGISTRY: OnceLock<Mutex<HashMap<u32, Arc<AtomicBool>>>> = OnceLock::new();
    REGISTRY.get_or_init(|| Mutex::new(HashMap::new()))
}

/// Whether a polling watch reads on tick number `tick`: every second while a run it saw is live
/// (its `state.json` and `heartbeat`), every fifth second otherwise (looking for a new run folder).
pub fn poll_due(tick: u32, live: bool) -> bool {
    live || tick.is_multiple_of(DISCOVERY_TICKS)
}

/// Starts watching; `on_view` gets the view now and after each change, and returns false to stop.
/// With `poll` there are no file events (a `\\wsl.localhost` share has none): the timer alone drives
/// it, at the cadence of `poll_due`. The returned id is for `unwatch`.
pub fn watch_loop(
    repo_root: PathBuf,
    feature_dir: PathBuf,
    feature: String,
    poll: bool,
    on_view: impl Fn(LoopView) -> bool + Send + 'static,
) -> u32 {
    let id = NEXT.fetch_add(1, Ordering::Relaxed);
    let stop = Arc::new(AtomicBool::new(false));
    if let Ok(mut all) = registry().lock() {
        all.insert(id, stop.clone());
    }
    std::thread::spawn(move || {
        let (tx, rx) = mpsc::channel::<()>();
        // No watcher at all when polling: nothing may subscribe to file events on a share.
        let mut watches = (!poll).then(|| Watches::new(tx.clone()));
        if let Some(w) = watches.as_mut() {
            w.add(&repo_root.join("logs"), false);
        }
        let mut last: Option<LoopView> = None;
        let mut live = false;
        let mut tick: u32 = 0;
        while !stop.load(Ordering::Relaxed) {
            if poll && !poll_due(tick, live) {
                tick = tick.wrapping_add(1);
                std::thread::sleep(TICK);
                continue;
            }
            let env = Env {
                now: SystemTime::now(),
                pid_alive: &script_alive,
            };
            let view = read_loop_view(&repo_root, &feature_dir, &feature, &env);
            if let Some(w) = watches.as_mut() {
                w.follow(view.run.as_ref().map(|r| Path::new(&r.dir)));
            }
            live = view
                .run
                .as_ref()
                .is_some_and(|r| r.status == RunStatus::Live);
            keepawake::report(id, live);
            if last.as_ref() != Some(&view) {
                if !on_view(view.clone()) {
                    break;
                }
                last = Some(view);
            }
            tick = tick.wrapping_add(1);
            if poll {
                std::thread::sleep(TICK);
            } else if rx.recv_timeout(TICK).is_ok() {
                std::thread::sleep(SETTLE);
                while rx.try_recv().is_ok() {}
            }
        }
        keepawake::report(id, false);
        if let Ok(mut all) = registry().lock() {
            all.remove(&id);
        }
    });
    id
}

/// Stops a watch; the thread ends within a second.
pub fn unwatch(id: u32) {
    if let Some(stop) = registry().lock().ok().and_then(|all| all.get(&id).cloned()) {
        stop.store(true, Ordering::Relaxed);
    }
}

#[cfg(not(target_os = "macos"))]
struct Watches {
    watcher: Option<notify::RecommendedWatcher>,
    run: Option<PathBuf>,
}

#[cfg(not(target_os = "macos"))]
impl Watches {
    fn new(tx: mpsc::Sender<()>) -> Self {
        use notify::{Config, Event, EventKind, RecommendedWatcher, Watcher};
        let watcher = RecommendedWatcher::new(
            move |result: notify::Result<Event>| {
                if let Ok(event) = result {
                    if !matches!(event.kind, EventKind::Access(_)) {
                        let _ = tx.send(());
                    }
                }
            },
            Config::default(),
        )
        .ok();
        Self { watcher, run: None }
    }

    /// Watches a folder that may not exist yet; the timer picks it up later.
    fn add(&mut self, dir: &Path, recursive: bool) {
        use notify::{RecursiveMode, Watcher};
        let mode = if recursive {
            RecursiveMode::Recursive
        } else {
            RecursiveMode::NonRecursive
        };
        if let Some(w) = self.watcher.as_mut() {
            let _ = w.watch(dir, mode);
        }
    }

    /// Moves the recursive watch to the newest run folder.
    fn follow(&mut self, run: Option<&Path>) {
        use notify::Watcher;
        if self.run.as_deref() == run {
            return;
        }
        if let (Some(old), Some(w)) = (self.run.take(), self.watcher.as_mut()) {
            let _ = w.unwatch(&old);
        }
        if let Some(run) = run {
            self.add(run, true);
            self.run = Some(run.to_path_buf());
        }
    }
}

#[cfg(target_os = "macos")]
struct Watches;

#[cfg(target_os = "macos")]
impl Watches {
    fn new(_tx: mpsc::Sender<()>) -> Self {
        Self
    }
    fn add(&mut self, _dir: &Path, _recursive: bool) {}
    fn follow(&mut self, _run: Option<&Path>) {}
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn a_polling_watch_reads_each_second_while_live_and_each_fifth_second_otherwise() {
        assert!((0..20).all(|t| poll_due(t, true)));
        let idle: Vec<u32> = (0..12).filter(|t| poll_due(*t, false)).collect();
        assert_eq!(idle, [0, 5, 10]);
    }
}
