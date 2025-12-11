// Booking hook for fetching and managing bookings
export function useBookings() {
  return {
    bookings: [],
    isLoading: false,
    error: null,
    createBooking: async (data: any) => {},
    updateBooking: async (id: string, data: any) => {},
    deleteBooking: async (id: string) => {},
  };
}
