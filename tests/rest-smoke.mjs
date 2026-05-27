const BASE_URL = process.env.BASE_URL || "http://localhost:8080";

const endpoints = [
  {
    name: "API Gateway root",
    method: "GET",
    url: `${BASE_URL}/`,
    expectStatus: 200,
  },
  {
    name: "Doctors list",
    method: "GET",
    url: `${BASE_URL}/doctors`,
    expectStatus: 200,
  },
  {
    name: "Appointments list",
    method: "GET",
    url: `${BASE_URL}/appointments`,
    expectStatus: 200,
  },
  {
    name: "Notification logs",
    method: "GET",
    url: `${BASE_URL}/notifications/logs?limit=5`,
    expectStatus: 200,
  },
];

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

const main = async () => {
  console.log(`Running REST smoke tests against ${BASE_URL}`);

  for (const endpoint of endpoints) {
    const { response, body } = await fetchJson(endpoint.url, {
      method: endpoint.method,
    });

    if (response.status !== endpoint.expectStatus) {
      throw new Error(
        `${endpoint.name} failed: expected ${endpoint.expectStatus}, got ${response.status} with body ${JSON.stringify(body)}`
      );
    }

    console.log(`PASS: ${endpoint.name}`);
  }

  console.log("REST smoke tests completed successfully");
};

main().catch((error) => {
  console.error("REST smoke tests failed:");
  console.error(error.message);
  process.exitCode = 1;
});