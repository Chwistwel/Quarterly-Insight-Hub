import mongoose from 'mongoose';

const administratorSchema = new mongoose.Schema(
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
        collection: 'administrators'
    }
);

const Administrator = mongoose.models.Administrator || mongoose.model('Administrator', administratorSchema);

export default Administrator;
