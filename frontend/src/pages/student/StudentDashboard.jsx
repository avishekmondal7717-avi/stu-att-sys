import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import {
  Container,
  VStack,
  Heading,
  Text,
  Card,
  CardBody,
  CircularProgress,
  CircularProgressLabel,
  Badge,
  Flex,
  Stack,
  Divider,
  Icon,
  HStack,
  Spacer,
  Box,
  SimpleGrid,
  Button,
  Progress
} from '@chakra-ui/react';
import { CheckCircle2, XCircle, Clock, Award, Calendar, Bell } from 'lucide-react';
import { attendanceAPI } from '../../services/api';

export default function StudentDashboard() {
  const navigate = useNavigate();
  const { logs = [], presentCount = 0, absentCount = 0, totalClasses = 0, activeSessions = [], theme } = useOutletContext() || {};
  
  // Calculate attendance metrics
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  
  // Compliance status styling
  const isSafe = attendanceRate >= 75;
  const complianceStatus = isSafe 
    ? `${attendanceRate}% - Attendance Safe` 
    : `${attendanceRate}% - Below Mandatory Threshold (75%)`;
  
  const complianceColor = isSafe ? '#10b981' : '#ef4444'; // Green or Red
  const complianceScheme = isSafe ? 'green' : 'red';

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const fullName = currentUser ? currentUser.fullName : (localStorage.getItem("userFullName") || "Student");

  // Modern UI theme variables
  const cardBg = theme === 'dark' ? '#161618' : '#ffffff';
  const cardBorderColor = theme === 'dark' ? '#27272a' : '#e4e4e7';
  const textPrimary = theme === 'dark' ? '#f4f4f5' : '#0f172a';
  const textSecondary = theme === 'dark' ? '#a1a1aa' : '#71717a';
  const welcomeCardBg = theme === 'dark' ? '#18181b' : '#09090b';

  const COURSE_MAP = {
    'CS-401': 'Data Structures & Algorithms',
    'CS-402': 'Database Management Systems',
    'CS-403': 'Operating Systems',
    'CS-404': 'Formal Language & Automata',
    'HU-401': 'Values & Ethics in Profession'
  };

  const coursesMetrics = Object.entries(COURSE_MAP).map(([code, name]) => {
    const courseLogs = logs.filter(l => l.type && l.type.includes(code));
    const presentLogs = courseLogs.filter(l => l.status === 'Present').length;
    
    let baseTotal = 12;
    let basePresent = 10;
    if (code === 'CS-401') { baseTotal = 15; basePresent = 13; }
    else if (code === 'CS-402') { baseTotal = 14; basePresent = 9; }
    else if (code === 'CS-403') { baseTotal = 16; basePresent = 14; }
    else if (code === 'CS-404') { baseTotal = 15; basePresent = 10; }
    else if (code === 'HU-401') { baseTotal = 10; basePresent = 9; }

    courseLogs.forEach(l => {
      baseTotal += 1;
      if (l.status === 'Present') {
        basePresent += 1;
      }
    });

    const rate = Math.round((basePresent / baseTotal) * 100);

    return {
      code,
      name,
      rate
    };
  });


  const localDate = new Date();
  const year = localDate.getFullYear();
  const month = String(localDate.getMonth() + 1).padStart(2, '0');
  const day = String(localDate.getDate()).padStart(2, '0');
  const todayStr = `${year}-${month}-${day}`;

  return (
    <Container maxW="container.md" py={6} as={VStack} spacing={6} align="stretch" px={0}>
      {/* Title Header */}
      <Box mb={2}>
        <Heading size="lg" color={textPrimary} fontWeight="700" letterSpacing="-0.02em">Student Attendance Portal</Heading>
        <Text fontSize="md" color={textSecondary} mt={1}>View your active biometric verification logs and compliance parameters</Text>
      </Box>

      {/* Active Session Notification */}
      {activeSessions.map(session => {
        const isMarked = logs.some(l => l.date === todayStr && l.type && l.type.includes(session.classCode));
        
        if (isMarked) {
          return (
            <Card
              key={session.classCode}
              bg="green.500"
              color="white"
              borderRadius="xl"
              border="1px solid"
              borderColor="green.400"
              mb={2}
            >
              <CardBody p={5}>
                <Flex direction={{ base: 'column', sm: 'row' }} align="center" justify="space-between" gap={4}>
                  <HStack spacing={3} align="center">
                    <Box p={2.5} bg="rgba(255,255,255,0.2)" borderRadius="lg" display="flex" align="center" justify="center">
                      <Icon as={CheckCircle2} color="white" w={5} h={5} />
                    </Box>
                    <Box>
                      <Text fontWeight="800" fontSize="md" letterSpacing="-0.010em">Attendance Marked Successfully!</Text>
                      <Text fontSize="sm" mt={0.5} color="green.50">
                        You have already marked attendance for {session.className} today.
                      </Text>
                    </Box>
                  </HStack>
                  <Button
                    bg="rgba(255,255,255,0.2)"
                    color="white"
                    disabled
                    fontWeight="700"
                    size="md"
                    px={6}
                    borderRadius="lg"
                    _hover={{}}
                    _active={{}}
                    cursor="default"
                  >
                    Already Marked
                  </Button>
                </Flex>
              </CardBody>
            </Card>
          );
        }

        return (
          <Card
            key={session.classCode}
            bg="orange.500"
            color="white"
            borderRadius="xl"
            border="1px solid"
            borderColor="orange.400"
            className="glow-animation"
            mb={2}
          >
            <CardBody p={5}>
              <Flex direction={{ base: 'column', sm: 'row' }} align="center" justify="space-between" gap={4}>
                <HStack spacing={3} align="center">
                  <Box p={2.5} bg="rgba(255,255,255,0.2)" borderRadius="lg" display="flex" align="center" justify="center" className="pulse-icon">
                    <Icon as={Bell} color="white" w={5} h={5} />
                  </Box>
                  <Box>
                    <Text fontWeight="800" fontSize="md" letterSpacing="-0.010em">Active Attendance Session Live!</Text>
                    <Text fontSize="sm" mt={0.5} color="orange.50">
                      Faculty has opened the scanning window for: {session.className}.
                    </Text>
                  </Box>
                </HStack>
                <Button
                  bg="white"
                  color="orange.600"
                  _hover={{ bg: 'orange.50', transform: 'translateY(-1px)' }}
                  _active={{ bg: 'white', transform: 'translateY(0)' }}
                  fontWeight="700"
                  size="md"
                  px={6}
                  borderRadius="lg"
                  boxShadow="sm"
                  transition="all 0.2s"
                  onClick={() => navigate(`/student/webcam?class=${session.classCode}`)}
                >
                  Mark Attendance
                </Button>
              </Flex>
            </CardBody>
          </Card>
        );
      })}

      {/* Welcome Banner Card */}
      <Card
        bg={welcomeCardBg}
        color="white"
        borderRadius="xl"
        border="1px solid"
        borderColor={theme === 'dark' ? '#27272a' : '#09090b'}
        boxShadow="sm"
      >
        <CardBody p={6}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
            <Box>
              <HStack spacing={3}>
                <Heading size="md" fontWeight="600" letterSpacing="-0.01em">Welcome Back, {fullName}!</Heading>
                <Icon as={Award} color="yellow.400" w={5} h={5} />
              </HStack>
              <Text fontSize="sm" mt={1.5} color="#d4d4d8">
                Your SFace biometric profile is synced with the PostgreSQL vector DB.
              </Text>
            </Box>
            <Badge colorScheme="whiteAlpha" variant="solid" p={2} borderRadius="lg" display="flex" align="center" gap={1.5}>
              <Icon as={Calendar} w={3.5} h={3.5} />
              <Text fontSize="xs" fontWeight="semibold">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </Badge>
          </Flex>
        </CardBody>
      </Card>

      {/* Quota Compliance Circular Chart Panel */}
      <Card borderRadius="xl" border="1px solid" borderColor={cardBorderColor} bg={cardBg} boxShadow="sm">
        <CardBody p={6}>
          <Flex direction="column" align="center" justify="center" py={4}>
            <Text fontSize="xs" fontWeight="700" color={textSecondary} mb={6} uppercase letterSpacing="0.08em">
              Attendance Quota Status
            </Text>

            {/* Circular Progress as requested */}
            <CircularProgress
              value={attendanceRate}
              size="130px"
              thickness="10px"
              color={complianceColor}
              trackColor={theme === 'dark' ? '#18181b' : '#f4f4f5'}
            >
              <CircularProgressLabel fontSize="lg" fontWeight="700" color={complianceColor}>
                {attendanceRate}%
              </CircularProgressLabel>
            </CircularProgress>

            <Badge
              colorScheme={complianceScheme}
              variant="solid"
              mt={6}
              px={4}
              py={2}
              borderRadius="full"
              fontSize="sm"
              fontWeight="bold"
            >
              {complianceStatus}
            </Badge>
            
            <SimpleGrid columns={3} spacing={6} w="100%" mt={8} textAlign="center" as={Flex} justify="space-around">
              <Box>
                <Text fontSize="2xs" color={textSecondary} fontWeight="700" letterSpacing="0.05em">PRESENT</Text>
                <Text fontSize="lg" fontWeight="700" color="#10b981" mt={1}>{presentCount} Days</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color={textSecondary} fontWeight="700" letterSpacing="0.05em">ABSENT</Text>
                <Text fontSize="lg" fontWeight="700" color="#ef4444" mt={1}>{absentCount} Days</Text>
              </Box>
              <Box>
                <Text fontSize="2xs" color={textSecondary} fontWeight="700" letterSpacing="0.05em">TOTAL SESSIONS</Text>
                <Text fontSize="lg" fontWeight="700" color={textPrimary} mt={1}>{totalClasses} Classes</Text>
              </Box>
            </SimpleGrid>
          </Flex>
        </CardBody>
      </Card>

      {/* Chronological Vertical Timeline Card */}
      <Card borderRadius="xl" border="1px solid" borderColor={cardBorderColor} bg={cardBg} boxShadow="sm">
        <CardBody p={6}>
          <Flex align="center" mb={4}>
            <Icon as={Clock} color="#3b82f6" mr={2.5} w={5} h={5} />
            <Heading size="md" fontWeight="600" color={textPrimary} letterSpacing="-0.01em">Attendance Verification History</Heading>
          </Flex>
          <Stack spacing={4} divider={<Divider borderColor={cardBorderColor} />}>
            {logs.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8} color={textSecondary} gap={2}>
                <Icon as={Calendar} w={8} h={8} />
                <Text fontSize="sm">No attendance check-ins logged.</Text>
              </Flex>
            ) : (
              logs.map((log, index) => (
                <Flex key={index} align="center" justify="space-between" py={1}>
                  <HStack spacing={4}>
                    <Icon
                      as={log.status === 'Present' ? CheckCircle2 : XCircle}
                      color={log.status === 'Present' ? '#10b981' : '#ef4444'}
                      w={5}
                      h={5}
                    />
                    <Box>
                      <Text fontWeight="600" fontSize="sm" color={textPrimary}>
                        {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                      </Text>
                      <Text fontSize="xs" color={textSecondary}>
                        {log.status === 'Present' ? `Verified: ${log.type || 'Webcam Face ID'}` : 'Absent'}
                      </Text>
                    </Box>
                  </HStack>
                  <Box textAlign="right">
                    <Badge colorScheme={log.status === 'Present' ? 'green' : 'red'} variant="subtle" px={2.5} py={0.5} borderRadius="md">
                      {log.status}
                    </Badge>
                    {log.status === 'Present' && (
                      <Text fontSize="2xs" color={textSecondary} mt={1}>
                        {log.timeIn}
                      </Text>
                    )}
                  </Box>
                </Flex>
              ))
            )}
          </Stack>
        </CardBody>
      </Card>
    </Container>
  );
}
