import React, { useState } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Select,
  Button,
  Text,
  Heading,
  Stack,
  Card,
  CardHeader,
  CardBody,
  useToast,
  Divider
} from '@chakra-ui/react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { Play } from 'lucide-react';
import { attendanceAPI } from '../../services/api';

const STREAMS = [
  {
    label: 'Computer Science',
    value: 'Computer Science',
    prefix: 'CS',
    years: [
      {
        label: '1st Year',
        value: '1',
        semesters: [
          { label: 'Semester I', value: '1', subjects: [
            ['CS-101', 'Mathematics-IA (BS-M101)'],
            ['CS-102', 'Physics-I (BS-PH101)'],
            ['CS-103', 'Basic Electrical Engineering (ES-EE101)'],
            ['CS-104', 'Physics-I Laboratory (BS-PH191)'],
            ['CS-105', 'Basic Electrical Engineering Lab (ES-EE191)'],
            ['CS-106', 'Workshop (ES-ME192)'],
          ]},
          { label: 'Semester II', value: '2', subjects: [
            ['CS-201', 'Chemistry-I (BS-CH201)'],
            ['CS-202', 'Mathematics-IIA (BS-M201)'],
            ['CS-203', 'Programming for Problem Solving (ES-CS201)'],
            ['CS-204', 'English (HM-HU201)'],
            ['CS-205', 'Chemistry-I Laboratory (BS-CH291)'],
            ['CS-206', 'Programming for Problem Solving Lab (ES-CS291)'],
            ['CS-207', 'Engineering Graphics & Design (ES-ME291)'],
            ['CS-208', 'Language Laboratory (HM-HU291)'],
          ]},
        ],
      },
      {
        label: '2nd Year',
        value: '2',
        semesters: [
          { label: 'Semester III', value: '3', subjects: [
            ['CS-301', 'Analog and Digital Electronics (ESC 301)'],
            ['CS-302', 'Data Structure & Algorithms (PCC-CS301)'],
            ['CS-303', 'Computer Organisation (PCC-CS302)'],
            ['CS-304', 'Mathematics-III (BSC 301)'],
            ['CS-305', 'Economics for Engineers (HSMC 301)'],
            ['CS-306', 'Analog and Digital Electronics Lab (ESC 391)'],
            ['CS-307', 'Data Structure & Algorithm Lab (PCC-CS391)'],
            ['CS-308', 'Computer Organization Lab (PCC-CS392)'],
            ['CS-309', 'IT Workshop (PCC-CS393)'],
          ]},
          { label: 'Semester IV', value: '4', subjects: [
            ['CS-401', 'Discrete Mathematics (PCC-CS401)'],
            ['CS-402', 'Computer Architecture (PCC-CS402)'],
            ['CS-403', 'Formal Language & Automata Theory (PCC-CS403)'],
            ['CS-404', 'Design and Analysis of Algorithms (PCC-CS404)'],
            ['CS-405', 'Biology (BSC 401)'],
            ['CS-406', 'Environmental Sciences (MC-401)'],
            ['CS-407', 'Computer Architecture Lab (PCC-CS492)'],
            ['CS-408', 'Design & Analysis Algorithm Lab (PCC-CS494)'],
          ]},
        ],
      },
      {
        label: '3rd Year',
        value: '3',
        semesters: [
          { label: 'Semester V', value: '5', subjects: [
            ['CS-501', 'Software Engineering (ESC501)'],
            ['CS-502', 'Compiler Design (PCC-CS501)'],
            ['CS-503', 'Operating Systems (PCC-CS502)'],
            ['CS-504', 'Object Oriented Programming (PCC-CS503)'],
            ['CS-505', 'Introduction to Industrial Management (HSMC-501)'],
            ['CS-506', 'Artificial Intelligence (PEC-IT501B)'],
            ['CS-507', 'Constitution of India (MC-CS501)'],
            ['CS-508', 'Software Engineering Lab (ESC591)'],
            ['CS-509', 'Operating System Lab (PCC-CS592)'],
            ['CS-510', 'Object Oriented Programming Lab (PCC-CS593)'],
          ]},
          { label: 'Semester VI', value: '6', subjects: [
            ['CS-601', 'Database Management Systems (PCC-CS601)'],
            ['CS-602', 'Computer Networks (PCC-CS602)'],
            ['CS-603', 'Research Methodology (PROJ-CS601)'],
            ['CS-604', 'Distributed Systems (PEC-IT601B)'],
            ['CS-605', 'Image Processing (PEC-IT601D)'],
            ['CS-606', 'Pattern Recognition (PEC-IT602D)'],
            ['CS-607', 'Numerical Methods (OEC-IT601A)'],
            ['CS-608', 'Database Management System Lab (PCC-CS691)'],
            ['CS-609', 'Computer Networks Lab (PCC-CS692)'],
          ]},
        ],
      },
      {
        label: '4th Year',
        value: '4',
        semesters: [
          { label: 'Semester VII', value: '7', subjects: [
            ['CS-701', 'Project Management and Entrepreneurship (HSMC 701)'],
            ['CS-702', 'Machine Learning (PEC-CS701E)'],
            ['CS-703', 'Soft Computing (PEC-CS702B)'],
            ['CS-704', 'Adhoc-Sensor Network (PEC-CS702C)'],
            ['CS-705', 'Operation Research (OEC-CS701A)'],
            ['CS-706', 'Multimedia Technology (OEC-CS701B)'],
            ['CS-707', 'Project-II (PROJ-CS781)'],
          ]},
          { label: 'Semester VIII', value: '8', subjects: [
            ['CS-801', 'Cryptography and Network Security (PEC-CS801B)'],
            ['CS-802', 'Internet of Things (PEC-CS801E)'],
            ['CS-803', 'Big Data Analytics (OEC-CS801A)'],
            ['CS-804', 'Mobile Computing (OEC-CS801C)'],
            ['CS-805', 'E-Commerce & ERP (OEC-CS802A)'],
            ['CS-806', 'Project-III (PROJ-CS881)'],
          ]},
        ],
      },
    ],
  },
];

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const { theme } = useOutletContext();
  const toast = useToast();

  const [department, setDepartment] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [allowedRadius, setAllowedRadius] = useState('');
  const [locating, setLocating] = useState(false);
  const handleLaunchScan = async () => {
    if (!department || !year || !semester || !subject) {
      toast({
        title: 'Incomplete Session Configuration',
        description: 'Please select stream, year, semester, and subject before opening the attendance window.',
        status: 'warning',
        duration: 3500,
        isClosable: true
      });
      return;
    }

    toast({
      title: 'Initializing Biometric Scan Session',
      description: `Starting scanner for ${subject} (${department} Sem ${semester})`,
      status: 'info',
      duration: 2500,
      isClosable: true
    });

    const selectedSubject = availableSubjects.find(([code]) => code === subject);
    const subjectName = selectedSubject?.[1] || subject;

    const geofenceEnabled = Boolean(allowedRadius);
    let teacherLocation = null;
    if (geofenceEnabled) {
      setLocating(true);
      try {
        teacherLocation = await new Promise((resolve, reject) => {
          if (!navigator.geolocation) return reject(new Error('Geolocation is not supported by this browser.'));
          navigator.geolocation.getCurrentPosition(
            ({ coords }) => resolve({ latitude: coords.latitude, longitude: coords.longitude, accuracy: coords.accuracy }),
            () => reject(new Error('Allow location access to open a geofenced attendance window.')),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });
      } catch (err) {
        toast({ title: 'Classroom location unavailable', description: err.message, status: 'error', duration: 5000, isClosable: true });
        setLocating(false);
        return;
      }
    }

    let openedSession;
    try {
      openedSession = await attendanceAPI.toggleSession({
        classCode: subject,
        active: true,
        latitude: teacherLocation?.latitude,
        longitude: teacherLocation?.longitude,
        allowedRadiusMeters: geofenceEnabled ? Number(allowedRadius) : null,
        locationRequired: geofenceEnabled
      });
      localStorage.setItem('teacherAttendanceScope', JSON.stringify({
        department,
        year,
        semester,
        classCode: subject,
        subjectName,
        sessionId: openedSession.sessionId
      }));
    } catch (err) {
      toast({
        title: 'Could not open attendance window',
        description: err.message || 'Please try again.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
      setLocating(false);
      return;
    }
    setLocating(false);

    const sessionQuery = new URLSearchParams({
      stream: department,
      year,
      sem: semester,
      classCode: subject,
      subject: subjectName,
      sessionId: String(openedSession.sessionId)
    });
    navigate(`/webcam?${sessionQuery.toString()}`);
  };

  const isDark = theme === 'dark';
  const bgPrimary = isDark ? '#09090b' : 'gray.50';
  const bgSecondary = isDark ? '#18181b' : 'white';
  const borderColor = isDark ? '#27272a' : 'gray.200';
  const textColor = isDark ? '#f4f4f5' : 'gray.800';
  const textMuted = isDark ? '#a1a1aa' : 'gray.500';
  const textLabel = isDark ? '#e4e4e7' : 'gray.600';
  const optionBg = isDark ? '#18181b' : 'white';
  const selectedStream = STREAMS.find(s => s.value === department);
  const availableYears = selectedStream?.years || [];
  const selectedYear = availableYears.find(y => y.value === year);
  const availableSemesters = selectedYear?.semesters || [];
  const selectedSemester = availableSemesters.find(s => s.value === semester);
  const availableSubjects = selectedSemester?.subjects || [];

  return (
    <Box p={6} bg={bgPrimary} minH="100vh" w="100%" transition="all 0.3s">
      {/* Title Header */}
      <Box mb={6}>
        <Heading size="lg" color={textColor} fontWeight="bold">Faculty Dashboard</Heading>
        <Text color={textMuted} fontSize="sm">Configure a class, then monitor verified attendance in its live window</Text>
      </Box>

      {/* Primary Grid Layout */}
      <Grid templateColumns="1fr" gap={6}>
        {/* Left Panel: Session Setup Wizard */}
        <GridItem>
          <Card borderRadius="xl" shadow="md" bg={bgSecondary} border={isDark ? "1px solid" : "none"} borderColor={borderColor}>
            <CardHeader pb={0}>
              <Heading size="md" color={textColor}>Initialize Attendance Window</Heading>
              <Text fontSize="xs" color={textMuted}>Select stream, year, semester, and subject before monitoring verified check-ins</Text>
            </CardHeader>
            <CardBody>
              <Stack spacing={5}>
                <FormControl>
                  <FormLabel fontSize="sm" fontWeight="bold" color={textLabel}>Classroom geofence radius (optional)</FormLabel>
                  <Select value={allowedRadius} onChange={(e) => setAllowedRadius(e.target.value)} bg={bgSecondary} color={textColor} borderColor={borderColor}>
                    <option value="" style={{ background: optionBg, color: textColor }}>Disabled — allow attendance from anywhere</option>
                    <option value="50" style={{ background: optionBg, color: textColor }}>50 metres</option>
                    <option value="100" style={{ background: optionBg, color: textColor }}>100 metres (recommended)</option>
                    <option value="200" style={{ background: optionBg, color: textColor }}>200 metres</option>
                  </Select>
                  <Text mt={1} fontSize="xs" color={textMuted}>Leave disabled for testing. Selecting a radius enables location verification.</Text>
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={textLabel}>Select Stream</FormLabel>
                  <Select
                    placeholder="Choose Stream"
                    value={department}
                    onChange={(e) => {
                      setDepartment(e.target.value);
                      setYear('');
                      setSemester('');
                      setSubject('');
                    }}
                    focusBorderColor="blue.400"
                    bg={bgSecondary}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: isDark ? 'whiteAlpha.450' : 'gray.300' }}
                  >
                    {STREAMS.map(stream => (
                      <option key={stream.value} value={stream.value} style={{ background: optionBg, color: textColor }}>{stream.label}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={textLabel}>Select Year</FormLabel>
                  <Select
                    placeholder="Choose Year"
                    value={year}
                    onChange={(e) => {
                      setYear(e.target.value);
                      setSemester('');
                      setSubject('');
                    }}
                    isDisabled={!department}
                    focusBorderColor="blue.400"
                    bg={bgSecondary}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: isDark ? 'whiteAlpha.450' : 'gray.300' }}
                  >
                    {availableYears.map(item => (
                      <option key={item.value} value={item.value} style={{ background: optionBg, color: textColor }}>{item.label}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={textLabel}>Select Semester</FormLabel>
                  <Select
                    placeholder="Choose Semester"
                    value={semester}
                    onChange={(e) => {
                      setSemester(e.target.value);
                      setSubject('');
                    }}
                    isDisabled={!year}
                    focusBorderColor="blue.400"
                    bg={bgSecondary}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: isDark ? 'whiteAlpha.450' : 'gray.300' }}
                  >
                    {availableSemesters.map(item => (
                      <option key={item.value} value={item.value} style={{ background: optionBg, color: textColor }}>{item.label}</option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color={textLabel}>Subject / Course Module</FormLabel>
                  <Select
                    placeholder="Choose Course Module"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    isDisabled={!semester}
                    focusBorderColor="blue.400"
                    bg={bgSecondary}
                    color={textColor}
                    borderColor={borderColor}
                    _hover={{ borderColor: isDark ? 'whiteAlpha.450' : 'gray.300' }}
                  >
                    {availableSubjects.map(([code, name]) => (
                      <option key={code} value={code} style={{ background: optionBg, color: textColor }}>{name}</option>
                    ))}
                  </Select>
                </FormControl>

                <Divider pt={2} borderColor={borderColor} />

                <Button
                  leftIcon={<Play size={18} />}
                  colorScheme="blue"
                  size="lg"
                  w="100%"
                  shadow="md"
                  onClick={handleLaunchScan}
                  isLoading={locating}
                  loadingText="Getting classroom location"
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.2s"
                >
                  Initialize Face Recognition Scanning
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

      </Grid>
    </Box>
  );
}
