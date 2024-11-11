var mongoose=require('mongoose');
var Schema1=require('../models/activity')
var Activity= mongoose.model("activities",Schema1);

async function logUserActivity(userId, productId, activityType) {
    try {
        const activity = new Activity({ userId, productId, activityType });
        await activity.save();
    } catch (error) {
        console.error("Error in logUserActivity:", error);
    }
}



module.exports = logUserActivity;