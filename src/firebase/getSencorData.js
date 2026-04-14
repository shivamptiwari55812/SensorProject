import { ref, onValue } from "firebase/database";
import database from "./connect";

/**
 * Subscribe to real-time sensor data updates
 * @param {function} callback - Function to call with sensor data whenever it changes
 * @returns {function} Unsubscribe function to stop listening for updates
 */
const subscribeToSensorData = (callback) => {
    const sensorRef = ref(database, '/sensors');

    const unsubscribe = onValue(sensorRef, (snapshot) => {
        if (snapshot.exists()) {
            const data = snapshot.val();
            console.log("Real-time sensor data:", data);
            callback(data);
        } else {
            console.log("No sensor data available");
            callback(null);
        }
    }, (error) => {
        console.error("Error listening to sensor data:", error);
        callback(null);
    });

    return unsubscribe;
};

export default subscribeToSensorData;