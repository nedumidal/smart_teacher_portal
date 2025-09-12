# Substitution Management System

This document describes the complete substitution management flow implemented in the Smart Hospital Portal.

## Overview

The substitution management system allows admins to handle teacher leave requests and assign substitute teachers automatically. The system includes:

1. **Leave Request Management** - Teachers can submit leave requests
2. **Admin Approval** - Admins can approve/reject leave requests
3. **Substitution Assignment** - Admins can assign substitute teachers
4. **Teacher Response** - Substitute teachers can accept/reject substitution requests
5. **Status Tracking** - Real-time status updates for all parties

## Flow Diagram

```
Teacher submits leave request
         ↓
Admin reviews and approves leave
         ↓
Leave appears in "Pending Leave Requests" (Manage Substitutions)
         ↓
Admin selects leave and assigns substitution
         ↓
Substitution request sent to recommended teacher
         ↓
Teacher accepts/rejects substitution request
         ↓
Admin sees updated status in "Active Substitutions"
```

## Components

### Backend Routes

#### Leave Routes (`/api/leaves`)
- `GET /pending` - Get pending leave requests (admin only)
- `GET /all` - Get all leaves (admin only)
- `PUT /:id/approve` - Approve leave request (admin only)
- `PUT /:id/reject` - Reject leave request (admin only)

#### Timetable Routes (`/api/timetable`)
- `GET /substitution-recommendations` - Get recommended substitute teachers
- `POST /assign-substitution` - Assign substitution to teacher
- `PATCH /substitutions/:id/accept` - Accept substitution request
- `PATCH /substitutions/:id/reject` - Reject substitution request
- `GET /substitutions/all` - Get all substitutions (admin only)
- `GET /substitutions/:teacherId` - Get teacher's substitutions

### Frontend Components

#### Admin Components
- **ManageLeaves** (`/admin/manage-leaves`) - Approve/reject leave requests
- **ManageSubstitutions** (`/admin/manage-substitutions`) - Assign and track substitutions

#### Teacher Components
- **SubstitutionRequests** (`/teacher/substitution-requests`) - View and respond to substitution requests

## Database Models

### Leave Model
```javascript
{
  teacherId: ObjectId,
  date: Date,
  reason: String,
  status: ['pending', 'approved', 'rejected', 'cancelled'],
  leaveType: ['sick', 'personal', 'medical', 'other'],
  duration: ['half-day', 'full-day', 'multiple-days'],
  finalSubstitute: ObjectId, // Reference to assigned substitute
  approvedBy: ObjectId,
  approvedAt: Date
}
```

### Substitution Model
```javascript
{
  leaveId: ObjectId,
  originalTeacherId: ObjectId,
  substituteTeacherId: ObjectId,
  day: String,
  periodNumber: Number,
  subject: String,
  className: String,
  status: ['requested', 'accepted', 'rejected', 'completed'],
  assignedBy: ObjectId,
  assignedAt: Date,
  acceptedAt: Date,
  rejectedAt: Date,
  rejectionReason: String,
  notes: String
}
```

## Usage Instructions

### For Teachers

1. **Submit Leave Request**
   - Go to Teacher Dashboard
   - Click "Request Leave"
   - Fill in leave details and submit

2. **Respond to Substitution Requests**
   - Go to "Substitution Requests" section
   - View pending substitution requests
   - Click "Accept" or "Reject" with reason

### For Admins

1. **Manage Leave Requests**
   - Go to Admin Dashboard
   - Click "Manage Leaves"
   - Review pending leave requests
   - Click "Approve" or "Reject"

2. **Assign Substitutions**
   - Go to "Manage Substitutions"
   - View "Pending Leave Requests"
   - Click on a leave request
   - Enter class details and click "Find Teachers"
   - Select recommended teacher and click "Assign"

3. **Track Substitution Status**
   - View "Active Substitutions" table
   - See real-time status updates
   - Monitor teacher responses

## Features

### Automatic Recommendations
The system automatically recommends substitute teachers based on:
- Subject compatibility
- Availability (free periods)
- Attendance record
- Leave balance
- Previous substitution history

### Real-time Updates
- Status changes are reflected immediately
- Teachers receive instant notifications
- Admin dashboard shows live updates

### Comprehensive Tracking
- Full audit trail of all actions
- Status history for each substitution
- Reason tracking for rejections
- Performance metrics

## API Endpoints

### Leave Management
```bash
# Get pending leaves
GET /api/leaves/pending

# Get all leaves
GET /api/leaves/all

# Approve leave
PUT /api/leaves/:id/approve

# Reject leave
PUT /api/leaves/:id/reject
```

### Substitution Management
```bash
# Get substitution recommendations
GET /api/timetable/substitution-recommendations?subject=Math&day=monday&periodNumber=1

# Assign substitution
POST /api/timetable/assign-substitution

# Accept substitution
PATCH /api/timetable/substitutions/:id/accept

# Reject substitution
PATCH /api/timetable/substitutions/:id/reject

# Get all substitutions
GET /api/timetable/substitutions/all
```

## Status Flow

1. **Leave Request**: `pending` → `approved`/`rejected`
2. **Substitution Request**: `requested` → `accepted`/`rejected`
3. **Final Status**: `completed` (after class is conducted)

## Error Handling

- Duplicate substitution prevention
- Availability validation
- Permission checks
- Input validation
- Graceful error messages

## Future Enhancements

- Email notifications
- SMS alerts
- Calendar integration
- Bulk substitution assignments
- Advanced analytics
- Mobile app support
