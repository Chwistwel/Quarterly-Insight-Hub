import mongoose from 'mongoose';

const classSectionSchema = new mongoose.Schema(
    {
        className: {
            type: String,
            required: true,
            trim: true
        },
        gradeLevel: {
            type: String,
            required: true,
            trim: true
        },
        section: {
            type: String,
            required: true,
            trim: true
        },
        subject: {
            type: String,
            required: true,
            trim: true
        },
        teacherName: {
            type: String,
            required: true,
            trim: true
        },
        studentCount: {
            type: Number,
            required: true,
            min: 0
        }
    },
    {
        timestamps: true,
        collection: 'class_sections'
    }
);

const ClassSection = mongoose.models.ClassSection || mongoose.model('ClassSection', classSectionSchema);

export default ClassSection;
