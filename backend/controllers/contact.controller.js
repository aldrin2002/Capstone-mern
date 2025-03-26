import { Contact } from "../models/contact.model.js";

// Get contact information
export const getContactInfo = async (req, res) => {
    try {
        // Using the static method to get the single contact document or create it if it doesn't exist
        const contact = await Contact.findOneOrCreate();
        res.status(200).json(contact);
    } catch (error) {
        console.error("Error in getContactInfo:", error);
        res.status(500).json({ message: "Server error while fetching contact information" });
    }
};

// Update contact information
export const updateContactInfo = async (req, res) => {
    try {
        const updates = req.body;
        
        // Find the contact document (there should only be one) or create it if it doesn't exist
        const contact = await Contact.findOneOrCreate();
        
        // Apply updates
        Object.keys(updates).forEach(key => {
            // Handle nested socialMedia object separately
            if (key === 'socialMedia' && typeof updates[key] === 'object') {
                Object.keys(updates[key]).forEach(socialKey => {
                    contact.socialMedia[socialKey] = updates[key][socialKey];
                });
            } else {
                contact[key] = updates[key];
            }
        });
        
        // Save the updated contact info
        const updatedContact = await contact.save();
        
        res.status(200).json(updatedContact);
    } catch (error) {
        console.error("Error in updateContactInfo:", error);
        res.status(500).json({ message: "Server error while updating contact information" });
    }
}; 