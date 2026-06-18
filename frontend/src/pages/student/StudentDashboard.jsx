import React from 'react';
import { useOutletContext } from 'react-router-dom';
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardHeader,
  CardBody,
  CircularProgress,
  CircularProgressLabel,
  Badge,
  Flex,
  Stack,
  Divider,
  Icon,
  HStack,
  Spacer
} from '@chakra-ui/react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer
} from 'recharts';
import { Calendar, CheckCircle2, XCircle, ArrowUpRight, Clock, Award } from 'lucide-react';

export default function StudentDashboard() {
  const { logs = [], presentCount = 0, absentCount = 0, totalClasses = 0 } = useOutletContext() || {};
  
  // Calculate attendance metrics
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  
  // Compliance logic
  const isSafe = attendanceRate >= 75;
  const complianceStatus = isSafe 
    ? `${attendanceRate}% - Attendance Safe` 
    : `${attendanceRate}% - Below Mandatory Threshold (75%)`;
  const complianceColor = isSafe ? 'green.500' : 'red.500';
  const complianceScheme = isSafe ? 'green' : 'red';

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const fullName = currentUser ? currentUser.fullName : (localStorage.getItem("userFullName") || "Student");

  // Recharts weekly projection mock data
  const chartData = [
    { name: 'Week 1', rate: 70 },
    { name: 'Week 2', rate: 80 },
    { name: 'Week 3', rate: 75 },
    { name: 'Week 4', rate: attendanceRate || 85 },
  ];

  return (
    <Container maxW="container.lg" py={6}>
      <VStack spacing={6} align="stretch">
        
        {/* Welcome Banner Card */}
        <Card
          bgGradient="linear(to-r, blue.700, indigo.800)"
          color="white"
          borderRadius="xl"
          shadow="lg"
          p={6}
        >
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
            <Box>
              <HStack spacing={3}>
                <Heading size="md" fontWeight="bold">Welcome Back, {fullName}!</Heading>
                <Icon as={Award} color="yellow.300" w={5} h={5} />
              </HStack>
              <Text fontSize="sm" mt={1} opacity={0.85}>
                Your SFace biometric profile is registered. Keep attending classes to maintain compliance!
              </Text>
            </Box>
            <Badge colorScheme="whiteAlpha" variant="solid" p={2} borderRadius="lg" display="flex" align="center" gap={1.5}>
              <Icon as={Calendar} w={3.5} h={3.5} />
              <Text fontSize="xs" fontWeight="semibold">
                {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
              </Text>
            </Badge>
          </Flex>
        </Card>

        {/* Analytics Workspace Grid */}
        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
          
          {/* Attendance Compliance Circular Summary */}
          <Card borderRadius="xl" shadow="md" bg="white">
            <CardHeader pb={0}>
              <Heading size="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                Attendance Compliance
              </Heading>
            </CardHeader>
            <CardBody>
              <Flex direction="column" align="center" justify="center" py={4}>
                <CircularProgress
                  value={attendanceRate}
                  size="180px"
                  thickness="10px"
                  color={complianceColor}
                  trackColor="gray.100"
                >
                  <CircularProgressLabel fontSize="2xl" fontWeight="bold" color={complianceColor}>
                    {attendanceRate}%
                  </CircularProgressLabel>
                </CircularProgress>

                <Badge
                  colorScheme={complianceScheme}
                  variant="subtle"
                  mt={6}
                  px={4}
                  py={2}
                  borderRadius="full"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {complianceStatus}
                </Badge>
                
                <SimpleGrid columns={3} spacing={6} w="100%" mt={8} textAlign="center">
                  <Box>
                    <Text fontSize="xs" color="gray.400" fontWeight="semibold">PRESENT</Text>
                    <Text fontSize="lg" fontWeight="bold" color="green.600">{presentCount} Days</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.400" fontWeight="semibold">ABSENT</Text>
                    <Text fontSize="lg" fontWeight="bold" color="red.600">{absentCount} Days</Text>
                  </Box>
                  <Box>
                    <Text fontSize="xs" color="gray.400" fontWeight="semibold">TOTAL CLASSES</Text>
                    <Text fontSize="lg" fontWeight="bold" color="gray.700">{totalClasses} Sessions</Text>
                  </Box>
                </SimpleGrid>
              </Flex>
            </CardBody>
          </Card>

          {/* Weekly Performance Trend Graph */}
          <Card borderRadius="xl" shadow="md" bg="white">
            <CardHeader>
              <Heading size="sm" color="gray.600" textTransform="uppercase" letterSpacing="wider">
                Monthly Performance Trend
              </Heading>
            </CardHeader>
            <CardBody>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} tickFormatter={(v) => `${v}%`} />
                  <Tooltip formatter={(v) => [`${v}%`, 'Rate']} />
                  <Line type="monotone" dataKey="rate" stroke="#3b82f6" strokeWidth={3} dot={{ r: 5, fill: '#3b82f6' }} />
                </LineChart>
              </ResponsiveContainer>
              <Text fontSize="xs" color="gray.400" mt={4} textAlign="center">
                Weekly progress computed relative to class syllabus timeline goals.
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>

        {/* Past Check-ins Vertical History Timeline */}
        <Card borderRadius="xl" shadow="md" bg="white">
          <CardHeader borderBottom="1px solid" borderColor="gray.100" py={4}>
            <Flex align="center">
              <Icon as={Clock} color="blue.500" mr={2} />
              <Heading size="sm" color="gray.700">Past Attendance Check-ins</Heading>
              <Spacer />
              <Badge colorScheme="blue">Registry Log</Badge>
            </Flex>
          </CardHeader>
          <CardBody>
            <Stack spacing={4} divider={<Divider />}>
              {logs.length === 0 ? (
                <Flex direction="column" align="center" justify="center" py={8} color="gray.400" gap={2}>
                  <Calendar size={32} />
                  <Text fontSize="sm">No historical attendance logs recorded yet.</Text>
                </Flex>
              ) : (
                logs.slice(0, 7).map((log, index) => (
                  <Flex key={index} align="center" justify="space-between" py={1}>
                    <HStack spacing={4}>
                      <Icon
                        as={log.status === 'Present' ? CheckCircle2 : XCircle}
                        color={log.status === 'Present' ? 'green.500' : 'red.500'}
                        w={6}
                        h={6}
                      />
                      <Box>
                        <Text fontWeight="bold" fontSize="sm" color="gray.700">
                          {new Date(log.date).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' })}
                        </Text>
                        <Text fontSize="xs" color="gray.400">
                          {log.status === 'Present' ? `Method: ${log.type || 'Webcam Face ID'}` : 'Unexcused Absence'}
                        </Text>
                      </Box>
                    </HStack>
                    <Box textAlign="right">
                      <Badge colorScheme={log.status === 'Present' ? 'green' : 'red'} variant="subtle" px={2.5} py={0.5} borderRadius="md">
                        {log.status}
                      </Badge>
                      {log.status === 'Present' && (
                        <Text fontSize="3xs" color="gray.400" mt={1}>
                          In: {log.timeIn} | Out: {log.timeOut || '-'}
                        </Text>
                      )}
                    </Box>
                  </Flex>
                ))
              )}
            </Stack>
          </CardBody>
        </Card>

      </VStack>
    </Container>
  );
}
