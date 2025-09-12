import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { FaCalendarAlt, FaClock, FaUserGraduate, FaExchangeAlt, FaCheckCircle, FaTimesCircle, FaTable } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const TeacherStats = () => {
  const [stats, setStats] = useState({});
  const [timetable, setTimetable] = useState([]);
  const [leaveBalances, setLeaveBalances] = useState({});
  const [attendancePercentage, setAttendancePercentage] = useState(100);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const teacherId = user?._id;

  useEffect(() => {
    if (teacherId) {
      fetchTeacherData();
    }
  }, [teacherId]);

  const fetchTeacherData = async () => {
    if (!teacherId) {
      console.log('No teacher ID available');
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');

      // Fetch teacher stats
      const statsResponse = await axios.get('/api/teachers/stats', {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch teacher's timetable
      const timetableResponse = await axios.get(`/api/timetable/teacher/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      // Fetch detailed teacher info for leave balances and attendance
      const teacherResponse = await axios.get(`/api/teachers/${teacherId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (statsResponse.data.success) {
        setStats(statsResponse.data.data);
      }

      if (timetableResponse.data.success) {
        setTimetable(timetableResponse.data.data);
      }

      if (teacherResponse.data.success) {
        setLeaveBalances(teacherResponse.data.data.leaveBalances || {});
        setAttendancePercentage(teacherResponse.data.data.attendancePercentage || 100);
      }
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodInfo = (day, periodNumber) => {
    const dayTimetable = timetable.find(t => t.day === day);
    if (!dayTimetable) return null;

    const period = dayTimetable.periods.find(p => p.periodNumber === periodNumber);
    return period;
  };

  const getPeriodDisplay = (day, periodNumber) => {
    const period = getPeriodInfo(day, periodNumber);
    
    if (!period) {
      return { text: 'Free', className: 'bg-gray-100 text-gray-600' };
    }

    if (period.isSubstitution) {
      return { 
        text: `${period.subject} (${period.className})`, 
        className: 'bg-pink-200 text-pink-800 font-medium border-2 border-pink-400',
        isSubstitution: true,
        substitutionInfo: `Sub for ${period.originalTeacherId || 'Unknown'}`
      };
    }

    return { 
      text: `${period.subject} (${period.className})`, 
      className: 'bg-blue-100 text-blue-800' 
    };
  };

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!teacherId) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading user information...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">Welcome back!</h1>
        <p className="text-blue-100">Here's your current status and timetable overview</p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center">
            <FaCalendarAlt className="text-blue-600 text-2xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Total Leaves</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalLeaves || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center">
            <FaCheckCircle className="text-green-600 text-2xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Approved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approvedLeaves || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center">
            <FaClock className="text-yellow-600 text-2xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pendingLeaves || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center">
            <FaTimesCircle className="text-red-600 text-2xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Rejected</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejectedLeaves || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center">
            <FaExchangeAlt className="text-purple-600 text-2xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Substitutions</p>
              <p className="text-2xl font-bold text-gray-900">{stats.substitutions || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-indigo-500">
          <div className="flex items-center">
            <FaUserGraduate className="text-indigo-600 text-2xl mr-4" />
            <div>
              <p className="text-sm font-medium text-gray-600">Attendance</p>
              <p className="text-2xl font-bold text-gray-900">{attendancePercentage}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Leave Balances */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaCalendarAlt className="mr-2 text-blue-600" />
          Leave Balances (Monthly Limits)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-blue-600">Casual Leave</p>
            <p className="text-2xl font-bold text-blue-800">{leaveBalances.casualLeave || 0}</p>
            <p className="text-xs text-blue-600">/ 8 per month</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-green-600">Medical Leave</p>
            <p className="text-2xl font-bold text-green-800">{leaveBalances.medicalLeave || 0}</p>
            <p className="text-xs text-green-600">/ 10 per month</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 text-center">
            <p className="text-sm font-medium text-purple-600">Earned Leave</p>
            <p className="text-2xl font-bold text-purple-800">{leaveBalances.earnedLeave || 0}</p>
            <p className="text-xs text-purple-600">/ 2.5 per month</p>
          </div>
        </div>
      </div>

      {/* Interactive Timetable */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <FaTable className="mr-2 text-blue-600" />
          My Timetable
        </h3>
        
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-200">
            <thead>
              <tr className="bg-gray-50">
                <th className="border border-gray-200 px-4 py-3 text-left font-medium text-gray-700">Time</th>
                {days.map(day => (
                  <th key={day} className="border border-gray-200 px-4 py-3 text-center font-medium text-gray-700 capitalize">
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {periods.map(period => (
                <tr key={period} className="hover:bg-gray-50">
                  <td className="border border-gray-200 px-4 py-3 text-sm font-medium text-gray-700">
                    Period {period}
                  </td>
                  {days.map(day => {
                    const periodDisplay = getPeriodDisplay(day, period);
                    return (
                      <td key={day} className="border border-gray-200 px-4 py-3 text-center">
                        <div className={`inline-block px-3 py-2 rounded-lg text-sm ${periodDisplay.className}`}>
                          {periodDisplay.text}
                          {periodDisplay.isSubstitution && (
                            <div className="text-xs mt-1 text-pink-700">
                              ⭐ Substitution
                            </div>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Legend */}
        <div className="mt-4 flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-blue-100 border border-blue-300 rounded mr-2"></div>
            <span className="text-gray-700">Regular Class</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-pink-200 border border-pink-300 rounded mr-2"></div>
            <span className="text-gray-700">Substitution Period</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-gray-100 border border-gray-300 rounded mr-2"></div>
            <span className="text-gray-700">Free Period</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherStats;
