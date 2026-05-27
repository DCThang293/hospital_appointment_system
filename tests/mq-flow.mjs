const BASE_URL = process.env.BASE_URL || "http://localhost:8080";
const NOTIFICATION_URL = process.env.NOTIFICATION_URL || "http://localhost:8084";
const DOCTOR_ID = Number(process.env.DOCTOR_ID || 1);
const PATIENT_ID = Number(process.env.PATIENT_ID || 999);
const APPOINTMENT_DATE = process.env.APPOINTMENT_DATE || "2026-05-30";
const APPOINTMENT_TIME = process.env.APPOINTMENT_TIME || null;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const fetchJson = async (url, options = {}) => {
  const response = await fetch(url, {
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const text = await response.text();
  let body = null;

  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = text;
    }
  }

  return { response, body };
};

const pad = (value) => String(value).padStart(2, "0");

const buildCandidateTimes = () => {
  const candidates = [];

  for (let hour = 8; hour <= 11; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      candidates.push(`${pad(hour)}:${pad(minute)}:00`);
    }
  }

  for (let hour = 13; hour <= 17; hour += 1) {
    for (let minute = 0; minute < 60; minute += 15) {
      candidates.push(`${pad(hour)}:${pad(minute)}:00`);
    }
  }

  return candidates;
};

const getExistingAppointmentTimes = async () => {
  const { response, body } = await fetchJson(`${BASE_URL}/appointments/doctor/${DOCTOR_ID}`, {
    method: "GET",
  });

  if (response.status !== 200) {
    throw new Error(
      `Failed to load existing appointments: expected 200, got ${response.status} with body ${JSON.stringify(body)}`
    );
  }

  const appointments = Array.isArray(body?.data) ? body.data : [];

  return appointments
    .filter((appointment) => {
      const appointmentDate = String(appointment?.appointment_date || "").slice(0, 10);
      return appointmentDate === APPOINTMENT_DATE;
    })
    .map((appointment) => String(appointment.appointment_time));
};

const pickAvailableTime = async () => {
  if (APPOINTMENT_TIME) {
    return APPOINTMENT_TIME;
  }

  const existingTimes = new Set(await getExistingAppointmentTimes());
  const candidates = buildCandidateTimes();
  const chosen = candidates.find((candidate) => !existingTimes.has(candidate));

  if (!chosen) {
    throw new Error(`No available appointment slot found for doctorId=${DOCTOR_ID} on ${APPOINTMENT_DATE}`);
  }

  return chosen;
};

const createAppointment = async () => {
  const appointmentTime = await pickAvailableTime();
  const payload = {
    patientId: PATIENT_ID,
    doctorId: DOCTOR_ID,
    appointmentDate: APPOINTMENT_DATE,
    appointmentTime,
    reason: "MQ flow test",
  };

  const { response, body } = await fetchJson(`${BASE_URL}/appointments`, {
    method: "POST",
    body: JSON.stringify(payload),
  });

  if (response.status !== 201) {
    throw new Error(
      `Appointment create failed: expected 201, got ${response.status} with body ${JSON.stringify(body)}`
    );
  }

  const appointmentId = body?.data?.id;
  if (!appointmentId) {
    throw new Error(`Appointment response missing id: ${JSON.stringify(body)}`);
  }

  console.log(`PASS: created appointment id=${appointmentId}`);
  return { appointmentId, payload };
};

const waitForNotificationLog = async (appointmentId) => {
  for (let attempt = 1; attempt <= 15; attempt += 1) {
    const { response, body } = await fetchJson(
      `${NOTIFICATION_URL}/notifications/logs?limit=20`,
      { method: "GET" }
    );

    if (response.status !== 200) {
      throw new Error(
        `Notification log query failed: got ${response.status} with body ${JSON.stringify(body)}`
      );
    }

    const logs = Array.isArray(body?.data) ? body.data : [];
    const match = logs.find((entry) => entry?.payload?.appointmentId === appointmentId);

    if (match) {
      return match;
    }

    console.log(`Waiting for queue message... attempt ${attempt}/15`);
    await sleep(1000);
  }

  throw new Error(`No notification log found for appointmentId=${appointmentId}`);
};

const main = async () => {
  console.log(`Running MQ flow test via ${BASE_URL}`);
  const { appointmentId } = await createAppointment();
  const log = await waitForNotificationLog(appointmentId);

  console.log(
    `PASS: notification log stored with id=${log.id}, status=${log.status}, event_type=${log.event_type}`
  );
  console.log("MQ flow test completed successfully");
};

main().catch((error) => {
  console.error("MQ flow test failed:");
  console.error(error.message);
  process.exitCode = 1;
});