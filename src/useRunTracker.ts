To prevent your running app from registering movement when you are stationary, you need to filter the raw GPS data. GPS signals often have small, natural variations (known as "GPS drift" or "spidering"), even when a device is not moving. The key is to implement logic that ignores small, insignificant changes in location. 

Here is the filtering logic you can implement in your app, using pseudocode as an example. 

1. Set a minimum movement threshold

The most direct way to filter out stationary movement is to set a minimum distance threshold. Your app should only register new movement if the user has traveled a certain distance since the last recorded location point.

Logic:

Store the last recorded valid location, $last\_location.

When a new GPS location update, $current\_location, is received, calculate the distance between $last\_location and $current\_location.

If this distance is greater than your predefined threshold (e.g., 5–10 meters), then it is considered a valid movement. Update your total distance and set $last\_location to $current\_location.

If the distance is below the threshold, ignore the update and do not change $last\_location.

Pseudocode:

// Initialize variables
$last_location = null;
$total_distance = 0;
$distance_threshold = 7; // Example: 7 meters

// Location update function
function onLocationUpdate($current_location) {
    // Check if a previous location exists
    if ($last_location != null) {
        // Calculate distance between current and last location
        $distance = calculateDistance($last_location, $current_location);

        // Filter out GPS drift
        if ($distance > $distance_threshold) {
            $total_distance += $distance;
            $last_location = $current_location;
            // Add new location to the map path
            recordLocation($current_location);
        }
    } else {
        // First location point, just record it
        $last_location = $current_location;
        recordLocation($current_location);
    }
}


Tip: Adjusting the threshold value allows you to fine-tune the app's sensitivity. For more accurate pace calculations, a stricter threshold (e.g., 5 meters) may be appropriate. 

2. Implement a timer to detect "stillness"

For more robust filtering, you can combine the distance threshold with a timer. If no significant movement has occurred for a set period, your app can pause tracking until a new, valid movement is detected. This also helps save battery life. 

Logic:

Start a timer or record a timestamp when the last valid movement was logged.

If the timer exceeds a certain duration (e.g., 60 seconds) without a new, valid location update, transition the app to a "stationary" mode.

In stationary mode, increase the distance threshold to filter out any lingering drift. Resume normal tracking only when a large-enough, legitimate movement is detected.

3. Consider using platform-specific APIs

For apps targeting a specific platform, using built-in, pre-optimized APIs is a good practice. They are often more efficient and reliable than custom-built solutions. 