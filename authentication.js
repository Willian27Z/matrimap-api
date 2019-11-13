/*
Requirements:
1. User Identifier - User Name.
2. Email Address - for contact purposes only.
3. Password - challenge part of authentication.
*/

/*
Process 1: Authentication

Required parameters: Username, Password.

1. Grab User from Database.
2. Salt/Hash Entered password from User
3. Compare Entered vs. Stored passwords.
3.1 if password hashes match, generate a token and send to the user
3.2 if password hashes don't match, return an error.
*/

/* 
Process 2: Registration

Required Parameters: Username, Email, Password, Password2

1. Check the database for an existing user by Email and Username.
1.1 If there is not a user already, move on.
1.2 If there is a user already, return an error.
2. Compare the password fields.
2.1 If they match, move on.
2.2 If they don't, return an error 
3. Salt and Hash the password
4. Save User to Database.
5. Return success to the client.

*/