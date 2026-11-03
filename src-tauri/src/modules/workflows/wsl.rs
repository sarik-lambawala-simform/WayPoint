//! Windows runs a workflow's stages inside the space's WSL distro. This is the thin native half:
//! the argument lists (pure, tested anywhere) and the two `wsl.exe` calls built from them.
//! Parsing what the distro check printed is the page's job (`lib/wsl.ts`).

/// The tools a stage needs inside the distro.
pub const REQUIRED_TOOLS: [&str; 4] = ["jq", "git", "curl", "claude"];

/// `wsl.exe` arguments for the distro check: `command -v jq git curl claude`, run by the distro's
/// shell. A tool that is missing is simply absent from the output.
pub fn check_args(distro: &str) -> Vec<String> {
    ["-d", distro, "--", "command", "-v"]
        .into_iter()
        .map(String::from)
        .chain(REQUIRED_TOOLS.into_iter().map(String::from))
        .collect()
}

/// `wsl.exe` arguments that run a gate's shell command in `linux_root` inside the distro.
pub fn run_args(distro: &str, linux_root: &str, command: &str) -> Vec<String> {
    ["-d", distro, "--cd", linux_root, "--", "sh", "-c", command]
        .into_iter()
        .map(String::from)
        .collect()
}

/// What `command -v` printed in the distro. A tool that is not installed makes the command exit
/// non-zero, so the exit code is not an error here; only a `wsl.exe` that cannot run is.
#[cfg(windows)]
pub fn check_distro(distro: &str) -> Result<String, String> {
    crate::modules::workspace::validate_wsl_distro_name(distro)?;
    let mut cmd = std::process::Command::new("wsl.exe");
    cmd.args(check_args(distro));
    crate::modules::proc::hide_console(&mut cmd);
    let out = cmd.output().map_err(|e| e.to_string())?;
    let stdout = crate::modules::workspace::decode_command_output(&out.stdout);
    if stdout.trim().is_empty() && !out.status.success() {
        let stderr = crate::modules::workspace::decode_command_output(&out.stderr);
        // Nothing found and a message from wsl.exe itself: the distro did not start.
        if !stderr.trim().is_empty() {
            return Err(stderr.trim().to_string());
        }
    }
    Ok(stdout)
}

#[cfg(not(windows))]
pub fn check_distro(_distro: &str) -> Result<String, String> {
    Err("WSL is only available on Windows".into())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn the_distro_check_is_one_command_v_for_the_four_tools() {
        assert_eq!(
            check_args("Ubuntu").join(" "),
            "-d Ubuntu -- command -v jq git curl claude"
        );
    }

    #[test]
    fn a_gate_runs_in_the_repo_inside_the_distro() {
        assert_eq!(
            run_args("Ubuntu", "/home/me/app", "pnpm test"),
            [
                "-d",
                "Ubuntu",
                "--cd",
                "/home/me/app",
                "--",
                "sh",
                "-c",
                "pnpm test"
            ]
        );
    }
}
