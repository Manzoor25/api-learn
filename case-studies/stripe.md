# Stripe lists

Payments. Checked 2026-10-28.

https://docs.stripe.com/api/pagination

List methods take `limit` (default 10, range 1 to 100), `starting_after`, and `ending_before`. `has_more` says whether another page exists. `starting_after` is an object id, which is a cursor even though the parameter looks friendly.

Lesson: a cursor can hide inside a parameter named like a keyset. You still cannot start at an arbitrary page unless the API lets you.
