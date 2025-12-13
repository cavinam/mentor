'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  History,
  Calendar,
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  Users,
  MapPin,
  Clock,
  Loader2,
  X,
  ChevronDown,
  ChevronUp,
  Eye
} from 'lucide-react';
import { historyService, CompanyVisit, CompanyAggregate } from '@/services/historyService';
import { format } from 'date-fns';
import { id as localeId } from 'date-fns/locale';

const MONTHS = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function SummaryVisitorPage() {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(now.getFullYear());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [meetings, setMeetings] = useState<CompanyVisit[]>([]);
  const [companies, setCompanies] = useState<CompanyAggregate[]>([]);
  const [summary, setSummary] = useState<{
    totalVisits: number;
    uniqueCompanies: number;
    month: number;
    year: number;
  } | null>(null);

  // Expanded companies
  const [expandedCompanies, setExpandedCompanies] = useState<Set<string>>(new Set());

  // Selected meeting for detail view
  const [selectedMeeting, setSelectedMeeting] = useState<CompanyVisit | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch data
  const fetchData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await historyService.getCompanyVisits({
        month: selectedMonth,
        year: selectedYear,
        companyName: searchQuery || undefined,
      });
      setMeetings(response.data.meetings);
      setCompanies(response.data.companies);
      setSummary(response.data.summary);
    } catch (err: any) {
      console.error('Error fetching history:', err);
      setError('Gagal memuat data history. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedMonth, selectedYear, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(companies.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCompanies = companies.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setExpandedCompanies(new Set()); // Collapse all when changing page
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    setCurrentPage(1);
    setExpandedCompanies(new Set());
  };

  // Navigate months
  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  // Toggle company expansion
  const toggleCompany = (companyName: string) => {
    setExpandedCompanies(prev => {
      const next = new Set(prev);
      if (next.has(companyName)) {
        next.delete(companyName);
      } else {
        next.add(companyName);
      }
      return next;
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    try {
      return format(new Date(dateStr), 'd MMM yyyy', { locale: localeId });
    } catch {
      return dateStr;
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Summary Visitor</h1>
        <p className="text-gray-600 text-sm">Riwayat kunjungan PT dalam 1 bulan</p>
      </div>

      {/* Month Navigation & Search */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 mb-4">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          {/* Month Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <div className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-blue-600" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {MONTHS.map((month, idx) => (
                  <option key={idx} value={idx + 1}>{month}</option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
              >
                {Array.from({ length: 5 }, (_, i) => now.getFullYear() - 2 + i).map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>

            <button
              onClick={goToNextMonth}
              className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>

          {/* Stats & Search */}
          <div className="flex items-center gap-3">
            {summary && (
              <div className="flex items-center gap-3 text-sm">
                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded font-medium">
                  {summary.uniqueCompanies} Visitor Company
                </span>
                <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded font-medium">
                  {summary.totalVisits} Visits
                </span>
              </div>
            )}

            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Cari PT..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 pr-8 py-1.5 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-48"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
          {error}
        </div>
      )}

      {/* Company List - Compact */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-3 border-b border-gray-200">
          <h2 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-blue-600" />
            PT Visit - {MONTHS[selectedMonth - 1]} {selectedYear}
          </h2>
        </div>

        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="p-8 text-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">Memuat data...</p>
            </div>
          ) : companies.length === 0 ? (
            <div className="p-8 text-center">
              <History className="w-10 h-10 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">
                {searchQuery
                  ? `Tidak ada PT "${searchQuery}" yang visit`
                  : 'Belum ada kunjungan di bulan ini'
                }
              </p>
            </div>
          ) : (
            paginatedCompanies.map((company) => (
              <div key={company.companyName}>
                {/* Company Row - Compact */}
                <button
                  onClick={() => toggleCompany(company.companyName)}
                  className="w-full flex items-center justify-between p-3 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <Building2 className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 text-sm">{company.companyName}</h3>
                      <p className="text-xs text-gray-500">{company.visitCount} kunjungan</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded text-xs font-medium">
                      {company.visitCount}x
                    </span>
                    {expandedCompanies.has(company.companyName) ? (
                      <ChevronUp className="w-4 h-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Visit List */}
                {expandedCompanies.has(company.companyName) && (
                  <div className="bg-gray-50 border-t border-gray-100">
                    <table className="w-full text-xs">
                      <thead className="bg-gray-100">
                        <tr>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-500">Tanggal</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-500">Waktu</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-500">Agenda</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-500">Visitor</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-500">Lokasi</th>
                          <th className="px-3 py-1.5 text-left font-medium text-gray-500">Aksi</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {company.visits.map((visit) => (
                          <tr key={visit.id} className="hover:bg-gray-100">
                            <td className="px-3 py-2 whitespace-nowrap text-gray-700">
                              {formatDate(visit.startDate)}
                            </td>
                            <td className="px-3 py-2 whitespace-nowrap text-gray-600">
                              {visit.startTime}-{visit.endTime}
                            </td>
                            <td className="px-3 py-2 text-gray-900 max-w-[200px] truncate">
                              {visit.agenda}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {visit.visitorName || '-'}
                            </td>
                            <td className="px-3 py-2 text-gray-700">
                              {visit.isGenbaVisit ? 'Genba' : visit.meetingRoom?.name || '-'}
                            </td>
                            <td className="px-3 py-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedMeeting(visit);
                                }}
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Detail
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {!isLoading && companies.length > 0 && (
          <div className="px-4 py-3 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-3 text-sm text-gray-600">
              <span>
                Showing {startIndex + 1} - {Math.min(endIndex, companies.length)} of {companies.length} companies
              </span>
              <div className="flex items-center gap-2">
                <span>Per page:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                  className="px-2 py-1 border border-gray-300 rounded text-sm focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value={5}>5</option>
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {/* Page numbers */}
              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((page) => {
                    return page === 1 || page === totalPages || Math.abs(page - currentPage) <= 1;
                  })
                  .map((page, index, array) => (
                    <div key={page} className="flex items-center">
                      {index > 0 && array[index - 1] !== page - 1 && (
                        <span className="px-1.5 text-gray-400">...</span>
                      )}
                      <button
                        onClick={() => handlePageChange(page)}
                        className={`px-2.5 py-1 rounded text-sm ${currentPage === page
                            ? 'bg-blue-600 text-white'
                            : 'border border-gray-300 hover:bg-gray-50'
                          }`}
                      >
                        {page}
                      </button>
                    </div>
                  ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages || totalPages === 0}
                className="p-1.5 rounded border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Meeting Detail Modal */}
      {selectedMeeting && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full max-h-[80vh] overflow-auto">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-semibold text-gray-900">Detail Meeting</h3>
              <button
                onClick={() => setSelectedMeeting(null)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="p-4 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500 text-xs">Company</p>
                  <p className="font-medium text-gray-900">{selectedMeeting.companyName}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Visitor</p>
                  <p className="font-medium text-gray-900">{selectedMeeting.visitorName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Tanggal</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedMeeting.startDate)}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Waktu</p>
                  <p className="font-medium text-gray-900">{selectedMeeting.startTime} - {selectedMeeting.endTime}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">PIC GTIM</p>
                  <p className="font-medium text-gray-900">{selectedMeeting.gtimName || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Lokasi</p>
                  <p className="font-medium text-gray-900">
                    {selectedMeeting.isGenbaVisit ? 'Genba Visit' : selectedMeeting.meetingRoom?.name || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Department</p>
                  <p className="font-medium text-gray-900">{selectedMeeting.department?.name || '-'}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Dibuat oleh</p>
                  <p className="font-medium text-gray-900">{selectedMeeting.user?.fullName || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-gray-500 text-xs mb-1">Agenda</p>
                <p className="text-sm text-gray-900 bg-gray-50 p-2 rounded">{selectedMeeting.agenda}</p>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <span className={`px-2 py-0.5 rounded text-xs font-medium ${selectedMeeting.isGenbaVisit
                  ? 'bg-purple-100 text-purple-700'
                  : 'bg-gray-100 text-gray-700'
                  }`}>
                  {selectedMeeting.isGenbaVisit ? 'Genba Visit' : 'Meeting Room'}
                </span>
                <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700">
                  {selectedMeeting.overallStatus}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

