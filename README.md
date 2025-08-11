## Gabor Molnar Engineering - [structural-design.eu](structural-design.eu)

Python version: `3.13.5`

The project is ran most easily using Flakes-enabled Nix in order to activate the development terminal shell environment defined at `flake.nix` through the command `nix develop`.

The primary technologies are [Python](https://www.python.org/) with [Flask](https://flask.palletsprojects.com/en/stable/) for the backend, [MySQL](https://www.mysql.com/) for the database (handled through [SQLAlchemy](https://www.sqlalchemy.org/)) and [Svelte](https://svelte.dev/) for the frontend, developed and built using [Vite](https://vite.dev/) (using [special scripts](https://github.com/martinm07/flask-svelte-template) to integrate the Vite builds into the Flask application). There is also [Typesense](https://typesense.org/) for powering the search function for guidance documents.

#### Project Whiteboard: https://www.tldraw.com/r/QUvVY_9gF6fGJGS-gM0nm (OUTDATED)

The website is composed of a "business card" and official "guidance documents", ~~under which users are able to comment and converse.~~<br>
Features:

- Display the work of Gabor Molnar Engineering
- - All work on one page, separated by section headers
- - Sections contain text (on work values and guarantees), images and videos.
- - Images contained in carousels
- An expansive feature-complete in-house document editor, for creating and editing HTML/CSS/JS pages in a visual yet powerful way
- Converter for turning document files (mainly ODT files) into HTML pages
- - Both of these features are only displayed for "admin" accounts, which are protected beyond Two-Factor Authentication.
- Search engine for guidance documents
- - Ability to filter guidance documents based on date created, and tags
- - Ability to sort guidance documents based on relevance, views, activity, and recency

In the future, the ability to comment and converse with others under guidance documents may be added:

- A "user" is comprised of a name (unique), email/phone number (unique), avatar image (not clickable), status, comments
- A "comment" is comprised of an author (id), parent guidance document (id), date created, content
- - Comments can also be posted anonymously, in which case author is nullable
- - Anonymous comments still however have an id, and anonymous posters can opt-in to have their browser "remember" these comments it posted, such that if the user ever does decide to make an account those comments suddenly have an author.
- - This'll work using browser cookies (that we only ever read after they make an account), meaning we never store any data about anonymous users (defeating the point). Since cookies are browser dependent though, we'd have to wait for the user to use their new account on all platforms they made comments with to successfully assign all their comments to their account (and of course if they clear cookie data then those comments stay anonymous forever).

---

- [x] We will start by creating a basic skeleton of everything; figuring out the workflow with Svelte, how to communicate common elements (like the footer and navigation), how to do navigation between pages, creating the database schema for users, guidance documents and comments.
- [x] Then, we'll focus on all user management systems (but not user's ability to comment, status, or notifications or anything like that). This includes registration, logging in, login sessions, forgot password, account recovery, changing information (once logged in), deleting accounts.
- [ ] After that is developing the document editor for writing guidance documents and the search engine for guidance documents. This also includes developing the "home view" for users, and the whole interface for searching, filtering and sorting guidance documents.
- [ ] Finally, we'll develop the ability to comment and reply, users getting notifications (such that they can hold conversations), tagging users with "@" and users being able to set their "status", a short piece of text that expires after some set time.
