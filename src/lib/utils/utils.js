// src/lib/utils.js

/**
 * Utility Helper Functions
 * 
 * This file contains reusable utility functions used throughout the application.
 * These functions help with:
 * 1. CSS class management (Tailwind CSS)
 * 2. Data formatting
 * 3. Date/time utilities
 * 4. Error handling
 */

import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Combines Tailwind CSS classes intelligently
 * Merges classes and resolves conflicts (e.g., if you have both 'p-2' and 'p-4', it keeps only 'p-4')
 * 
 * @param {...any} inputs - CSS class names or conditional objects
 * @returns {string} Merged class string
 * 
 * Example:
 * cn('px-2 py-1', 'px-4') => 'py-1 px-4'
 * cn('text-red-500', condition && 'text-blue-500') => conditional classes
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}

/**
 * Format a number to a readable string with commas
 * @param {number} num - Number to format
 * @returns {string} Formatted number
 * 
 * Example: 1234567 => "1,234,567"
 */
export function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    return num.toLocaleString('en-US');
}

/**
 * Format bytes to human-readable size (KB, MB, GB)
 * @param {number} bytes - Number of bytes
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted size
 * 
 * Example: 1536 => "1.5 KB"
 */
export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

/**
 * Format milliseconds to human-readable duration
 * @param {number} ms - Milliseconds
 * @returns {string} Formatted duration
 * 
 * Example: 125000 => "2m 5s"
 */
export function formatDuration(ms) {
    if (ms < 1000) return `${ms}ms`;

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} Formatted date
 * 
 * Example: "2024-01-15T10:30:00Z" => "Jan 15, 2024 10:30 AM"
 */
export function formatDate(date) {
    if (!date) return 'N/A';

    const d = new Date(date);
    return d.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

/**
 * Format date to relative time (e.g., "2 hours ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export function formatRelativeTime(date) {
    if (!date) return 'N/A';

    const d = new Date(date);
    const now = new Date();
    const diffMs = now - d;
    const diffSeconds = Math.floor(diffMs / 1000);
    const diffMinutes = Math.floor(diffSeconds / 60);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffSeconds < 60) return 'just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return formatDate(date);
}

/**
 * Generate a random number between min and max
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {number} Random number
 */
export function randomNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

/**
 * Generate random temperature reading (realistic IoT sensor data)
 * @param {string} region - Region name
 * @returns {number} Temperature in Celsius
 */
export function generateTemperature(region) {
    // Different base temperatures for different regions
    const baseTempByRegion = {
        north: 15, // Cooler northern region
        south: 30, // Warmer southern region
        east: 22,  // Moderate eastern region
        west: 25,  // Moderate western region
    };

    const baseTemp = baseTempByRegion[region] || 20;
    const variation = (Math.random() - 0.5) * 10; // ±5°C variation

    return parseFloat((baseTemp + variation).toFixed(2));
}

/**
 * Generate random humidity reading (percentage)
 * @returns {number} Humidity percentage (0-100)
 */
export function generateHumidity() {
    return parseFloat((40 + Math.random() * 40).toFixed(2)); // 40-80%
}

/**
 * Generate random air quality index (0-500)
 * Lower is better: 0-50 (Good), 51-100 (Moderate), 101-150 (Unhealthy for sensitive), etc.
 * @returns {number} Air quality index
 */
export function generateAirQuality() {
    return Math.floor(Math.random() * 200); // 0-200 AQI
}

/**
 * Get air quality category from AQI value
 * @param {number} aqi - Air Quality Index
 * @returns {Object} Category and color
 */
export function getAirQualityCategory(aqi) {
    if (aqi <= 50) return { category: 'Good', color: 'text-green-600' };
    if (aqi <= 100) return { category: 'Moderate', color: 'text-yellow-600' };
    if (aqi <= 150) return { category: 'Unhealthy for Sensitive', color: 'text-orange-600' };
    if (aqi <= 200) return { category: 'Unhealthy', color: 'text-red-600' };
    if (aqi <= 300) return { category: 'Very Unhealthy', color: 'text-purple-600' };
    return { category: 'Hazardous', color: 'text-red-900' };
}

/**
 * Sleep/delay function for async operations
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise} Promise that resolves after delay
 * 
 * Example: await sleep(1000); // Wait 1 second
 */
export function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry a function multiple times if it fails
 * @param {Function} fn - Function to retry
 * @param {number} maxRetries - Maximum number of retries
 * @param {number} delay - Delay between retries (ms)
 * @returns {Promise} Result of the function
 */
export async function retry(fn, maxRetries = 3, delay = 1000) {
    let lastError;

    for (let i = 0; i < maxRetries; i++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;
            console.log(`Retry ${i + 1}/${maxRetries} failed:`, error.message);

            if (i < maxRetries - 1) {
                await sleep(delay);
            }
        }
    }

    throw lastError;
}

/**
 * Parse CSV content to JSON
 * @param {string} csvContent - CSV file content
 * @returns {Array<Object>} Parsed data
 */
export function parseCSV(csvContent) {
    const lines = csvContent.trim().split('\n');
    const headers = lines[0].split(',').map(h => h.trim());

    return lines.slice(1).map(line => {
        const values = line.split(',').map(v => v.trim());
        const obj = {};

        headers.forEach((header, index) => {
            obj[header] = values[index];
        });

        return obj;
    });
}

/**
 * Calculate percentage
 * @param {number} value - Current value
 * @param {number} total - Total value
 * @returns {number} Percentage (0-100)
 */
export function calculatePercentage(value, total) {
    if (total === 0) return 0;
    return parseFloat(((value / total) * 100).toFixed(2));
}

/**
 * Truncate text to specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @returns {string} Truncated text
 */
export function truncateText(text, maxLength = 50) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}