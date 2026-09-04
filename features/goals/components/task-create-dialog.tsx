"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateGoal, useGenerateTaskDescription } from "../actions/use-goals";
import { useEmployees } from "@/features/manager/actions/use-manager";
import { MarkdownView } from "@/components/ui/markdown-view";
import {
  Loader2,
  Plus,
  Sparkles,
  Wand2,
  ClipboardPaste,
  X,
  Eye,
  PenLine,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface TaskCreateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultUserId?: string;
  defaultSection?: string;
}

const TEAMS = [
  "Build People",
  "Engineering",
  "Treasury Products",
  "Accounting Portal",
  "Platform Core",
  "FBR bugs - Tiger Team",
];

const SIZES = ["XS", "S", "M", "L", "XL"];
const SPRINTS = ["Sprint 42", "Sprint 43", "Sprint 44", "Backlog"];

export function TaskCreateDialog({
  open,
  onOpenChange,
  defaultUserId,
  defaultSection = "ASSIGNED",
}: TaskCreateDialogProps) {
  const { data: employeesData } = useEmployees("");
  const createGoalMutation = useCreateGoal();
  const generateDescMutation = useGenerateTaskDescription();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descViewMode, setDescViewMode] = useState<"write" | "preview">("write");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED">("TODO");
  const [assignedUserId, setAssignedUserId] = useState(defaultUserId || "");
  const selectedEmployee = employeesData?.employees.find((employee) => employee.id === assignedUserId);
  const [owningTeam, setOwningTeam] = useState("Build People");
  const [size, setSize] = useState("M");
  const [sprint, setSprint] = useState("Sprint 42");
  const [project, setProject] = useState("Build People");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dueDate, setDueDate] = useState(
    new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  );

  // AI Description Generator state
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [roughPrompt, setRoughPrompt] = useState("");
  const [generatedPreview, setGeneratedPreview] = useState("");

  const handleGenerateDescription = () => {
    generateDescMutation.mutate(
      {
        title: title || "New Task",
        prompt: roughPrompt.trim() || description || "Create a full task breakdown",
        project: owningTeam || project,
      },
      {
        onSuccess: (data) => {
          setGeneratedPreview(data.description);
          toast.success("Professional description generated!");
        },
      }
    );
  };

  const handlePasteDescription = () => {
    if (!generatedPreview) return;
    setDescription(generatedPreview);
    setShowAiGenerator(false);
    setDescViewMode("preview");
    toast.success("Description formatted & pasted!");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    createGoalMutation.mutate(
      {
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        status,
        userId: assignedUserId || undefined,
        section: defaultSection,
        owningTeam,
        size,
        sprint,
        project,
        startDate: startDate ? new Date(startDate) : new Date(),
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      {
        onSuccess: () => {
          onOpenChange(false);
          setTitle("");
          setDescription("");
          setRoughPrompt("");
          setGeneratedPreview("");
          setShowAiGenerator(false);
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-5 pb-3 border-b">
          <DialogTitle className="text-lg font-bold flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Create Task
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto px-6 py-4 space-y-4 text-xs">
          {/* Title */}
          <div>
            <label className="font-bold text-foreground block mb-1">
              Task Title <span className="text-destructive">*</span>
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Implement real-time notifications for manager approvals"
              className="text-xs font-medium"
              required
            />
          </div>

          {/* Assignee & Team Grid */}
          <div className="grid grid-cols-2 gap-3">
            {employeesData?.employees && (
              <div>
                <label className="font-bold text-foreground block mb-1">Assign to:</label>
                <Select
                  value={assignedUserId}
                  onValueChange={(v) => {
                    if (v) setAssignedUserId(v);
                  }}
                >
                  <SelectTrigger className="text-xs">
                    <SelectValue placeholder="Select team member...">
                      {selectedEmployee?.name ?? (assignedUserId ? "Selected team member" : undefined)}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {employeesData.employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs">
                        {emp.name} ({emp.designation || "Engineer"})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <label className="font-bold text-foreground block mb-1">Owning Team:</label>
              <Select
                value={owningTeam}
                onValueChange={(v) => {
                  if (v) setOwningTeam(v);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEAMS.map((t) => (
                    <SelectItem key={t} value={t} className="text-xs">
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Priority, Size, Sprint */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Priority:</label>
              <Select
                value={priority}
                onValueChange={(v) => {
                  if (v) setPriority(v as any);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Size:</label>
              <Select
                value={size}
                onValueChange={(v) => {
                  if (v) setSize(v);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SIZES.map((s) => (
                    <SelectItem key={s} value={s} className="text-xs">
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="font-bold text-foreground block mb-1">Sprint:</label>
              <Select
                value={sprint}
                onValueChange={(v) => {
                  if (v) setSprint(v);
                }}
              >
                <SelectTrigger className="text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPRINTS.map((sp) => (
                    <SelectItem key={sp} value={sp} className="text-xs">
                      {sp}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-foreground block mb-1">Start Date:</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-foreground block mb-1">Target Date:</label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="text-xs"
              />
            </div>
          </div>

          {/* Description with AI Generator and [ Write | Formatted View ] */}
          <div className="border-t pt-3 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="font-bold text-foreground block">
                  Description
                </label>

                {/* View Mode Toggle */}
                <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setDescViewMode("write")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all",
                      descViewMode === "write"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <PenLine className="h-3 w-3" />
                    Write
                  </button>
                  <button
                    type="button"
                    onClick={() => setDescViewMode("preview")}
                    className={cn(
                      "flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all",
                      descViewMode === "preview"
                        ? "bg-background text-foreground shadow-xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Eye className="h-3 w-3 text-primary" />
                    Formatted View
                  </button>
                </div>
              </div>

              {/* Small Generate Button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAiGenerator(!showAiGenerator)}
                className="h-6 gap-1 text-[11px] font-semibold border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary px-2 shadow-none"
              >
                <Sparkles className="h-3 w-3" />
                Generate with AI
              </Button>
            </div>

            {/* AI Generator Helper Card */}
            {showAiGenerator && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2.5 animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-primary flex items-center gap-1.5">
                    <Wand2 className="h-3.5 w-3.5" />
                    AI Description Assistant
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon-sm"
                    className="h-5 w-5"
                    onClick={() => setShowAiGenerator(false)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>

                <Textarea
                  value={roughPrompt}
                  onChange={(e) => setRoughPrompt(e.target.value)}
                  placeholder="Type rough notes, requirements or leave blank to generate from title..."
                  className="text-xs min-h-[50px] bg-background"
                />

                <div className="flex items-center justify-between">
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleGenerateDescription}
                    disabled={generateDescMutation.isPending}
                    className="h-6 text-[11px] font-semibold gap-1"
                  >
                    {generateDescMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Sparkles className="h-3 w-3" />
                    )}
                    Generate Description
                  </Button>

                  {generatedPreview && (
                    <Button
                      type="button"
                      size="sm"
                      onClick={handlePasteDescription}
                      className="h-6 text-[11px] gap-1 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                    >
                      <ClipboardPaste className="h-3 w-3" />
                      Paste in Description
                    </Button>
                  )}
                </div>

                {generatedPreview && (
                  <div className="bg-background rounded p-3 text-xs border max-h-48 overflow-y-auto">
                    <MarkdownView content={generatedPreview} />
                  </div>
                )}
              </div>
            )}

            {/* Description Textarea or Markdown View */}
            {descViewMode === "preview" ? (
              <div
                onClick={() => setDescViewMode("write")}
                className="group relative text-xs min-h-[160px] rounded-lg border p-3.5 bg-background hover:bg-muted/10 transition-colors cursor-text"
                title="Click to edit markdown"
              >
                <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[10px] bg-muted/80 text-muted-foreground px-2 py-0.5 rounded border">
                  <PenLine className="h-3 w-3" /> Click to edit
                </div>
                <MarkdownView content={description} />
              </div>
            ) : (
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter comprehensive task description, requirements, and acceptance criteria..."
                className="text-xs min-h-[160px] font-sans leading-relaxed"
              />
            )}
          </div>

          <DialogFooter className="border-t pt-3">
            <Button variant="outline" size="sm" type="button" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={!title.trim() || createGoalMutation.isPending}
              className="font-semibold shadow-sm"
            >
              {createGoalMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Create & Assign Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
