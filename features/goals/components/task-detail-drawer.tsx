"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Star,
  Lock,
  Sparkles,
  MoreHorizontal,
  CheckCircle2,
  Clock,
  AlertCircle,
  CircleDot,
  Copy,
  Check,
  Send,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Heading2,
  Heading3,
  Maximize2,
  Minimize2,
  Trash2,
  Calendar as CalendarIcon,
  Layers,
  ChevronDown,
  Loader2,
  Wand2,
  ClipboardPaste,
  Eye,
  PenLine,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  GoalWithUsers,
  TaskComment,
  useAddTaskComment,
  useDeleteGoal,
  useSolveTaskWithAI,
  useUpdateGoal,
  useGenerateTaskDescription,
  TaskAISolution,
} from "../actions/use-goals";
import { useSession } from "@/features/auth/actions/use-auth";
import { useEmployees } from "@/features/manager/actions/use-manager";
import { MarkdownView } from "@/components/ui/markdown-view";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { format } from "date-fns";

interface TaskDetailDrawerProps {
  task: GoalWithUsers | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const TEAMS = [
  "Wipro Build People",
  "Engineering",
  "Treasury Products",
  "Accounting Portal",
  "Platform Core",
  "FBR bugs - Tiger Team",
];

const SIZES = ["XS", "S", "M", "L", "XL"];
const SPRINTS = ["Sprint 42", "Sprint 43", "Sprint 44", "Backlog"];

export function TaskDetailDrawer({ task, open, onOpenChange }: TaskDetailDrawerProps) {
  const { data: currentUser } = useSession();
  const { data: employeesData } = useEmployees("");
  const updateGoalMutation = useUpdateGoal();
  const deleteGoalMutation = useDeleteGoal();
  const addCommentMutation = useAddTaskComment();
  const solveAiMutation = useSolveTaskWithAI();
  const generateDescMutation = useGenerateTaskDescription();

  const isManager = currentUser?.role === "MANAGER" || currentUser?.role === "ADMIN";
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Local Form State
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [descViewMode, setDescViewMode] = useState<"write" | "preview">("preview");
  const [status, setStatus] = useState<"TODO" | "IN_PROGRESS" | "BLOCKED" | "COMPLETED">("TODO");
  const [priority, setPriority] = useState<"LOW" | "MEDIUM" | "HIGH" | "CRITICAL">("MEDIUM");
  const [assignedUserId, setAssignedUserId] = useState<string>("");
  const [owningTeam, setOwningTeam] = useState("Wipro Build People");
  const [size, setSize] = useState("M");
  const [sprint, setSprint] = useState("Sprint 42");
  const [project, setProject] = useState("Wipro Build People");
  const [progress, setProgress] = useState(0);
  const [startDate, setStartDate] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [starred, setStarred] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [copiedId, setCopiedId] = useState(false);
  const [aiSolution, setAiSolution] = useState<TaskAISolution | null>(null);
  const [showAiSolution, setShowAiSolution] = useState(false);

  // AI Description Generator Drawer / Box State
  const [showAiGenerator, setShowAiGenerator] = useState(false);
  const [roughPrompt, setRoughPrompt] = useState("");
  const [generatedPreview, setGeneratedPreview] = useState("");

  // Sync state with selected task
  useEffect(() => {
    if (task) {
      setTitle(task.title || "");
      setDescription(task.description || "");
      setStatus((task.status as any) || "TODO");
      setPriority((task.priority as any) || "MEDIUM");
      setAssignedUserId(task.userId || "");
      setOwningTeam(task.owningTeam || "Wipro Build People");
      setSize(task.size || "M");
      setSprint(task.sprint || "Sprint 42");
      setProject(task.project || "Wipro Build People");
      setProgress(task.progress || 0);
      setStartDate(task.startDate ? new Date(task.startDate).toISOString().slice(0, 10) : "");
      setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : "");
      setStarred(task.starred || false);
      setAiSolution(null);
      setShowAiSolution(false);
      setShowAiGenerator(false);
      setGeneratedPreview("");
      setRoughPrompt("");
      setDescViewMode(task.description ? "preview" : "write");
    }
  }, [task]);

