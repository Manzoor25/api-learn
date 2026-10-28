# Defender Vulnerability Management exports

Security. Fetched 2026-10-28.

https://learn.microsoft.com/en-us/defender-endpoint/api/get-assessment-software-vulnerabilities

- JSON response: described as best for small organizations with less than 100-K devices.
- Via files: recommended for large organizations with more than 100-K devices. It is the bulk path.
- Both are a current snapshot, not history.
- A separate delta export is a date range, not a full export.

Lesson: the same product offers a page-shaped API and a file export, and it tells you which one at a scale. Read that sentence before you loop.
