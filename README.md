## Gabor Molnar Engineering - structural-design.eu

The website is composed of a "business card" and official "guidance documents", under which users are able to comment and converse.<br>
Features:<br>
<sub>"Our" here is the "our" of the company Gabor Molnar Engineering Design.</sub>

- Display our work, along with an honest, reflective "about us" that'll woo the millionares
- - All work on one page, seperated by section headers
- - Sections contain text (on guaruntees and values), images and videos.
- - Images contained in carousels
- A rich markdown-flavoured text editor for writing guidance documents
- - Hopefully built in-house (such that it's easily extendable later on)
- - The option is only displayed for admin accounts
- - Protected behind 2Factor Authentication that only official writers can access
- Search engine for guidance documents
- - Also hopefully made in-house, perhaps using TF-IDF on the content of the documents
- - Ability to filter guidance documents based on date created, and tags
- - Ability to sort guidance documents based on relevance, views, activity, and recency
- A "guidance document" is comprised of a title, date created, thumbnail image, content, tags, comments
- A "user" is comprised of a name (unique), email/phone number (unique), avatar image (not clickable), status, comments
- A "comment" is comprised of an author (id), parent guidance document (id), date created, content
- - Comments can also be posted anonymously, in which case author is nullable
- - Anonymous comments still however have an id, and anonymous posters can opt-in to have their browser "remember" these comments it posted, such that if the user ever does decide to make an account those comments suddenly have an author.
- - This'll work using browser cookies (that we only ever read after they make an account), meaning we never store any data about anonymous users (defeating the point). Since cookies are browser dependant though, we'd have to wait for the user to use their new account on all platforms they made comments with to successfully assign all their comments to their account (and of course if they clear cookie data then those comments stay anonymous forever).

All text in the website is kept completely non-personal, speaking in the "our"s and "we"s of a professional collective rather than "me"s and "I"s of a single person, which could be seen as fallible and be discriminated against.

## 29/10/22 Plans to Begin Development Proper

There has been created a full-working prototype of the registration flow. We now have all the question-answers formulated to create the final user management system.

Currently, accounts will not have sensitive information, and so our main priority for user registration is being hassle-free over being secure, although we'd still like the _option_ to go for more secure flows, in order to appease those with scrutiny. The incorporation of these options needs to be such that it doesn't capture any attention from casual users but noticeable to advanced users.

**Should the default registration be Knowledge Factor (with Posession Factor as backup) or just Posession Factor (no hopes for backup until we later pester them to add other posession options for backup)?** \
On one hand, it's far less clutter to be able to stay on the same website on the same device without getting sent any email or text message and quickly get in with a password. On the other hand, it's far more vulnerable to getting compromised and people either forget password or use the same for multiple services of use some obvious system based on the sames of the services (which can also get inferred and compromised just like using the same password). Although our dervice doesn't hold much that's sensitive, it may affect other services that are more sensitive. \
**Conclusion**: The default will be a Posession factor with either an email or a phone number.

There will also be the ability to do Knowledge factor, Posession factor. Backup factors aren't prominently displayed and beyond that there is no multi-factor authentication. With only the option for 2FA (default yes) if you choose to do a Knowledge factor, Posession factor. You can have either an email or a phone number attatched to an account, but not both. Registration starts by asking you to come up with a new (not taken) username, and Login starts by asking for your username or email/phone number. Registration moves on asking you to specify an email or phone number then verify it by sending a token. Once you do that you may "Finish Registration", but you also may add a password (hidden away, optional option). Doing that will ask for password, confirm password and a checkbox for 2FA before bringing you back to the "Finish Registration" button. There, in a similar vein, you may also add backup posession factors.

We want to make sure our system is secure. The biggest point of consideration here is our tokens, along with rate-limiting. \
To generate a token, we use a hash function that takes as input, the current time (offset by some amount to make the time of expiration consistent), and the user secret (which an attacker should never be able to know). An attacker should never know what our hashes look like, only verify whether any specific one equals ours (i.e. never send the hash to the front-end). With this it should be very difficult for an attacker to compromise an account&mdash;they have no way of knowing the (full) hash's input, so they need to rely on us to tell them. They can't control where we send the information (to do that they'd have to already have compromised the account), so they'd have to get a view of the posession, wait for the user to attempt a login and intercept the message to log in themselves. We can easily stop this if we detect more than one user making attempts in a token cycle, and denying them all (warning them that the posession may be compromised). This risks spoofing, or impersonation as the attacker may customize their packets to make them indistinguishable from the legitimate user's. Hopefully some part of the request header the attacker can't know about unless they truly compromise the user's device, such that...\
While our cookies are cryptographically secure, meaning clients can't manafacture their own, an attacker may still copy the cookie data of someone they know is logged in and use that on their own device to gain access... Essentially, if the attacker compromises their device like this, the user is screwed. \
Rate-limiting is also important so attackers can't brute-force tokens, and fraudsters can't toll-fraud. The problem is keeping track of them, as they may save and revert cookie data back to when there was no (time) penalty to guessing a token, or calling a number. We may have to globalize the attempt number, and put it on the User table. This stops the attackers, but may also stop innocent users as hackers are consuming guesses. Alternatively, we may create a new table that associates IP addresses to attempt numbers. If we detect someone trying to manipulate their cookie data, we may blacklist the IP address. Note that the attacker actually couldn't address spoof here, as they wouldn't be able to even complete the TCP handshake (since we'd be sending data to their new IP address, which probably relates to a machine they don't control) to make us ever do anything&mdash;address spoofing is only possible for DDoS attacks. This means they can't cheat, and would really need a lot of machines to accomplish anything. To stop those who do, we may later implement anomoly detection to also blacklist IP addresses that are suspicious, not just those trying to cheat the rate-limiter.

---

- [ ] We will start by creating a basic skeleton of everything; figuring out the workflow with Svelte, how to communicate common elements (like the footer and navigation), how to do navigation between pages, creating the database schema for users, guidance documents and comments.
- [ ] Then, we'll focus on all user management systems (but not user's ability to comment, status, or notifications or anything like that). This includes registration, logging in, login sessions, forgot password, account recovery, changing information (once logged in), deleting accounts.
- [ ] After that is developing the markdown editor for writing guidance documents and the search engine for guidance documents. This also includes developing the "home view" for users, and the whole interface for searching, filtering and sorting guidance documents.
- [ ] Finally, we'll develop the ability to comment and reply, users getting notifications (such that they can hold conversations), tagging users with "@" and users being able to set their "status", a short piece of text that expires after some set time.
