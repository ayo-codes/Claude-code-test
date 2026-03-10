"use client";

import { Loader2 } from "lucide-react";
import type { ToolInvocation } from "ai";

interface ToolCallBadgeProps {
  toolInvocation: ToolInvocation;
}

/**
 * Converts a tool name + args into a human-readable label.
 *
 * WHY: The raw tool names ("str_replace_editor", "file_manager") are internal
 * API names that mean nothing to end users. This function translates them into
 * plain-English descriptions of what is actually happening, e.g.
 * "Creating /App.jsx" or "Deleting /old-component.jsx".
 *
 * @param toolName  - The internal tool name from the AI SDK
 * @param args      - The arguments passed to that tool (command, path, etc.)
 * @param isDone    - Whether the tool call has completed; changes tense (Creating → Created)
 */
function getToolLabel(
  toolName: string,
  args: Record<string, unknown>,
  isDone: boolean
): string {
  const path = typeof args.path === "string" ? args.path : "";
  const newPath = typeof args.new_path === "string" ? args.new_path : "";
  const command = typeof args.command === "string" ? args.command : "";

  if (toolName === "str_replace_editor") {
    // Each command maps to a past/present tense verb pair
    switch (command) {
      case "create":
        return isDone ? `Created ${path}` : `Creating ${path}`;
      case "str_replace":
        return isDone ? `Edited ${path}` : `Editing ${path}`;
      case "insert":
        return isDone ? `Inserted into ${path}` : `Inserting into ${path}`;
      case "view":
        return isDone ? `Read ${path}` : `Reading ${path}`;
      case "undo_edit":
        return isDone ? `Undid edit in ${path}` : `Undoing edit in ${path}`;
      default:
        // Unknown command — fall back to showing the tool name so nothing is lost
        return toolName;
    }
  }

  if (toolName === "file_manager") {
    switch (command) {
      case "rename":
        // Show both old and new path so the user knows what moved where
        return isDone
          ? `Renamed ${path} → ${newPath}`
          : `Renaming ${path} → ${newPath}`;
      case "delete":
        return isDone ? `Deleted ${path}` : `Deleting ${path}`;
      default:
        return toolName;
    }
  }

  // Fallback for any future tools — show the raw tool name rather than
  // crashing or showing nothing
  return toolName;
}

/**
 * ToolCallBadge
 *
 * Renders a small pill/badge for an AI tool invocation, showing:
 * - A spinning loader while the tool is in progress
 * - A green dot once the tool has completed
 * - A human-friendly description of what the tool did (not the raw API name)
 *
 * USED IN: MessageList.tsx → tool-invocation part
 */
export function ToolCallBadge({ toolInvocation }: ToolCallBadgeProps) {
  // A tool call is "done" when it has both a result state AND an actual result value
  const isDone =
    toolInvocation.state === "result" &&
    toolInvocation.result !== undefined &&
    toolInvocation.result !== null;

  const label = getToolLabel(
    toolInvocation.toolName,
    // args may be typed as `unknown` in some SDK versions — cast safely
    (toolInvocation.args ?? {}) as Record<string, unknown>,
    isDone
  );

  return (
    <div className="inline-flex items-center gap-2 mt-2 px-3 py-1.5 bg-neutral-50 rounded-lg text-xs font-mono border border-neutral-200">
      {isDone ? (
        // Green dot = tool finished successfully
        <div className="w-2 h-2 rounded-full bg-emerald-500" />
      ) : (
        // Spinning loader = tool still running
        <Loader2 className="w-3 h-3 animate-spin text-blue-600" />
      )}
      <span className="text-neutral-700">{label}</span>
    </div>
  );
}
