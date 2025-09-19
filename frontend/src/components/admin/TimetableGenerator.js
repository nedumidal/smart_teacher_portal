import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import { 
  FaPlus, 
  FaEdit, 
  FaSave, 
  FaTrash, 
  FaTable, 
  FaBuilding, 
  FaUserGraduate,
  FaClock,
  FaChalkboardTeacher,
  FaExclamationTriangle,
  FaMagic
} from 'react-icons/fa';

const TimetableGenerator = () => {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [classDetails, setClassDetails] = useState({
    department: '',
    section: '',
    semester: '',
    graduationYear: ''
  });
  const [subjects, setSubjects] = useState(['']);
  const [timetable, setTimetable] = useState(null);
  const [editingCell, setEditingCell] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    subject: '',
    teacherId: '',
    room: ''
  });

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const periods = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7'];
  const rooms = ['A101', 'A102', 'A103', 'A201', 'A202', 'A203', 'B101', 'B102', 'Lab1', 'Lab2'];

  // Department-specific subjects mapping
  const departmentSubjects = {
    'CSE': ['Data Structures', 'Algorithms', 'Computer Networks', 'Database Systems', 'Operating Systems', 'Software Engineering', 'Computer Organization', 'Web Development'],
    'AIML': ['Machine Learning', 'Artificial Intelligence', 'Deep Learning', 'Data Mining', 'Neural Networks', 'Computer Vision', 'Natural Language Processing', 'Statistics'],
    'IT': ['Information Systems', 'Web Technologies', 'Database Management', 'Network Security', 'Mobile Computing', 'Cloud Computing', 'IT Project Management', 'System Analysis'],
    'ECE': ['Digital Electronics', 'Communication Systems', 'Signal Processing', 'Microprocessors', 'VLSI Design', 'Embedded Systems', 'Control Systems', 'Antenna Theory'],
    'MECH': ['Thermodynamics', 'Fluid Mechanics', 'Machine Design', 'Manufacturing Technology', 'Heat Transfer', 'Strength of Materials', 'CAD/CAM', 'Automotive Engineering'],
    'CIVIL': ['Structural Analysis', 'Concrete Technology', 'Geotechnical Engineering', 'Transportation Engineering', 'Environmental Engineering', 'Surveying', 'Construction Management', 'Hydraulics'],
    'EEE': ['Power Systems', 'Electrical Machines', 'Power Electronics', 'Control Systems', 'Renewable Energy', 'High Voltage Engineering', 'Power Quality', 'Smart Grid'],
    'DS': ['Data Science', 'Big Data Analytics', 'Statistical Methods', 'Data Visualization', 'Business Intelligence', 'Predictive Analytics', 'Data Engineering', 'Machine Learning'],
    'CS': ['Programming Fundamentals', 'Object-Oriented Programming', 'Data Structures', 'Algorithms', 'Software Engineering', 'Computer Networks', 'Database Systems', 'Web Development'],
    'MBA': ['Business Management', 'Financial Management', 'Marketing Management', 'Human Resource Management', 'Operations Management', 'Strategic Management', 'Business Analytics', 'Entrepreneurship'],
    'MATH': ['Calculus', 'Linear Algebra', 'Discrete Mathematics', 'Probability & Statistics', 'Numerical Methods', 'Differential Equations', 'Complex Analysis', 'Mathematical Modeling'],
    'PHY': ['Physics I', 'Physics II', 'Modern Physics', 'Quantum Mechanics', 'Thermodynamics', 'Electromagnetism', 'Optics', 'Solid State Physics'],
    'CHEM': ['Chemistry I', 'Chemistry II', 'Organic Chemistry', 'Inorganic Chemistry', 'Physical Chemistry', 'Analytical Chemistry', 'Biochemistry', 'Environmental Chemistry'],
    'ENG': ['English I', 'English II', 'Technical Writing', 'Communication Skills', 'Literature', 'Grammar', 'Vocabulary', 'Presentation Skills']
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const fetchTeachers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/teachers?limit=100');
      if (response.data.success) {
        setTeachers(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle subject input dynamically
  const handleSubjectChange = (index, value) => {
    const updated = [...subjects];
    updated[index] = value;
    setSubjects(updated);
  };

  const addSubject = () => {
    setSubjects([...subjects, '']);
  };

  const removeSubject = (index) => {
    if (subjects.length > 1) {
      const updated = subjects.filter((_, i) => i !== index);
      setSubjects(updated);
    }
  };

  // Auto-populate subjects based on department
  const handleDepartmentChange = (department) => {
    setClassDetails({ ...classDetails, department });
    if (department && departmentSubjects[department]) {
      setSubjects(departmentSubjects[department].slice(0, 6)); // Take first 6 subjects
    }
  };

  // Generate all slots
  const generateSlots = () => {
    let slots = [];
    days.forEach((day) => {
      periods.forEach((period) => {
        slots.push({ day, period });
      });
    });
    return slots;
  };

  // Timetable generator with better logic
  const generateTimetable = () => {
    if (!classDetails.department || !classDetails.section || !classDetails.semester || !classDetails.graduationYear) {
      alert('Please fill in all class details');
      return;
    }

    if (subjects.every(subj => !subj.trim())) {
      alert('Please add at least one subject');
      return;
    }

    const validSubjects = subjects.filter(subj => subj.trim());
    const slots = generateSlots();
    let newTable = {};

    days.forEach((day) => {
      newTable[day] = {};
      periods.forEach((period) => {
        // Better distribution of subjects
        const subjectIndex = Math.floor(Math.random() * validSubjects.length);
        const subject = validSubjects[subjectIndex];
        
        // Assign teacher based on subject (if available)
        const subjectTeachers = teachers.filter(teacher => 
          teacher.subject && teacher.subject.toLowerCase().includes(subject.toLowerCase())
        );
        
        let teacher;
        if (subjectTeachers.length > 0) {
          teacher = subjectTeachers[Math.floor(Math.random() * subjectTeachers.length)];
        } else {
          // Fallback to any available teacher
          teacher = teachers[Math.floor(Math.random() * teachers.length)] || { name: 'TBD', _id: 'tbd' };
        }
        
        const room = rooms[Math.floor(Math.random() * rooms.length)];
        
        newTable[day][period] = { 
          subject, 
          teacher: teacher.name, 
          teacherId: teacher._id,
          room,
          isSubstitution: false
        };
      });
    });

    setTimetable(newTable);
  };

  // Handle cell click for editing
  const handleCellClick = (day, period) => {
    if (!timetable) return;
    
    const cellData = timetable[day][period];
    setEditingCell({ day, period });
    setEditForm({
      subject: cellData.subject,
      teacherId: cellData.teacherId,
      room: cellData.room
    });
    setShowEditModal(true);
  };

  // Handle edit form submission
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editingCell) return;

    const updatedTimetable = { ...timetable };
    const selectedTeacher = teachers.find(t => t._id === editForm.teacherId);
    
    updatedTimetable[editingCell.day][editingCell.period] = {
      subject: editForm.subject,
      teacher: selectedTeacher ? selectedTeacher.name : 'TBD',
      teacherId: editForm.teacherId,
      room: editForm.room,
      isSubstitution: false
    };

    setTimetable(updatedTimetable);
    setShowEditModal(false);
    setEditingCell(null);
  };

  // Save timetable to database
  const saveTimetable = async () => {
    if (!timetable) {
      alert('No timetable to save');
      return;
    }

    try {
      // Convert timetable format to match our database schema
      const timetableData = [];
      days.forEach(day => {
        const dayData = { day: day.toLowerCase(), periods: [] };
        periods.forEach(period => {
          const cellData = timetable[day][period];
          dayData.periods.push({
            periodNumber: parseInt(period.replace('P', '')),
            subject: cellData.subject,
            teacherId: cellData.teacherId,
            room: cellData.room,
            isSubstitution: cellData.isSubstitution || false
          });
        });
        timetableData.push(dayData);
      });

      // Check for existing class with same details
      const classesRes = await api.get('/api/classes');
      const existing = (classesRes.data && classesRes.data.data || []).find(c =>
        c.department === classDetails.department &&
        c.section === classDetails.section &&
        String(c.semester) === String(classDetails.semester) &&
        String(c.graduationYear) === String(classDetails.graduationYear)
      );

      let classId = existing?._id;
      if (!classId) {
        const classResponse = await api.post('/api/classes', classDetails);
        if (!classResponse.data.success) throw new Error('Failed to create class');
        classId = classResponse.data.data._id;
      }

      // Save timetable for the class (create or update)
      const timetableResponse = await api.put(`/api/classes/${classId}/timetable`, {
        timetable: timetableData
      });

      if (timetableResponse.data.success) {
        // Persist last saved class to help ClassTimetableManager auto-select it
        try { localStorage.setItem('lastSavedClassId', classId); } catch (_) {}

        alert(`Timetable saved successfully for ${classDetails.department}-${classDetails.section}!`);
        // Reset form
        setClassDetails({ department: '', section: '', semester: '', graduationYear: '' });
        setSubjects(['']);
        setTimetable(null);
      }
    } catch (error) {
      console.error('Error saving timetable:', error);
      if (error.response?.data?.message?.includes('already exists')) {
        alert('A class with this combination already exists. Please check the existing classes or modify the details.');
      } else {
        alert(error.response?.data?.message || 'Error saving timetable');
      }
    }
  };

  // Regenerate timetable with different random distribution
  const regenerateTimetable = () => {
    if (!classDetails.department || !classDetails.section || !classDetails.semester || !classDetails.graduationYear) {
      alert('Please fill in all class details');
      return;
    }

    const validSubjects = subjects.filter(subj => subj.trim());
    if (validSubjects.length === 0) {
      alert('Please add at least one subject');
      return;
    }

    generateTimetable();
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
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg p-6 text-white">
        <div className="flex items-center">
          <FaMagic className="mr-3 h-8 w-8" />
          <div>
            <h1 className="text-2xl font-bold">Timetable Generator</h1>
            <p className="text-purple-100">Generate and manage class timetables automatically</p>
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-medium text-blue-800 mb-2">How to use:</h3>
        <ol className="text-sm text-blue-700 space-y-1">
          <li>1. Fill in the class details (Department, Section, Semester, Graduation Year)</li>
          <li>2. Subjects will auto-populate based on the selected department</li>
          <li>3. Click "Generate Timetable" to create a random timetable</li>
          <li>4. Click any cell to edit subject, teacher, or room</li>
          <li>5. Use "Regenerate" to create a new random distribution</li>
          <li>6. Click "Save Timetable" to save to the database</li>
        </ol>
      </div>

      {/* Class Details Form */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaBuilding className="mr-2" />
            Class Information
          </h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
              <select
                value={classDetails.department}
                onChange={(e) => handleDepartmentChange(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Department</option>
                {Object.keys(departmentSubjects).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Section *</label>
              <select
                value={classDetails.section}
                onChange={(e) => setClassDetails({ ...classDetails, section: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Section</option>
                {['A', 'B', 'C', 'D', 'E', 'F'].map(section => (
                  <option key={section} value={section}>{section}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester *</label>
              <select
                value={classDetails.semester}
                onChange={(e) => setClassDetails({ ...classDetails, semester: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Semester</option>
                {[1, 2, 3, 4, 5, 6, 7, 8].map(sem => (
                  <option key={sem} value={sem}>{sem}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Graduation Year *</label>
              <input
                type="text"
                placeholder="e.g., 2025"
                value={classDetails.graduationYear}
                onChange={(e) => setClassDetails({ ...classDetails, graduationYear: e.target.value })}
                className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>
        </div>
      </div>

      {/* Subjects Section */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <FaUserGraduate className="mr-2" />
            Subjects for {classDetails.department || 'Selected Department'}
          </h2>
          <p className="text-sm text-gray-600 mt-1">
            {classDetails.department ? `Auto-populated subjects for ${classDetails.department} department` : 'Select a department to auto-populate subjects'}
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-3">
            {subjects.map((subject, index) => (
              <div key={index} className="flex items-center space-x-3">
                <input
                  type="text"
                  placeholder={`Subject ${index + 1}`}
                  value={subject}
                  onChange={(e) => handleSubjectChange(index, e.target.value)}
                  className="flex-1 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {subjects.length > 1 && (
                  <button
                    onClick={() => removeSubject(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-md"
                    title="Remove subject"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
          <button
            onClick={addSubject}
            className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-blue-600 bg-blue-50 hover:bg-blue-100"
          >
            <FaPlus className="mr-2 h-4 w-4" />
            Add Subject
          </button>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex justify-center">
        <button
          onClick={generateTimetable}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
        >
          <FaMagic className="mr-2 h-5 w-5" />
          Generate Timetable
        </button>
      </div>

      {/* Generated Timetable */}
      {timetable && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <FaTable className="mr-2" />
              Generated Timetable
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              {classDetails.department}-{classDetails.section} (Sem {classDetails.semester}, {classDetails.graduationYear})
            </p>
          </div>
          <div className="p-6">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="border border-gray-300 p-3 text-left font-medium text-gray-700">Day</th>
                    {periods.map((period) => (
                      <th key={period} className="border border-gray-300 p-3 text-center font-medium text-gray-700">
                        {period}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {days.map((day) => (
                    <tr key={day}>
                      <td className="border border-gray-300 p-3 font-medium bg-gray-50">
                        {day}
                      </td>
                      {periods.map((period) => (
                        <td
                          key={period}
                          className="border border-gray-300 p-2 text-sm cursor-pointer hover:bg-blue-50 transition-colors"
                          onClick={() => handleCellClick(day, period)}
                        >
                          <div className="bg-white rounded p-2 shadow-sm">
                            <div className="font-semibold text-gray-800">
                              {timetable[day][period].subject}
                            </div>
                            <div className="text-gray-600 text-xs mt-1">
                              {timetable[day][period].teacher}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {timetable[day][period].room}
                            </div>
                          </div>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            {/* Action Buttons */}
            <div className="mt-6 flex justify-center space-x-4">
              <button
                onClick={regenerateTimetable}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-purple-600 bg-purple-50 hover:bg-purple-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
              >
                <FaMagic className="mr-2 h-5 w-5" />
                Regenerate
              </button>
              <button
                onClick={saveTimetable}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <FaSave className="mr-2 h-5 w-5" />
                Save Timetable
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingCell && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-full max-w-md shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <FaEdit className="mr-2" />
                Edit Period
              </h3>
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Day:</strong> {editingCell.day}<br/>
                  <strong>Period:</strong> {editingCell.period}
                </p>
              </div>
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Subject *</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Teacher *</label>
                  <select
                    value={editForm.teacherId}
                    onChange={(e) => setEditForm({ ...editForm, teacherId: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Select Teacher</option>
                    {teachers.map(teacher => (
                      <option key={teacher._id} value={teacher._id}>
                        {teacher.name} - {teacher.subject}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Room</label>
                  <select
                    value={editForm.room}
                    onChange={(e) => setEditForm({ ...editForm, room: e.target.value })}
                    className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Room</option>
                    {rooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  >
                    Save Changes
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

export default TimetableGenerator;
