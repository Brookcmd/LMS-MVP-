# Bruno API Guide for Admin Login and User Creation

This guide shows how to use Bruno to sign in as the seeded admin and create teacher and parent accounts for this backend.

## 1) Start the backend

From the backend folder, run:

```bash
cd backend
npm install
npx prisma generate
npm run prisma:seed
npm run dev
```

The API should be available at:

```text
http://localhost:5200
```

## 2) Create a Bruno collection and environment

In Bruno:

- Create a new collection for this project
- Create an environment named `Local`
- Add these variables:

```text
baseUrl = http://localhost:5200
schoolId = 1
adminEmail = admin@testschool.com
adminPassword = Admin@123
token =
```

If your seeded school ID is different, update `schoolId` accordingly.

## 3) Sign in as admin

Create a request in Bruno:

- Method: `POST`
- URL: `{{baseUrl}}/auth/login`

Body (JSON):

```json
{
  "schoolId": "{{schoolId}}",
  "email": "{{adminEmail}}",
  "password": "{{adminPassword}}"
}
```

### Expected response

You should get a response with:

```json
{
  "success": true,
  "data": {
    "user": {
      "role": "admin"
    },
    "token": "..."
  }
}
```

### Save the token

After the login succeeds:

- Copy the returned `data.token`
- Paste it into the `token` variable in Bruno

You can also set the authorization header manually for later requests:

```text
Authorization: Bearer {{token}}
```

## 4) Create a teacher account

Create another request:

- Method: `POST`
- URL: `{{baseUrl}}/auth/signup`
- Header:

```text
Authorization: Bearer {{token}}
```

Body (JSON):

```json
{
  "name": "Mr. Smith",
  "email": "teacher@example.com",
  "role": "teacher",
  "password": "Teacher@123"
}
```

This will create a teacher account in the same school as the admin.

## 5) Create a parent account

Create another request:

- Method: `POST`
- URL: `{{baseUrl}}/auth/signup`
- Header:

```text
Authorization: Bearer {{token}}
```

Body (JSON):

```json
{
  "name": "Mrs. Johnson",
  "email": "parent@example.com",
  "role": "parent",
  "password": "Parent@123"
}
```

This creates a parent account.

## 6) Notes

- Only an admin can use `POST /auth/signup`
- The backend uses the authenticated admin’s school ID automatically, so you do not need to send a school ID in the signup body
- The default seeded admin credentials are:
- If the backend is not running yet, start it with:

```bash
cd backend
npm run dev
```

- If the database connection is failing, the API will not start. In that case, the issue is with the configured Postgres connection rather than Bruno.

```text
email: admin@testschool.com
password: Admin@123
```

If you want, I can also create a Bruno collection file in the repo so you can import it directly.
