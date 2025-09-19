import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  FaPlus, 
  FaEdit, 
  FaSave, 
  FaTimes, 
  FaTrash, 
  FaTable, 
  FaBuilding, 
  FaUserGraduate,
  FaClock,
  FaChalkboardTeacher,
  FaExclamationTriangle
} from 'react-icons/fa';

const ClassTimetableManager = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTimetableModal, setShowTimetableModal] = useState(false);
  const [showSubstitutionModal, setShowSubstitutionModal] = useState(false);
  const [editingCell, setEditingCell] = useState(null);
  const [substitutionData, setSubstitutionData] = useState(null);
  const [viewMode, setViewMode] = useState('single'); // 'single' or 'all'

  // Form states
  const [classForm, setClassForm] = useState({
    department: '',
    section: '',
    semester: '',
    graduationYear: '',
    strength: ''
  });

  const [timetableForm, setTimetableForm] = useState({
    subject: '',
    teacherId: '',
    room: ''
  });

  const [substitutionForm, setSubstitutionForm] = useState({
    originalTeacherId: '',
    substituteTeacherId: '',
    subject: '',
    room: '',
    notes: ''
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  const departments = ['CSE', 'AIML', 'IT', 'ECE', 'MECH', 'CIVIL', 'EEE', 'DS', 'CS', 'MBA', 'MATH', 'PHY', 'CHEM', 'ENG'];

  useEffect(() => {
    fetchData();
  }, []);

  // Auto-select last saved class (from generator) for a smoother flow
  useEffect(() => {
    const selectLast = async () => {
      try {
        const lastId = localStorage.getItem('lastSavedClassId');
        if (!lastId) return;
        // Ensure classes are loaded
        if (classes.length === 0) return;
        const hit = classes.find(c => c._id === lastId);
        if (hit) setSelectedClass(hit);
      } catch (_) {}
    };
    selectLast();
  }, [classes]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [classesRes, teachersRes] = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/admin/teachers?limit=100') // Get all teachers for admin
      ]);

      if (classesRes.data.success) {
        setClasses(classesRes.data.data);
      }
      if (teachersRes.data.success) {
        setTeachers(teachersRes.data.data);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/classes', classForm);
      if (response.data.success) {
        alert('Class created successfully!');
        setShowCreateModal(false);
        setClassForm({ department: '', section: '', semester: '', graduationYear: '', strength: '' });
        await fetchData();
        // Automatically select the newly created class
        setSelectedClass(response.data.data);
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error.response?.data?.message || 'Error creating class');
    }
  };

  const handleTimetableUpdate = async (day, periodNumber, data) => {
    try {
      if (!selectedClass) return;

      const updatedTimetable = [...(selectedClass.timetable || [])];
      let dayIndex = updatedTimetable.findIndex(d => d.day === day);
      
      if (dayIndex === -1) {
        updatedTimetable.push({ day, periods: [] });
        dayIndex = updatedTimetable.length - 1;
      }

      let periodIndex = updatedTimetable[dayIndex].periods.findIndex(p => p.periodNumber === periodNumber);
      
      if (periodIndex === -1) {
        updatedTimetable[dayIndex].periods.push({
          periodNumber,
          ...data
        });
      } else {
        updatedTimetable[dayIndex].periods[periodIndex] = {
          ...updatedTimetable[dayIndex].periods[periodIndex],
          ...data
        };
      }

      const response = await api.put(`/api/classes/${selectedClass._id}/timetable`, {
        timetable: updatedTimetable
      });

      if (response.data.success) {
        setSelectedClass(response.data.data);
        setShowTimetableModal(false);
        setEditingCell(null);
        alert('Timetable updated successfully!');
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      alert(error.response?.data?.message || 'Error updating timetable');
    }
  };

  const handleSubstitution = async (e) => {
    e.preventDefault();
    try {
      if (!selectedClass || !substitutionData) return;

      const response = await api.post(`/api/classes/${selectedClass._id}/substitution`, {
        day: substitutionData.day,
        periodNumber: substitutionData.periodNumber,
        originalTeacherId: substitutionForm.originalTeacherId,
        substituteTeacherId: substitutionForm.substituteTeacherId,
        subject: substitutionForm.subject,
        room: substitutionForm.room,
        notes: substitutionForm.notes
      });

      if (response.data.success) {
        alert('Substitution created successfully!');
        setShowSubstitutionModal(false);
        setSubstitutionData(null);
        setSubstitutionForm({ originalTeacherId: '', substituteTeacherId: '', subject: '', room: '', notes: '' });
        fetchData();
        if (selectedClass) {
          const updatedClass = await api.get(`/api/classes/${selectedClass._id}`);
          if (updatedClass.data.success) {
            setSelectedClass(updatedClass.data.data);
          }
        }
      }
    } catch (error) {
      console.error('Error creating substitution:', error);
      alert(error.response?.data?.message || 'Error creating substitution');
    }
  };

  const getPeriodData = (day, periodNumber) => {
    if (!selectedClass || !selectedClass.timetable) return null;
    const dayData = selectedClass.timetable.find(d => d.day === day);
    if (!dayData) return null;
    return dayData.periods.find(p => p.periodNumber === periodNumber);
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const openTimetableModal = (day, periodNumber) => {
    const existingData = getPeriodData(day, periodNumber);
    setEditingCell({ day, periodNumber });
    setTimetableForm({
      subject: existingData?.subject || '',
      teacherId: existingData?.teacherId || '',
      room: existingData?.room || ''
    });
    setShowTimetableModal(true);
  };

  const openSubstitutionModal = (day, periodNumber) => {
    const existingData = getPeriodData(day, periodNumber);
    if (!existingData) {
      alert('No class assigned to this period');
      return;
    }
    setSubstitutionData({ day, periodNumber });
    setSubstitutionForm({
      originalTeacherId: existingData.teacherId,
      substituteTeacherId: '',
      subject: existingData.subject,
      room: existingData.room || '',
      notes: ''
    });
    setShowSubstitutionModal(true);
  };

  const deletePeriod = async (day, periodNumber) => {
    if (!selectedClass) return;
    
    if (!window.confirm('Are you sure you want to delete this period?')) return;

    try {
      const updatedTimetable = [...(selectedClass.timetable || [])];
      const dayIndex = updatedTimetable.findIndex(d => d.day === day);
      
      if (dayIndex !== -1) {
        updatedTimetable[dayIndex].periods = updatedTimetable[dayIndex].periods.filter(
          p => p.periodNumber !== periodNumber
        );
        
        if (updatedTimetable[dayIndex].periods.length === 0) {
          updatedTimetable.splice(dayIndex, 1);
        }
      }

      const response = await api.put(`/api/classes/${selectedClass._id}/timetable`, {
        timetable: updatedTimetable
      });

      if (response.data.success) {
        setSelectedClass(response.data.data);
        alert('Period deleted successfully!');
      }
    } catch (error) {
      console.error('Error deleting period:', error);
      alert(error.response?.data?.message || 'Error deleting period');
    }
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
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold mb-2 flex items-center">
              <FaTable className="mr-3" />
              Class Timetable Management
            </h1>
            <p className="text-blue-100">Create classes and manage their individual timetables</p>
          </div>
          <div className="flex space-x-3">
            <div className="flex bg-white rounded-md p-1">
              <button
                onClick={() => setViewMode('single')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'single'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                Single View
              </button>
              <button
                onClick={() => setViewMode('all')}
                className={`px-3 py-1 text-sm font-medium rounded ${
                  viewMode === 'all'
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-600 hover:bg-blue-50'
                }`}
              >
                All Timetables
              </button>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <FaPlus className="mr-2" />
              Create Class
            </button>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Classes</h2>
        </div>
        <div className="p-6">
          {classes.length === 0 ? (
            <div className="text-center py-8">
              <FaTable className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 mb-4">No classes found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Create First Class
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classData) => {
                const totalPeriods = classData.timetable?.reduce((total, day) => total + day.periods.length, 0) || 0;
                return (
                  <div
                    key={classData._id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedClass?._id === classData._id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedClass(classData)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{classData.name}</h3>
                        <p className="text-sm text-gray-600">
                          {classData.department} - Section {classData.section}
                        </p>
                        <p className="text-sm text-gray-500">
                          Semester {classData.semester} • {classData.graduationYear}
                        </p>
                        <div className="mt-2 flex items-center">
                          <FaTable className="h-3 w-3 text-gray-400 mr-1" />
                          <span className="text-xs text-gray-500">
                            {totalPeriods} periods scheduled
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <FaEdit className="text-gray-400 mb-1" />
                        {selectedClass?._id === classData._id && (
                          <span className="text-xs text-blue-600 font-medium">Selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* All Timetables View */}
      {viewMode === 'all' && classes.length > 0 && (
        <div className="space-y-6">
          {classes.map((classData) => (
            <div key={classData._id} className="bg-white rounded-lg shadow-md">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">
                  {classData.name} - {classData.department} Section {classData.section}
                </h2>
                <p className="text-sm text-gray-600">
                  Semester {classData.semester} • {classData.graduationYear}
                </p>
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
                            const dayData = classData.timetable?.find(d => d.day === day);
                            const periodData = dayData?.periods.find(p => p.periodNumber === period);
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
                                    <div className="font-medium text-gray-800 text-xs">
                                      {periodData.subject}
                                      {periodData.isSubstitution && (
                                        <FaExclamationTriangle className="ml-1 text-pink-600 inline" title="Substitution" />
                                      )}
                                    </div>
                                    <div className="text-gray-600 text-xs mt-1">
                                      {periodData.isSubstitution && periodData.originalTeacherId
                                        ? `Sub: ${getTeacherName(periodData.teacherId)}`
                                        : getTeacherName(periodData.teacherId)
                                      }
                                    </div>
                                    {periodData.room && (
                                      <div className="text-xs text-gray-500 mt-1">{periodData.room}</div>
                                    )}
                                  </div>
                                ) : (
                                  <div className="bg-gray-100 rounded-lg p-2">
                                    <span className="text-gray-500 text-xs">Free</span>
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
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Single Timetable View */}
      {viewMode === 'single' && selectedClass ? (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Timetable - {selectedClass.name}
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {selectedClass.department} - Section {selectedClass.section} • Semester {selectedClass.semester} • {selectedClass.graduationYear}
            </p>
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
                            className={`border border-gray-300 px-4 py-3 text-center min-w-[120px] cursor-pointer ${
                              periodData?.isSubstitution 
                                ? 'bg-pink-100' 
                                : periodData 
                                  ? 'bg-blue-50' 
                                  : 'bg-gray-50'
                            }`}
                            onClick={() => openTimetableModal(day, period)}
                          >
                            {periodData ? (
                              <div className="bg-white rounded-lg p-2 shadow-sm">
                                <div className="font-medium text-gray-800 flex items-center justify-center">
                                  {periodData.subject}
                                  {periodData.isSubstitution && (
                                    <FaExclamationTriangle className="ml-1 text-pink-600" title="Substitution" />
                                  )}
                                </div>
                                <div className="text-gray-600 text-xs mt-1">
                                  {periodData.isSubstitution && periodData.originalTeacherId
                                    ? `Sub: ${getTeacherName(periodData.teacherId)} (for ${getTeacherName(periodData.originalTeacherId)})`
                                    : getTeacherName(periodData.teacherId)
                                  }
                                </div>
                                {periodData.room && (
                                  <div className="text-xs text-gray-500 mt-1">{periodData.room}</div>
                                )}
                                <div className="flex justify-center space-x-1 mt-2">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      openSubstitutionModal(day, period);
                                    }}
                                    className="text-xs px-2 py-1 bg-yellow-500 text-white rounded hover:bg-yellow-600"
                                    title="Create Substitution"
                                  >
                                    Sub
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      deletePeriod(day, period);
                                    }}
                                    className="text-xs px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                                    title="Delete Period"
                                  >
                                    Del
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <div className="bg-gray-100 rounded-lg p-2">
                                <span className="text-gray-500 text-sm">Click to add</span>
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
                <span className="text-gray-700">Substitution</span>
              </div>
              <div className="flex items-center">
                <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded mr-2"></div>
                <span className="text-gray-700">Free Period</span>
              </div>
            </div>
          </div>
        </div>
      ) : viewMode === 'single' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Select a Class</h2>
            <p className="text-sm text-gray-600 mt-1">
              Choose a class from the list above to view and edit its timetable
            </p>
          </div>
          <div className="p-6">
            <div className="text-center py-12">
              <FaTable className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Class Selected</h3>
              <p className="text-gray-500 mb-6">
                Select a class from the list above to start managing its timetable
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FaPlus className="mr-2" />
                Create New Class
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Class</h3>
              <form onSubmit={handleCreateClass} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department *</label>
                  <select
                    value={classForm.department}
                    onChange={(e) => setClassForm({ ...classForm, department: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Department</option>
                    {departments.map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Section *</label>
                    <select
                      value={classForm.section}
                      onChange={(e) => setClassForm({ ...classForm, section: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section} value={section}>{section}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester *</label>
                    <select
                      value={classForm.semester}
                      onChange={(e) => setClassForm({ ...classForm, semester: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>{sem}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Graduation Year *</label>
                    <input
                      type="text"
                      value={classForm.graduationYear}
                      onChange={(e) => setClassForm({ ...classForm, graduationYear: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2025"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700">Strength</label>
                    <input
                      type="number"
                      value={classForm.strength}
                      onChange={(e) => setClassForm({ ...classForm, strength: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 60"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Create Class
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Timetable Modal */}
      {showTimetableModal && editingCell && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaEdit className="mr-2" />
                {getPeriodData(editingCell.day, editingCell.periodNumber) ? 'Edit Period' : 'Add Period'}
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Day:</strong> {editingCell.day.charAt(0).toUpperCase() + editingCell.day.slice(1)}<br/>
                  <strong>Period:</strong> {editingCell.periodNumber}
                </p>
              </div>
              <form onSubmit={(e) => {
                e.preventDefault();
                handleTimetableUpdate(editingCell.day, editingCell.periodNumber, timetableForm);
              }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject *</label>
                  <input
                    type="text"
                    value={timetableForm.subject}
                    onChange={(e) => setTimetableForm({ ...timetableForm, subject: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics, Physics, Computer Science"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher *</label>
                  <select
                    value={timetableForm.teacherId}
                    onChange={(e) => setTimetableForm({ ...timetableForm, teacherId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.length > 0 ? (
                      teachers.map(teacher => (
                        <option key={teacher._id} value={teacher._id}>
                          {teacher.name} - {teacher.subject} {teacher.department ? `(${teacher.department})` : ''}
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>No teachers available</option>
                    )}
                  </select>
                  {teachers.length === 0 && (
                    <div className="mt-1">
                      <p className="text-sm text-red-600">
                        No teachers found. Please create teachers first.
                      </p>
                      <button
                        type="button"
                        onClick={fetchData}
                        className="mt-1 text-sm text-blue-600 hover:text-blue-800 underline"
                      >
                        Refresh Teachers
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input
                    type="text"
                    value={timetableForm.room}
                    onChange={(e) => setTimetableForm({ ...timetableForm, room: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Room 101, Lab A, Auditorium"
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowTimetableModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save Period
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Substitution Modal */}
      {showSubstitutionModal && substitutionData && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaExclamationTriangle className="mr-2 text-yellow-600" />
                Create Substitution
              </h3>
              <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <p className="text-sm text-gray-600">
                  <strong>Day:</strong> {substitutionData.day.charAt(0).toUpperCase() + substitutionData.day.slice(1)}<br/>
                  <strong>Period:</strong> {substitutionData.periodNumber}<br/>
                  <strong>Class:</strong> {selectedClass?.name}
                </p>
              </div>
              <form onSubmit={handleSubstitution} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Original Teacher</label>
                  <select
                    value={substitutionForm.originalTeacherId}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-gray-50"
                    disabled
                  >
                    <option value={substitutionForm.originalTeacherId}>
                      {getTeacherName(substitutionForm.originalTeacherId)}
                    </option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Substitute Teacher *</label>
                  <select
                    value={substitutionForm.substituteTeacherId}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, substituteTeacherId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Substitute Teacher</option>
                    {teachers.filter(t => t._id !== substitutionForm.originalTeacherId).map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} - {teacher.subject} {teacher.department ? `(${teacher.department})` : ''}
                      </option>
                    ))}
                  </select>
                  {teachers.filter(t => t._id !== substitutionForm.originalTeacherId).length === 0 && (
                    <p className="mt-1 text-sm text-red-600">
                      No other teachers available for substitution.
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject *</label>
                  <input
                    type="text"
                    value={substitutionForm.subject}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, subject: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Subject name"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input
                    type="text"
                    value={substitutionForm.room}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, room: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Room 101, Lab A"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Notes</label>
                  <textarea
                    value={substitutionForm.notes}
                    onChange={(e) => setSubstitutionForm({ ...substitutionForm, notes: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Reason for substitution, special instructions, etc."
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowSubstitutionModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-yellow-600 rounded-md hover:bg-yellow-700"
                  >
                    Create Substitution
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTimetableManager;
