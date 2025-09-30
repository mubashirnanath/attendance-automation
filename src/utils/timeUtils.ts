export const calculateTotalHours = (startTime: string, endTime: string): string => {
  if (!startTime || !endTime) {
    return '';
  }

  try {
    // Parse time strings (HH:MM format)
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);

    // Convert to minutes since midnight
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;

    // Calculate difference in minutes
    let diffMinutes = endTotalMinutes - startTotalMinutes;

    // Handle case where end time is next day
    if (diffMinutes < 0) {
      diffMinutes += 24 * 60; // Add 24 hours
    }

    // Convert back to hours and minutes
    const hours = Math.floor(diffMinutes / 60);
    const minutes = diffMinutes % 60;

    // Format as "H:MM hrs"
    return `${hours}:${minutes.toString().padStart(2, '0')} hrs`;
  } catch (error) {
    console.error('Error calculating total hours:', error);
    return '';
  }
};

export const formatTime = (timeString: string): string => {
  if (!timeString) return '';
  
  try {
    const [hours, minutes] = timeString.split(':');
    return `${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}`;
  } catch (error) {
    return timeString;
  }
};

export const isValidTime = (timeString: string): boolean => {
  if (!timeString) return true; // Allow empty times
  
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(timeString);
};