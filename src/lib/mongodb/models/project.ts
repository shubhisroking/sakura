import mongoose, { Document, Schema } from 'mongoose';

// Define the project interface
export interface IProject extends Document {
  title: string;
  description: string;
  repositoryUrl?: string;
  liveUrl?: string;
  technologies: string[];
  slackUserId: string;
  slackUsername: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: Date;
  updatedAt: Date;
}

// Define the project schema
const ProjectSchema = new Schema<IProject>(
  {
    title: {
      type: String,
      required: [true, 'Please provide a project title'],
      trim: true,
      maxlength: [100, 'Project title cannot be more than 100 characters'],
    },
    description: {
      type: String,
      required: [true, 'Please provide project description'],
      trim: true,
      maxlength: [1000, 'Description cannot be more than 1000 characters'],
    },
    repositoryUrl: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)(www\.)?(github\.com|gitlab\.com|bitbucket\.org)\/[^\s]+$/,
        'Please provide a valid repository URL',
      ],
    },
    liveUrl: {
      type: String,
      trim: true,
      match: [
        /^(https?:\/\/)?(www\.)?[^\s]+\.[^\s]+$/,
        'Please provide a valid URL',
      ],
    },
    technologies: {
      type: [String],
      required: [true, 'Please provide at least one technology'],
      validate: {
        validator: function(v: string[]) {
          return v.length > 0;
        },
        message: 'Please add at least one technology',
      },
    },
    slackUserId: {
      type: String,
      required: [true, 'Slack user ID is required'],
      trim: true,
    },
    slackUsername: {
      type: String,
      required: [true, 'Slack username is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Create or retrieve the model, using "projects" as the collection name instead of "sakura"
// This follows MongoDB conventions where collection names are typically plural
export const Project = mongoose.models.Project || mongoose.model<IProject>('Project', ProjectSchema, 'projects');

// Log that the model has been initialized with the collection
console.log('[MongoDB] Project model initialized with collection name:', Project.collection.name);
console.log('[MongoDB] Project model collection namespace:', Project.collection.namespace);
