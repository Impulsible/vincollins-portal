// components/staff/UploadNoteDialog.tsx
"use client";

import { useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Loader2,
  Upload,
  X,
  FileText,
  Users,
  BookOpen,
  Bell,
  Send,
} from "lucide-react";

interface UploadNoteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  teacherProfile: any;
}

const subjects = [
  "Mathematics",
  "English Language",
  "Physics",
  "Chemistry",
  "Biology",
  "Economics",
  "Government",
  "Literature in English",
  "Geography",
  "Commerce",
  "Financial Accounting",
  "Agricultural Science",
  "Christian Religious Studies",
  "Civic Education",
  "",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Business Studies",
];

const classes = ["JSS 1", "JSS 2", "JSS 3", "SS 1", "SS 2", "SS 3"];

export function UploadNoteDialog({
  open,
  onOpenChange,
  onSuccess,
  teacherProfile,
}: UploadNoteDialogProps) {
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [notifyStudents, setNotifyStudents] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    title: "",
    subject: "",
    description: "",
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error("File size should be less than 50MB");
        return;
      }
      setSelectedFile(file);
    }
  };

  const toggleClass = (className: string) => {
    setSelectedClasses((prev) =>
      prev.includes(className)
        ? prev.filter((c) => c !== className)
        : [...prev, className],
    );
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.subject || selectedClasses.length === 0) {
      toast.error(
        "Please fill in all required fields and select at least one class",
      );
      return;
    }

    setLoading(true);

    try {
      let fileUrl = null;
      let fileName = null;

      // Upload file
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop();
        fileName = `${Date.now()}-${selectedFile.name}`;
        const filePath = `notes/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from("student-photos")
          .upload(filePath, selectedFile);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("student-photos").getPublicUrl(filePath);

        fileUrl = publicUrl;
      }

      // Create notes for each selected class
      for (const className of selectedClasses) {
        const { data: note, error: noteError } = await supabase
          .from("notes")
          .insert({
            title: formData.title,
            subject: formData.subject,
            class: className,
            description: formData.description,
            file_url: fileUrl,
            file_name: selectedFile?.name || null,
            created_by: teacherProfile?.id,
            teacher_name: teacherProfile?.full_name || "Teacher",
            status: "published",
            created_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (noteError) throw noteError;

        // Send notifications
        if (notifyStudents && note) {
          const { data: students } = await supabase
            .from("profiles")
            .select("id, full_name")
            .eq("class", className)
            .eq("role", "student");

          if (students && students.length > 0) {
            const notifications = students.map((student: any) => ({
              user_id: student.id,
              title: "📖 New Study Material",
              message: `${formData.title} - ${formData.subject}`,
              type: "new_note",
              link: "/student/courses",
              metadata: {
                note_id: note.id,
                class: className,
                subject: formData.subject,
              },
              read: false,
              created_at: new Date().toISOString(),
            }));

            await supabase.from("notifications").insert(notifications);
          }
        }
      }

      toast.success(
        `Study note published to ${selectedClasses.length} class(es)!`,
      );
      if (notifyStudents) {
        toast.info("Students have been notified");
      }

      onSuccess();
      handleClose();
    } catch (error) {
      console.error("Error creating note:", error);
      toast.error("Failed to publish study note");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ title: "", subject: "", description: "" });
    setSelectedFile(null);
    setSelectedClasses([]);
    setNotifyStudents(true);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            Upload Study Material
          </DialogTitle>
          <DialogDescription>
            Upload study notes, materials, or resources for your students.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div>
            <Label htmlFor="title">Title *</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Week 1 Lecture Notes"
            />
          </div>

          {/* Subject */}
          <div>
            <Label htmlFor="subject">Subject *</Label>
            <Select
              value={formData.subject}
              onValueChange={(v) => setFormData({ ...formData, subject: v })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select subject" />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject} value={subject}>
                    {subject}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Target Classes */}
          <div>
            <Label>Share with Classes *</Label>
            <div className="flex flex-wrap gap-2 mt-2 p-3 bg-slate-50 rounded-lg">
              {classes.map((className) => (
                <Badge
                  key={className}
                  variant={
                    selectedClasses.includes(className) ? "default" : "outline"
                  }
                  className={cn(
                    "cursor-pointer hover:bg-primary/10 transition-all px-3 py-1.5 text-sm",
                    selectedClasses.includes(className) &&
                      "bg-primary text-white",
                  )}
                  onClick={() => toggleClass(className)}
                >
                  <Users className="h-3 w-3 mr-1" />
                  {className}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedClasses.length} class(es) selected
            </p>
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Describe the study material..."
              rows={3}
            />
          </div>

          {/* File Attachment */}
          <div>
            <Label>File Attachment (Optional)</Label>
            <input
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              className="hidden"
              accept=".pdf,.doc,.docx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.mp4,.mp3"
            />
            <div
              className="border-2 border-dashed border-slate-200 rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {selectedFile ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-blue-500" />
                    <span className="text-sm truncate">
                      {selectedFile.name}
                    </span>
                    <span className="text-xs text-slate-500">
                      ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                    </span>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-600">
                    Click to upload a file
                  </p>
                  <p className="text-xs text-slate-400 mt-1">
                    PDF, DOC, PPT, Images, Videos (Max 50MB)
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Notify Students */}
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Bell className="h-5 w-5 text-green-600" />
            <div className="flex-1">
              <p className="font-medium text-green-800">Notify Students</p>
              <p className="text-xs text-green-600">
                Send notification to all students in selected classes
              </p>
            </div>
            <Badge
              variant={notifyStudents ? "default" : "outline"}
              className={cn("cursor-pointer", notifyStudents && "bg-green-600")}
              onClick={() => setNotifyStudents(!notifyStudents)}
            >
              {notifyStudents ? "ON" : "OFF"}
            </Badge>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-green-600"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Publish Note
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
