import mongoose from 'mongoose';

const bloomCountsSchema = new mongoose.Schema(
	{
		remembering: { type: Number, default: 0, min: 0 },
		understanding: { type: Number, default: 0, min: 0 },
		applying: { type: Number, default: 0, min: 0 },
		analyzing: { type: Number, default: 0, min: 0 },
		evaluating: { type: Number, default: 0, min: 0 },
		creating: { type: Number, default: 0, min: 0 }
	},
	{ _id: false }
);

const tosRowSchema = new mongoose.Schema(
	{
		id: { type: Number, required: true, min: 1 },
		competency: { type: String, required: true, trim: true },
		days: { type: Number, default: 0, min: 0 },
		percentage: { type: Number, default: 0, min: 0 },
		counts: { type: bloomCountsSchema, default: () => ({}) }
	},
	{ _id: false }
);

const bloomWeightsSchema = new mongoose.Schema(
	{
		remembering: { type: Number, default: 0, min: 0 },
		understanding: { type: Number, default: 0, min: 0 },
		applying: { type: Number, default: 0, min: 0 },
		analyzing: { type: Number, default: 0, min: 0 },
		evaluating: { type: Number, default: 0, min: 0 },
		creating: { type: Number, default: 0, min: 0 }
	},
	{ _id: false }
);

const tosBlueprintHistorySchema = new mongoose.Schema(
	{
		teacherEmail: {
			type: String,
			required: true,
			trim: true,
			lowercase: true,
			index: true
		},
		schoolYear: {
			type: String,
			required: true,
			trim: true,
			index: true
		},
		quarter: {
			type: String,
			required: true,
			trim: true,
			index: true
		},
		classValue: {
			type: String,
			required: true,
			trim: true,
			index: true
		},
		subject: {
			type: String,
			required: true,
			trim: true,
			index: true
		},
		version: { type: Number, required: true, min: 1 },
		savedAt: { type: Date, required: true },
		totalDays: { type: Number, default: 0, min: 0 },
		totalItems: { type: Number, default: 0, min: 0 },
		objectiveCount: { type: Number, default: 0, min: 0 },
		bloomWeights: { type: bloomWeightsSchema, default: () => ({}) },
		rows: { type: [tosRowSchema], default: [] }
	},
	{
		timestamps: true,
		collection: 'teacher_tos_blueprint_history'
	}
);

tosBlueprintHistorySchema.index(
	{ teacherEmail: 1, schoolYear: 1, classValue: 1, subject: 1, quarter: 1, version: -1 },
	{ unique: true }
);
tosBlueprintHistorySchema.index({ teacherEmail: 1, schoolYear: 1, classValue: 1, subject: 1, quarter: 1, savedAt: -1 });

const TosBlueprintHistory = mongoose.models.TosBlueprintHistory || mongoose.model('TosBlueprintHistory', tosBlueprintHistorySchema);

export default TosBlueprintHistory;
