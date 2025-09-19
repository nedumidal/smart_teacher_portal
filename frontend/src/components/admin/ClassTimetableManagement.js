import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { FaTable, FaEdit, FaSave, FaTimes, FaPlus, FaBuilding, FaUserGraduate, FaCalendarAlt, FaFilter, FaSearch, FaTrash, FaExclamationTriangle, FaCheckCircle, FaClock, FaChalkboardTeacher } from 'react-icons/fa';

const ClassTimetableManagement = () => {
  const [classes, setClasses] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [substitutions, setSubstitutions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingClass, setEditingClass] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCreateDeptModal, setShowCreateDeptModal] = useState(false);
  const [showCreateTimetableModal, setShowCreateTimetableModal] = useState(false);
  const [filterDepartment, setFilterDepartment] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    department: '',
    academicYear: '2025',
    semester: '',
    strength: '',
    section: ''
  });
  const [deptFormData, setDeptFormData] = useState({
    name: '',
    code: '',
    description: ''
  });
  const [timetableFormData, setTimetableFormData] = useState({
    classId: '',
    section: '',
    day: '',
    periodNumber: '',
    subject: '',
    teacherId: '',
    room: ''
  });

  const days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const periods = [1, 2, 3, 4, 5, 6, 7];
  const sections = ['A', 'B', 'C', 'D', 'E', 'F'];
  
  // College-level departments
  const collegeDepartments = [
    { name: 'Artificial Intelligence & Machine Learning', code: 'AIML' },
    { name: 'Computer Science & Engineering', code: 'CSE' },
    { name: 'Information Technology', code: 'IT' },
    { name: 'Electronics & Communication Engineering', code: 'ECE' },
    { name: 'Mechanical Engineering', code: 'ME' },
    { name: 'Civil Engineering', code: 'CE' },
    { name: 'Electrical & Electronics Engineering', code: 'EEE' },
    { name: 'Data Science', code: 'DS' },
    { name: 'Cybersecurity', code: 'CS' },
    { name: 'Business Administration', code: 'MBA' },
    { name: 'Mathematics', code: 'MATH' },
    { name: 'Physics', code: 'PHY' },
    { name: 'Chemistry', code: 'CHEM' },
    { name: 'English', code: 'ENG' }
  ];

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    console.log('Departments state updated:', departments);
  }, [departments]);

  useEffect(() => {
    console.log('Classes state updated:', classes);
  }, [classes]);

  const fetchData = async () => {
    try {
      console.log('Fetching data...');
      
      // Test departments API first
      try {
        const departmentsRes = await api.get('/api/departments');
        console.log('Departments response:', departmentsRes.data);
        
        if (departmentsRes.data.success) {
          console.log('Setting departments:', departmentsRes.data.data);
          setDepartments(departmentsRes.data.data);
        } else {
          console.error('Departments API returned success: false');
        }
      } catch (deptError) {
        console.error('Error fetching departments:', deptError);
        console.error('Department error details:', deptError.response?.data);
        if (deptError.response?.status === 401) {
          alert('Authentication error. Please log in again.');
        }
      }

      // Fetch other data
      const [classesRes, teachersRes, substitutionsRes] = await Promise.all([
        api.get('/api/classes'),
        api.get('/api/admin/teachers'),
        api.get('/api/substitutions')
      ]);

      console.log('Classes response:', classesRes.data);
      console.log('Teachers response:', teachersRes.data);
      console.log('Substitutions response:', substitutionsRes.data);

      if (classesRes.data.success) {
        console.log('Setting classes:', classesRes.data.data);
        console.log('Classes data type:', typeof classesRes.data.data);
        console.log('Classes data length:', classesRes.data.data?.length);
        console.log('First class:', classesRes.data.data?.[0]);
        setClasses(classesRes.data.data);
      } else {
        console.error('Classes API returned success: false');
      }
      if (teachersRes.data.success) setTeachers(teachersRes.data.data);
      if (substitutionsRes.data.success) setSubstitutions(substitutionsRes.data.data);
    } catch (error) {
      console.error('Error fetching data:', error);
      console.error('Error details:', error.response?.data);
      
      // Show specific error messages
      if (error.response?.status === 401) {
        alert('Authentication error. Please log in again.');
      } else if (error.response?.status === 500) {
        alert('Server error. Please try again later.');
      } else {
        alert('Error loading data. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClass = async () => {
    try {
      // Validate required fields
      if (!formData.name || !formData.department || !formData.academicYear || !formData.semester) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await api.post('/api/classes', formData);

      if (response.data.success) {
        alert('Class created successfully!');
        setShowCreateModal(false);
        setFormData({ name: '', department: '', academicYear: '2025', semester: '', strength: '', section: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating class:', error);
      alert(error.response?.data?.message || 'Error creating class');
    }
  };

  const handleCreateDepartment = async () => {
    try {
      // Validate required fields
      if (!deptFormData.name || !deptFormData.code) {
        alert('Please fill in department name and code');
        return;
      }

      const response = await api.post('/api/departments', deptFormData);

      if (response.data.success) {
        alert('Department created successfully!');
        setShowCreateDeptModal(false);
        setDeptFormData({ name: '', code: '', description: '' });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating department:', error);
      alert(error.response?.data?.message || 'Error creating department');
    }
  };

  const handleCreateTimetable = async () => {
    try {
      // Validate required fields
      if (!timetableFormData.classId || !timetableFormData.day || !timetableFormData.periodNumber || !timetableFormData.subject || !timetableFormData.teacherId) {
        alert('Please fill in all required fields');
        return;
      }

      const response = await api.post('/api/timetables/teacher/' + timetableFormData.teacherId, {
        day: timetableFormData.day,
        periods: [{
          periodNumber: parseInt(timetableFormData.periodNumber),
          subject: timetableFormData.subject,
          className: classes.find(c => c._id === timetableFormData.classId)?.name || '',
          room: timetableFormData.room || ''
        }]
      });

      if (response.data.success) {
        alert('Timetable entry created successfully!');
        setShowCreateTimetableModal(false);
        setTimetableFormData({
          classId: '',
          section: '',
          day: '',
          periodNumber: '',
          subject: '',
          teacherId: '',
          room: ''
        });
        fetchData();
      }
    } catch (error) {
      console.error('Error creating timetable:', error);
      alert(error.response?.data?.message || 'Error creating timetable');
    }
  };

  const createSampleData = async () => {
    try {
      // First create sample departments if none exist
      if (departments.length === 0) {
        const sampleDepts = [
          { name: 'Computer Science & Engineering', code: 'CSE', description: 'Computer Science & Engineering Department' },
          { name: 'Artificial Intelligence & Machine Learning', code: 'AIML', description: 'AI & ML Department' },
          { name: 'Information Technology', code: 'IT', description: 'Information Technology Department' }
        ];

        for (const dept of sampleDepts) {
          try {
            await api.post('/api/departments', dept);
            console.log(`Sample department ${dept.name} created`);
          } catch (error) {
            console.log(`Department ${dept.name} might already exist`);
          }
        }
      }

      // Create sample classes
      const sampleClasses = [
        { name: 'CSE-3A', department: departments.length > 0 ? departments[0]._id : null, academicYear: '2024-25', semester: 5, strength: 60, section: 'A' },
        { name: 'AIML-2B', department: departments.length > 1 ? departments[1]._id : null, academicYear: '2024-25', semester: 3, strength: 45, section: 'B' },
        { name: 'IT-1C', department: departments.length > 2 ? departments[2]._id : null, academicYear: '2024-25', semester: 1, strength: 50, section: 'C' }
      ];

      for (const classData of sampleClasses) {
        try {
          await api.post('/api/classes', classData);
          console.log(`Sample class ${classData.name} created`);
        } catch (error) {
          console.log(`Class ${classData.name} might already exist`);
        }
      }

      alert('Sample college data created successfully!');
      fetchData();
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert(error.response?.data?.message || 'Error creating sample data');
    }
  };

  const startEditing = (classData) => {
    setEditingClass(classData);
  };

  const cancelEditing = () => {
    setEditingClass(null);
  };

  const saveTimetable = async (classId, timetable) => {
    try {
      const response = await api.put(`/api/classes/${classId}/timetable`, { timetable });

      if (response.data.success) {
        alert('Timetable updated successfully! Teacher timetables have been synchronized.');
        setEditingClass(null);
        fetchData();
      }
    } catch (error) {
      console.error('Error updating timetable:', error);
      alert(error.response?.data?.message || 'Error updating timetable');
    }
  };

  const updatePeriod = (day, periodNumber, field, value) => {
    if (!editingClass) return;

    const newTimetable = [...editingClass.timetable];
    const dayIndex = newTimetable.findIndex(d => d.day === day);
    
    if (dayIndex === -1) {
      // Create new day if it doesn't exist
      newTimetable.push({
        day,
        periods: []
      });
    }

    const dayData = newTimetable.find(d => d.day === day);
    const periodIndex = dayData.periods.findIndex(p => p.periodNumber === periodNumber);
    
    if (periodIndex === -1) {
      // Create new period if it doesn't exist
      dayData.periods.push({
        periodNumber,
        subject: '',
        teacherId: '',
        room: ''
      });
    }

    const period = dayData.periods.find(p => p.periodNumber === periodNumber);
    period[field] = value;

    setEditingClass({
      ...editingClass,
      timetable: newTimetable
    });
  };

  const getPeriodData = (classData, day, periodNumber) => {
    const dayData = classData.timetable.find(d => d.day === day);
    if (!dayData) return null;
    
    const period = dayData.periods.find(p => p.periodNumber === periodNumber);
    return period;
  };

  const getTeacherName = (teacherId) => {
    const teacher = teachers.find(t => t._id === teacherId);
    return teacher ? teacher.name : 'Unknown';
  };

  const getDepartmentName = (departmentId) => {
    const dept = departments.find(d => d._id === departmentId);
    return dept ? dept.name : 'Unknown';
  };

  const getTeachersBySubject = (subject) => {
    if (!subject) return teachers;
    return teachers.filter(teacher => 
      teacher.subject && teacher.subject.toLowerCase().includes(subject.toLowerCase())
    );
  };

  const deletePeriod = (day, periodNumber) => {
    if (!editingClass) return;

    const newTimetable = [...editingClass.timetable];
    const dayIndex = newTimetable.findIndex(d => d.day === day);
    
    if (dayIndex !== -1) {
      const dayData = newTimetable[dayIndex];
      dayData.periods = dayData.periods.filter(p => p.periodNumber !== periodNumber);
      
      // If no periods left for this day, remove the day
      if (dayData.periods.length === 0) {
        newTimetable.splice(dayIndex, 1);
      }
    }

    setEditingClass({
      ...editingClass,
      timetable: newTimetable
    });
  };

  const isSubstitutionPeriod = (classData, day, periodNumber) => {
    const dayData = classData.timetable.find(d => d.day === day);
    if (!dayData) return false;
    
    const period = dayData.periods.find(p => p.periodNumber === periodNumber);
    return period && period.isSubstitution;
  };

  const getSubstitutionInfo = (classData, day, periodNumber) => {
    const dayData = classData.timetable.find(d => d.day === day);
    if (!dayData) return null;
    
    const period = dayData.periods.find(p => p.periodNumber === periodNumber);
    if (!period || !period.isSubstitution) return null;

    // Find the substitution record
    const substitution = substitutions.find(sub => 
      sub.className === classData.name &&
      sub.day === day &&
      sub.periodNumber === periodNumber &&
      sub.status === 'accepted'
    );

    return substitution;
  };

  const filteredClasses = classes.filter(classData => {
    const matchesDepartment = !filterDepartment || classData.department === filterDepartment;
    const matchesSearch = !searchTerm || 
      classData.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      getDepartmentName(classData.department).toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesDepartment && matchesSearch;
  });

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
              College Timetable Management System
            </h1>
            <p className="text-blue-100">Manage academic schedules for all departments, classes, and sections across the college</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCreateTimetableModal(true)}
              className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <FaClock className="mr-2" />
              Create Timetable Entry
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <FaPlus className="mr-2" />
              Create Class
            </button>
            <button
              onClick={() => setShowCreateDeptModal(true)}
              className="inline-flex items-center px-4 py-2 border border-white text-sm font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white"
            >
              <FaBuilding className="mr-2" />
              Create Department
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Department</label>
            <select
              value={filterDepartment}
              onChange={(e) => setFilterDepartment(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All Departments</option>
              {departments.length > 0 ? (
                departments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))
              ) : (
                <option value="" disabled>Loading departments...</option>
              )}
            </select>
            {departments.length === 0 && !loading && (
              <div className="text-xs text-red-500 mt-1">
                No departments available. Please check your connection.
                <button 
                  onClick={fetchData}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  Retry
                </button>
              </div>
            )}
            <div className="text-xs text-gray-500 mt-1">
              Filter departments: {departments.length}
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Classes</label>
            <div className="relative">
              <FaSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search by class name or department..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="flex items-end">
            <button
              onClick={fetchData}
              className="w-full inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <FaSearch className="mr-2" />
              Refresh Data
            </button>
          </div>
        </div>
      </div>

      {/* Classes List */}
      <div className="space-y-6">
        {/* Debug info */}
        <div className="bg-gray-100 p-4 rounded-lg text-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="font-semibold">Debug Info:</p>
              <p>Total classes in state: {classes.length}</p>
              <p>Total departments: {departments.length}</p>
              <p>Total teachers: {teachers.length}</p>
              <p>Total substitutions: {substitutions.length}</p>
              <p>Filtered classes: {filteredClasses.length}</p>
              <p>Filter department: {filterDepartment || 'All'}</p>
              <p>Search term: {searchTerm || 'None'}</p>
              <p>Loading state: {loading ? 'Yes' : 'No'}</p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={fetchData}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Refresh Data
              </button>
              <button
                onClick={createSampleData}
                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              >
                Create Sample Data
              </button>
            </div>
          </div>
          {classes.length > 0 && (
            <div className="mt-2">
              <p>First class sample:</p>
              <pre className="text-xs bg-white p-2 rounded max-h-40 overflow-y-auto">
                {JSON.stringify(classes[0], null, 2)}
              </pre>
            </div>
          )}
          {departments.length > 0 && (
            <div className="mt-2">
              <p>Available departments:</p>
              <div className="text-xs bg-white p-2 rounded">
                {departments.map(dept => (
                  <div key={dept._id}>{dept.name} ({dept.code})</div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {filteredClasses.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6 text-center">
            <FaTable className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            {classes.length === 0 ? (
              <div>
                <p className="text-gray-600 mb-4">No classes found in the system.</p>
                <div className="space-y-2">
                  <p className="text-sm text-gray-500">To get started:</p>
                  <div className="flex justify-center space-x-4">
                    <button
                      onClick={() => setShowCreateDeptModal(true)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
                    >
                      Create Department First
                    </button>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 text-sm"
                    >
                      Create Class
                    </button>
                    <button
                      onClick={createSampleData}
                      className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 text-sm"
                    >
                      Create Sample Data
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="text-gray-600">No classes found matching your criteria.</p>
                <div className="mt-4">
                  <p className="text-sm text-gray-500">Classes exist but may be filtered out:</p>
                  <ul className="text-xs text-gray-400 mt-2">
                    {classes.slice(0, 5).map(cls => (
                      <li key={cls._id}>{cls.name} - {getDepartmentName(cls.department)}</li>
                    ))}
                  </ul>
                  <button
                    onClick={() => {
                      setFilterDepartment('');
                      setSearchTerm('');
                    }}
                    className="mt-2 px-3 py-1 bg-gray-500 text-white rounded text-xs hover:bg-gray-600"
                  >
                    Clear Filters
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          filteredClasses.map((classData) => (
            <div key={classData._id} className="bg-white rounded-lg shadow-md border border-gray-200">
              <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{classData.name}</h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mt-1">
                      <span className="flex items-center">
                        <FaBuilding className="mr-1" />
                        {getDepartmentName(classData.department)}
                      </span>
                      <span>Year: {classData.academicYear}</span>
                      <span>Semester: {classData.semester}</span>
                      <span>Strength: {classData.strength}</span>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {editingClass?._id === classData._id ? (
                      <>
                        <button
                          onClick={() => saveTimetable(classData._id, editingClass.timetable)}
                          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                        >
                          <FaSave className="mr-1" />
                          Save & Sync
                        </button>
                        <button
                          onClick={cancelEditing}
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <FaTimes className="mr-1" />
                          Cancel
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => startEditing(classData)}
                        className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                      >
                        <FaEdit className="mr-1" />
                        Edit Timetable
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Timetable Grid */}
              <div className="p-6">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="border border-gray-300 px-4 py-3 text-left font-medium text-gray-700 bg-gray-100">Time</th>
                        {days.map(day => (
                          <th key={day} className="border border-gray-300 px-4 py-3 text-center font-medium text-gray-700 bg-gray-100 capitalize">
                            {day}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {periods.map(period => (
                        <tr key={period} className="hover:bg-gray-50">
                          <td className="border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 bg-gray-100">
                            Period {period}
                          </td>
                          {days.map(day => {
                            const periodData = getPeriodData(classData, day, period);
                            const isEditing = editingClass?._id === classData._id;
                            const isSubstitution = isSubstitutionPeriod(classData, day, period);
                            const substitutionInfo = getSubstitutionInfo(classData, day, period);
                            
                            return (
                              <td 
                                key={day} 
                                className={`border border-gray-300 px-4 py-3 text-center min-w-[120px] ${
                                  isSubstitution ? 'bg-pink-100' : periodData ? 'bg-blue-50' : 'bg-gray-50'
                                }`}
                              >
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                      <input
                                        type="text"
                                        placeholder="Subject"
                                        value={periodData?.subject || ''}
                                        onChange={(e) => updatePeriod(day, period, 'subject', e.target.value)}
                                        className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                      />
                                      <button
                                        onClick={() => deletePeriod(day, period)}
                                        className="ml-1 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded"
                                        title="Delete period"
                                      >
                                        <FaTrash className="text-xs" />
                                      </button>
                                    </div>
                                    <select
                                      value={periodData?.teacherId || ''}
                                      onChange={(e) => updatePeriod(day, period, 'teacherId', e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                      <option value="">Select Teacher</option>
                                      {getTeachersBySubject(periodData?.subject || '').map(teacher => (
                                        <option key={teacher._id} value={teacher._id}>
                                          {teacher.name} - {teacher.subject}
                                        </option>
                                      ))}
                                    </select>
                                    <input
                                      type="text"
                                      placeholder="Room"
                                      value={periodData?.room || ''}
                                      onChange={(e) => updatePeriod(day, period, 'room', e.target.value)}
                                      className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                  </div>
                                ) : (
                                  <div className="text-sm">
                                    {periodData ? (
                                      <div className="bg-white rounded-lg p-2 shadow-sm">
                                        <div className="font-medium text-gray-800 flex items-center justify-center">
                                          {periodData.subject}
                                          {isSubstitution && (
                                            <FaExclamationTriangle className="ml-1 text-pink-600" title="Substitution Period" />
                                          )}
                                        </div>
                                        <div className="text-gray-600 text-xs mt-1">
                                          {isSubstitution && substitutionInfo ? (
                                            <div>
                                              <div className="text-pink-700 font-medium">
                                                {substitutionInfo.substituteTeacherId?.name}
                                              </div>
                                              <div className="text-xs text-pink-600">
                                                (Sub for {substitutionInfo.originalTeacherId?.name})
                                              </div>
                                            </div>
                                          ) : (
                                            getTeacherName(periodData.teacherId)
                                          )}
                                        </div>
                                        {periodData.room && <div className="text-xs text-gray-500 mt-1">{periodData.room}</div>}
                                        {isSubstitution && substitutionInfo && (
                                          <div className="text-xs text-pink-600 mt-1">
                                            Status: {substitutionInfo.status}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="bg-gray-100 rounded-lg p-2">
                                        <span className="text-gray-500 text-sm">Free</span>
                                      </div>
                                    )}
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
          ))
        )}
      </div>

      {/* Create Class Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Class</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class Name *</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., CSE-3A, AIML-2B, IT-1C"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {departments.length > 0 ? (
                      departments.map((dept) => (
                        <option key={dept._id} value={dept._id}>
                          {dept.name} ({dept.code})
                        </option>
                      ))
                    ) : (
                      <option value="" disabled>Loading departments...</option>
                    )}
                  </select>
                  {departments.length === 0 && !loading && (
                    <div className="text-xs text-red-500 mt-1">
                      No departments available. Please check your connection.
                      <button 
                        onClick={fetchData}
                        className="ml-2 text-blue-600 hover:text-blue-800 underline"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                  <div className="text-xs text-gray-500 mt-1">
                    Available departments: {departments.length}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Section</label>
                    <select
                      value={formData.section}
                      onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Section</option>
                      {sections.map(section => (
                        <option key={section} value={section}>Section {section}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Semester *</label>
                    <select
                      value={formData.semester}
                      onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Semester</option>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                        <option key={sem} value={sem}>Semester {sem}</option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Academic Year *</label>
                    <input
                      type="text"
                      value={formData.academicYear}
                      onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 2025"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Class Strength</label>
                    <input
                      type="number"
                      value={formData.strength}
                      onChange={(e) => setFormData({ ...formData, strength: e.target.value })}
                      className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="e.g., 30"
                    />
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateClass}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Department Modal */}
      {showCreateDeptModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Department</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Select Department *</label>
                  <select
                    value={deptFormData.name}
                    onChange={(e) => {
                      const selectedDept = collegeDepartments.find(d => d.name === e.target.value);
                      setDeptFormData({ 
                        ...deptFormData, 
                        name: e.target.value,
                        code: selectedDept ? selectedDept.code : ''
                      });
                    }}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {collegeDepartments.map((dept) => (
                      <option key={dept.code} value={dept.name}>
                        {dept.name} ({dept.code})
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Department Code *</label>
                  <input
                    type="text"
                    value={deptFormData.code}
                    onChange={(e) => setDeptFormData({ ...deptFormData, code: e.target.value.toUpperCase() })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Auto-filled from selection"
                    readOnly
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={deptFormData.description}
                    onChange={(e) => setDeptFormData({ ...deptFormData, description: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows="3"
                    placeholder="Brief description of the department..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateDeptModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDepartment}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Department
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Timetable Entry Modal */}
      {showCreateTimetableModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-full max-w-2xl shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaClock className="mr-2" />
                Create New Timetable Entry
              </h3>
              <p className="text-sm text-gray-600 mb-4">Add a new class period to the college timetable system</p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Class *</label>
                  <select
                    value={timetableFormData.classId}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, classId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Class</option>
                    {classes.map((cls) => (
                      <option key={cls._id} value={cls._id}>
                        {cls.name} - {getDepartmentName(cls.department)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Section</label>
                  <select
                    value={timetableFormData.section}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, section: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Section</option>
                    {sections.map(section => (
                      <option key={section} value={section}>Section {section}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Day *</label>
                  <select
                    value={timetableFormData.day}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, day: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Day</option>
                    {days.map(day => (
                      <option key={day} value={day} className="capitalize">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Period Number *</label>
                  <select
                    value={timetableFormData.periodNumber}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, periodNumber: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Period</option>
                    {periods.map(period => (
                      <option key={period} value={period}>Period {period}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject *</label>
                  <input
                    type="text"
                    value={timetableFormData.subject}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, subject: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Mathematics, Physics"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher *</label>
                  <select
                    value={timetableFormData.teacherId}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, teacherId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} - {teacher.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <input
                    type="text"
                    value={timetableFormData.room}
                    onChange={(e) => setTimetableFormData({ ...timetableFormData, room: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., Room 101, Lab A"
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowCreateTimetableModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTimetable}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  Create Timetable Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClassTimetableManagement;

