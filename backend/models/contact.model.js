import mongoose from "mongoose";

const socialMediaSchema = new mongoose.Schema(
    {
        facebook: {
            type: String,
            default: ""
        },
        instagram: {
            type: String,
            default: ""
        },
        twitter: {
            type: String,
            default: ""
        }
    },
    { _id: false }
);

const contactSchema = new mongoose.Schema(
    {
        phone: {
            type: String,
            required: true
        },
        email: {
            type: String,
            required: true
        },
        address: {
            type: String,
            required: true
        },
        hours: {
            type: String,
            required: true
        },
        website: {
            type: String,
            default: ""
        },
        socialMedia: {
            type: socialMediaSchema,
            default: {}
        }
    },
    { timestamps: true }
);

// We'll only have one contact document in the database
contactSchema.statics.findOneOrCreate = async function() {
    const contact = await this.findOne();
    if (contact) {
        return contact;
    }
    
    return this.create({
        phone: "+1 (555) 123-4567",
        email: "info@cafex.com",
        address: "123 Coffee Street, Cafe District, NY 10001",
        hours: "Monday - Friday: 7AM - 8PM, Weekends: 8AM - 10PM",
        website: "www.cafex.com",
        socialMedia: {
            facebook: "facebook.com/cafex",
            instagram: "instagram.com/cafex",
            twitter: "twitter.com/cafex"
        }
    });
};

export const Contact = mongoose.model("Contact", contactSchema); 