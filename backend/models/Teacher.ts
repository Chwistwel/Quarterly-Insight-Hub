import mongoose from 'mongoose';

const teacherSchema = new mongoose.Schema(
    {
        firstName: {
            type: String,
            required: true,
            trim: true
        },
        lastName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true,
            unique: true
        },
        passwordHash: {
            type: String,
            required: true
        }
    },
    {
        timestamps: true,
        collection: 'teachers'
    }
);

const Teacher = mongoose.models.Teacher || mongoose.model('Teacher', teacherSchema);

export default Teacher;
