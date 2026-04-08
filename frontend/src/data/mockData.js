// Mock data for the HostelOS application
// Shaped to match the backend API response format for easy switching

export const mockStudents = [
  { _id: '1', name: 'Rahul Jaiswal', email: 'rahul@college.edu', studentId: 'STU001', room: '104A', phone: '9876543210', role: 'student', status: 'active', year: '3rd', branch: 'CSE', joinDate: '2024-07-15' },
  { _id: '2', name: 'Ananya Sharma', email: 'ananya@college.edu', studentId: 'STU002', room: '302B', phone: '9876543211', role: 'student', status: 'active', year: '2nd', branch: 'ECE', joinDate: '2024-07-15' },
  { _id: '3', name: 'Karthik V.', email: 'karthik@college.edu', studentId: 'STU003', room: '210C', phone: '9876543212', role: 'student', status: 'active', year: '4th', branch: 'ME', joinDate: '2023-07-15' },
  { _id: '4', name: 'Priya Patel', email: 'priya@college.edu', studentId: 'STU004', room: '205A', phone: '9876543213', role: 'student', status: 'active', year: '1st', branch: 'IT', joinDate: '2025-07-15' },
  { _id: '5', name: 'Arjun Mehta', email: 'arjun@college.edu', studentId: 'STU005', room: '108B', phone: '9876543214', role: 'student', status: 'active', year: '3rd', branch: 'CSE', joinDate: '2024-07-15' },
  { _id: '6', name: 'Sneha Reddy', email: 'sneha@college.edu', studentId: 'STU006', room: '401A', phone: '9876543215', role: 'student', status: 'active', year: '2nd', branch: 'EEE', joinDate: '2024-07-15' },
]

