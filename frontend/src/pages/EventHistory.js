import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import MainLayout from '../components/mainlayout/MainLayout';

import EventHistoryGlobalStyles from '../components/eventhistory/EventHistoryGlobalStyles';
import EventHistoryHeader from '../components/eventhistory/EventHistoryHeader';
import SummaryStatsCards from '../components/eventhistory/SummaryStatsCards';
import FilterToolbar from '../components/eventhistory/FilterToolbar';
import ResultsBar from '../components/eventhistory/ResultsBar';
import EventsTable from '../components/eventhistory/EventsTable';
import EventDetailModal from '../components/eventhistory/EventDetailModal';

import styles from '../components/eventhistory/EventHistoryStyles';
import {
  API_BASE_URL,
  ITEMS_PER_PAGE,
  getAuthHeaders,
  parseEventDetections,
  exportEventsToCSV,
} from '../components/eventhistory/EventHistoryHelpers';

const EventHistory = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('all'); // 'all' | 'fire' | 'smoke' | 'both'
  const [cameraFilter, setCameraFilter] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination & Modal State
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedEvent, setSelectedEvent] = useState(null);

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const handleSessionExpired = useCallback(() => {
    localStorage.removeItem('token');
    navigate('/');
  }, [navigate]);

  const fetchData = useCallback(
    async (isManual = false) => {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/');
        return;
      }

      if (isManual) setIsRefreshing(true);

      try {
        const [userRes, eventsRes, camRes] = await Promise.allSettled([
          axios.get(`${API_BASE_URL}/me`, getAuthHeaders()),
          axios.get(`${API_BASE_URL}/detections`, getAuthHeaders()),
          axios.get(`${API_BASE_URL}/cameras`, getAuthHeaders()),
        ]);

        if (userRes.status === 'rejected' && userRes.reason?.response?.status === 401) {
          handleSessionExpired();
          return;
        }

        if (!isMountedRef.current) return;

        if (userRes.status === 'fulfilled') setUser(userRes.value.data);
        if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data || []);
        if (camRes.status === 'fulfilled') setCameras(camRes.value.data || []);
      } catch (err) {
        console.error('Error fetching event history:', err);
      } finally {
        if (isMountedRef.current) {
          setLoading(false);
          if (isManual) setIsRefreshing(false);
        }
      }
    },
    [navigate, handleSessionExpired]
  );

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Fast camera map by ID
  const camerasMap = useMemo(() => {
    const map = {};
    cameras.forEach((cam) => {
      if (cam.camera_id) map[cam.camera_id] = cam;
      if (cam.id) map[cam.id] = cam;
    });
    return map;
  }, [cameras]);

  // Global counts
  const { totalCount, fireCount, smokeCount, todayCount } = useMemo(() => {
    const todayStr = new Date().toDateString();
    let fCount = 0;
    let sCount = 0;
    let tCount = 0;

    events.forEach((evt) => {
      const parsed = parseEventDetections(evt);
      if (parsed.hasFire) fCount++;
      if (parsed.hasSmoke) sCount++;
      if (evt.created_at && new Date(evt.created_at).toDateString() === todayStr) {
        tCount++;
      }
    });

    return {
      totalCount: events.length,
      fireCount: fCount,
      smokeCount: sCount,
      todayCount: tCount,
    };
  }, [events]);

  // Filtered Events
  const filteredEvents = useMemo(() => {
    return events.filter((evt) => {
      const parsed = parseEventDetections(evt);
      const cam = camerasMap[evt.camera_id];

      // 1. Search filter (Event ID, Camera ID, Location, Sub-location)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const eventId = (evt.event_id || '').toLowerCase();
        const camId = (evt.camera_id || '').toLowerCase();
        const location = (cam?.location || '').toLowerCase();
        const subLocation = (cam?.sub_location || '').toLowerCase();

        const matches =
          eventId.includes(q) || camId.includes(q) || location.includes(q) || subLocation.includes(q);

        if (!matches) return false;
      }

      // 2. Type filter
      if (typeFilter === 'fire' && !parsed.hasFire) return false;
      if (typeFilter === 'smoke' && !parsed.hasSmoke) return false;
      if (typeFilter === 'both' && !parsed.hasBoth) return false;

      // 3. Camera filter
      if (cameraFilter !== 'all' && evt.camera_id !== cameraFilter) {
        return false;
      }

      // 4. Date range filter
      if (startDate && evt.created_at) {
        const eventDate = new Date(evt.created_at);
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        if (eventDate < start) return false;
      }

      if (endDate && evt.created_at) {
        const eventDate = new Date(evt.created_at);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        if (eventDate > end) return false;
      }

      return true;
    });
  }, [events, searchTerm, typeFilter, cameraFilter, startDate, endDate, camerasMap]);

  // Reset pagination when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, typeFilter, cameraFilter, startDate, endDate]);

  // Paginated Events
  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE) || 1;
  const paginatedEvents = useMemo(() => {
    const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredEvents.slice(startIdx, startIdx + ITEMS_PER_PAGE);
  }, [filteredEvents, currentPage]);

  // Reset filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setCameraFilter('all');
    setStartDate('');
    setEndDate('');
  };

  return (
    <MainLayout title="Event History" username={user?.username || 'User'} userRole={user?.role || 'user'}>
      <EventHistoryGlobalStyles />

      <div style={styles.page}>
        <EventHistoryHeader
          isRefreshing={isRefreshing}
          onRefresh={() => fetchData(true)}
          onExportCSV={() => exportEventsToCSV(filteredEvents, camerasMap)}
        />

        <SummaryStatsCards
          totalCount={totalCount}
          fireCount={fireCount}
          smokeCount={smokeCount}
          todayCount={todayCount}
        />

        <FilterToolbar
          searchTerm={searchTerm}
          onSearchTermChange={setSearchTerm}
          typeFilter={typeFilter}
          onTypeFilterChange={setTypeFilter}
          cameraFilter={cameraFilter}
          onCameraFilterChange={setCameraFilter}
          startDate={startDate}
          onStartDateChange={setStartDate}
          endDate={endDate}
          onEndDateChange={setEndDate}
          cameras={cameras}
          onResetFilters={handleResetFilters}
        />

        <ResultsBar
          filteredCount={filteredEvents.length}
          totalCount={totalCount}
          currentPage={currentPage}
          totalPages={totalPages}
        />

        <EventsTable
          loading={loading}
          filteredEvents={filteredEvents}
          paginatedEvents={paginatedEvents}
          camerasMap={camerasMap}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
          onSelectEvent={setSelectedEvent}
          onResetFilters={handleResetFilters}
        />

        <EventDetailModal
          selectedEvent={selectedEvent}
          camerasMap={camerasMap}
          onClose={() => setSelectedEvent(null)}
        />
      </div>
    </MainLayout>
  );
};

export default EventHistory;