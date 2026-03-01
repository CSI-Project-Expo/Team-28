import mongoose, { Schema } from 'mongoose';

export const IssueSchema = new Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  stepsToReproduce: { type: String, required: true },
  severity: { type: String, required: true },
  repoUrl: { type: String, required: true },
  status: { type: String, required: true },
  aiDecision: { type: String },
  aiReason: { type: String },
  sandboxId: { type: String },
  sandboxLogs: { type: [String] },
  branchName: { type: String },
  prUrl: { type: String },
  patchSummary: { type: String },
  commitMessage: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

export const Issue = mongoose.model('Issue', IssueSchema);