export const mockRooms = Array.from({ length: 40 }, (_, i) => {
  const floor = Math.floor(i / 10) + 1
  const num = (i % 10) + 1
  const roomNum = `${floor}${String(num).padStart(2, '0')}`
  const statuses = ['occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'occupied', 'vacant', 'maintenance', 'occupied']
  const status = statuses[i % 10]
  return {
    _id: `room_${i}`,
    roomNumber: roomNum,
    floor: floor,
    type: i % 3 === 0 ? 'single' : 'double',
    capacity: i % 3 === 0 ? 1 : 2,
    occupants: status === 'occupied' ? (i % 3 === 0 ? 1 : Math.random() > 0.3 ? 2 : 1) : 0,
    status,
    amenities: ['WiFi', 'AC', 'Attached Bathroom'],
    monthlyRent: i % 3 === 0 ? 8000 : 6000,
    wing: floor <= 2 ? 'A' : 'B',
  }
})

export const mockComplaints = [
  { _id: 'c1', complaintId: 'CMP-1024', student: mockStudents[0], room: '104A', title: 'AC leakage in main unit', description: 'The air conditioner is leaking water onto the floor near the electrical outlet.', category: 'electrical', status: 'urgent', priority: 'high', assignedTo: 'Manoj (Elec)', createdAt: '2025-10-12T10:30:00Z', updatedAt: '2025-10-12T14:15:00Z' },
  { _id: 'c2', complaintId: 'CMP-1023', student: mockStudents[1], room: '302B', title: 'WiFi connectivity issues', description: 'WiFi keeps dropping every 10 minutes in the room.', category: 'network', status: 'in-progress', priority: 'medium', assignedTo: 'IT Support', createdAt: '2025-10-11T09:00:00Z', updatedAt: '2025-10-12T11:00:00Z' },
  { _id: 'c3', complaintId: 'CMP-1022', student: mockStudents[2], room: '210C', title: 'Clogged bathroom drain', description: 'The bathroom drain is completely blocked and water is accumulating.', category: 'plumbing', status: 'pending', priority: 'medium', assignedTo: null, createdAt: '2025-10-11T16:00:00Z', updatedAt: '2025-10-11T16:00:00Z' },
  { _id: 'c4', complaintId: 'CMP-1021', student: mockStudents[3], room: '205A', title: 'Broken window latch', description: 'The window latch on the study area window is broken.', category: 'furniture', status: 'resolved', priority: 'low', assignedTo: 'Raju (Maint)', createdAt: '2025-10-09T08:00:00Z', updatedAt: '2025-10-10T15:00:00Z' },
  { _id: 'c5', complaintId: 'CMP-1020', student: mockStudents[4], room: '108B', title: 'Hot water not working', description: 'The geyser is not heating water in the morning hours.', category: 'plumbing', status: 'in-progress', priority: 'high', assignedTo: 'Suresh (Plum)', createdAt: '2025-10-10T06:30:00Z', updatedAt: '2025-10-11T09:00:00Z' },
]

export const mockNotices = [
  { _id: 'n1', title: 'Mess Menu Update', message: 'Special festive menu introduced for the upcoming weekend. Check attachments for details.', icon: 'restaurant', category: 'mess', time: '2 hours ago', color: 'secondary' },
  { _id: 'n2', title: 'Electricity Maintenance', message: 'Scheduled power cut in Wing A from 2 PM to 4 PM for panel upgrades.', icon: 'bolt', category: 'maintenance', time: '5 hours ago', color: 'error' },
  { _id: 'n3', title: 'Wing Sports Meet', message: 'Registrations open for the annual inter-wing cricket tournament.', icon: 'event', category: 'events', time: 'Yesterday', color: 'primary' },
  { _id: 'n4', title: 'Library Hours Extended', message: 'Library timings extended till 11 PM during exam season.', icon: 'menu_book', category: 'academic', time: '2 days ago', color: 'tertiary' },
]

export const mockStaff = [
  { _id: 's1', name: 'Manoj Kumar', role: 'Electrician', department: 'Maintenance', phone: '9876543220', status: 'active', shift: 'Morning', activeComplaints: 3 },
  { _id: 's2', name: 'Suresh Babu', role: 'Plumber', department: 'Maintenance', phone: '9876543221', status: 'active', shift: 'Morning', activeComplaints: 2 },
  { _id: 's3', name: 'Raju Pillai', role: 'General Maintenance', department: 'Maintenance', phone: '9876543222', status: 'active', shift: 'Evening', activeComplaints: 1 },
  { _id: 's4', name: 'Lakshmi Devi', role: 'Housekeeping Lead', department: 'Cleaning', phone: '9876543223', status: 'active', shift: 'Morning', activeComplaints: 0 },
  { _id: 's5', name: 'Ramesh IT', role: 'IT Support', department: 'Technology', phone: '9876543224', status: 'on-leave', shift: 'Full Day', activeComplaints: 4 },
]

export const mockDocuments = [
  { _id: 'd1', title: 'Hostel Rules & Regulations', type: 'PDF', size: '2.4 MB', category: 'rules', uploadDate: '2025-01-15', downloads: 342 },
  { _id: 'd2', title: 'Fee Structure 2025-26', type: 'PDF', size: '1.1 MB', category: 'finance', uploadDate: '2025-03-01', downloads: 567 },
  { _id: 'd3', title: 'Room Allotment Policy', type: 'PDF', size: '890 KB', category: 'policy', uploadDate: '2025-02-20', downloads: 234 },
  { _id: 'd4', title: 'Mess Menu Schedule', type: 'PDF', size: '560 KB', category: 'mess', uploadDate: '2025-10-01', downloads: 890 },
  { _id: 'd5', title: 'Emergency Contact List', type: 'PDF', size: '340 KB', category: 'emergency', uploadDate: '2025-01-10', downloads: 156 },
  { _id: 'd6', title: 'Maintenance Request Form', type: 'DOCX', size: '120 KB', category: 'forms', uploadDate: '2025-06-15', downloads: 78 },
]

export const mockLeaveRequests = [
  { _id: 'l1', student: mockStudents[0], type: 'Home Visit', from: '2025-10-15', to: '2025-10-20', reason: 'Family function', status: 'approved', appliedOn: '2025-10-08' },
  { _id: 'l2', student: mockStudents[1], type: 'Medical', from: '2025-10-14', to: '2025-10-16', reason: 'Doctor appointment in hometown', status: 'pending', appliedOn: '2025-10-12' },
  { _id: 'l3', student: mockStudents[4], type: 'Home Visit', from: '2025-10-20', to: '2025-10-25', reason: 'Diwali vacation', status: 'pending', appliedOn: '2025-10-10' },
]

export const mockApplications = [
  { _id: 'a1', student: mockStudents[3], type: 'Room Change', from: '205A', to: '301B', reason: 'Want to be near study group', status: 'pending', appliedOn: '2025-10-11' },
  { _id: 'a2', student: mockStudents[5], type: 'New Allotment', preferredFloor: 4, preferredType: 'single', reason: 'Returning student for new semester', status: 'pending', appliedOn: '2025-10-10' },
  { _id: 'a3', student: { name: 'Vikram Singh', studentId: 'STU007', email: 'vikram@college.edu' }, type: 'New Allotment', preferredFloor: 2, preferredType: 'double', reason: 'New admission', status: 'approved', appliedOn: '2025-10-05' },
]

export const mockMaintenanceSchedule = [
  { _id: 'm1', task: 'Wing A Corridor Cleaning', assignee: 'Housekeeping Team A', schedule: 'Daily 6:00 AM', status: 'completed', nextDue: 'Tomorrow 6:00 AM' },
  { _id: 'm2', task: 'Water Tank Cleaning', assignee: 'Suresh Babu', schedule: 'Weekly (Monday)', status: 'scheduled', nextDue: 'Monday 8:00 AM' },
  { _id: 'm3', task: 'Generator Maintenance', assignee: 'Manoj Kumar', schedule: 'Monthly', status: 'overdue', nextDue: 'Overdue by 3 days' },
  { _id: 'm4', task: 'Pest Control - Wing B', assignee: 'External Vendor', schedule: 'Quarterly', status: 'scheduled', nextDue: 'Oct 25, 2025' },
  { _id: 'm5', task: 'Fire Extinguisher Inspection', assignee: 'Safety Officer', schedule: 'Bi-annual', status: 'completed', nextDue: 'Apr 2026' },
]

export const mockDashboardStats = {
  admin: {
    totalStudents: 1240,
    occupancyRate: 94,
    openComplaints: 18,
    pendingApprovals: 5,
    totalRooms: 40,
    vacantRooms: 6,
    maintenanceRooms: 2,
    revenue: 7440000,
  },
  student: {
    roomNumber: '302',
    complaintStatus: 'Resolved',
    newNotices: 2,
    pendingPayment: 6000,
    nextLeave: null,
  }
}

export const mockUsers = {
  admin: { _id: 'admin1', name: 'Admin Warden', email: 'admin@hostel.com', role: 'admin', wing: 'Premium Wing A' },
  student: { _id: 'stu1', name: 'Alex Johnson', email: 'alex@college.edu', role: 'student', studentId: 'STU001', room: '302', phone: '9876543210', year: '3rd', branch: 'CSE' },
  staff: { _id: 'staff1', name: 'Maintenance Lead', email: 'staff@hostel.com', role: 'warden', department: 'Maintenance' },
}
