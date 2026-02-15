/**
 * Geometry point type for location coordinates
 */
export interface Point {
    x: number;
    y: number;
}
/**
 * Common API response wrapper
 */
export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
}
/**
 * Paginated response
 */
export interface PaginatedResponse<T> {
    items: T[];
    total: number;
    page: number;
    limit: number;
}
