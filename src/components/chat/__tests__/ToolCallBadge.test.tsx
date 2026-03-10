import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { ToolCallBadge } from "../ToolCallBadge";
import type { ToolInvocation } from "ai";

// Helper to build a ToolInvocation object so tests stay concise.
// We set state="call" for in-progress and state="result" with a result for done.
function makeToolCall(
  toolName: string,
  args: Record<string, unknown>,
  done = false
): ToolInvocation {
  if (done) {
    return {
      toolCallId: "test-id",
      toolName,
      args,
      state: "result",
      result: "Success",
    };
  }
  return {
    toolCallId: "test-id",
    toolName,
    args,
    state: "call",
  };
}

afterEach(() => {
  // Clean up the DOM between tests so renders don't bleed into each other
  cleanup();
});

// ─── str_replace_editor ──────────────────────────────────────────────────────

describe("ToolCallBadge — str_replace_editor", () => {
  it("shows 'Creating /App.jsx' while a file is being created", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("str_replace_editor", {
          command: "create",
          path: "/App.jsx",
        })}
      />
    );
    expect(screen.getByText("Creating /App.jsx")).toBeDefined();
  });

  it("shows 'Created /App.jsx' once file creation is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "str_replace_editor",
          { command: "create", path: "/App.jsx" },
          true // done
        )}
      />
    );
    expect(screen.getByText("Created /App.jsx")).toBeDefined();
  });

  it("shows 'Editing' while str_replace is in progress", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("str_replace_editor", {
          command: "str_replace",
          path: "/components/Button.jsx",
        })}
      />
    );
    expect(screen.getByText("Editing /components/Button.jsx")).toBeDefined();
  });

  it("shows 'Edited' once str_replace is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "str_replace_editor",
          { command: "str_replace", path: "/components/Button.jsx" },
          true
        )}
      />
    );
    expect(screen.getByText("Edited /components/Button.jsx")).toBeDefined();
  });

  it("shows 'Inserting into' while insert is in progress", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("str_replace_editor", {
          command: "insert",
          path: "/App.jsx",
        })}
      />
    );
    expect(screen.getByText("Inserting into /App.jsx")).toBeDefined();
  });

  it("shows 'Inserted into' once insert is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "str_replace_editor",
          { command: "insert", path: "/App.jsx" },
          true
        )}
      />
    );
    expect(screen.getByText("Inserted into /App.jsx")).toBeDefined();
  });

  it("shows 'Reading' while view is in progress", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("str_replace_editor", {
          command: "view",
          path: "/App.jsx",
        })}
      />
    );
    expect(screen.getByText("Reading /App.jsx")).toBeDefined();
  });

  it("shows 'Read' once view is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "str_replace_editor",
          { command: "view", path: "/App.jsx" },
          true
        )}
      />
    );
    expect(screen.getByText("Read /App.jsx")).toBeDefined();
  });

  it("shows 'Undoing edit in' while undo_edit is in progress", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("str_replace_editor", {
          command: "undo_edit",
          path: "/App.jsx",
        })}
      />
    );
    expect(screen.getByText("Undoing edit in /App.jsx")).toBeDefined();
  });

  it("shows 'Undid edit in' once undo_edit is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "str_replace_editor",
          { command: "undo_edit", path: "/App.jsx" },
          true
        )}
      />
    );
    expect(screen.getByText("Undid edit in /App.jsx")).toBeDefined();
  });
});

// ─── file_manager ─────────────────────────────────────────────────────────────

describe("ToolCallBadge — file_manager", () => {
  it("shows 'Renaming' with both paths while rename is in progress", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("file_manager", {
          command: "rename",
          path: "/old.jsx",
          new_path: "/new.jsx",
        })}
      />
    );
    expect(screen.getByText("Renaming /old.jsx → /new.jsx")).toBeDefined();
  });

  it("shows 'Renamed' with both paths once rename is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "file_manager",
          { command: "rename", path: "/old.jsx", new_path: "/new.jsx" },
          true
        )}
      />
    );
    expect(screen.getByText("Renamed /old.jsx → /new.jsx")).toBeDefined();
  });

  it("shows 'Deleting' while delete is in progress", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("file_manager", {
          command: "delete",
          path: "/unused.jsx",
        })}
      />
    );
    expect(screen.getByText("Deleting /unused.jsx")).toBeDefined();
  });

  it("shows 'Deleted' once delete is done", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall(
          "file_manager",
          { command: "delete", path: "/unused.jsx" },
          true
        )}
      />
    );
    expect(screen.getByText("Deleted /unused.jsx")).toBeDefined();
  });
});

// ─── Fallback ─────────────────────────────────────────────────────────────────

describe("ToolCallBadge — fallback", () => {
  it("falls back to the raw tool name for unknown tools", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("some_future_tool", { command: "run" })}
      />
    );
    // Should not crash — just shows the tool name
    expect(screen.getByText("some_future_tool")).toBeDefined();
  });

  it("falls back to the raw tool name for unknown commands", () => {
    render(
      <ToolCallBadge
        toolInvocation={makeToolCall("str_replace_editor", {
          command: "unknown_command",
          path: "/App.jsx",
        })}
      />
    );
    expect(screen.getByText("str_replace_editor")).toBeDefined();
  });
});
