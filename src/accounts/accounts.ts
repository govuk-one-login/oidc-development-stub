// Maybe consider dynamic account data
export const accounts = [
  {
    sub: "alice-001",
    name: "Alice Smith",
    email: "alice@example.com",
    tokenClaims: { role: "admin", department: "engineering" },
    userinfoClaims: { phone: "+1-555-0101", address: "123 Main St" },
  },
  {
    sub: "bob-001",
    name: "Bob Jones",
    email: "bob@example.com",
    userinfoClaims: { phone: "+1-555-0102", address: "456 Oak Ave" },
  },
  {
    sub: "charlie-001",
    name: "Charlie Brown",
    email: "charlie@example.com",
    tokenClaims: { role: "editor", department: "design" },
  },
];
