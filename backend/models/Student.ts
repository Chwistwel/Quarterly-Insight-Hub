import mongoose from 'mongoose';

const studentSchema = new mongoose.Schema(
    {
        classId: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        teacherEmail: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            index: true
        },
        studentNo: {
            type: String,
            default: '',
            trim: true,
            index: true
        },
        name: {
            type: String,
            required: true,
            trim: true
        },
        firstName: {
            type: String,
            default: '',
            trim: true
        },
        middleInitial: {
            type: String,
            default: '',
            trim: true
        },
        lastName: {
            type: String,
            default: '',
            trim: true,
            index: true
        },
        gender: {
            type: String,
            default: '',
            trim: true
        },
        grade: {
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
        q1Score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        q2Score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        q3Score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        q4Score: {
            type: Number,
            default: 0,
            min: 0,
            max: 100
        },
        ranking: {
            type: Number,
            default: 0,
            min: 0
        }
    },
    {
        timestamps: true,
        collection: 'students'
    }
);

const Student = mongoose.models.Student || mongoose.model('Student', studentSchema);

export default Student;
