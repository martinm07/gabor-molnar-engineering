## Gabor Molnar Engineering - structural-design.eu

The website is composed of a "business card" and official "guidance documents", under which users are able to comment and converse.<br>
Features:<br>

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
- - This'll work using browser cookies (that we only ever read after they make an account), meaning we never store any data about anonymous users (defeating the point). Since cookies are browser dependent though, we'd have to wait for the user to use their new account on all platforms they made comments with to successfully assign all their comments to their account (and of course if they clear cookie data then those comments stay anonymous forever).

## Project Whiteboard: https://www.tldraw.com/r/QUvVY_9gF6fGJGS-gM0nm

---

- [x] We will start by creating a basic skeleton of everything; figuring out the workflow with Svelte, how to communicate common elements (like the footer and navigation), how to do navigation between pages, creating the database schema for users, guidance documents and comments.
- [ ] Then, we'll focus on all user management systems (but not user's ability to comment, status, or notifications or anything like that). This includes registration, logging in, login sessions, forgot password, account recovery, changing information (once logged in), deleting accounts.
- [ ] After that is developing the markdown editor for writing guidance documents and the search engine for guidance documents. This also includes developing the "home view" for users, and the whole interface for searching, filtering and sorting guidance documents.
- [ ] Finally, we'll develop the ability to comment and reply, users getting notifications (such that they can hold conversations), tagging users with "@" and users being able to set their "status", a short piece of text that expires after some set time.
