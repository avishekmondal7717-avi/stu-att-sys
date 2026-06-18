import React from 'react';
import { useOutletContext } from 'react-router-dom';
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
  SimpleGrid
} from '@chakra-ui/react';
import { CheckCircle2, XCircle, Clock, Award, Calendar } from 'lucide-react';

export default function StudentDashboard() {
  const { logs = [], presentCount = 0, absentCount = 0, totalClasses = 0 } = useOutletContext() || {};
  
  // Calculate attendance metrics
  const attendanceRate = totalClasses > 0 ? Math.round((presentCount / totalClasses) * 100) : 0;
  
  // Compliance status styling
  const isSafe = attendanceRate >= 75;
  const complianceStatus = isSafe 
    ? `${attendanceRate}% - Attendance Safe` 
    : `${attendanceRate}% - Below Mandatory Threshold (75%)`;
  const complianceColor = isSafe ? 'green.400' : 'red.400';
  const complianceScheme = isSafe ? 'green' : 'red';

  const currentUserStr = localStorage.getItem("currentUser");
  const currentUser = currentUserStr ? JSON.parse(currentUserStr) : null;
  const fullName = currentUser ? currentUser.fullName : (localStorage.getItem("userFullName") || "Student");

  return (
    <Container maxW="container.md" py={8} as={VStack} spacing={6} align="stretch">
      {/* Title Header */}
      <Box mb={2}>
        <Heading size="lg" color="gray.850" fontWeight="bold">Student Attendance Portal</Heading>
        <Text fontSize="md" color="gray.500">View your active biometric verification logs and compliance parameters</Text>
      </Box>

      {/* Welcome Banner Card */}
      <Card
        bgGradient="linear(to-r, blue.700, indigo.800)"
        color="white"
        borderRadius="xl"
        shadow="lg"
      >
        <CardBody p={6}>
          <Flex direction={{ base: 'column', md: 'row' }} justify="space-between" align={{ base: 'flex-start', md: 'center' }} gap={4}>
            <Box>
              <HStack spacing={3}>
                <Heading size="md" fontWeight="bold">Welcome Back, {fullName}!</Heading>
                <Icon as={Award} color="yellow.300" w={5} h={5} />
              </HStack>
              <Text fontSize="sm" mt={1} opacity={0.85}>
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
      <Card borderRadius="xl" shadow="md" bg="white">
        <CardBody p={6}>
          <Flex direction="column" align="center" justify="center" py={4}>
            <Text fontSize="md" fontWeight="bold" color="gray.600" mb={4} uppercase letterSpacing="wider">
              Attendance Quota Status
            </Text>

            {/* Circular Progress as requested */}
            <CircularProgress
              value={attendanceRate}
              size="120px"
              thickness="12px"
              color={complianceColor}
              trackColor="gray.100"
            >
              <CircularProgressLabel fontSize="xl" fontWeight="bold" color={complianceColor}>
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
                <Text fontSize="xs" color="gray.400" fontWeight="semibold">PRESENT</Text>
                <Text fontSize="lg" fontWeight="bold" color="green.600">{presentCount} Days</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.400" fontWeight="semibold">ABSENT</Text>
                <Text fontSize="lg" fontWeight="bold" color="red.600">{absentCount} Days</Text>
              </Box>
              <Box>
                <Text fontSize="xs" color="gray.400" fontWeight="semibold">TOTAL SESSIONS</Text>
                <Text fontSize="lg" fontWeight="bold" color="gray.700">{totalClasses} Classes</Text>
              </Box>
            </SimpleGrid>
          </Flex>
        </CardBody>
      </Card>

      {/* Chronological Vertical Timeline Card */}
      <Card borderRadius="xl" shadow="md" bg="white">
        <CardBody p={6}>
          <Flex align="center" mb={4}>
            <Icon as={Clock} color="blue.500" mr={2} />
            <Heading size="md" color="gray.700">Attendance Verification History</Heading>
          </Flex>
          <Stack spacing={4} divider={<Divider />}>
            {logs.length === 0 ? (
              <Flex direction="column" align="center" justify="center" py={8} color="gray.400" gap={2}>
                <Icon as={Calendar} w={8} h={8} />
                <Text fontSize="sm">No attendance check-ins logged.</Text>
              </Flex>
            ) : (
              logs.map((log, index) => (
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
                        {log.status === 'Present' ? `Verified: ${log.type || 'Webcam Face ID'}` : 'Absent'}
                      </Text>
                    </Box>
                  </HStack>
                  <Box textAlign="right">
                    <Badge colorScheme={log.status === 'Present' ? 'green' : 'red'} variant="subtle" px={2.5} py={0.5} borderRadius="md">
                      {log.status}
                    </Badge>
                    {log.status === 'Present' && (
                      <Text fontSize="3xs" color="gray.400" mt={1}>
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
