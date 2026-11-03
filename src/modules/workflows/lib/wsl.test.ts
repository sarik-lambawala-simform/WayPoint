import { describe, expect, it } from "vitest";
import {
  installCommand,
  isMntPath,
  linuxPathOfHost,
  missingTools,
  missingWithInstall,
  repoLocationWarning,
  wslHostPath,
} from "./wsl";

describe("wslHostPath", () => {
  it("turns a Linux path into the distro's share", () => {
    expect(wslHostPath("Ubuntu", "/home/me/app")).toBe(
      "\\\\wsl.localhost\\Ubuntu\\home\\me\\app",
    );
    expect(wslHostPath("Ubuntu", "/home/me/app/")).toBe(
      "\\\\wsl.localhost\\Ubuntu\\home\\me\\app",
    );
    expect(wslHostPath("Ubuntu", "/")).toBe("\\\\wsl.localhost\\Ubuntu\\");
  });
  it("keeps a name with spaces and dots as it is", () => {
    expect(wslHostPath("Ubuntu-22.04", "/home/me/My App.git")).toBe(
      "\\\\wsl.localhost\\Ubuntu-22.04\\home\\me\\My App.git",
    );
  });
  it("reads /mnt/<drive> through the drive, not the share", () => {
    expect(wslHostPath("Ubuntu", "/mnt/c/Users/me/app")).toBe(
      "C:\\Users\\me\\app",
    );
    expect(wslHostPath("Ubuntu", "/mnt/d")).toBe("D:\\");
  });
  it("does not take /mnt/cache for a drive", () => {
    expect(wslHostPath("Ubuntu", "/mnt/cache/x")).toBe(
      "\\\\wsl.localhost\\Ubuntu\\mnt\\cache\\x",
    );
  });
});

describe("linuxPathOfHost", () => {
  it("is the inverse of wslHostPath", () => {
    for (const p of ["/home/me/app", "/mnt/c/Users/me", "/mnt/d", "/"]) {
      expect(linuxPathOfHost("Ubuntu", wslHostPath("Ubuntu", p))).toBe(p);
    }
  });
  it("accepts the older wsl$ share and refuses another distro's", () => {
    expect(linuxPathOfHost("Ubuntu", "\\\\wsl$\\Ubuntu\\home\\me")).toBe(
      "/home/me",
    );
    expect(linuxPathOfHost("Ubuntu", "\\\\wsl.localhost\\Debian\\home")).toBe(
      null,
    );
    expect(linuxPathOfHost("Ubuntu", "\\\\wsl.localhost\\UbuntuX\\home")).toBe(
      null,
    );
  });
});

describe("isMntPath and the repo warning", () => {
  it("warns for a drive under /mnt and for nothing else", () => {
    expect(isMntPath("/mnt/c/dev/app")).toBe(true);
    expect(isMntPath("/mnt/c")).toBe(true);
    expect(isMntPath("/mnt/wsl/x")).toBe(false);
    expect(isMntPath("/home/me/mnt/c")).toBe(false);
    expect(repoLocationWarning("/mnt/c/dev/app")).toMatch(/\/mnt/);
    expect(repoLocationWarning("/home/me/app")).toBeNull();
  });
  it("is one line", () => {
    expect(repoLocationWarning("/mnt/c/x")).not.toMatch(/\n/);
  });
});

describe("missingTools", () => {
  it("lists nothing when every tool printed a path", () => {
    const out =
      "/usr/bin/jq\n/usr/bin/git\n/usr/bin/curl\n/home/me/.local/bin/claude\n";
    expect(missingTools(out)).toEqual([]);
  });
  it("lists what is absent, in the asked order", () => {
    expect(missingTools("/usr/bin/git\n/usr/bin/curl\n")).toEqual([
      "jq",
      "claude",
    ]);
    expect(missingTools("")).toEqual(["jq", "git", "curl", "claude"]);
  });
  it("reads Windows line ends and an alias or builtin line", () => {
    expect(missingTools("/usr/bin/jq\r\n/usr/bin/git\r\ncurl\r\n")).toEqual([
      "claude",
    ]);
  });
  it("does not take a path that merely ends in a tool's name for the tool", () => {
    expect(missingTools("/usr/bin/jq-wrapper\n")).toContain("jq");
  });
});

describe("install commands", () => {
  it("gives the exact line for each missing tool", () => {
    expect(installCommand("jq")).toBe("sudo apt-get install -y jq");
    expect(installCommand("claude")).toBe(
      "curl -fsSL https://claude.ai/install.sh | bash",
    );
    expect(missingWithInstall("/usr/bin/git\n")).toEqual([
      { tool: "jq", install: "sudo apt-get install -y jq" },
      { tool: "curl", install: "sudo apt-get install -y curl" },
      {
        tool: "claude",
        install: "curl -fsSL https://claude.ai/install.sh | bash",
      },
    ]);
  });
});