  if (!task) return null;

  const taskNumber = task.taskNumber || `T${task.id.slice(0, 8).toUpperCase()}`;

  const copyTaskNumber = () => {
    navigator.clipboard.writeText(taskNumber);
    setCopiedId(true);
    toast.success(`Copied ${taskNumber} to clipboard`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleSave = () => {
    updateGoalMutation.mutate({
      id: task.id,
      title,
      description,
      status,
      priority,
      userId: isManager ? assignedUserId : undefined,
      owningTeam,
      size,
      sprint,
      project,
      progress: status === "COMPLETED" ? 100 : progress,
      startDate: startDate ? new Date(startDate) : undefined,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      starred,
    });
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    addCommentMutation.mutate(
      { taskId: task.id, text: newComment.trim() },
      {
        onSuccess: () => {
          setNewComment("");
        },
      }
    );
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this task?")) {
      deleteGoalMutation.mutate(task.id, {
        onSuccess: () => {
          onOpenChange(false);
        },
      });
    }
  };

  const handleSolveWithAI = () => {
    setShowAiSolution(true);
    solveAiMutation.mutate(
      {
        ...task,
        title,
        description,
      },
      {
        onSuccess: (data) => {
          setAiSolution(data);
          toast.success("AI analysis complete!");
        },
      }
    );
  };

  // Generate Professional Description with AI
  const handleGenerateDescription = () => {
    generateDescMutation.mutate(
      {
        title: title || task.title,
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

  // Paste generated description into main description field
  const handlePasteDescription = () => {
    if (!generatedPreview) return;
    setDescription(generatedPreview);
    setShowAiGenerator(false);
    setDescViewMode("preview");
    toast.success("Description formatted & pasted!");
  };

  const handleAppendDescription = () => {
    if (!generatedPreview) return;
    setDescription((prev) => (prev ? `${prev}\n\n${generatedPreview}` : generatedPreview));
    setShowAiGenerator(false);
    setDescViewMode("preview");
    toast.success("Description formatted & appended!");
  };

  // Insert formatting into textarea
  const insertFormatting = (prefix: string, suffix: string = "") => {
    setDescViewMode("write");
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = description;
    const selected = text.substring(start, end);
    const replacement = `${prefix}${selected || "text"}${suffix}`;
    const newText = text.substring(0, start) + replacement + text.substring(end);
    setDescription(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  const commentsList: TaskComment[] = Array.isArray(task.comments)
    ? (task.comments as unknown as TaskComment[])
    : [];

  const statusColors = {
    TODO: "bg-slate-100 text-slate-800 border-slate-300 dark:bg-slate-800 dark:text-slate-200",
    IN_PROGRESS: "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300",
    BLOCKED: "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950 dark:text-amber-300",
    COMPLETED: "bg-blue-100 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300",
  };

  const statusLabels = {
    TODO: "Planned / To Do",
    IN_PROGRESS: "In Progress",
    BLOCKED: "Blocked",
    COMPLETED: "Closed / Done",
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={cn(
          "flex max-h-[92vh] flex-col p-0 overflow-hidden sm:max-w-4xl transition-all duration-200 border-border bg-background shadow-2xl",
          isFullscreen && "sm:max-w-[98vw] h-[96vh] max-h-[96vh]"
        )}
      >
        <DialogHeader className="sr-only">
          <DialogTitle>{title || "Task Details"}</DialogTitle>
        </DialogHeader>

        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b px-5 py-3 bg-muted/30">
          <div className="flex items-center gap-3">
            {/* Status Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="outline"
                    size="sm"
                    className={cn(
                      "h-8 gap-1.5 font-semibold text-xs border rounded-md px-2.5 shadow-none",
                      statusColors[status]
                    )}
                  >
                    {status === "COMPLETED" ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                    ) : status === "IN_PROGRESS" ? (
                      <Clock className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                    ) : status === "BLOCKED" ? (
                      <AlertCircle className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400" />
                    ) : (
                      <CircleDot className="h-3.5 w-3.5 text-slate-500" />
                    )}
                    {statusLabels[status]}
                    <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
                  </Button>
                }
              />
              <DropdownMenuContent align="start" className="w-44">
                <DropdownMenuLabel className="text-xs text-muted-foreground">Change Status</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setStatus("TODO")}>
                  <CircleDot className="mr-2 h-4 w-4 text-slate-500" /> Planned / To Do
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatus("IN_PROGRESS")}>
                  <Clock className="mr-2 h-4 w-4 text-emerald-500" /> In Progress
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatus("BLOCKED")}>
                  <AlertCircle className="mr-2 h-4 w-4 text-amber-500" /> Blocked
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setStatus("COMPLETED")}>
                  <CheckCircle2 className="mr-2 h-4 w-4 text-blue-500" /> Closed / Done
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Task ID Pill */}
            <button
              onClick={copyTaskNumber}
              className="flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-semibold bg-muted hover:bg-muted/80 text-foreground transition-colors"
              title="Click to copy task ID"
            >
              <span>{taskNumber}</span>
              {copiedId ? <Check className="h-3 w-3 text-emerald-600" /> : <Copy className="h-3 w-3 opacity-50" />}
            </button>

            <Lock className="h-3.5 w-3.5 text-muted-foreground opacity-70" />
            <button
              onClick={() => setStarred(!starred)}
              className={cn(
                "p-1 rounded hover:bg-muted transition-colors",
                starred ? "text-amber-500 fill-amber-500" : "text-muted-foreground"
              )}
            >
              <Star className={cn("h-4 w-4", starred && "fill-amber-400")} />
            </button>
          </div>

          {/* Right Action Icons */}
          <div className="flex items-center gap-1.5">
            {/* AI Solver Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleSolveWithAI}
              disabled={solveAiMutation.isPending}
              className="h-8 gap-1.5 border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary font-medium text-xs rounded-md shadow-none"
            >
              {solveAiMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Sparkles className="h-3.5 w-3.5 text-primary" />
              )}
              Solve task with AI
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="ghost" size="icon-sm" className="h-8 w-8">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                }
              />
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={copyTaskNumber}>
                  <Copy className="mr-2 h-4 w-4" /> Copy Task ID
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleSave}>
                  <Check className="mr-2 h-4 w-4" /> Save changes
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8"
              onClick={() => setIsFullscreen(!isFullscreen)}
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>

            <Button
              variant="ghost"
              size="icon-sm"
              className="h-8 w-8"
              onClick={() => onOpenChange(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-5">
          {/* AI Solution Banner (If requested) */}
          {showAiSolution && (
            <div className="rounded-xl border border-primary/30 bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary animate-pulse" />
                  <span className="text-sm font-semibold text-primary">AI Task Resolution & Root Cause</span>
                </div>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="h-6 w-6"
                  onClick={() => setShowAiSolution(false)}
                >
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>

              {solveAiMutation.isPending ? (
                <div className="flex items-center gap-2 py-4 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  Analyzing task requirements and generating fix strategy...
                </div>
              ) : aiSolution ? (
                <div className="space-y-3 text-xs">
                  <p className="font-medium text-foreground">{aiSolution.summary}</p>
                  <div>
                    <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                      Technical Solution / Approach:
                    </span>
                    <p className="mt-0.5 text-foreground leading-relaxed">{aiSolution.rootCause}</p>
                  </div>
                  {aiSolution.solutionSteps && (
                    <div>
                      <span className="font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">
                        Implementation Steps:
                      </span>
                      <ul className="mt-1 list-disc list-inside space-y-0.5 text-foreground">
                        {aiSolution.solutionSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {aiSolution.codeSnippet && (
                    <div className="bg-muted p-2.5 rounded-md font-mono text-[11px] overflow-x-auto border">
                      <pre>{aiSolution.codeSnippet}</pre>
                    </div>
                  )}
                  {aiSolution.suggestedPRTitle && (
                    <div className="flex items-center gap-2 text-[11px] bg-background/80 px-2.5 py-1.5 rounded border">
                      <span className="font-semibold text-muted-foreground">Suggested PR:</span>
                      <code className="font-mono text-primary">{aiSolution.suggestedPRTitle}</code>
                    </div>
                  )}
                </div>
              ) : null}
            </div>
          )}

          {/* Editable Title */}
          <div>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task Title..."
              className="text-lg font-bold border-none px-0 shadow-none focus-visible:ring-0 tracking-tight text-foreground"
            />
          </div>

          {/* Metadata Controls Bar */}
          <div className="flex flex-wrap items-center gap-2 border-y py-2.5 bg-muted/10 text-xs">
            {/* Assignee / Owner */}
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarImage src={task.user?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px] bg-primary text-primary-foreground font-semibold">
                  {(task.user?.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              {isManager && employeesData?.employees ? (
                <Select
                  value={assignedUserId}
                  onValueChange={(v) => {
                    if (v) setAssignedUserId(v);
                  }}
                >
                  <SelectTrigger className="h-7 text-xs border-dashed w-36 px-2">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    {employeesData.employees.map((emp) => (
                      <SelectItem key={emp.id} value={emp.id} className="text-xs">
                        {emp.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <span className="font-medium text-foreground">{task.user?.name || "Unassigned"}</span>
              )}
            </div>

            {/* Owning Team */}
            <div className="flex items-center gap-1.5 ml-2 border-l pl-3">
              <Layers className="h-3.5 w-3.5 text-muted-foreground" />
              <Select
                value={owningTeam}
                onValueChange={(v) => {
                  if (v) setOwningTeam(v);
                }}
              >
                <SelectTrigger className="h-7 text-xs border-none shadow-none font-medium px-1.5">
                  <SelectValue placeholder="Team" />
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

            {/* Priority */}
            <div className="flex items-center gap-1.5 border-l pl-3">
              <Select
                value={priority}
                onValueChange={(v) => {
                  if (v) setPriority(v as any);
                }}
              >
                <SelectTrigger className="h-7 text-xs font-semibold px-2 border-none shadow-none">
                  <span
                    className={cn(
                      "px-2 py-0.5 rounded text-[11px]",
                      priority === "CRITICAL"
                        ? "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300"
                        : priority === "HIGH"
                        ? "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300"
                        : priority === "MEDIUM"
                        ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300"
                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    )}
                  >
                    {priority}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="LOW">Low</SelectItem>
                  <SelectItem value="MEDIUM">Medium</SelectItem>
                  <SelectItem value="HIGH">High</SelectItem>
                  <SelectItem value="CRITICAL">Critical</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Size */}
            <div className="flex items-center gap-1.5 border-l pl-3">
              <span className="text-muted-foreground text-[11px]">Size:</span>
              <Select
                value={size}
                onValueChange={(v) => {
                  if (v) setSize(v);
                }}
              >
                <SelectTrigger className="h-7 text-xs border-none shadow-none font-semibold px-1">
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

            {/* Sprint */}
            <div className="flex items-center gap-1.5 border-l pl-3">
              <span className="text-muted-foreground text-[11px]">Sprint:</span>
              <Select
                value={sprint}
                onValueChange={(v) => {
                  if (v) setSprint(v);
                }}
              >
                <SelectTrigger className="h-7 text-xs border-none shadow-none font-medium px-1">
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

            {/* Dates */}
            <div className="flex items-center gap-2 border-l pl-3 ml-auto">
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <CalendarIcon className="h-3 w-3" />
                <span>Start:</span>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="bg-transparent border rounded px-1.5 py-0.5 text-[11px] text-foreground"
                />
              </div>
              <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                <span>Target:</span>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="bg-transparent border rounded px-1.5 py-0.5 text-[11px] text-foreground"
                />
              </div>
            </div>
          </div>

          {/* Description Section with AI Generator & Markdown Preview */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <label className="text-xs font-bold uppercase tracking-wider text-foreground">
                  Description
                </label>

                {/* View Mode Toggle: [ Write | Preview ] */}
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

              {/* Small "Generate with AI" button */}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowAiGenerator(!showAiGenerator)}
                className="h-7 gap-1.5 text-xs font-semibold border-primary/30 bg-primary/5 hover:bg-primary/10 text-primary shadow-xs"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Generate with AI</span>
              </Button>
            </div>

            {/* AI Description Generator Card */}
            {showAiGenerator && (
              <div className="rounded-xl border border-primary/30 bg-primary/5 p-3.5 space-y-3 transition-all animate-in fade-in-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wand2 className="h-4 w-4 text-primary" />
                    <span className="text-xs font-bold text-primary">
                      AI Professional Task Description Generator
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    className="h-6 w-6"
                    onClick={() => setShowAiGenerator(false)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <p className="text-[11px] text-muted-foreground">
                    Type rough bullet points, keywords, or requirements (or leave blank to build from task title):
                  </p>
                  <Textarea
                    value={roughPrompt}
                    onChange={(e) => setRoughPrompt(e.target.value)}
                    placeholder="e.g. Needs to support CSV exports, add filter dropdown by status, show error toast when offline..."
                    className="text-xs min-h-[60px] bg-background"
                  />
                  <div className="flex items-center justify-between pt-1">
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleGenerateDescription}
                      disabled={generateDescMutation.isPending}
                      className="h-7 text-xs font-semibold gap-1.5 shadow-sm"
                    >
                      {generateDescMutation.isPending ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="h-3.5 w-3.5" />
                      )}
                      Generate Description
                    </Button>

                    {generatedPreview && (
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleAppendDescription}
                          className="h-7 text-xs"
                        >
                          Append to Description
                        </Button>
                        <Button
                          type="button"
                          size="sm"
                          onClick={handlePasteDescription}
                          className="h-7 text-xs gap-1 font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm"
                        >
                          <ClipboardPaste className="h-3.5 w-3.5" />
                          Paste into Description
                        </Button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Generated Preview Box Rendered with Formatted Markdown */}
                {generatedPreview && (
                  <div className="space-y-1.5 pt-2 border-t border-primary/20">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        Formatted AI Output Preview:
                      </span>
                      <span className="text-[10px] text-primary font-medium">Rendered Heading & Bold Format</span>
                    </div>
                    <div className="bg-background rounded-md p-4 border max-h-64 overflow-y-auto">
                      <MarkdownView content={generatedPreview} />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Formatting Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-1 border rounded-t-lg px-2 py-1 bg-muted/30 text-muted-foreground">
              <div className="flex items-center gap-1 flex-wrap">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2 text-xs font-bold text-foreground"
                  onClick={() => insertFormatting("### ")}
                  title="Heading 3"
                >
                  <Heading3 className="h-3.5 w-3.5 mr-1" />
                  Heading
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 text-foreground font-bold"
                  onClick={() => insertFormatting("**", "**")}
                  title="Bold (**text**)"
                >
                  <Bold className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 italic text-foreground"
                  onClick={() => insertFormatting("*", "*")}
                  title="Italic (*text*)"
                >
                  <Italic className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 line-through"
                  onClick={() => insertFormatting("~~", "~~")}
                  title="Strikethrough"
                >
                  <Strikethrough className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7 underline"
                  onClick={() => insertFormatting("<u>", "</u>")}
                  title="Underline"
                >
                  <Underline className="h-3.5 w-3.5" />
                </Button>
                <div className="h-4 w-px bg-border mx-1" />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => insertFormatting("\n- ")}
                  title="Bullet List (- item)"
                >
                  <List className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => insertFormatting("\n1. ")}
                  title="Numbered List (1. item)"
                >
                  <ListOrdered className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => insertFormatting("\n- [ ] ")}
                  title="Checklist (- [ ] task)"
                >
                  <CheckSquare className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => insertFormatting("\n> ")}
                  title="Quote (> quote)"
                >
                  <Quote className="h-3.5 w-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="h-7 w-7"
                  onClick={() => insertFormatting("```\n", "\n```")}
                  title="Code Block"
                >
                  <Code className="h-3.5 w-3.5" />
                </Button>
              </div>

              <div className="text-[11px] text-muted-foreground px-1 hidden sm:block">
                {descViewMode === "preview" ? "Formatted Markdown Active" : "Editing Markdown"}
              </div>
            </div>

            {/* Big Description Box: Switches between Formatted Markdown and Raw Write Mode */}
            {descViewMode === "preview" ? (
              <div
                onClick={() => setDescViewMode("write")}
                className="group relative text-xs min-h-[260px] rounded-b-lg border border-t-0 p-4 bg-background hover:bg-muted/10 transition-colors cursor-text focus-visible:ring-1"
                title="Click to edit markdown"
              >
                <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-[11px] bg-muted/80 text-muted-foreground px-2 py-1 rounded border shadow-xs">
                  <PenLine className="h-3 w-3" /> Click anywhere to edit
                </div>
                <MarkdownView content={description} />
              </div>
            ) : (
              <Textarea
                ref={textareaRef}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Provide a detailed, professional description of the task, objectives, scope, and acceptance criteria..."
                className="text-xs min-h-[260px] rounded-t-none border-t-0 font-sans leading-relaxed focus-visible:ring-1"
              />
            )}
          </div>

          {/* Progress Completion Slider */}
          <div className="space-y-1 pt-1 border-t">
            <div className="flex justify-between text-xs font-medium">
              <span className="text-muted-foreground">Task Progress</span>
              <span className="font-semibold text-primary">{status === "COMPLETED" ? 100 : progress}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={status === "COMPLETED" ? 100 : progress}
              onChange={(e) => setProgress(Number(e.target.value))}
              disabled={status === "COMPLETED"}
              className="w-full accent-primary cursor-pointer h-1.5 bg-muted rounded"
            />
          </div>

          {/* Activity & Comments Feed */}
          <div className="border-t pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Activity & Discussion ({commentsList.length})
            </h3>

            {/* Previous Comments */}
            {commentsList.length > 0 && (
              <div className="space-y-2.5">
                {commentsList.map((c) => (
                  <div key={c.id} className="flex items-start gap-2.5 text-xs bg-muted/30 p-2.5 rounded-lg border">
                    <Avatar className="h-6 w-6 shrink-0 mt-0.5">
                      <AvatarImage src={c.userAvatar ?? undefined} />
                      <AvatarFallback className="text-[10px] bg-secondary">
                        {(c.userName || "U").slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground">{c.userName}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {c.createdAt ? format(new Date(c.createdAt), "MMM d, h:mm a") : ""}
                        </span>
                      </div>
                      <p className="text-foreground leading-relaxed whitespace-pre-wrap">{c.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Leave a comment Input */}
            <form onSubmit={handleAddComment} className="flex items-center gap-2 pt-2">
              <Avatar className="h-7 w-7">
                <AvatarImage src={currentUser?.avatarUrl ?? undefined} />
                <AvatarFallback className="text-[10px]">
                  {(currentUser?.name || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="relative flex-1">
                <Input
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Leave a comment..."
                  className="pr-20 text-xs bg-background"
                />
                <div className="absolute right-1.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <Button
                    type="submit"
                    size="icon-sm"
                    disabled={!newComment.trim() || addCommentMutation.isPending}
                    className="h-6 w-6 rounded bg-primary text-primary-foreground"
                  >
                    {addCommentMutation.isPending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Send className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t px-6 py-3 bg-muted/20 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateGoalMutation.isPending}
              className="font-semibold px-4 shadow-sm"
            >
              {updateGoalMutation.isPending && <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
