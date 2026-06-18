import React, { useState, useEffect } from 'react';
import {
  Box,
  Flex,
  Grid,
  GridItem,
  FormControl,
  FormLabel,
  Select,
  Button,
  Avatar,
  Text,
  Spacer,
  Heading,
  Stack,
  Card,
  CardHeader,
  CardBody,
  Badge,
  useToast,
  Spinner,
  Stat,
  StatLabel,
  StatNumber,
  SimpleGrid,
  Divider,
  HStack
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { Users, CheckCircle, XCircle, Play } from 'lucide-react';
import { dashboardAPI, reportsAPI } from '../../services/api';

export default function FacultyDashboard() {
  const navigate = useNavigate();
  const toast = useToast();

  // Faculty session states
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [subject, setSubject] = useState('');
  const [loading, setLoading] = useState(true);

  // Stats and history states
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalPresent: 0,
    totalAbsent: 0,
    attendanceRate: 0,
    recentAttendance: []
  });

  const loadDashboardData = async () => {
    try {
      const statsRes = await dashboardAPI.getStats();
      setStats(statsRes);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      toast({
        title: 'Error loading dashboard',
        description: err.message || 'Could not fetch faculty workspace metrics.',
        status: 'error',
        duration: 4000,
        isClosable: true
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  const handleLaunchScan = () => {
    if (!department || !semester || !subject) {
      toast({
        title: 'Incomplete Session Configuration',
        description: 'Please select Subject, Semester, and Department before launching webcam scans.',
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

    // Navigate to the webcam screen with routing parameters
    navigate(`/webcam?dept=${encodeURIComponent(department)}&sem=${encodeURIComponent(semester)}&sub=${encodeURIComponent(subject)}`);
  };

  if (loading) {
    return (
      <Flex minH="80vh" align="center" justify="center">
        <Spinner size="xl" thickness="4px" speed="0.65s" color="blue.500" />
      </Flex>
    );
  }

  return (
    <Box p={6} bg="gray.50" minH="100vh">
      {/* Title Header */}
      <Box mb={6}>
        <Heading size="lg" color="gray.800" fontWeight="bold">Faculty Dashboard</Heading>
        <Text color="gray.500" fontSize="sm">Launch scanning sessions and view live student attendance updates</Text>
      </Box>

      {/* Quick Metrics Banner */}
      <SimpleGrid columns={{ base: 1, sm: 2, md: 4 }} spacing={6} mb={8}>
        <Card shadow="sm" borderTop="4px solid" borderColor="blue.500">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500">Total Students</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="blue.600">{stats.totalStudents}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm" borderTop="4px solid" borderColor="green.500">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500">Present Today</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="green.600">{stats.totalPresent}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm" borderTop="4px solid" borderColor="red.500">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500">Absent Today</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="red.600">{stats.totalAbsent}</StatNumber>
            </Stat>
          </CardBody>
        </Card>
        <Card shadow="sm" borderTop="4px solid" borderColor="purple.500">
          <CardBody>
            <Stat>
              <StatLabel color="gray.500">Attendance Rate</StatLabel>
              <StatNumber fontSize="2xl" fontWeight="bold" color="purple.600">{stats.attendanceRate}%</StatNumber>
            </Stat>
          </CardBody>
        </Card>
      </SimpleGrid>

      {/* Primary Split Workspace */}
      <Grid templateColumns={{ base: '1fr', lg: '4fr 5fr' }} gap={8}>
        {/* Left Column: Session Initializer Block */}
        <GridItem>
          <Card borderRadius="xl" shadow="md" bg="white">
            <CardHeader pb={0}>
              <Heading size="md" color="gray.700">Initialize Biometric Session</Heading>
              <Text fontSize="xs" color="gray.400">Configure parameters to deploy the real-time SFace scanning window</Text>
            </CardHeader>
            <CardBody>
              <Stack spacing={5}>
                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Select Department</FormLabel>
                  <Select
                    placeholder="Select Department"
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    focusBorderColor="blue.400"
                  >
                    <option value="Computer Science">Computer Science</option>
                    <option value="Information Technology">Information Technology</option>
                    <option value="Electronics & Communication">Electronics & Communication</option>
                    <option value="Mechanical Engineering">Mechanical Engineering</option>
                    <option value="Civil Engineering">Civil Engineering</option>
                    <option value="Electrical Engineering">Electrical Engineering</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Select Semester</FormLabel>
                  <Select
                    placeholder="Select Semester"
                    value={semester}
                    onChange={(e) => setSemester(e.target.value)}
                    focusBorderColor="blue.400"
                  >
                    <option value="1">Semester 1</option>
                    <option value="2">Semester 2</option>
                    <option value="3">Semester 3</option>
                    <option value="4">Semester 4</option>
                    <option value="5">Semester 5</option>
                    <option value="6">Semester 6</option>
                    <option value="7">Semester 7</option>
                    <option value="8">Semester 8</option>
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel fontSize="sm" fontWeight="bold" color="gray.600">Subject / Course Module</FormLabel>
                  <Select
                    placeholder="Select Course Module"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    focusBorderColor="blue.400"
                  >
                    <option value="Machine Learning">Machine Learning (CS-401)</option>
                    <option value="Database Systems">Database Systems (IT-402)</option>
                    <option value="Computer Networks">Computer Networks (EC-403)</option>
                    <option value="Software Engineering">Software Engineering (CS-404)</option>
                    <option value="Theory of Computation">Theory of Computation (CS-405)</option>
                  </Select>
                </FormControl>

                <Divider pt={2} />

                <Button
                  leftIcon={<Play size={18} />}
                  colorScheme="blue"
                  size="lg"
                  w="100%"
                  shadow="md"
                  onClick={handleLaunchScan}
                  _hover={{ transform: 'translateY(-2px)', shadow: 'lg' }}
                  transition="all 0.2s"
                >
                  Launch Face Scanning Window
                </Button>
              </Stack>
            </CardBody>
          </Card>
        </GridItem>

        {/* Right Column: Real-time Attendance Stream */}
        <GridItem>
          <Card borderRadius="xl" shadow="md" bg="white" minH="420px">
            <CardHeader pb={2} display="flex" justifyContent="space-between" align="center">
              <Box>
                <Heading size="md" color="gray.700">Real-Time Attendance Stream</Heading>
                <Text fontSize="xs" color="gray.400">Continuous feed of verified biometric face scans</Text>
              </Box>
              <Badge colorScheme="green" variant="solid" px={2} py={1} borderRadius="md" alignSelf="center">
                Live
              </Badge>
            </CardHeader>
            <CardBody>
              <Stack spacing={4}>
                {stats.recentAttendance.length === 0 ? (
                  <Flex h="280px" direction="column" align="center" justify="center" color="gray.400" gap={2}>
                    <Users size={36} />
                    <Text fontSize="sm">No attendance records registered today.</Text>
                  </Flex>
                ) : (
                  stats.recentAttendance.map((item, index) => (
                    <Box key={index}>
                      <Flex align="center" p={3} bg="gray.50" borderRadius="lg" borderLeft="4px solid" borderColor={item.status === 'Present' ? 'green.400' : 'red.400'} shadow="sm">
                        <Avatar size="sm" name={item.studentName} bg={item.status === 'Present' ? 'green.600' : 'red.600'} color="white" mr={3} />
                        <Box>
                          <Text fontWeight="bold" fontSize="sm" color="gray.700">{item.studentName}</Text>
                          <Text fontSize="2xs" color="gray.400">Roll: {item.rollNumber} • {item.department}</Text>
                        </Box>
                        <Spacer />
                        <Stack align="flex-end" spacing={1}>
                          <Badge colorScheme={item.status === 'Present' ? 'green' : 'red'}>
                            {item.status}
                          </Badge>
                          {item.status === 'Present' && (
                            <Text fontSize="3xs" color="gray.400">Verified via {item.markedBy} at {item.timeIn}</Text>
                          )}
                        </Stack>
                      </Flex>
                    </Box>
                  ))
                )}
              </Stack>
            </CardBody>
          </Card>
        </GridItem>
      </Grid>
    </Box>
  );
}
