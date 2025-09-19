import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FaTable, 
  FaClock, 
  FaChalkboardTeacher, 
  FaBuilding,
  FaExclamationTriangle,
  FaUserGraduate
} from 'react-icons/fa';

const TeacherTimetable = () => {
  const { user } = useAuth();
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];

  useEffect(() => {
    if (user) {
      fetchTeacherTimetable();
    }
  }, [user]);

  const fetchTeacherTimetable = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/teachers/${user._id}/timetable`);
      if (response.data.success) {
        setTimetable(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teacher timetable:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodData = (day, periodNumber) => {
    const dayData = timetable.find(d => d.day === day);
    if (!dayData) return null;
    return dayData.periods.find(p => p.periodNumber === periodNumber);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <FaTable className="mr-3 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">My Timetable</h1>
            <p className="text-green-100">Welcome, {user?.name}</p>
          </div>
        </div>
      </div>

      {/* Timetable Grid */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaClock className="mr-2" />
            Weekly Schedule
          </h2>
        </div>
        <div className="p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100">
                  <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700">Time</th>
                  {days.map(day => (
                    <th key={day} className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 capitalize">
                      {day}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {periods.map(period => (
                  <tr key={period}>
                    <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100">
                      Period {period}
                    </td>
                    {days.map(day => {
                      const periodData = getPeriodData(day, period);
                      return (
                        <td
                          key={day}
                          className={`border border-gray-300 px-4 py-3 text-center min-w-[120px] ${
                            periodData?.isSubstitution 
                              ? 'bg-pink-100' 
                              : periodData 
                                ? 'bg-blue-50' 
                                : 'bg-gray-50'
                          }`}
                        >
                          {periodData ? (
                            <div className="bg-white rounded-lg p-2 shadow-sm">
                              <div className="font-medium text-gray-800 flex items-center justify-center">
                                {periodData.subject}
                                {periodData.isSubstitution && (
                                  <FaExclamationTriangle className="ml-1 text-pink-600" title="Substitution Period" />
                                )}
                              </div>
                              <div className="text-gray-600 text-xs mt-1 flex items-center justify-center">
                                <FaBuilding className="mr-1" />
                                {periodData.className}
                              </div>
                              {periodData.room && (
                                <div className="text-xs text-gray-500 mt-1 flex items-center justify-center">
                                  <FaUserGraduate className="mr-1" />
                                  {periodData.room}
                                </div>
                              )}
                              {periodData.isSubstitution && periodData.originalTeacherId && (
                                <div className="text-xs text-pink-600 mt-1">
                                  Substituting for: {periodData.originalTeacherId.name}
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="bg-gray-100 rounded-lg p-2">
                              <span className="text-gray-500 text-sm">Free</span>
                            </div>
                          )}
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
              <div className="w-4 h-4 bg-blue-50 border border-blue-200 rounded mr-2"></div>
              <span className="text-gray-700">Regular Class</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-pink-100 border border-pink-200 rounded mr-2"></div>
              <span className="text-gray-700">Substitution Period</span>
            </div>
            <div className="flex items-center">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
              <span className="text-gray-700">Free Period</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FaChalkboardTeacher className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl font-semibold text-gray-900">
                {timetable.reduce((total, day) => total + day.periods.length, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-pink-100 text-pink-600">
              <FaExclamationTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Substitutions</p>
              <p className="text-2xl font-semibold text-gray-900">
                {timetable.reduce((total, day) => 
                  total + day.periods.filter(p => p.isSubstitution).length, 0
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FaClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Free Periods</p>
              <p className="text-2xl font-semibold text-gray-900">
                {42 - timetable.reduce((total, day) => total + day.periods.length, 0)}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherTimetable;
